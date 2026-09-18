"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getUnlockedFlareOptions } from "@/lib/rewards";
import { resolveColor } from "@/lib/flare";

/**
 * Self-service equivalent of the admin flare editor, but heavily
 * restricted: an employee may only set backgroundEffect / borderStyle /
 * iconOverride / ribbonText / nameSuffix — each locked to a pool of exact
 * values they've unlocked — plus outlineColor / backgroundColor, which
 * work differently: those two are a *capability* unlock (see
 * lib/rewards.ts), not a value pool, so once granted the employee may set
 * any resolvable color of their own choosing for that field, not just a
 * pre-set option. Everything else on BadgeFlare (achievements, motto,
 * codenameOverride, expiresAt) stays admin-only and is left untouched by
 * this action.
 *
 * Submitted values are re-validated server-side against a fresh query of
 * the employee's own completed challenges — the unlocked list rendered
 * client-side is only a display convenience, never trusted on its own.
 */
export async function selfUpdateFlareAction(formData: FormData) {
  const identity = await getAgentIdentity();
  if (!identity) redirect("/identify?next=/profile");
  const email = identity!.email;
  const profileUrl = `/profile/${encodeURIComponent(email)}`;

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) redirect(profileUrl);

  const unlocked = await getUnlockedFlareOptions(employee!.id);

  const requested = {
    backgroundEffect: String(formData.get("backgroundEffect") ?? "").trim(),
    borderStyle: String(formData.get("borderStyle") ?? "").trim(),
    iconOverride: String(formData.get("iconOverride") ?? "").trim(),
    ribbonText: String(formData.get("ribbonText") ?? "").trim(),
    nameSuffix: String(formData.get("nameSuffix") ?? "").trim(),
    outlineColor: String(formData.get("outlineColor") ?? "").trim(),
    backgroundColor: String(formData.get("backgroundColor") ?? "").trim(),
  };

  const rejected: string[] = [];

  function pickValidated(value: string, pool: string[], field: string): string | null {
    if (!value) return null; // clearing a field is always allowed
    if (pool.includes(value)) return value;
    rejected.push(field);
    return null; // silently drop anything not actually unlocked
  }

  // ribbonText/nameSuffix are freeform text, not a fixed catalog like
  // backgroundEffect/borderStyle/icon - so "unlocked" for them can mean
  // either "matches something a challenge already grants" (pool) OR, for
  // admins, "can type anything" (canFreeType), same idea as the color
  // capability flags below. A generous length cap keeps it from becoming
  // a dumping ground for arbitrary long text.
  function pickTextOrPool(value: string, pool: string[], canFreeType: boolean, field: string): string | null {
    if (!value) return null;
    if (canFreeType) return value.slice(0, 60);
    if (pool.includes(value)) return value;
    rejected.push(field);
    return null;
  }

  // Colors aren't a pool of exact values — canUse just gates whether the
  // picker is usable at all. Any value that passes must still resolve to a
  // real CSS color (same rule the admin editor already enforces), so a
  // stray unresolvable string can't sneak into storage.
  function pickColor(value: string, canUse: boolean, field: string): string | null {
    if (!value) return null;
    if (!canUse) {
      rejected.push(field);
      return null;
    }
    const resolved = resolveColor(value, field, []);
    if (!resolved) {
      // Distinct from "not unlocked" — the capability is there, the text just
      // isn't a color format resolveColor understands. Different problem,
      // different message on the way back (see SelfFlareEditor.tsx).
      rejected.push(`${field}Invalid`);
      return null;
    }
    return value;
  }

  const data = {
    backgroundEffect: pickValidated(requested.backgroundEffect, unlocked.backgroundEffect, "backgroundEffect"),
    borderStyle: pickValidated(requested.borderStyle, unlocked.borderStyle, "borderStyle"),
    iconOverride: pickValidated(requested.iconOverride, unlocked.icon, "iconOverride"),
    ribbonText: pickTextOrPool(requested.ribbonText, unlocked.ribbonText, unlocked.canPickRibbonText, "ribbonText"),
    nameSuffix: pickTextOrPool(requested.nameSuffix, unlocked.nameSuffix, unlocked.canPickNameSuffix, "nameSuffix"),
    outlineColor: pickColor(requested.outlineColor, unlocked.canPickOutlineColor, "outlineColor"),
    backgroundColor: pickColor(requested.backgroundColor, unlocked.canPickBackgroundColor, "backgroundColor"),
  };

  await prisma.badgeFlare.upsert({
    where: { employeeId: employee!.id },
    update: data,
    create: { employeeId: employee!.id, ...data },
  });

  revalidatePath("/leaderboard");
  revalidatePath(profileUrl);

  if (rejected.length) {
    redirect(`${profileUrl}?flareRejected=${encodeURIComponent(rejected.join(","))}`);
  }
  redirect(`${profileUrl}?flareSaved=1`);
}
