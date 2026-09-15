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

  if (existing) {
    if (challenge.rewardMode === "UNLOCK") {
      // UNLOCK challenges aren't scored, so there's no fairness reason to
      // cap attempts at one — clear the old attempt and let them try again.
      await prisma.submission.delete({ where: { id: existing.id } });
    } else {
      redirect(`/challenges/${slug}?already=1`);
    }
  }

  if (!answerRaw) {
    redirect(`/challenges/${slug}?error=${encodeURIComponent("Please enter an answer.")}`);
  }

  const status = grade(challenge.answerType, challenge.correctAnswer, answerRaw);
  const xpAwarded = challenge.rewardMode === "UNLOCK" ? 0 : status === "CORRECT" ? challenge.xpValue : 0;

  try {
    await prisma.submission.create({
      data: {
        employeeId: employee.id,
        challengeId: challenge.id,
        answerRaw,
        status,
        xpAwarded,
      },
    });
  } catch {
    // Unique constraint race — someone double-submitted concurrently.
    redirect(`/challenges/${slug}?already=1`);
  }

  revalidatePath("/leaderboard");
  revalidatePath("/profile");

  // Grading/XP still happens for real behind the scenes (status/xpAwarded
  // are stored above) — the employee-facing message is intentionally a
  // generic acknowledgment rather than an immediate right/wrong reveal.
  redirect(`/challenges/${slug}?submitted=1`);
}
