"use client";

import { useMemo, useState } from "react";
import { resetSubmissionAction } from "@/lib/actions/admin";
import { summarizeConnectionsSubmission } from "@/lib/connections";

export interface AnswerRow {
  id: string;
  employeeName: string;
  employeeEmail: string;
  challengeTitle: string;
  challengeSlug: string;
  answerType: string;
  status: "CORRECT" | "INCORRECT" | "PENDING_REVIEW" | "IN_PROGRESS";
  xpAwarded: number;
  attempts: number;
  answerRaw: string;
  submittedAt: string; // pre-formatted server-side
}

const STATUS_STYLE: Record<AnswerRow["status"], string> = {
  CORRECT: "text-brand-light-green",
  INCORRECT: "text-brand-red",
  PENDING_REVIEW: "text-brand-yellow",
  IN_PROGRESS: "text-brand-cyan",
};

const STATUS_LABEL: Record<AnswerRow["status"], string> = {
  CORRECT: "Correct",
  INCORRECT: "Incorrect",
  PENDING_REVIEW: "Pending review",
  IN_PROGRESS: "In progress",
};

// Client-side search only (no server round trip) - filters across agent
// name/email and challenge title/slug in one box, since admins browse this
// two different ways: "what has this person done" and "who's answered
// this specific question" (the latter matters for flagging a question
// for retesting, per the original request).
export function AgentAnswersTable({ rows }: { rows: AnswerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeEmail.toLowerCase().includes(q) ||
        r.challengeTitle.toLowerCase().includes(q) ||
        r.challengeSlug.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by agent name/email or challenge title..."
        className="input-modern mb-4 w-full sm:max-w-md"
      />
      <p className="mb-3 font-terminal text-[11px] text-brand-sand/35">
        {filtered.length} of {rows.length} answer{rows.length === 1 ? "" : "s"}
      </p>

      <div className="surface-card overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-sand/10 text-left font-terminal text-[11px] uppercase tracking-wide text-brand-sand/40">
              <th className="px-3 py-3">Agent</th>
              <th className="px-3 py-3">Challenge</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">XP</th>
              <th className="px-3 py-3">Attempts</th>
              <th className="px-3 py-3">Answer</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Reset</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-brand-sand/5 last:border-0 align-top">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-brand-sand">{r.employeeName}</div>
                  <div className="font-terminal text-[11px] text-brand-sand/40">{r.employeeEmail}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="text-brand-sand/85">{r.challengeTitle}</div>
                  <div className="font-terminal text-[11px] text-brand-sand/35">/{r.challengeSlug}</div>
                </td>
                <td className={`px-3 py-2.5 font-terminal text-xs ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </td>
                <td className="px-3 py-2.5 font-terminal">{r.xpAwarded > 0 ? `+${r.xpAwarded}` : "—"}</td>
                <td className="px-3 py-2.5 font-terminal">{r.attempts}</td>
                <td className="max-w-[220px] px-3 py-2.5 text-brand-sand/60">
                  <span className="line-clamp-2 break-words">
                    {r.answerType === "CONNECTIONS" ? summarizeConnectionsSubmission(r.status, r.answerRaw) : r.answerRaw}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-terminal text-[11px] text-brand-sand/40">
                  {r.submittedAt}
                </td>
                <td className="px-3 py-2.5">
                  <ResetAnswerButton id={r.id} employeeName={r.employeeName} challengeTitle={r.challengeTitle} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-brand-sand/40">
                  No answers match that filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResetAnswerButton({
  id,
  employeeName,
  challengeTitle,
}: {
  id: string;
  employeeName: string;
  challengeTitle: string;
}) {
  return (
    <form
      action={resetSubmissionAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Reset ${employeeName}'s answer to "${challengeTitle}"?\n\nAny XP it awarded is removed and they'll be able to submit a fresh answer, starting back at 0 attempts.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn-secondary !border-brand-red/30 !px-2 !py-0.5 !text-[10px] !text-brand-red">
        Reset
      </button>
    </form>
  );
}
