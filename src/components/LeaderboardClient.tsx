"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCard } from "./BadgeCard";
import { Icon } from "./Icon";
import type { ClientAgentCard } from "@/lib/client-types";

export interface ClientTierSection {
  tierKey: string;
  tierLabel: string;
  tierColor: string;
  tierIcon: string;
  minXp: number;
  maxXp: number | null;
  members: ClientAgentCard[];
}

type FilterKey = "ALL" | "ROGUE" | "TOP_SECRET" | "SECRET" | "UNCLASSIFIED" | "WINNERS";
type SortKey = "XP_DESC" | "XP_ASC" | "NAME_ASC" | "CLOSEST";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ROGUE", label: "Rogue" },
  { key: "TOP_SECRET", label: "Top Secret" },
  { key: "SECRET", label: "Secret" },
  { key: "UNCLASSIFIED", label: "Unclassified" },
  { key: "WINNERS", label: "🏆 Winners" },
];

export function LeaderboardClient({ sections }: { sections: ClientTierSection[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [sort, setSort] = useState<SortKey>("XP_DESC");
  const searchRef = useRef<HTMLInputElement>(null);
  const [chaos, setChaos] = useState(false);

  // process420 keyboard easter egg
  useEffect(() => {
    let buffer = "";
    const target = "process420";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
        if (buffer === target) {
          setChaos(true);
          document.body.classList.add("chaos-mode");
          setTimeout(() => {
            document.body.classList.remove("chaos-mode");
            setChaos(false);
          }, 3000);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const allMembers = useMemo(() => sections.flatMap((s) => s.members), [sections]);

  function matchesFilter(card: ClientAgentCard, f: FilterKey): boolean {
    if (f === "ALL") return true;
    if (f === "WINNERS") return card.achievements.length > 0;
    return card.tierKey === f;
  }

  function sortMembers(members: ClientAgentCard[], s: SortKey): ClientAgentCard[] {
    const copy = [...members];
    switch (s) {
      case "XP_ASC":
        return copy.sort((a, b) => a.xp - b.xp);
      case "NAME_ASC":
        return copy.sort((a, b) => a.displayName.localeCompare(b.displayName));
      case "CLOSEST":
        return copy.sort((a, b) => {
          const av = a.xpToNext ?? Infinity;
          const bv = b.xpToNext ?? Infinity;
          return av - bv;
        });
      case "XP_DESC":
      default:
        return copy.sort((a, b) => b.xp - a.xp);
    }
  }

  function isDimmed(card: ClientAgentCard): boolean {
    if (!matchesFilter(card, filter)) return true;
    if (query.trim() && !card.displayName.toLowerCase().includes(query.trim().toLowerCase())) return true;
    return false;
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = allMembers.find((m) => m.displayName.toLowerCase().includes(q));
    if (match) {
      const el = document.getElementById(`badge-${match.email.replace(/[^a-z0-9]/gi, "-")}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.animate(
          [
            { boxShadow: "0 0 0 0 rgba(255,192,42,0.9)" },
            { boxShadow: "0 0 0 12px rgba(255,192,42,0)" },
          ],
          { duration: 900, iterations: 2 }
        );
      }
    }
  }

  return (
    <div className={chaos ? "glitch-text" : ""}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Find your badge..."
          className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 font-terminal text-sm placeholder:text-brand-sand/40 sm:max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 font-terminal text-sm"
        >
          <option value="XP_DESC">XP: High to Low</option>
          <option value="XP_ASC">XP: Low to High</option>
          <option value="NAME_ASC">Name A-Z</option>
          <option value="CLOSEST">Closest to leveling up</option>
        </select>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 font-terminal text-xs uppercase transition ${
              filter === f.key
                ? "border-brand-yellow bg-brand-yellow/20 text-brand-yellow"
                : "border-brand-sand/20 text-brand-sand/60 hover:text-brand-sand"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sections.map((section) => {
        const visibleMembers = sortMembers(section.members, sort);
        return (
          <section key={section.tierKey} className="mb-10">
            {section.tierKey === "ROGUE" && (
              <div className="glitch-text rogue-flicker mb-4 rounded border border-brand-red/50 bg-brand-red/10 px-4 py-2 font-terminal text-xs uppercase tracking-wide text-brand-red">
                ⚠ THIS CLEARANCE TIER WAS NOT ISSUED BY DUTCHIE SECURITY. ORIGIN UNTRACEABLE.
              </div>
            )}
            <div className="mb-4 flex items-center gap-3 border-b border-brand-sand/15 pb-2">
              <Icon name={section.tierIcon} className="h-6 w-6" style={{ color: section.tierColor } as React.CSSProperties} />
              <h2 className="font-terminal text-lg uppercase tracking-wider" style={{ color: section.tierColor }}>
                {section.tierLabel}
              </h2>
              <span className="font-terminal text-xs text-brand-sand/50">
                {section.minXp}
                {section.maxXp !== null ? `–${section.maxXp}` : "+"} XP · {section.members.length} agent
                {section.members.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {visibleMembers.map((card) => (
                <BadgeCard key={card.email} card={card} dimmed={isDimmed(card)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
