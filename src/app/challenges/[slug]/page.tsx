import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { submitAnswerAction } from "@/lib/actions/submit";

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
    <div className="mx-auto max-w-2xl">
      <div className="mb-1 font-terminal text-xs uppercase tracking-widest text-brand-light-green">
        Mission Briefing
      </div>
      <h2 className="mb-2 text-2xl font-bold">{challenge.title}</h2>
      <div className="mb-4 font-terminal text-sm text-brand-yellow">+{challenge.xpValue} XP on success</div>
      <p className="mb-6 whitespace-pre-wrap text-brand-sand/80">{challenge.description}</p>

      {!isOpen && (
        <div className="rounded-md border border-brand-sand/20 bg-black/20 p-4 text-sm text-brand-sand/60">
          This mission isn&apos;t currently open.
        </div>
      )}

      {isOpen && justSubmitted && (
        <div className="rounded-md border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          Thanks for the submission.
        </div>
      )}

      {isOpen && !justSubmitted && completed && (
        <div className="rounded-md border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          {existing?.status === "CORRECT" && `Already completed — you earned +${existing.xpAwarded} XP.`}
          {existing?.status === "PENDING_REVIEW" && "Already submitted — pending Security team review."}
          {existing?.status === "INCORRECT" && "You've already attempted this challenge."}
          {!existing && "Already completed."}
        </div>
      )}

      {isOpen && !justSubmitted && !completed && (
        <form action={submitAnswerAction} className="space-y-4">
          <input type="hidden" name="slug" value={challenge.slug} />

          {error && <div className="rounded-md bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

          {challenge.answerType === "MULTIPLE_CHOICE" && choices ? (
            <div className="space-y-2">
              {choices.map((choice, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-brand-sand/15 bg-black/20 p-3 text-sm hover:border-brand-yellow"
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
              className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
            />
          ) : (
            <input
              name="answer"
              required
              placeholder="Type your answer..."
              className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
            />
          )}

          <button className="w-full rounded-md bg-brand-yellow py-2 font-terminal text-sm uppercase text-brand-dark-green hover:brightness-110">
            Submit Answer
          </button>
        </form>
      )}
    </div>
  );
}
