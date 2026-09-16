"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { encodeAdminCookie, ADMIN_COOKIE_NAME, isAdminSession } from "@/lib/session";
import { IMAGE_TYPES, IMAGE_MAX_BYTES, AUDIO_TYPES, AUDIO_MAX_BYTES, VIDEO_TYPES, VIDEO_MAX_BYTES } from "@/lib/assetUpload";
import { serializeAchievements } from "@/lib/flare";
import { setCompromisedMode } from "@/lib/settings";

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


/**
 * Reads an optional file upload + "remove" checkbox off formData and, only
 * if one of them actually applies, mutates `data` in place with the new
 * bytes/mimetype (or nulls to clear). If neither a file was chosen nor
 * remove was checked, `data` is left untouched so an existing asset isn't
 * silently wiped out just because the challenge form was re-saved.
 */
async function applyAssetField(
  data: Record<string, unknown>,
  formData: FormData,
  opts: {
    fileField: string;
    removeField: string;
    dataField: string;
    mimeField: string;
    allowedTypes: Set<string>;
    maxBytes: number;
  }
): Promise<string | null> {
  const file = formData.get(opts.fileField);
  const remove = formData.get(opts.removeField) === "on";

  if (file instanceof File && file.size > 0) {
    if (!opts.allowedTypes.has(file.type)) {
      return `Unsupported file type for ${opts.fileField} (${file.type || "unknown"}).`;
    }
    if (file.size > opts.maxBytes) {
      return `${opts.fileField} is too large — max ${Math.floor(opts.maxBytes / (1024 * 1024))}MB.`;
    }
    data[opts.dataField] = Buffer.from(await file.arrayBuffer());
    data[opts.mimeField] = file.type;
  } else if (remove) {
    data[opts.dataField] = null;
    data[opts.mimeField] = null;
  }
  return null;
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
  const rewardMode = String(formData.get("rewardMode") ?? "XP") === "UNLOCK" ? "UNLOCK" : "XP";
  const minClearanceRaw = String(formData.get("minClearance") ?? "UNCLASSIFIED");
  const minClearance = ["UNCLASSIFIED", "SECRET", "TOP_SECRET", "ROGUE"].includes(minClearanceRaw)
    ? minClearanceRaw
    : "UNCLASSIFIED";
  const unlockText = String(formData.get("unlockText") ?? "").trim() || null;
  const unlockLinkUrl = String(formData.get("unlockLinkUrl") ?? "").trim() || null;
  const unlockLinkLabel = String(formData.get("unlockLinkLabel") ?? "").trim() || null;
  const rewardBackgroundEffect = String(formData.get("rewardBackgroundEffect") ?? "").trim() || null;
  const rewardBorderStyle = String(formData.get("rewardBorderStyle") ?? "").trim() || null;
  const rewardIcon = String(formData.get("rewardIcon") ?? "").trim() || null;
  const rewardRibbonText = String(formData.get("rewardRibbonText") ?? "").trim() || null;
  const rewardNameSuffix = String(formData.get("rewardNameSuffix") ?? "").trim() || null;
  const rewardOutlineColorPicker = formData.get("rewardOutlineColorPicker") === "on";
  const rewardBackgroundColorPicker = formData.get("rewardBackgroundColorPicker") === "on";
  const rewardPrize = String(formData.get("rewardPrize") ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";
  const opensAtRaw = String(formData.get("opensAt") ?? "");
  const closesAtRaw = String(formData.get("closesAt") ?? "");

  const data: Record<string, unknown> = {
    slug,
    title,
    description,
    answerType,
    correctAnswer: answerType === "FREE_TEXT_REVIEW" ? null : correctAnswer,
    choices: answerType === "MULTIPLE_CHOICE" ? JSON.stringify(parseChoices(choicesRaw)) : undefined,
    xpValue,
    rewardMode,
    minClearance,
    unlockText,
    unlockLinkUrl,
    unlockLinkLabel,
    rewardBackgroundEffect,
    rewardBorderStyle,
    rewardIcon,
    rewardRibbonText,
    rewardNameSuffix,
    rewardOutlineColorPicker,
    rewardBackgroundColorPicker,
    rewardPrize,
    isActive,
    opensAt: opensAtRaw ? new Date(opensAtRaw) : null,
    closesAt: closesAtRaw ? new Date(closesAtRaw) : null,
  };

  // Image/audio assets: only touched when a new file was actually chosen or
  // its "remove" checkbox was ticked — otherwise the existing bytea (if any)
  // is left completely alone rather than getting nulled out by every save.
  const assetError =
    (await applyAssetField(data, formData, {
      fileField: "questionImage",
      removeField: "questionImageRemove",
      dataField: "questionImage",
      mimeField: "questionImageMimeType",
      allowedTypes: IMAGE_TYPES,
      maxBytes: IMAGE_MAX_BYTES,
    })) ||
    (await applyAssetField(data, formData, {
      fileField: "unlockImage",
      removeField: "unlockImageRemove",
      dataField: "unlockImage",
      mimeField: "unlockImageMimeType",
      allowedTypes: IMAGE_TYPES,
      maxBytes: IMAGE_MAX_BYTES,
    })) ||
    (await applyAssetField(data, formData, {
      fileField: "unlockAudio",
      removeField: "unlockAudioRemove",
      dataField: "unlockAudio",
      mimeField: "unlockAudioMimeType",
      allowedTypes: AUDIO_TYPES,
      maxBytes: AUDIO_MAX_BYTES,
    })) ||
    (await applyAssetField(data, formData, {
      fileField: "unlockVideo",
      removeField: "unlockVideoRemove",
      dataField: "unlockVideo",
      mimeField: "unlockVideoMimeType",
      allowedTypes: VIDEO_TYPES,
      maxBytes: VIDEO_MAX_BYTES,
    }));

  if (assetError) {
    redirect(`/admin/challenges?error=${encodeURIComponent(assetError)}`);
  }

  if (id) {
    // data's exact shape is built dynamically (asset fields only present
    // when actually changed), so it doesn't line up with Prisma's precise
    // per-field input types — the runtime keys are all real Challenge
    // columns, so this is safe.
    await prisma.challenge.update({ where: { id }, data: data as never });
  } else {
    await prisma.challenge.create({ data: data as never });
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
    achievements: serializeAchievements(achievements),
    outlineColor: String(formData.get("outlineColor") ?? "").trim() || null,
    backgroundColor: String(formData.get("backgroundColor") ?? "").trim() || null,
    backgroundEffect: String(formData.get("backgroundEffect") ?? "").trim() || null,
    codenameOverride: String(formData.get("codenameOverride") ?? "").trim() || null,
    motto: String(formData.get("motto") ?? "").trim() || null,
    iconOverride: String(formData.get("iconOverride") ?? "").trim() || null,
    borderStyle: String(formData.get("borderStyle") ?? "").trim() || null,
    ribbonText: String(formData.get("ribbonText") ?? "").trim() || null,
    nameSuffix: String(formData.get("nameSuffix") ?? "").trim() || null,
    secretBackText: String(formData.get("secretBackText") ?? "").trim() || null,
    expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
  };

  await prisma.badgeFlare.upsert({
    where: { employeeId: employee!.id },
    update: data,
    create: { employeeId: employee!.id, ...data },
  });

  const changedFields = Object.entries(data)
    .filter(([key, value]) => key !== "achievements" && value !== null)
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

export async function toggleCompromisedModeAction(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get("compromisedMode") === "on";
  await setCompromisedMode(enabled);
  await logAdminAudit("SITE_THEME", `Site-wide compromised theme: ${enabled ? "ENABLED" : "disabled"}`);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

// Nick Duda is a permanent admin - hardcoded on purpose, not editable via
// the UI, so the admin panel can never be locked out by someone
// accidentally revoking every admin's access.
const PERMANENT_ADMIN_EMAIL = "nick-duda";

export async function toggleAdminAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const admin = formData.get("admin") === "on";

  if (email === PERMANENT_ADMIN_EMAIL && !admin) {
    redirect(`/admin/employees?error=${encodeURIComponent("Nick Duda is a permanent admin and can't be removed.")}`);
  }

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) redirect(`/admin/employees?error=${encodeURIComponent("Unknown employee")}`);

  await prisma.employee.update({ where: { email }, data: { isAdmin: admin } });
  await logAdminAudit(
    "ADMIN_FLAG",
    `${employee!.displayName} (${email}): ${admin ? "granted" : "revoked"} admin access`
  );
  revalidatePath("/admin/employees");
  redirect("/admin/employees?saved=1");
}

/**
 * Clears an employee's PIN (sets pinHash back to null) rather than setting
 * a new one directly - the admin never learns or transmits the employee's
 * new PIN this way, which is both simpler and a bit safer than a
 * "set-a-specific-PIN" flow. The employee just uses the New Agent tab with
 * their name once more to pick a fresh PIN and reclaim their profile -
 * exactly the same "claim a legacy account" path already used for the
 * original email->PIN migration, so it's already tested and understood by
 * the app (see registerAction in actions/identify.ts).
 */
export async function resetPinAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) redirect(`/admin/employees?error=${encodeURIComponent("Unknown employee")}`);

  await prisma.employee.update({ where: { email }, data: { pinHash: null } });
  await logAdminAudit("PIN_RESET", `${employee!.displayName} (${email}): PIN reset - must re-claim via New Agent tab`);
  revalidatePath("/admin/employees");
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

const PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2MB, same cap as self-service uploads.
const PHOTO_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Admin equivalents of the self-service photo actions (lib/actions/photo.ts)
// — same crop tool, same validation, but targets an arbitrary employee
// (bound via .bind(null, email) from FlareEditor) instead of the caller's
// own session, and requires admin auth instead of employee identity.
export async function adminUploadPhotoAction(email: string, formData: FormData) {
  await requireAdmin();
  const flareUrl = `/admin/flare?email=${encodeURIComponent(email)}`;

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) redirect(`/admin/flare?error=${encodeURIComponent("Unknown employee")}`);

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${flareUrl}&photoError=${encodeURIComponent("Please choose an image file.")}`);
  }
  if (!PHOTO_ALLOWED_TYPES.has(file.type)) {
    redirect(`${flareUrl}&photoError=${encodeURIComponent("Unsupported file type — use JPG, PNG, WEBP, or GIF.")}`);
  }
  if (file.size > PHOTO_MAX_BYTES) {
    redirect(`${flareUrl}&photoError=${encodeURIComponent("Image is too large — please use one under 2MB.")}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await prisma.employee.update({
    where: { email },
    data: { photo: buffer, photoMimeType: file.type, photoUpdatedAt: new Date() },
  });

  await logAdminAudit("PHOTO_OVERRIDE", `${employee!.displayName} (${email}): photo replaced by admin`);

  revalidatePath("/leaderboard");
  revalidatePath("/admin/flare");
  revalidatePath(`/profile/${encodeURIComponent(email)}`);
  redirect(`${flareUrl}&photoUploaded=1`);
}

export async function adminRemovePhotoAction(email: string) {
  await requireAdmin();
  const flareUrl = `/admin/flare?email=${encodeURIComponent(email)}`;

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) redirect(`/admin/flare?error=${encodeURIComponent("Unknown employee")}`);

  await prisma.employee.update({
    where: { email },
    data: { photo: null, photoMimeType: null, photoUpdatedAt: null },
  });

  await logAdminAudit("PHOTO_OVERRIDE", `${employee!.displayName} (${email}): photo removed by admin`);

  revalidatePath("/leaderboard");
  revalidatePath("/admin/flare");
  revalidatePath(`/profile/${encodeURIComponent(email)}`);
  redirect(`${flareUrl}&photoRemoved=1`);
}
