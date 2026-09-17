"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEasternShortDate } from "@/lib/easternTime";

export interface PrizeWinnerRow {
  submissionId: string;
  employeeEmail: string;
  displayName: string;
  photoUrl: string | null;
  challengeTitle: string;
  challengeSlug: string;
  prize: string;
  wonAt: string; // ISO
}

/**
 * Client-side search over the already-loaded winners list - no server
 * round trip, same pattern as AgentsTable. Matches on agent name/handle,
 * the prize itself, or the challenge title, since any of those is a
 * reasonable thing to search for ("who won the hoodie?", "did Jordan win
 * anything?", "who beat Securdle?").
 */
export function PrizeWinnersList({ rows }: { rows: PrizeWinnerRow[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.employeeEmail.toLowerCase().includes(q) ||
        r.prize.toLowerCase().includes(q) ||
        r.challengeTitle.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search winners by agent, prize, or challenge..."
        className="input-modern mb-4 w-full sm:max-w-sm"
      />
      <p className="mb-4 font-terminal text-[11px] text-brand-sand/35">
        {visible.length} of {rows.length} prize {rows.length === 1 ? "win" : "wins"}
      </p>

      {visible.length === 0 && (
        <div className="surface-card p-6 text-center font-terminal text-sm text-brand-sand/40">
          {rows.length === 0 ? "No prizes have been won yet." : `No winners match "${query}".`}
        </div>
      )}

      <div className="space-y-2">
        {visible.map((r) => (
          <div key={r.submissionId} className="surface-card flex flex-wrap items-center gap-4 p-4">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand-sand/10">
              {r.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${encodeURIComponent(r.employeeEmail)}`}
                className="font-medium text-brand-sand hover:underline"
              >
                {r.displayName}
              </Link>
              {r.challengeTitle && (
                <div className="font-terminal text-xs text-brand-sand/40">
                  won for{" "}
                  <Link href={`/challenges/${r.challengeSlug}`} className="text-brand-cyan hover:underline">
                    {r.challengeTitle}
                  </Link>
                </div>
              )}
            </div>
            <div className="rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-1 font-terminal text-xs font-bold uppercase tracking-wide text-brand-yellow">
              🏆 {r.prize}
            </div>
            <div className="w-full shrink-0 text-right font-terminal text-[11px] text-brand-sand/30 sm:w-auto">
              {formatEasternShortDate(new Date(r.wonAt))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
