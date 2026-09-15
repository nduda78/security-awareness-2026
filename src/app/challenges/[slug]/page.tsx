import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { submitAnswerAction } from "@/lib/actions/submit";
import { ChallengeRewardDetails } from "@/components/ChallengeRewardPills";

export const dynamic = "force-dynamic";

export default async function ChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string; already?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { submitted, already, error } = await searchParams;
  const identity = await getAgentIdentity();

  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge) notFound();

  const existing = identity
    ? await prisma.submission.findFirst({
        where: { challengeId: challenge.id, employee: { email: identity.email } },
      })
    : null;

  const now = new Date();
  const isOpen =
    challenge.isActive &&
    (!challenge.opensAt || challenge.opensAt <= now) &&
    (!challenge.closesAt || challenge.closesAt >= now);

  const justSubmitted = submitted === "1";
  const choices = (challenge.choices as string[] | null) ?? null;
  const completed = already === "1" || !!existing;

  return (
    <div className="fade-in-up mx-auto max-w-2xl">
      <div className="section-eyebrow mb-2">Mission Briefing</div>
      <h1 className="mb-4 font-display text-2xl font-semibold sm:text-3xl">{challenge.title}</h1>

      <div className="surface-card mb-6 p-4">
        <div className="mb-2.5 font-terminal text-xs uppercase text-brand-cyan/70">Rewards</div>
        <div className="flex flex-wrap gap-1.5">
          <span className="pill !cursor-default !border-brand-yellow/30 !text-brand-yellow">
            +{challenge.xpValue} XP
          </span>
          <ChallengeRewardDetails reward={challenge} />
        </div>
      </div>

      <p className="surface-card mb-6 whitespace-pre-wrap p-5 text-brand-sand/75">{challenge.description}</p>

      {!isOpen && (
        <div className="surface-card p-4 text-sm text-brand-sand/60">This mission isn&apos;t currently open.</div>
      )}

      {isOpen && justSubmitted && (
        <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          Thanks for the submission.
        </div>
      )}

      {isOpen && !justSubmitted && completed && (
        <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          {existing?.status === "CORRECT" && `Already completed — you earned +${existing.xpAwarded} XP.`}
          {existing?.status === "PENDING_REVIEW" && "Already submitted — pending Security team review."}
          {existing?.status === "INCORRECT" && "You've already attempted this challenge."}
          {!existing && "Already completed."}
        </div>
      )}

      {isOpen && !justSubmitted && !completed && (
        <form action={submitAnswerAction} className="space-y-4">
          <input type="hidden" name="slug" value={challenge.slug} />

          {error && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

          {challenge.answerType === "MULTIPLE_CHOICE" && choices ? (
            <div className="space-y-2">
              {choices.map((choice, i) => (
                <label
                  key={i}
                  className="surface-card flex items-center gap-3 p-3.5 text-sm has-[:checked]:border-brand-yellow has-[:checked]:bg-brand-yellow/8"
                >
                  <input type="radio" name="answer" value={choice} required className="accent-brand-yellow" />
                  {choice}
                </label>
              ))}
            </div>
          ) : challenge.answerType === "FREE_TEXT_REVIEW" ? (
            <textarea
              name="answer"
              required
              rows={5}
              placeholder="Type your answer..."
              className="input-modern w-full"
            />
          ) : (
            <input name="answer" required placeholder="Type your answer..." className="input-modern w-full" />
          )}

          <button className="btn-primary w-full">Submit Answer</button>
        </form>
      )}
    </div>
  );
}
