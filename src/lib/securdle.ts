// Shared types/helpers for the SECURDLE challenge type (answerType =
// "SECURDLE") - a real Wordle clone. Reuses existing generic columns,
// same trick as CONNECTIONS (lib/connections.ts):
//
//   Challenge.correctAnswer -> the target word (uppercased). Word length
//                              is just correctAnswer.length - no separate
//                              length field, and guesses are hardcoded
//                              at 6 (not configurable per-challenge).
//   Submission.answerRaw    -> live game progress (SecurdleProgress),
//                              updated in place per guess
//   Submission.status       -> IN_PROGRESS (shared with CONNECTIONS)
//                              until CORRECT (won) or INCORRECT (used
//                              all 6 guesses without winning)

export const MAX_GUESSES = 6;

export type LetterStatus = "correct" | "present" | "absent";

export interface SecurdleProgress {
  /** Every guess submitted so far, in order, uppercased. */
  guesses: string[];
}

/** Parses Submission.answerRaw for a SECURDLE submission. Never throws -
 * malformed/missing/legacy (pre-migration plain-string) data all yield
 * "no guesses yet" rather than crashing the board. */
export function parseSecurdleProgress(answerRaw: string | null | undefined): SecurdleProgress {
  if (!answerRaw) return { guesses: [] };
  try {
    const parsed = JSON.parse(answerRaw);
    const guesses = Array.isArray(parsed?.guesses)
      ? parsed.guesses.filter((g: unknown): g is string => typeof g === "string")
      : [];
    return { guesses };
  } catch {
    return { guesses: [] };
  }
}

export function formatSecurdleProgress(progress: SecurdleProgress): string {
  return JSON.stringify(progress);
}

/**
 * Real Wordle letter-status algorithm: exact-position matches are
 * claimed first, then remaining letters in the guess are matched against
 * remaining (not-yet-claimed) letters in the answer for "present",
 * without double-counting a repeated letter more times than it actually
 * appears in the answer. `guess` and `answer` must be the same length
 * and already uppercased by the caller.
 */
export function computeLetterStatuses(guess: string, answer: string): LetterStatus[] {
  const len = answer.length;
  const statuses: LetterStatus[] = new Array(len).fill("absent");
  const answerLettersRemaining: (string | null)[] = answer.split("");

  // Pass 1: exact position matches - claim that answer letter so it
  // can't also satisfy a "present" match for a different guess position.
  for (let i = 0; i < len; i++) {
    if (guess[i] === answer[i]) {
      statuses[i] = "correct";
      answerLettersRemaining[i] = null;
    }
  }

  // Pass 2: remaining guess letters check against remaining
  // (unclaimed) answer letters, left to right - each unclaimed answer
  // letter can satisfy at most one "present" guess letter.
  for (let i = 0; i < len; i++) {
    if (statuses[i] === "correct") continue;
    const idx = answerLettersRemaining.indexOf(guess[i]);
    if (idx !== -1) {
      statuses[i] = "present";
      answerLettersRemaining[idx] = null;
    }
  }

  return statuses;
}

export interface SecurdleGuessResult {
  word: string;
  statuses: LetterStatus[];
}

/**
 * Best-known status for every letter seen across all submitted guesses
 * so far - correct beats present beats absent, matching the on-screen
 * keyboard's coloring. Deliberately takes already-known {word, statuses}
 * pairs rather than the raw answer, so it can run entirely client-side
 * (SecurdleBoard never receives the real answer while a game is still
 * in progress) as well as server-side.
 */
export function computeKeyboardStatuses(results: SecurdleGuessResult[]): Record<string, LetterStatus> {
  const rank: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 };
  const best: Record<string, LetterStatus> = {};
  for (const { word, statuses } of results) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const status = statuses[i];
      if (!best[letter] || rank[status] > rank[best[letter]]) {
        best[letter] = status;
      }
    }
  }
  return best;
}

/** Human-readable one-liner for admin Answers/Submissions tables, instead of dumping the raw JSON progress blob. `answer` is the challenge's real correctAnswer, so a loss can name the word that was missed. */
export function summarizeSecurdleSubmission(status: string, answerRaw: string | null, answer: string): string {
  const { guesses } = parseSecurdleProgress(answerRaw);
  if (status === "CORRECT") return `Solved in ${guesses.length}/${MAX_GUESSES}`;
  if (status === "INCORRECT") return `Lost - answer was ${answer}`;
  return `${guesses.length}/${MAX_GUESSES} guesses used`;
}
