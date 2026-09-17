"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEasternShortDate } from "@/lib/easternTime";

export interface PrizeWinnerEntry {
  prize: string;
  wonAt: string; // ISO
  /// "achievement" = a freeform Achievements entry (real-world prize,
  /// e.g. "Won a MacBook"). "flare" = a granted ribbon/name-suffix badge
  /// flare field - styled distinctly (cyan, matching the Challenges
  /// page's own "unlocks: ..." cyan) since it's a cosmetic badge reward
  /// rather than a literal physical/real-world prize.
  source: "achievement" | "flare";
  sourceChallengeTitle: string | null;
  sourceChallengeSlug: string | null;
}

export interface PrizeWinnerGroup {
  employeeEmail: string;
  displayName: string;
  photoUrl: string | null;
  entries: PrizeWinnerEntry[];
  latestWonAt: string; // ISO
}

/**
 * Registry view — one expandable row per winner, showing every prize
 * they've won inside. Client-side search over the already-loaded data
 * (same no-round-trip pattern as AgentsTable): matches on the person's
 * name/handle, or any of their individual prizes/source challenges, so
 * a match anywhere inside a person's list surfaces (and auto-expands)
 * that person even if the query itself doesn't match their name.
 */
export function PrizeWinnersList({ groups }: { groups: PrizeWinnerGroup[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      if (g.displayName.toLowerCase().includes(q) || g.employeeEmail.toLowerCase().includes(q)) return true;
      return g.entries.some(
        (e) =>
          e.prize.toLowerCase().includes(q) ||
          (e.sourceChallengeTitle ?? "").toLowerCase().includes(q),
      );
    });
  }, [groups, query]);

  const totalPrizes = groups.reduce((sum, g) => sum + g.entries.length, 0);
  const visiblePrizes = visible.reduce((sum, g) => sum + g.entries.length, 0);
  const isSearching = query.trim().length > 0;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search winners by agent, prize, or challenge..."
        className="input-modern mb-4 w-full sm:max-w-sm"
      />
      <p className="mb-4 font-terminal text-[11px] text-brand-sand/35">
        {visible.length} of {groups.length} {groups.length === 1 ? "winner" : "winners"} &middot; {visiblePrizes} of{" "}
        {totalPrizes} prizes
      </p>

      {visible.length === 0 && (
        <div className="surface-card p-6 text-center font-terminal text-sm text-brand-sand/40">
          {groups.length === 0 ? "No one has won a prize yet." : `No winners match "${query}".`}
        </div>
      )}

      <div className="space-y-2">
        {visible.map((g) => (
          <details key={g.employeeEmail} className="surface-card group p-4" open={isSearching}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-4">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand-sand/10">
                {g.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.photoUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${encodeURIComponent(g.employeeEmail)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-brand-sand hover:underline"
                >
                  {g.displayName}
                </Link>
                <div className="font-terminal text-xs text-brand-sand/40">
                  {g.entries.length} {g.entries.length === 1 ? "prize" : "prizes"} won
                </div>
              </div>
              <span className="font-terminal text-xs text-brand-sand/30 transition group-open:rotate-90">▶</span>
            </summary>

            <div className="mt-3 space-y-2 border-t border-brand-sand/10 pt-3">
              {g.entries.map((e, i) => {
                const isFlare = e.source === "flare";
                return (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-sand/[0.03] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div
                        className={
                          isFlare
                            ? "rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 font-terminal text-xs font-bold uppercase tracking-wide text-brand-cyan"
                            : "rounded-full border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-1 font-terminal text-xs font-bold uppercase tracking-wide text-brand-yellow"
                        }
                      >
                        {isFlare ? "✨" : "🏆"} {e.prize}
                      </div>
                      <div className="mt-1 font-terminal text-[11px] text-brand-sand/35">
                        {isFlare && <span className="text-brand-cyan/70">Badge Flare</span>}
                        {isFlare && " · "}
                        {e.sourceChallengeTitle ? (
                          <>
                            won for{" "}
                            <Link href={`/challenges/${e.sourceChallengeSlug}`} className="text-brand-cyan hover:underline">
                              {e.sourceChallengeTitle}
                            </Link>
                          </>
                        ) : (
                          "manually awarded"
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 font-terminal text-[11px] text-brand-sand/30">
                      {formatEasternShortDate(new Date(e.wonAt))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
