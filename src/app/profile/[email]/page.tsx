import { notFound } from "next/navigation";
import { buildAgentRoster, overallRank, rankWithinTier } from "@/lib/leaderboard";
import { toClientCard } from "@/lib/client-types";
import { prisma } from "@/lib/prisma";
import { BadgeCard } from "@/components/BadgeCard";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ email: string }> }) {
  const { email: emailParam } = await params;
  const email = decodeURIComponent(emailParam).toLowerCase();

  const roster = await buildAgentRoster();
  const card = roster.find((c) => c.email === email);
  if (!card) notFound();

  const { rank: overall, total: overallTotal } = overallRank(roster, email);
  const { rank: tierRank, total: tierTotal } = rankWithinTier(roster, card);
  const clientCard = toClientCard(card, tierRank, tierTotal);

  const employee = await prisma.employee.findUnique({ where: { email } });
  const submissions = employee
    ? await prisma.submission.findMany({
        where: { employeeId: employee.id, status: { in: ["CORRECT", "PENDING_REVIEW"] } },
        include: { challenge: true },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="w-full max-w-[420px] shrink-0">
          <BadgeCard card={clientCard} />
        </div>
        <div className="w-full">
          <div className="font-terminal text-xs uppercase tracking-widest text-brand-light-green">
            Personnel Record
          </div>
          <h2 className="text-2xl font-bold">{card.renderedName}</h2>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Total XP" value={String(card.xp)} />
            <Stat label="Overall Rank" value={`#${overall} / ${overallTotal}`} />
            <Stat label={`Rank in ${card.tier.shortLabel}`} value={`#${tierRank} / ${tierTotal}`} />
            <Stat label="Challenges Done" value={String(card.challengesCompleted)} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Progress</h3>
          <div className="rounded-md border border-brand-sand/10 bg-black/20 p-4">
            {card.progress.next ? (
              <>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{card.tier.label}</span>
                  <span>{card.progress.next.label}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-sand/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${card.progress.progressPct}%`, background: card.tier.color }}
                  />
                </div>
                <div className="mt-2 text-sm text-brand-sand/60">
                  {card.progress.xpToNext} XP to {card.progress.next.label}
                </div>
              </>
            ) : (
              <div className="text-sm text-brand-sand/60">
                {card.tier.key === "ROGUE" ? "Off the grid. No further progress tracked." : "Maximum clearance reached."}
              </div>
            )}
          </div>
        </div>

        {card.flare?.achievements.length ? (
          <div>
            <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {card.flare.achievements.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/15 px-3 py-1 text-sm text-brand-yellow"
                >
                  <Icon name="trophy" className="h-4 w-4" /> {a}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Challenge History</h3>
          {submissions.length === 0 ? (
            <p className="text-sm text-brand-sand/50">No challenges completed yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-brand-sand/10 bg-black/20 p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{s.challenge.title}</div>
                    <div className="text-xs text-brand-sand/50">
                      {s.submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="font-terminal text-xs">
                    {s.status === "CORRECT" ? (
                      <span className="text-brand-light-green">+{s.xpAwarded} XP</span>
                    ) : (
                      <span className="text-brand-yellow">pending review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-brand-sand/10 bg-black/20 p-3">
      <div className="font-terminal text-[10px] uppercase text-brand-sand/40">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
