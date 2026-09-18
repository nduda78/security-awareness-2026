"use client";

import { useMemo, useState, useTransition } from "react";
import { submitConnectionsGuessAction } from "@/lib/actions/connections";
import { burstConfetti } from "./confetti";
import { Icon } from "./Icon";

interface SolvedGroup {
  label: string;
  words: string[];
}

export interface ConnectionsBoardProps {
  slug: string;
  /** Full 16-word grid, shuffled server-side at save time. */
  words: string[];
  /** Groups already solved on page load (order = order they were solved in). */
  initialSolvedGroups: SolvedGroup[];
  initialMistakes: number;
  /** null = unlimited wrong guesses. */
  maxAttempts: number | null;
  initialStatus: "IN_PROGRESS" | "CORRECT" | "INCORRECT";
  totalGroups: number;
  xpValue: number;
  isUnlock: boolean;
  /** Rendered once the board is fully solved, when isUnlock is true - the page already knows how to build this (same UnlockedContent used by every other UNLOCK challenge). */
  unlockContent?: React.ReactNode;
  /** Optional custom text/image/audio/video (same SuccessExtras used by plain XP challenges and Securdle - see the admin form's "Success extras" section) shown once the board is fully solved, alongside the XP-earned line. */
  successExtras?: React.ReactNode;
}

// Purely cosmetic per-solved-group accent so each locked-in group reads as
// visually distinct, cycling through the same brand palette used
// elsewhere (clearance tiers, pills) rather than inventing new colors.
const GROUP_COLORS = ["#6aba48", "#ffc02a", "#2ad8ff", "#e5484d"];

export function ConnectionsBoard({
  slug,
  words,
  initialSolvedGroups,
  initialMistakes,
  maxAttempts,
  initialStatus,
  totalGroups,
  xpValue,
  isUnlock,
  unlockContent,
  successExtras,
}: ConnectionsBoardProps) {
  const [solved, setSolved] = useState<SolvedGroup[]>(initialSolvedGroups);
  const [mistakes, setMistakes] = useState(initialMistakes);
  const [status, setStatus] = useState<"IN_PROGRESS" | "CORRECT" | "INCORRECT">(initialStatus);
  const [selected, setSelected] = useState<string[]>([]);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const solvedWords = useMemo(() => new Set(solved.flatMap((g) => g.words)), [solved]);
  const remainingWords = useMemo(() => words.filter((w) => !solvedWords.has(w)), [words, solvedWords]);
  const mistakesRemaining = maxAttempts === null ? null : Math.max(0, maxAttempts - mistakes);
  const gameOver = status !== "IN_PROGRESS";

  function toggleWord(word: string) {
    if (gameOver || isPending) return;
    setError(null);
    setSelected((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= 4) return prev;
      return [...prev, word];
    });
  }

  function submitGuess(e: React.MouseEvent<HTMLButtonElement>) {
    if (selected.length !== 4 || isPending) return;
    const clickX = e.clientX;
    const clickY = e.clientY;
    setError(null);
    startTransition(async () => {
      const result = await submitConnectionsGuessAction(slug, selected);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setMistakes(result.mistakes);
      if (result.correct && result.solvedGroup) {
        setSolved((prev) => [...prev, result.solvedGroup!]);
        setSelected([]);
        setFlash("correct");
        if (result.won) burstConfetti(clickX, clickY);
      } else {
        setFlash("wrong");
        // Deliberately keep the selection on a wrong guess - matches real
        // Connections, where you swap out one tile rather than re-picking
        // all four from scratch.
      }
      setTimeout(() => setFlash(null), 500);
      if (result.gameOver) {
        setStatus(result.won ? "CORRECT" : "INCORRECT");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 font-terminal text-xs text-brand-sand/60">
        <span>
          {solved.length}/{totalGroups} groups found
        </span>
        <span>
          {mistakes} mistake{mistakes === 1 ? "" : "s"}
          {mistakesRemaining !== null && !gameOver && ` · ${mistakesRemaining} guess${mistakesRemaining === 1 ? "" : "es"} left`}
        </span>
      </div>

      {solved.length > 0 && (
        <div className="space-y-2">
          {solved.map((group, i) => (
            <div
              key={group.label}
              className="surface-card flex flex-wrap items-center gap-2 p-3"
              style={{ borderColor: `${GROUP_COLORS[i % GROUP_COLORS.length]}55` }}
            >
              <span
                className="font-terminal text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: GROUP_COLORS[i % GROUP_COLORS.length] }}
              >
                {group.label}
              </span>
              <span className="text-brand-sand/40">—</span>
              <span className="text-sm text-brand-sand/80">{group.words.join(", ")}</span>
            </div>
          ))}
        </div>
      )}

      {status === "IN_PROGRESS" && remainingWords.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {remainingWords.map((word) => {
              const isSelected = selected.includes(word);
              return (
                <button
                  key={word}
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleWord(word)}
                  className={`surface-card p-3 text-center text-xs font-medium uppercase tracking-wide transition-all sm:text-sm ${
                    isSelected ? "!border-brand-yellow !bg-brand-yellow/10 !text-brand-yellow" : "text-brand-sand/85"
                  } ${flash === "wrong" && isSelected ? "animate-shake !border-brand-red !bg-brand-red/10 !text-brand-red" : ""}`}
                >
                  {word}
                </button>
              );
            })}
          </div>

          {error && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submitGuess}
              disabled={selected.length !== 4 || isPending}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {isPending ? "Checking..." : `Submit Guess (${selected.length}/4)`}
            </button>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                disabled={isPending}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {status === "CORRECT" && (
        <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          <Icon name="trophy" className="mr-1.5 inline h-4 w-4" />
          Solved it! {isUnlock ? "Unlocked below." : `You earned +${xpValue} XP.`}
          {mistakes > 0 && ` (${mistakes} mistake${mistakes === 1 ? "" : "s"} along the way.)`}
        </div>
      )}

      {status === "CORRECT" && !isUnlock && successExtras}

      {status === "CORRECT" && isUnlock && unlockContent}

      {status === "INCORRECT" && (
        <div className="rounded-xl border border-brand-red/40 bg-brand-red/10 p-4 text-sm font-medium text-brand-red">
          <Icon name="skull" className="mr-1.5 inline h-4 w-4" />
          Out of guesses — you used all {maxAttempts} wrong {maxAttempts === 1 ? "guess" : "guesses"} without finding
          every group. This challenge is now locked.
        </div>
      )}
    </div>
  );
}
