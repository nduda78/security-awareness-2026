"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Lets the "Security Connections groups" section of the challenge form
// live/hide based on the Answer type select, the same Context pattern
// RewardModeContext.tsx uses for the Unlock-content section - a plain
// Context avoids restructuring the form's layout just to make the select
// and the conditional section siblings. Both stay inside the same <form>
// either way, so the submitted fields are unaffected by this being
// client-side.
const AnswerTypeContext = createContext<{ type: string; setType: (t: string) => void } | null>(null);

export function AnswerTypeProvider({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [type, setType] = useState(defaultValue);
  return <AnswerTypeContext.Provider value={{ type, setType }}>{children}</AnswerTypeContext.Provider>;
}

export function AnswerTypeSelect() {
  const ctx = useContext(AnswerTypeContext);
  return (
    <select
      name="answerType"
      value={ctx?.type ?? "EXACT"}
      onChange={(e) => ctx?.setType(e.target.value)}
      className="input-modern w-full"
    >
      <option value="EXACT">Exact match</option>
      <option value="CASE_INSENSITIVE">Case-insensitive match</option>
      <option value="CONTAINS">Contains (substring)</option>
      <option value="REGEX">Regex</option>
      <option value="MULTIPLE_CHOICE">Multiple choice</option>
      <option value="FREE_TEXT_REVIEW">Free text (manual review)</option>
      <option value="CONNECTIONS">Security Connections (word-grouping game)</option>
    </select>
  );
}

/** Renders children only while Answer type is CONNECTIONS - unmounts (not just visually hides) otherwise. */
export function ConnectionsOnly({ children }: { children: ReactNode }) {
  const ctx = useContext(AnswerTypeContext);
  if (ctx?.type !== "CONNECTIONS") return null;
  return <>{children}</>;
}
