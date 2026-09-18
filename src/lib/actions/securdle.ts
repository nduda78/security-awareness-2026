"use server";

// Dedicated action for the SECURDLE challenge type - same reasoning as
// connections.ts: needs many small guess round-trips without a full
// reload, and its "existing submission" locking rule differs from the
// shared submitAnswerAction (an IN_PROGRESS row must let you keep
// guessing, where every other type's existing-row check would treat
// that as "already answered, locked").
//
// Securdle is meant to be played over and over until you win: using all
// 6 guesses without winning silently resets the round (back to 0/6, same
// word) rather than permanently locking the challenge - and the answer
// is NEVER sent to the browser, not even on a loss, since there's always
// another round coming. Winning is still final: once CORRECT, that's it.

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
  /** false = the guess was rejected outright (bad input, not signed in, challenge closed/misconfigured/already won) - error explains why. */
  ok: boolean;
  error?: string;
  /** Only present when ok is true - per-letter statuses for the guess just submitted. */
  statuses?: LetterStatus[];
  guessesUsed: number;
  guessesRemaining: number;
  won: boolean;
  xpAwarded?: number;
  unlocked?: boolean;
  /** True exactly when this guess used up the 6th try without winning - the round resets (server-side, already done by the time this returns) but the answer is never included here. The client shows the just-submitted guess's tiles, then clears back to an empty board for another round. */
  roundLost?: boolean;
}

function notOk(error: string, guessesUsed = 0): SecurdleGuessResult {
  return {
    ok: false,
    error,
    guessesUsed,
    guessesRemaining: Math.max(0, MAX_GUESSES - guessesUsed),
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

  if (submission && submission.status === "CORRECT") {
    // Already won - that's the only permanently-final state for this
    // type. A loss never lands here anymore (see below).
    return notOk("You've already solved this one.", MAX_GUESSES);
  }

  // Legacy INCORRECT rows (from before Securdle allowed retries) and any
  // round that's somehow already sitting at a full 6 guesses both start
  // this call as a fresh round - the word doesn't change, only the
  // guess history resets.
  let progress = submission ? parseSecurdleProgress(submission.answerRaw) : { guesses: [] };
  if ((submission && submission.status === "INCORRECT") || progress.guesses.length >= MAX_GUESSES) {
    progress = { guesses: [] };
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
      won: false,
    };
  }

  const statuses = computeLetterStatuses(guess, answer);
  const won = guess === answer;
  const attemptedGuesses = [...progress.guesses, guess];
  const roundLost = !won && attemptedGuesses.length >= MAX_GUESSES;
  // A lost round resets immediately - the stored progress for next time
  // is already empty, so the very next guess (whenever they make it)
  // starts a brand new round at 0/6. status stays IN_PROGRESS regardless
  // - there's no separate "locked, out of guesses" state anymore.
  const newGuesses = roundLost ? [] : attemptedGuesses;
  const newStatus = won ? "CORRECT" : "IN_PROGRESS";

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
    revalidatePath("/leaderboard");
    revalidatePath("/profile");
  }

  return {
    ok: true,
    statuses,
    guessesUsed: attemptedGuesses.length,
    guessesRemaining: Math.max(0, MAX_GUESSES - attemptedGuesses.length),
    won,
    xpAwarded: won ? xpAwarded : undefined,
    unlocked: won && isUnlock,
    roundLost,
  };
}
