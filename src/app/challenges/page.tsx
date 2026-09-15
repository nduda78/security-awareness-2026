import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const identity = await getAgentIdentity();
  const now = new Date();

  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      submissions: identity
        ? { where: { employee: { email: identity.email } } }
        : false,
    },
  });

  const completedCount = challenges.filter((c) => {
    const mine = "submissions" in c ? (c.submissions as { status: string }[]) : [];
    return mine.length > 0 && mine[0].status === "CORRECT";
  }).length;

  return (
    <div className="fade-in-up">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="section-eyebrow mb-2">Active Missions</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="gradient-text">Challenges</span>
          </h1>
        </div>
        {challenges.length > 0 && (
          <div className="glass-panel rounded-xl px-4 py-2 text-center">
            <div className="font-display text-xl font-semibold text-brand-light-green">
              {completedCount}/{challenges.length}
            </div>
            <div className="font-terminal text-[10px] uppercase tracking-widest text-brand-sand/40">Completed</div>
          </div>
        )}
      </div>

      {challenges.length === 0 && (
        <div className="surface-card p-8 text-center text-brand-sand/60">
          No challenges are live yet. Check back soon, agent.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {challenges.map((c) => {
          const isOpen = (!c.opensAt || c.opensAt <= now) && (!c.closesAt || c.closesAt >= now);
          const mine = "submissions" in c ? (c.submissions as { status: string; xpAwarded: number }[]) : [];
          const completed = mine.length > 0;
          const status = completed ? mine[0] : null;

          return (
            <Link
              key={c.id}
              href={`/challenges/${c.slug}`}
              className={`surface-card group relative overflow-hidden p-5 ${
                completed ? "border-brand-light-green/30 bg-brand-light-green/[0.04]" : ""
              }`}
            >
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <h3 className="font-display font-semibold text-brand-sand transition group-hover:text-brand-yellow">
                  {c.title}
                </h3>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <span className="pill !cursor-default !border-brand-yellow/30 !text-brand-yellow">
                    +{c.xpValue} XP
                  </span>
                  {c.rewardBadgeFlare && (
                    <span className="pill !cursor-default !border-brand-purple/40 !text-brand-purple">
                      <Icon name="trophy" className="h-3 w-3" /> {c.rewardBadgeFlare} ribbon
                    </span>
                  )}
                  {c.rewardPrize && (
                    <span className="pill !cursor-default !border-brand-light-green/40 !text-brand-light-green">
                      <Icon name="crown" className="h-3 w-3" /> {c.rewardPrize}
                    </span>
                  )}
                </div>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-brand-sand/55">{c.description}</p>
              {!isOpen && <div className="font-terminal text-xs text-brand-sand/40">Not currently open</div>}
              {completed && status && (
                <div className="flex items-center gap-1.5 font-terminal text-xs text-brand-light-green">
                  <Icon name="shield" className="h-3.5 w-3.5" />
                  {status.status === "CORRECT" && `Completed · +${status.xpAwarded} XP`}
                  {status.status === "PENDING_REVIEW" && "Submitted · pending review"}
                  {status.status === "INCORRECT" && "Attempted"}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
