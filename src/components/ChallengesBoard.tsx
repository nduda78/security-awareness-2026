"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { ChallengeRewardPills, UnlockTeaserPills } from "./ChallengeRewardPills";
import type { ClientChallengeSection } from "@/lib/client-types";

type StatusFilter = "ALL" | "NEEDS_ACTION" | "COMPLETED";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NEEDS_ACTION", label: "Needs Action" },
  { key: "COMPLETED", label: "Completed" },
];

export function ChallengesBoard({ sections }: { sections: ClientChallengeSection[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [clearanceFilter, setClearanceFilter] = useState<string>("ALL");

  const allChallenges = useMemo(() => sections.flatMap((s) => s.challenges), [sections]);
  const completedCount = allChallenges.filter((c) => c.completed).length;

  const filteredSections = useMemo(() => {
    return sections
      .filter((s) => clearanceFilter === "ALL" || s.key === clearanceFilter)
      .map((s) => ({
        ...s,
        challenges: s.challenges.filter((c) => {
          if (statusFilter === "COMPLETED") return c.completed;
          if (statusFilter === "NEEDS_ACTION") return !c.completed;
          return true;
        }),
      }))
      .filter((s) => s.challenges.length > 0);
  }, [sections, statusFilter, clearanceFilter]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="section-eyebrow mb-2">Active Missions</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="gradient-text">Challenges</span>
          </h1>
        </div>
        {allChallenges.length > 0 && (
          <div className="glass-panel rounded-xl px-4 py-2 text-center">
            <div className="font-display text-xl font-semibold text-brand-light-green">
              {completedCount}/{allChallenges.length}
            </div>
            <div className="font-terminal text-[10px] uppercase tracking-widest text-brand-sand/40">Completed</div>
          </div>
        )}
      </div>

      {allChallenges.length === 0 ? (
        <div className="surface-card p-8 text-center text-brand-sand/60">
          No challenges are live yet. Check back soon, agent.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="font-terminal text-[11px] uppercase tracking-widest text-brand-sand/35">Status</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`pill ${statusFilter === f.key ? "pill-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="font-terminal text-[11px] uppercase tracking-widest text-brand-sand/35">Clearance</span>
            <button
              onClick={() => setClearanceFilter("ALL")}
              className={`pill ${clearanceFilter === "ALL" ? "pill-active" : ""}`}
            >
              All
            </button>
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setClearanceFilter(s.key)}
                className={`pill ${clearanceFilter === s.key ? "pill-active" : ""}`}
                style={clearanceFilter === s.key ? { borderColor: s.color, color: s.color } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filteredSections.length === 0 && (
            <div className="surface-card p-8 text-center text-brand-sand/60">
              Nothing matches those filters right now.
            </div>
          )}

          <div className="space-y-10">
            {filteredSections.map((section) => (
              <div key={section.key}>
                <div className="mb-3 flex items-center gap-2.5">
                  <Icon name={section.icon} className="h-4 w-4" style={{ color: section.color }} />
                  <h2
                    className="font-terminal text-sm font-semibold uppercase tracking-widest"
                    style={{ color: section.color }}
                  >
                    {section.key === "INFO" ? "Info" : `${section.label} Clearance`}
                  </h2>
                  <div className="h-px flex-1 bg-brand-sand/10" />
                  <span className="font-terminal text-[11px] text-brand-sand/35">{section.challenges.length}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.challenges.map((c) => (
                    <ChallengeCard key={c.id} challenge={c} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChallengeCard({ challenge: c }: { challenge: ClientChallengeSection["challenges"][number] }) {
  return (
    <Link
      href={`/challenges/${c.slug}`}
      className={`surface-card group relative overflow-hidden p-5 transition-opacity ${
        c.completed ? "opacity-45 saturate-[0.4] hover:opacity-75" : ""
      }`}
    >
      <h3 className="mb-1.5 font-display font-semibold text-brand-sand transition group-hover:text-brand-yellow">
        {c.title}
      </h3>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {c.rewardMode === "UNLOCK" ? (
          <UnlockTeaserPills challenge={c.unlockTeaser} />
        ) : (
          <>
            <span className="pill !cursor-default !border-brand-yellow/30 !text-brand-yellow">+{c.xpValue} XP</span>
            <ChallengeRewardPills reward={c.reward} />
          </>
        )}
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-brand-sand/55">{c.description}</p>
      {!c.isOpen && <div className="font-terminal text-xs text-brand-sand/40">Not currently open</div>}
      {c.status && (
        <div className="flex items-center gap-1.5 font-terminal text-xs text-brand-light-green">
          <Icon name="shield" className="h-3.5 w-3.5" />
          {c.rewardMode === "UNLOCK" ? (
            <>
              {c.status === "CORRECT" && "Unlocked"}
              {c.status === "PENDING_REVIEW" && "Submitted · pending review"}
              {c.status === "INCORRECT" && "Not yet — try again"}
            </>
          ) : (
            <>
              {c.status === "CORRECT" && `Completed · +${c.xpAwarded} XP`}
              {c.status === "PENDING_REVIEW" && "Submitted · pending review"}
              {c.status === "INCORRECT" && "Attempted"}
            </>
          )}
        </div>
      )}
    </Link>
  );
}
