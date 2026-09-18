"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Lets the "Unlock content" section of the challenge form live/hide based
// on the Reward Mode select, even though they're not adjacent in the JSX
// (there's a "Who can see this" + XP/question-image section between them)
// - a plain Context avoids having to restructure the form's layout just to
// make them siblings. Both pieces stay inside the same <form> either way,
// so the actual submitted fields are unaffected by this being client-side.
const RewardModeContext = createContext<{ mode: string; setMode: (m: string) => void } | null>(null);

export function RewardModeProvider({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [mode, setMode] = useState(defaultValue);
  return <RewardModeContext.Provider value={{ mode, setMode }}>{children}</RewardModeContext.Provider>;
}

export function RewardModeSelect() {
  const ctx = useContext(RewardModeContext);
  return (
    <select
      name="rewardMode"
      value={ctx?.mode ?? "XP"}
      onChange={(e) => ctx?.setMode(e.target.value)}
      className="input-modern w-full"
    >
      <option value="XP">XP (+ optional badge flare / prize)</option>
      <option value="UNLOCK">Unlock content (no XP — reveals audio/text/link/image)</option>
    </select>
  );
}

/** Renders children only while Reward Mode is UNLOCK - unmounts (not just visually hides) otherwise. */
export function UnlockOnly({ children }: { children: ReactNode }) {
  const ctx = useContext(RewardModeContext);
  if (ctx?.mode !== "UNLOCK") return null;
  return <>{children}</>;
}

/** Renders children only while Reward Mode is XP (the mirror of UnlockOnly) - unmounts (not just visually hides) otherwise. */
export function XpOnly({ children }: { children: ReactNode }) {
  const ctx = useContext(RewardModeContext);
  if (ctx?.mode === "UNLOCK") return null;
  return <>{children}</>;
}
