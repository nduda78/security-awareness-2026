"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getUnlockedFlareOptions } from "@/lib/rewards";

/**
 * Self-service equivalent of the admin flare editor, but heavily
 * restricted: an employee may only set backgroundEffect / borderStyle /
 * iconOverride / ribbonText / nameSuffix / outlineColor / backgroundColor,
 * and only to values they've actually unlocked by completing a challenge
 * that rewards them (see lib/rewards.ts). Everything else on BadgeFlare
 * (achievements, motto, codenameOverride, expiresAt) stays admin-only and
 * is left untouched by this action.
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

  const data = {
    backgroundEffect: pickValidated(requested.backgroundEffect, unlocked.backgroundEffect, "backgroundEffect"),
    borderStyle: pickValidated(requested.borderStyle, unlocked.borderStyle, "borderStyle"),
    iconOverride: pickValidated(requested.iconOverride, unlocked.icon, "iconOverride"),
    ribbonText: pickValidated(requested.ribbonText, unlocked.ribbonText, "ribbonText"),
    nameSuffix: pickValidated(requested.nameSuffix, unlocked.nameSuffix, "nameSuffix"),
    outlineColor: pickValidated(requested.outlineColor, unlocked.outlineColor, "outlineColor"),
    backgroundColor: pickValidated(requested.backgroundColor, unlocked.backgroundColor, "backgroundColor"),
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
