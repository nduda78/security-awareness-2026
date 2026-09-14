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

  return (
    <div>
      <div className="mb-6">
        <div className="font-terminal text-xs uppercase tracking-widest text-brand-light-green">
          Active Missions
        </div>
        <h2 className="text-2xl font-bold">Challenges</h2>
      </div>

      {challenges.length === 0 && (
        <p className="text-brand-sand/60">No challenges are live yet. Check back soon, agent.</p>
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
              className={`block rounded-xl border p-4 transition hover:border-brand-yellow ${
                completed ? "border-brand-light-green/40 bg-brand-light-green/5" : "border-brand-sand/15 bg-black/20"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-semibold">{c.title}</h3>
                <span className="font-terminal text-xs text-brand-yellow">+{c.xpValue} XP</span>
              </div>
              <p className="mb-2 line-clamp-2 text-sm text-brand-sand/60">{c.description}</p>
              {!isOpen && <div className="font-terminal text-xs text-brand-sand/40">Not currently open</div>}
              {completed && status && (
                <div className="flex items-center gap-1 font-terminal text-xs text-brand-light-green">
                  <Icon name="shield" className="h-3 w-3" />
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
