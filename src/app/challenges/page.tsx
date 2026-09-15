import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getViewerClearanceInfo } from "@/lib/leaderboard";
import { groupChallengesForViewer, ChallengeSection } from "@/lib/challengeSections";
import { Icon } from "@/components/Icon";
import { ChallengeRewardPills, UnlockTeaserPills } from "@/components/ChallengeRewardPills";

export const dynamic = "force-dynamic";

type Submission = { status: string; xpAwarded: number };
type ChallengeWithSubmissions = Awaited<ReturnType<typeof loadChallenges>>[number];

async function loadChallenges(email: string | null) {
  return prisma.challenge.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      submissions: email ? { where: { employee: { email } } } : false,
    },
  });
}

export default async function ChallengesPage() {
  const identity = await getAgentIdentity();
  const now = new Date();

  const allChallenges = await loadChallenges(identity?.email ?? null);
  const viewer = identity ? await getViewerClearanceInfo(identity.email) : null;
  const sections = viewer ? groupChallengesForViewer(allChallenges, viewer) : [];
  const visibleChallenges = sections.flatMap((s) => s.challenges);

  const completedCount = visibleChallenges.filter((c) => {
    const mine = "submissions" in c ? (c.submissions as Submission[]) : [];
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
        {visibleChallenges.length > 0 && (
          <div className="glass-panel rounded-xl px-4 py-2 text-center">
            <div className="font-display text-xl font-semibold text-brand-light-green">
              {completedCount}/{visibleChallenges.length}
            </div>
            <div className="font-terminal text-[10px] uppercase tracking-widest text-brand-sand/40">Completed</div>
          </div>
        )}
      </div>

      {visibleChallenges.length === 0 && (
        <div className="surface-card p-8 text-center text-brand-sand/60">
          No challenges are live yet. Check back soon, agent.
        </div>
      )}

      <div className="space-y-10">
        {sections.map((section) => (
          <ChallengeSectionBlock key={section.label} section={section} now={now} />
        ))}
      </div>
    </div>
  );
}

function ChallengeSectionBlock({
  section,
  now,
}: {
  section: ChallengeSection<ChallengeWithSubmissions>;
  now: Date;
}) {
  const isInfo = section.tier === null;
  const color = section.tier?.color;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <Icon name={isInfo ? "file" : section.tier!.icon} className="h-4 w-4" style={color ? { color } : undefined} />
        <h2
          className="font-terminal text-sm font-semibold uppercase tracking-widest"
          style={color ? { color } : { color: "var(--brand-cyan)" }}
        >
          {isInfo ? "Info" : `${section.label} Clearance`}
        </h2>
        <div className="h-px flex-1 bg-brand-sand/10" />
        <span className="font-terminal text-[11px] text-brand-sand/35">{section.challenges.length}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section.challenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} now={now} />
        ))}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge: c, now }: { challenge: ChallengeWithSubmissions; now: Date }) {
  const isOpen = (!c.opensAt || c.opensAt <= now) && (!c.closesAt || c.closesAt >= now);
  const mine = "submissions" in c ? (c.submissions as Submission[]) : [];
  const completed = mine.length > 0;
  const status = completed ? mine[0] : null;

  return (
    <Link
      href={`/challenges/${c.slug}`}
      className={`surface-card group relative overflow-hidden p-5 ${
        completed ? "border-brand-light-green/30 bg-brand-light-green/[0.04]" : ""
      }`}
    >
      <h3 className="mb-1.5 font-display font-semibold text-brand-sand transition group-hover:text-brand-yellow">
        {c.title}
      </h3>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {c.rewardMode === "UNLOCK" ? (
          <UnlockTeaserPills challenge={c} />
        ) : (
          <>
            <span className="pill !cursor-default !border-brand-yellow/30 !text-brand-yellow">+{c.xpValue} XP</span>
            <ChallengeRewardPills reward={c} />
          </>
        )}
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-brand-sand/55">{c.description}</p>
      {!isOpen && <div className="font-terminal text-xs text-brand-sand/40">Not currently open</div>}
      {completed && status && (
        <div className="flex items-center gap-1.5 font-terminal text-xs text-brand-light-green">
          <Icon name="shield" className="h-3.5 w-3.5" />
          {c.rewardMode === "UNLOCK" ? (
            <>
              {status.status === "CORRECT" && "Unlocked"}
              {status.status === "PENDING_REVIEW" && "Submitted · pending review"}
              {status.status === "INCORRECT" && "Not yet — try again"}
            </>
          ) : (
            <>
              {status.status === "CORRECT" && `Completed · +${status.xpAwarded} XP`}
              {status.status === "PENDING_REVIEW" && "Submitted · pending review"}
              {status.status === "INCORRECT" && "Attempted"}
            </>
          )}
        </div>
      )}
    </Link>
  );
}
