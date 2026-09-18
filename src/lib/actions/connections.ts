"use server";

// Dedicated action for the CONNECTIONS challenge type - deliberately NOT
// routed through submitAnswerAction (submit.ts). Every other answer type
// submits once (or once per retry) and gets a redirect back with a
// query-param outcome; Connections needs many small guess round-trips
// without a full page reload, and its "existing submission" locking rule
// is different too - an IN_PROGRESS row must let you keep playing, where
// every other type's existing-row check would treat that as "already
// answered, locked". Called directly from the client component as a
// plain async function (Server Actions work outside <form action> too),
// returning a JSON result object rather than redirecting.

import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getViewerClearanceInfo } from "@/lib/leaderboard";
import { meetsClearance, TierKey } from "@/lib/tiers";
import { handlePossibleTierUp, getCurrentXp } from "@/lib/tierUpEvents";
import { fireChallengeCompletedWebhook } from "@/lib/webhooks";
import { parseConnectionsGroups, parseConnectionsProgress, formatConnectionsProgress } from "@/lib/connections";
import { revalidatePath } from "next/cache";

export interface ConnectionsGuessResult {
  /** false = the guess was rejected outright (bad input, not signed in, challenge closed/misconfigured/already finished) - error explains why. */
  ok: boolean;
  error?: string;
  /** Only meaningful when ok is true. */
  correct?: boolean;
  /** Only present when ok && correct - the group's label is deliberately never sent to the client until it's actually solved. */
  solvedGroup?: { label: string; words: string[] };
  mistakes: number;
  mistakesRemaining: number | null;
  solvedCount: number;
  totalGroups: number;
  gameOver: boolean;
  won: boolean;
  xpAwarded?: number;
  unlocked?: boolean;
}

function notOk(error: string, mistakes = 0, solvedCount = 0, gameOver = false, won = false): ConnectionsGuessResult {
  return { ok: false, error, mistakes, mistakesRemaining: null, solvedCount, totalGroups: 4, gameOver, won };
}

export async function submitConnectionsGuessAction(slug: string, guessedWords: string[]): Promise<ConnectionsGuessResult> {
  const identity = await getAgentIdentity();
  if (!identity) return notOk("Not signed in.");

  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge || challenge.answerType !== "CONNECTIONS") return notOk("That challenge doesn't exist.");

  const now = new Date();
  const isOpen =
    challenge.isActive && (!challenge.opensAt || challenge.opensAt <= now) && (!challenge.closesAt || challenge.closesAt >= now);
  if (!isOpen) return notOk("This mission isn't currently open.");

  const viewer = await getViewerClearanceInfo(identity.email);
  if (!viewer || !meetsClearance(viewer, challenge.minClearance as TierKey)) return notOk("Clearance insufficient.");

  const groups = parseConnectionsGroups(challenge.correctAnswer);
  if (groups.length !== 4) return notOk("This challenge isn't configured correctly yet.");

  const employee = await prisma.employee.upsert({
    where: { email: identity.email },
    update: {},
    create: { email: identity.email, displayName: identity.displayName },
  });

  const submission = await prisma.submission.findUnique({
    where: { employeeId_challengeId: { employeeId: employee.id, challengeId: challenge.id } },
  });

  if (submission && submission.status !== "IN_PROGRESS") {
    // Already finished (CORRECT or INCORRECT/locked-out) - no more guesses.
    const progress = parseConnectionsProgress(submission.answerRaw);
    return {
      ok: false,
      error: "This challenge is already finished.",
      mistakes: progress.mistakes,
      mistakesRemaining:
        challenge.maxAttempts === null ? null : Math.max(0, challenge.maxAttempts - progress.mistakes),
      solvedCount: progress.solvedGroupIndexes.length,
      totalGroups: groups.length,
      gameOver: true,
      won: submission.status === "CORRECT",
    };
  }

  const progress = submission ? parseConnectionsProgress(submission.answerRaw) : { solvedGroupIndexes: [], mistakes: 0 };

  // Validate the guess shape itself: exactly 4 distinct real words, none
  // already part of a solved group. A bad guess here means a stale/tampered
  // client, not a real game mistake - reject without consuming an attempt.
  const dedupedGuess = Array.from(new Set(guessedWords.map((w) => w.trim()).filter(Boolean)));
  const solvedWordsSoFar = new Set(progress.solvedGroupIndexes.flatMap((i) => groups[i].words));
  const allWords = new Set(groups.flatMap((g) => g.words));
  const validShape =
    dedupedGuess.length === 4 &&
    dedupedGuess.every((w) => !solvedWordsSoFar.has(w)) &&
    dedupedGuess.every((w) => allWords.has(w));

  if (!validShape) {
    return {
      ok: false,
      error: "That's not a valid guess.",
      mistakes: progress.mistakes,
      mistakesRemaining: challenge.maxAttempts === null ? null : Math.max(0, challenge.maxAttempts - progress.mistakes),
      solvedCount: progress.solvedGroupIndexes.length,
      totalGroups: groups.length,
      gameOver: false,
      won: false,
    };
  }

  const matchedGroupIndex = groups.findIndex(
    (g, i) => !progress.solvedGroupIndexes.includes(i) && g.words.every((w) => dedupedGuess.includes(w))
  );
  const correct = matchedGroupIndex !== -1;

  const newSolvedGroupIndexes = correct ? [...progress.solvedGroupIndexes, matchedGroupIndex] : progress.solvedGroupIndexes;
  const newMistakes = correct ? progress.mistakes : progress.mistakes + 1;
  const won = newSolvedGroupIndexes.length === groups.length;
  const outOfGuesses = !won && challenge.maxAttempts !== null && newMistakes >= challenge.maxAttempts;
  const gameOver = won || outOfGuesses;
  const newStatus = won ? "CORRECT" : outOfGuesses ? "INCORRECT" : "IN_PROGRESS";

  const isUnlock = challenge.rewardMode === "UNLOCK";
  const xpAwarded = won && !isUnlock ? challenge.xpValue : 0;
  const newAnswerRaw = formatConnectionsProgress({ solvedGroupIndexes: newSolvedGroupIndexes, mistakes: newMistakes });

  // Same convention as submit.ts: capture the "before" XP total prior to
  // writing this submission's own row, since it's never CORRECT yet at
  // this point (locked-finished cases already returned above).
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
      return notOk("Something went wrong - refresh and try again.", progress.mistakes, progress.solvedGroupIndexes.length);
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
    correct,
    solvedGroup: correct ? groups[matchedGroupIndex] : undefined,
    mistakes: newMistakes,
    mistakesRemaining: challenge.maxAttempts === null ? null : Math.max(0, challenge.maxAttempts - newMistakes),
    solvedCount: newSolvedGroupIndexes.length,
    totalGroups: groups.length,
    gameOver,
    won,
    xpAwarded: won ? xpAwarded : undefined,
    unlocked: won && isUnlock,
  };
}
