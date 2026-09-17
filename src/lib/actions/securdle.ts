"use server";

// Dedicated action for the SECURDLE challenge type - same reasoning as
// connections.ts: needs many small guess round-trips without a full
// reload, and its "existing submission" locking rule differs from the
// shared submitAnswerAction (an IN_PROGRESS row must let you keep
// guessing, where every other type's existing-row check would treat
// that as "already answered, locked").

import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getViewerClearanceInfo } from "@/lib/leaderboard";
import { meetsClearance, TierKey } from "@/lib/tiers";
import { handlePossibleTierUp, getCurrentXp } from "@/lib/tierUpEvents";
import { fireChallengeCompletedWebhook } from "@/lib/webhooks";
import {
  MAX_GUESSES,
  computeLetterStatuses,
  parseSecurdleProgress,
  formatSecurdleProgress,
  type LetterStatus,
} from "@/lib/securdle";
import { revalidatePath } from "next/cache";

export interface SecurdleGuessResult {
  /** false = the guess was rejected outright (bad input, not signed in, challenge closed/misconfigured/already finished) - error explains why. */
  ok: boolean;
  error?: string;
  /** Only present when ok is true - per-letter statuses for the guess just submitted. */
  statuses?: LetterStatus[];
  guessesUsed: number;
  guessesRemaining: number;
  gameOver: boolean;
  won: boolean;
  xpAwarded?: number;
  unlocked?: boolean;
  /** Only present once the game has actually ended (win or loss) - never sent while still in progress. */
  answer?: string;
}

function notOk(error: string, guessesUsed = 0): SecurdleGuessResult {
  return {
    ok: false,
    error,
    guessesUsed,
    guessesRemaining: Math.max(0, MAX_GUESSES - guessesUsed),
    gameOver: false,
    won: false,
  };
}

export async function submitSecurdleGuessAction(slug: string, rawGuess: string): Promise<SecurdleGuessResult> {
  const identity = await getAgentIdentity();
  if (!identity) return notOk("Not signed in.");

  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge || challenge.answerType !== "SECURDLE") return notOk("That challenge doesn't exist.");

  const answer = (challenge.correctAnswer ?? "").trim().toUpperCase();
  if (!answer) return notOk("This challenge isn't configured correctly yet.");

  const now = new Date();
  const isOpen =
    challenge.isActive && (!challenge.opensAt || challenge.opensAt <= now) && (!challenge.closesAt || challenge.closesAt >= now);
  if (!isOpen) return notOk("This mission isn't currently open.");

  const viewer = await getViewerClearanceInfo(identity.email);
  if (!viewer || !meetsClearance(viewer, challenge.minClearance as TierKey)) return notOk("Clearance insufficient.");

  const employee = await prisma.employee.upsert({
    where: { email: identity.email },
    update: {},
    create: { email: identity.email, displayName: identity.displayName },
  });

  const submission = await prisma.submission.findUnique({
    where: { employeeId_challengeId: { employeeId: employee.id, challengeId: challenge.id } },
  });

  if (submission && submission.status !== "IN_PROGRESS") {
    // Already finished (CORRECT or INCORRECT) - no retries, per the
    // "locked either way" rule (no "allow retry after a loss" option
    // for this type).
    const progress = parseSecurdleProgress(submission.answerRaw);
    return {
      ok: false,
      error: "This challenge is already finished.",
      guessesUsed: progress.guesses.length,
      guessesRemaining: Math.max(0, MAX_GUESSES - progress.guesses.length),
      gameOver: true,
      won: submission.status === "CORRECT",
      answer,
    };
  }

  const progress = submission ? parseSecurdleProgress(submission.answerRaw) : { guesses: [] };

  if (progress.guesses.length >= MAX_GUESSES) {
    // Defensive - shouldn't be reachable since the 6th guess always
    // finalizes the submission below, but never allow a 7th write.
    return notOk("Out of guesses.", progress.guesses.length);
  }

  const guess = rawGuess.trim().toUpperCase();
  // No dictionary check by design - only the letter count has to match.
  // A bad-shape guess here is rejected without consuming a real attempt.
  if (guess.length !== answer.length || !/^[A-Z]+$/.test(guess)) {
    return {
      ok: false,
      error: `Guess must be exactly ${answer.length} letters.`,
      guessesUsed: progress.guesses.length,
      guessesRemaining: Math.max(0, MAX_GUESSES - progress.guesses.length),
      gameOver: false,
      won: false,
    };
  }

  const statuses = computeLetterStatuses(guess, answer);
  const won = guess === answer;
  const newGuesses = [...progress.guesses, guess];
  const outOfGuesses = !won && newGuesses.length >= MAX_GUESSES;
  const gameOver = won || outOfGuesses;
  const newStatus = won ? "CORRECT" : outOfGuesses ? "INCORRECT" : "IN_PROGRESS";

  const isUnlock = challenge.rewardMode === "UNLOCK";
  const xpAwarded = won && !isUnlock ? challenge.xpValue : 0;
  const newAnswerRaw = formatSecurdleProgress({ guesses: newGuesses });

  const xpBefore = won ? await getCurrentXp(employee.id) : 0;

  if (submission) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { answerRaw: newAnswerRaw, status: newStatus, xpAwarded, attempts: submission.attempts + 1, submittedAt: new Date() },
    });
  } else {
    try {
      await prisma.submission.create({
        data: {
          employeeId: employee.id,
          challengeId: challenge.id,
          answerRaw: newAnswerRaw,
          status: newStatus,
          xpAwarded,
          attempts: 1,
        },
      });
    } catch {
      // Unique constraint race - someone double-submitted concurrently.
      return notOk("Something went wrong - refresh and try again.", progress.guesses.length);
    }
  }

  if (won) {
    await handlePossibleTierUp(employee, xpBefore, xpAwarded);
    await fireChallengeCompletedWebhook(challenge, employee, xpAwarded);
  }

  if (gameOver) {
    revalidatePath("/leaderboard");
    revalidatePath("/profile");
  }

  return {
    ok: true,
    statuses,
    guessesUsed: newGuesses.length,
    guessesRemaining: Math.max(0, MAX_GUESSES - newGuesses.length),
    gameOver,
    won,
    xpAwarded: won ? xpAwarded : undefined,
    unlocked: won && isUnlock,
    // Revealed only on the actual moment the game ends - win or loss -
    // never while still in progress.
    answer: gameOver ? answer : undefined,
  };
}
