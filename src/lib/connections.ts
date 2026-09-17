// Shared types/helpers for the "SECURITY CONNECTIONS" challenge type
// (answerType = "CONNECTIONS") - a full NYT Connections clone: 16 words,
// sort into 4 labeled groups of 4. Every piece of this reuses existing
// generic String/String? columns via JSON encoding rather than a schema
// migration:
//
//   Challenge.choices        -> the 16 words, shuffled once at save time
//                                (display order = grid order)
//   Challenge.correctAnswer  -> the 4 groups (ConnectionsGroup[])
//   Challenge.maxAttempts    -> reused as "max wrong GROUP guesses",
//                                not max submissions (blank = unlimited)
//   Submission.answerRaw     -> live game progress (ConnectionsProgress),
//                                updated in place on every guess
//   Submission.status        -> gets a 4th value only this type ever
//                                writes: "IN_PROGRESS" (game not yet won
//                                or locked out), alongside the existing
//                                CORRECT / INCORRECT / PENDING_REVIEW

export interface ConnectionsGroup {
  label: string;
  words: string[];
}

export interface ConnectionsProgress {
  solvedGroupIndexes: number[];
  mistakes: number;
}

/** Parses Challenge.correctAnswer for a CONNECTIONS challenge. Never throws - malformed/missing data just yields no groups, which callers treat as "not configured". */
export function parseConnectionsGroups(correctAnswer: string | null | undefined): ConnectionsGroup[] {
  if (!correctAnswer) return [];
  try {
    const parsed = JSON.parse(correctAnswer);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((g): g is { label: unknown; words: unknown } => !!g && typeof g === "object")
      .map((g) => ({
        label: typeof g.label === "string" ? g.label : "",
        words: Array.isArray(g.words) ? g.words.map((w: unknown) => String(w)) : [],
      }))
      .filter((g) => g.label && g.words.length === 4);
  } catch {
    return [];
  }
}

/** Parses Submission.answerRaw for a CONNECTIONS submission. Never throws - malformed/missing data yields "nothing solved yet". */
export function parseConnectionsProgress(answerRaw: string | null | undefined): ConnectionsProgress {
  if (!answerRaw) return { solvedGroupIndexes: [], mistakes: 0 };
  try {
    const parsed = JSON.parse(answerRaw);
    const solvedGroupIndexes = Array.isArray(parsed?.solvedGroupIndexes)
      ? parsed.solvedGroupIndexes.filter((n: unknown): n is number => typeof n === "number")
      : [];
    const mistakes = typeof parsed?.mistakes === "number" ? parsed.mistakes : 0;
    return { solvedGroupIndexes, mistakes };
  } catch {
    return { solvedGroupIndexes: [], mistakes: 0 };
  }
}

export function formatConnectionsProgress(progress: ConnectionsProgress): string {
  return JSON.stringify(progress);
}

/** Fisher-Yates shuffle - used once at admin save time to scramble the 16-word grid order (never grouped by category). */
export function shuffleWords(words: string[]): string[] {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Human-readable one-liner for admin Answers/Submissions tables, instead of dumping the raw JSON progress blob. */
export function summarizeConnectionsSubmission(status: string, answerRaw: string | null, totalGroups = 4): string {
  const { solvedGroupIndexes, mistakes } = parseConnectionsProgress(answerRaw);
  const solved = solvedGroupIndexes.length;
  const mistakeWord = mistakes === 1 ? "mistake" : "mistakes";
  if (status === "CORRECT") return `Completed — ${mistakes} ${mistakeWord}`;
  if (status === "INCORRECT") return `Out of guesses — ${solved}/${totalGroups} found`;
  return `${solved}/${totalGroups} found, ${mistakes} ${mistakeWord}`;
}
