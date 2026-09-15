"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { encodeAdminCookie, ADMIN_COOKIE_NAME, isAdminSession } from "@/lib/session";

async function requireAdmin() {
  if (!(await isAdminSession())) {
    redirect("/admin");
  }
}

// Everything an admin does that isn't already visible through the
// submission ledger (flare edits, ROGUE overrides, manual XP grants) gets
// logged here so there's a single timestamped activity trail to review.
async function logAdminAudit(action: string, detail: string) {
  await prisma.adminAudit.create({ data: { action, detail } });
}

export async function adminLoginAction(formData: FormData) {
  const passphrase = String(formData.get("passphrase") ?? "");
  if (passphrase !== (process.env.ADMIN_PASSPHRASE || "")) {
    redirect(`/admin?error=${encodeURIComponent("Incorrect passphrase.")}`);
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, encodeAdminCookie(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin/challenges");
}

export async function adminLogoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin");
}

function parseChoices(raw: string): string[] | undefined {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines : undefined;
}

export async function upsertChallengeAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const answerType = String(formData.get("answerType") ?? "EXACT") as
    | "EXACT"
    | "CASE_INSENSITIVE"
    | "MULTIPLE_CHOICE"
    | "FREE_TEXT_REVIEW";
  const correctAnswer = String(formData.get("correctAnswer") ?? "").trim() || null;
  const choicesRaw = String(formData.get("choices") ?? "");
  const xpValue = parseInt(String(formData.get("xpValue") ?? "0"), 10) || 0;
  const isActive = formData.get("isActive") === "on";
  const opensAtRaw = String(formData.get("opensAt") ?? "");
  const closesAtRaw = String(formData.get("closesAt") ?? "");

  const data = {
    slug,
    title,
    description,
    answerType,
    correctAnswer: answerType === "FREE_TEXT_REVIEW" ? null : correctAnswer,
    choices: answerType === "MULTIPLE_CHOICE" ? parseChoices(choicesRaw) : undefined,
    xpValue,
    isActive,
    opensAt: opensAtRaw ? new Date(opensAtRaw) : null,
    closesAt: closesAtRaw ? new Date(closesAtRaw) : null,
  };

  if (id) {
    await prisma.challenge.update({ where: { id }, data });
  } else {
    await prisma.challenge.create({ data });
  }

  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  revalidatePath("/leaderboard");
  redirect("/admin/challenges?saved=1");
}

export async function deleteChallengeAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.challenge.delete({ where: { id } });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  redirect("/admin/challenges?deleted=1");
}

export async function reviewSubmissionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? ""); // "approve" | "reject"

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { challenge: true },
  });
  if (!submission) redirect("/admin/submissions");

  await prisma.submission.update({
    where: { id },
    data: {
      status: decision === "approve" ? "CORRECT" : "INCORRECT",
      xpAwarded: decision === "approve" ? submission!.challenge.xpValue : 0,
      reviewedBy: "admin",
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  redirect("/admin/submissions?reviewed=1");
}

export async function upsertFlareAction(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) {
    redirect(`/admin/flare?error=${encodeURIComponent("No employee with that email yet.")}`);
  }

  const achievementsRaw = String(formData.get("achievements") ?? "");
  const achievements = achievementsRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const expiresAtRaw = String(formData.get("expiresAt") ?? "");

  const data = {
    achievements,
    outlineColor: String(formData.get("outlineColor") ?? "").trim() || null,
    backgroundColor: String(formData.get("backgroundColor") ?? "").trim() || null,
    backgroundEffect: String(formData.get("backgroundEffect") ?? "").trim() || null,
    codenameOverride: String(formData.get("codenameOverride") ?? "").trim() || null,
    motto: String(formData.get("motto") ?? "").trim() || null,
    iconOverride: String(formData.get("iconOverride") ?? "").trim() || null,
    borderStyle: String(formData.get("borderStyle") ?? "").trim() || null,
    ribbonText: String(formData.get("ribbonText") ?? "").trim() || null,
    pinned: formData.get("pinned") === "on",
    nameSuffix: String(formData.get("nameSuffix") ?? "").trim() || null,
    expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
  };

  await prisma.badgeFlare.upsert({
    where: { employeeId: employee!.id },
    update: data,
    create: { employeeId: employee!.id, ...data },
  });

  const changedFields = Object.entries(data)
    .filter(([key, value]) => key !== "achievements" && value !== null && value !== false)
    .map(([key, value]) => `${key}=${value instanceof Date ? value.toISOString() : String(value)}`);
  if (achievements.length) changedFields.push(`achievements=[${achievements.join(", ")}]`);
  await logAdminAudit(
    "FLARE_UPDATE",
    `${employee!.displayName} (${employee!.email}): ${changedFields.length ? changedFields.join(", ") : "cleared all flare fields"}`
  );

  revalidatePath("/admin/flare");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  redirect(`/admin/flare?saved=1&email=${encodeURIComponent(email)}`);
}

export async function toggleRogueAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rogue = formData.get("rogue") === "on";
  const employee = await prisma.employee.findUnique({ where: { email } });
  await prisma.employee.update({ where: { email }, data: { rogueOverride: rogue } });
  await logAdminAudit(
    "ROGUE_OVERRIDE",
    `${employee?.displayName ?? email} (${email}): ${rogue ? "marked ROGUE" : "cleared ROGUE"}`
  );
  revalidatePath("/admin/employees");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  redirect("/admin/employees?saved=1");
}

export async function grantManualXpAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const xp = parseInt(String(formData.get("xp") ?? "0"), 10) || 0;
  const reason = String(formData.get("reason") ?? "Manual bonus").trim() || "Manual bonus";

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) redirect(`/admin/employees?error=${encodeURIComponent("Unknown employee")}`);

  // Every manual grant gets its own synthetic, uniquely-slugged "Manual
  // Bonus" challenge so it's auditable through the same submission ledger
  // used for real challenges (no separate untracked XP path).
  const slug = `manual-bonus-${employee!.id}-${Date.now()}`;
  const challenge = await prisma.challenge.create({
    data: {
      slug,
      title: `Manual Bonus: ${reason}`,
      description: `Admin-granted bonus XP. Reason: ${reason}`,
      answerType: "FREE_TEXT_REVIEW",
      xpValue: xp,
      isActive: false,
    },
  });

  await prisma.submission.create({
    data: {
      employeeId: employee!.id,
      challengeId: challenge.id,
      answerRaw: "(admin-granted)",
      status: "CORRECT",
      xpAwarded: xp,
      reviewedBy: "admin",
      reviewedAt: new Date(),
    },
  });

  await logAdminAudit("MANUAL_XP_GRANT", `${employee!.displayName} (${employee!.email}): +${xp} XP — ${reason}`);

  revalidatePath("/admin/employees");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  redirect("/admin/employees?granted=1");
}
