"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { submitSecurdleGuessAction } from "@/lib/actions/securdle";
import { MAX_GUESSES, computeKeyboardStatuses, type LetterStatus, type SecurdleGuessResult } from "@/lib/securdle";
import { Icon } from "./Icon";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const TILE_CLASS: Record<LetterStatus, string> = {
  correct: "border-brand-light-green bg-brand-light-green text-white",
  present: "border-brand-yellow bg-brand-yellow text-brand-dark-green",
  absent: "border-brand-sand/10 bg-black/40 text-brand-sand/40",
};

const KEY_CLASS: Record<LetterStatus | "unknown", string> = {
  correct: "bg-brand-light-green text-white",
  present: "bg-brand-yellow text-brand-dark-green",
  absent: "bg-black/50 text-brand-sand/35",
  unknown: "bg-brand-sand/10 text-brand-sand/85 hover:bg-brand-sand/20",
};

export interface SecurdleBoardProps {
  slug: string;
  answerLength: number;
  /** Every guess already submitted, with their per-letter statuses - computed server-side (the page already has the real answer), so the client never needs to know the answer itself to redisplay past guesses. */
  initialGuessResults: SecurdleGuessResult[];
  initialStatus: "IN_PROGRESS" | "CORRECT" | "INCORRECT";
  xpValue: number;
  isUnlock: boolean;
  unlockContent?: React.ReactNode;
  /** Only set once the game is actually over (win or loss) - never sent while still in progress. */
  revealedAnswer?: string | null;
}

export function SecurdleBoard({
  slug,
  answerLength,
  initialGuessResults,
  initialStatus,
  xpValue,
  isUnlock,
  unlockContent,
  revealedAnswer,
}: SecurdleBoardProps) {
  const [results, setResults] = useState<SecurdleGuessResult[]>(initialGuessResults);
  const [status, setStatus] = useState<"IN_PROGRESS" | "CORRECT" | "INCORRECT">(initialStatus);
  const [answer, setAnswer] = useState<string | null>(revealedAnswer ?? null);
  const [currentGuess, setCurrentGuess] = useState("");
  // Mirrors currentGuess synchronously - submitGuess reads this instead
  // of the state value directly, since a fast typist (or rapid on-screen
  // taps) can fire several key handlers within the same React batch
  // before a re-render happens, leaving submitGuess's own closure over
  // `currentGuess` looking at a stale pre-batch value at the moment
  // Enter is pressed. The ref is always updated in the exact same tick
  // as each keystroke, so it never has this staleness problem.
  const currentGuessRef = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isPending, startTransition] = useTransition();

  const gameOver = status !== "IN_PROGRESS";
  const guessesRemaining = MAX_GUESSES - results.length;
  const keyboardStatuses = useMemo(() => computeKeyboardStatuses(results), [results]);

  const submitGuess = useCallback(() => {
    if (gameOver || isPending) return;
    const guess = currentGuessRef.current;
    if (guess.length !== answerLength) {
      setError(`Guess must be exactly ${answerLength} letters.`);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitSecurdleGuessAction(slug, guess);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }
      setResults((prev) => [...prev, { word: guess, statuses: result.statuses! }]);
      currentGuessRef.current = "";
      setCurrentGuess("");
      if (result.gameOver) {
        setStatus(result.won ? "CORRECT" : "INCORRECT");
        if (result.answer) setAnswer(result.answer);
      }
    });
  }, [answerLength, gameOver, isPending, slug]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver || isPending) return;
      if (key === "ENTER") {
        submitGuess();
      } else if (key === "BACKSPACE") {
        setError(null);
        currentGuessRef.current = currentGuessRef.current.slice(0, -1);
        setCurrentGuess(currentGuessRef.current);
      } else if (/^[A-Z]$/.test(key) && currentGuessRef.current.length < answerLength) {
        setError(null);
        currentGuessRef.current = currentGuessRef.current + key;
        setCurrentGuess(currentGuessRef.current);
      }
    },
    [answerLength, gameOver, isPending, submitGuess]
  );

  // Real physical keyboard support, in addition to the on-screen keys.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("ENTER");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKey("BACKSPACE");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKey(e.key.toUpperCase());
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  if (answerLength <= 0) {
    return (
      <div className="surface-card p-4 text-sm text-brand-sand/60">This challenge isn&apos;t configured correctly yet.</div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 font-terminal text-xs text-brand-sand/60">
        <span>{answerLength}-letter word</span>
        <span>
          {gameOver ? (status === "CORRECT" ? "Solved" : "Out of guesses") : `${guessesRemaining} guess${guessesRemaining === 1 ? "" : "es"} left`}
        </span>
      </div>

      {/* Grid - width scales with word length (some Securdle answers run
          up to 10 letters) rather than a fixed tile size, so a long word
          never overflows its container on narrow screens. */}
      <div className="mx-auto flex flex-col items-center gap-1.5" style={{ width: `min(100%, ${answerLength * 3.2}rem)` }}>
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
          const submitted = results[row];
          const isCurrentRow = !submitted && row === results.length && !gameOver;
          const letters = submitted
            ? submitted.word.split("")
            : isCurrentRow
              ? currentGuess.padEnd(answerLength).split("")
              : new Array(answerLength).fill("");
          return (
            <div
              key={row}
              className={`grid w-full gap-1.5 ${isCurrentRow && shake ? "animate-shake" : ""}`}
              style={{ gridTemplateColumns: `repeat(${answerLength}, minmax(0, 1fr))` }}
            >
              {letters.map((letter, col) => {
                const status = submitted?.statuses[col];
                return (
                  <div
                    key={col}
                    className={`flex aspect-square w-full items-center justify-center rounded-md border-2 font-terminal font-bold uppercase ${
                      answerLength > 7 ? "text-sm" : "text-lg"
                    } ${status ? TILE_CLASS[status] : "border-brand-sand/20 bg-transparent text-brand-sand"}`}
                  >
                    {letter.trim()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {error && <div className="mx-auto max-w-md rounded-xl bg-brand-red/15 p-3 text-center text-sm text-brand-red">{error}</div>}

      {/* On-screen keyboard */}
      {!gameOver && (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-1.5">
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1.5">
              {row.map((key) => {
                const isWide = key === "ENTER" || key === "BACKSPACE";
                const letterStatus = key.length === 1 ? keyboardStatuses[key] : undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleKey(key)}
                    className={`flex h-11 items-center justify-center rounded-md font-terminal text-xs font-bold uppercase transition ${
                      isWide ? "px-2.5 text-[10px]" : "w-8 sm:w-9"
                    } ${KEY_CLASS[letterStatus ?? "unknown"]}`}
                  >
                    {key === "BACKSPACE" ? "\u232B" : key === "ENTER" ? "ENTER" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {status === "CORRECT" && (
        <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-center text-sm text-brand-light-green">
          <Icon name="trophy" className="mr-1.5 inline h-4 w-4" />
          {results.length > 0 ? (
            <>Solved it in {results.length}/{MAX_GUESSES}! </>
          ) : (
            // No guess history to show - covers a small number of legacy
            // submissions from before this challenge was migrated to the
            // real Wordle board (their answerRaw predates this format).
            <>Already solved. </>
          )}
          {isUnlock ? "Unlocked below." : `You earned +${xpValue} XP.`}
        </div>
      )}

      {status === "CORRECT" && isUnlock && unlockContent}

      {status === "INCORRECT" && (
        <div className="rounded-xl border border-brand-red/40 bg-brand-red/10 p-4 text-center text-sm font-medium text-brand-red">
          <Icon name="skull" className="mr-1.5 inline h-4 w-4" />
          Out of guesses. The answer was <span className="font-bold tracking-wide">{answer}</span>.
        </div>
      )}
    </div>
  );
}
