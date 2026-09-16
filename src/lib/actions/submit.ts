"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { revalidatePath } from "next/cache";

function normalizeAnswer(raw: string): string {
  return raw.trim();
}

function grade(
  answerType: string,
  correctAnswer: string | null,
  submitted: string
): "CORRECT" | "INCORRECT" | "PENDING_REVIEW" {
  if (answerType === "FREE_TEXT_REVIEW") return "PENDING_REVIEW";
  if (!correctAnswer) return "INCORRECT";

  if (answerType === "EXACT") {
    return submitted === correctAnswer ? "CORRECT" : "INCORRECT";
  }

  if (answerType === "CONTAINS") {
    // Correct if the submitted answer contains the target substring
    // anywhere, case-insensitively - handy for free-typed answers where
    // you only care that the key phrase shows up (e.g. "phishing" inside
    // a longer sentence).
    return submitted.toLowerCase().includes(correctAnswer.toLowerCase()) ? "CORRECT" : "INCORRECT";
  }

  if (answerType === "REGEX") {
    // correctAnswer is a JS regex pattern (no slashes/flags needed - always
    // matched case-insensitively). An admin-authored bad pattern must never
    // crash grading, so an invalid regex just grades INCORRECT rather than
    // throwing.
    try {
      return new RegExp(correctAnswer, "i").test(submitted) ? "CORRECT" : "INCORRECT";
    } catch {
      return "INCORRECT";
    }
  }

  // CASE_INSENSITIVE and MULTIPLE_CHOICE both compare case-insensitively,
  // trimmed.
  return submitted.toLowerCase() === correctAnswer.toLowerCase() ? "CORRECT" : "INCORRECT";
}

export async function submitAnswerAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const answerRaw = normalizeAnswer(String(formData.get("answer") ?? ""));

  const identity = await getAgentIdentity();
  if (!identity) {
    redirect(`/identify?next=${encodeURIComponent(`/challenges/${slug}`)}`);
  }

  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge) {
    redirect(`/challenges?error=${encodeURIComponent("That challenge doesn't exist.")}`);
  }

  const now = new Date();
  const isOpen =
    challenge.isActive &&
    (!challenge.opensAt || challenge.opensAt <= now) &&
    (!challenge.closesAt || challenge.closesAt >= now);

  if (!isOpen) {
    redirect(`/challenges/${slug}?error=${encodeURIComponent("This challenge is not currently open.")}`);
  }

  const employee = await prisma.employee.upsert({
    where: { email: identity!.email },
    update: {},
    create: { email: identity!.email, displayName: identity!.displayName },
  });

  // Belt-and-suspenders dedup: check first (nice UX message), and rely on
  // the DB unique constraint as the hard backstop against races.
  const existing = await prisma.submission.findUnique({
    where: { employeeId_challengeId: { employeeId: employee.id, challengeId: challenge.id } },
  });

  // FREE_TEXT_REVIEW is always one-shot, no matter what maxAttempts says -
  // there's no auto-grading to retry against, just a human decision, and
  // that decision is meant to be final.
  const isFreeText = challenge.answerType === "FREE_TEXT_REVIEW";

  if (existing) {
    // CORRECT (XP already awarded) or PENDING_REVIEW (awaiting the
    // Security team) are always locked, same as before - retries only
    // ever apply to a wrong (INCORRECT) attempt.
    if (existing.status !== "INCORRECT") {
      redirect(`/challenges/${slug}?already=1`);
    }
    if (isFreeText) {
      redirect(`/challenges/${slug}?already=1`);
    }
    if (challenge.maxAttempts !== null && existing.attempts >= challenge.maxAttempts) {
      // Used up every attempt without getting it right - permanently
      // locked, distinct from the generic "already" message so the UI can
      // show a clear "you're out of attempts" state.
      redirect(`/challenges/${slug}?outOfAttempts=1`);
    }
    // Otherwise falls through and retries below - the existing row gets
    // UPDATEd (not deleted+recreated) so the attempts counter persists.
  }

  if (!answerRaw) {
    redirect(`/challenges/${slug}?error=${encodeURIComponent("Please enter an answer.")}`);
  }

  const status = grade(challenge.answerType, challenge.correctAnswer, answerRaw);
  const xpAwarded = challenge.rewardMode === "UNLOCK" ? 0 : status === "CORRECT" ? challenge.xpValue : 0;

  if (existing) {
    await prisma.submission.update({
      where: { id: existing.id },
      data: { answerRaw, status, xpAwarded, attempts: existing.attempts + 1, submittedAt: new Date() },
    });
  } else {
    try {
      await prisma.submission.create({
        data: {
          employeeId: employee.id,
          challengeId: challenge.id,
          answerRaw,
          status,
          xpAwarded,
          attempts: 1,
        },
      });
    } catch {
      // Unique constraint race — someone double-submitted concurrently.
      redirect(`/challenges/${slug}?already=1`);
    }
  }

  revalidatePath("/leaderboard");
  revalidatePath("/profile");

  // Grading/XP still happens for real behind the scenes (status/xpAwarded
  // are stored above) — the employee-facing message is intentionally a
  // generic acknowledgment rather than an immediate right/wrong reveal.
  redirect(`/challenges/${slug}?submitted=1`);
}
