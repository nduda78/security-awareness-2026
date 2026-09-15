import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { submitAnswerAction } from "@/lib/actions/submit";
import { ChallengeRewardDetails, UnlockTeaserPills } from "@/components/ChallengeRewardPills";
import { Icon } from "@/components/Icon";

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
  const isUnlock = challenge.rewardMode === "UNLOCK";

  const answerForm = (
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
        <textarea name="answer" required rows={5} placeholder="Type your answer..." className="input-modern w-full" />
      ) : (
        <input name="answer" required placeholder="Type your answer..." className="input-modern w-full" />
      )}

      <button className="btn-primary w-full">Submit Answer</button>
    </form>
  );

  return (
    <div className="fade-in-up mx-auto max-w-2xl">
      <div className="section-eyebrow mb-2">Mission Briefing</div>
      <h1 className="mb-4 font-display text-2xl font-semibold sm:text-3xl">{challenge.title}</h1>

      <div className="surface-card mb-6 p-4">
        <div className="mb-2.5 font-terminal text-xs uppercase text-brand-cyan/70">
          {isUnlock ? "Unlocks" : "Rewards"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {isUnlock ? (
            <UnlockTeaserPills challenge={challenge} />
          ) : (
            <>
              <span className="pill !cursor-default !border-brand-yellow/30 !text-brand-yellow">
                +{challenge.xpValue} XP
              </span>
              <ChallengeRewardDetails reward={challenge} />
            </>
          )}
        </div>
      </div>

      <p className="surface-card mb-6 whitespace-pre-wrap p-5 text-brand-sand/75">{challenge.description}</p>

      {challenge.questionImage && (
        // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
        <img
          src={`/api/challenge-asset/${challenge.id}/question-image`}
          alt=""
          className="surface-card mb-6 w-full rounded-2xl object-contain"
        />
      )}

      {!isOpen && (
        <div className="surface-card p-4 text-sm text-brand-sand/60">This mission isn&apos;t currently open.</div>
      )}

      {isOpen && isUnlock && existing?.status === "CORRECT" && <UnlockedContent challenge={challenge} />}

      {isOpen && isUnlock && existing?.status === "PENDING_REVIEW" && (
        <div className="rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 p-4 text-sm text-brand-yellow">
          Submitted — pending Security team review.
        </div>
      )}

      {isOpen && isUnlock && (!existing || existing.status === "INCORRECT") && (
        <div className="space-y-4">
          {existing?.status === "INCORRECT" && (
            <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">
              Not quite — take another look and try again.
            </div>
          )}
          {answerForm}
        </div>
      )}

      {isOpen && !isUnlock && justSubmitted && (
        <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          Thanks for the submission.
        </div>
      )}

      {isOpen && !isUnlock && !justSubmitted && (already === "1" || !!existing) && (
        <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
          {existing?.status === "CORRECT" && `Already completed — you earned +${existing.xpAwarded} XP.`}
          {existing?.status === "PENDING_REVIEW" && "Already submitted — pending Security team review."}
          {existing?.status === "INCORRECT" && "You've already attempted this challenge."}
          {!existing && "Already completed."}
        </div>
      )}

      {isOpen && !isUnlock && !justSubmitted && !(already === "1" || !!existing) && answerForm}
    </div>
  );
}

function UnlockedContent({
  challenge,
}: {
  challenge: {
    id: string;
    unlockAudio: Buffer | null;
    unlockText: string | null;
    unlockLinkUrl: string | null;
    unlockLinkLabel: string | null;
    unlockImage: Buffer | null;
    unlockVideo: Buffer | null;
  };
}) {
  const hasAnything =
    challenge.unlockAudio ||
    challenge.unlockText ||
    challenge.unlockLinkUrl ||
    challenge.unlockImage ||
    challenge.unlockVideo;

  return (
    <div className="surface-card space-y-4 border-brand-cyan/30 bg-brand-cyan/[0.04] p-5">
      <div className="flex items-center gap-2 font-terminal text-xs uppercase text-brand-cyan">
        <Icon name="lock" className="h-3.5 w-3.5" />
        Unlocked
      </div>

      {!hasAnything && <p className="text-sm text-brand-sand/50">Nice work — nothing else was attached here, though.</p>}

      {challenge.unlockAudio && (
        <audio controls autoPlay className="w-full" src={`/api/challenge-asset/${challenge.id}/unlock-audio`} />
      )}

      {challenge.unlockVideo && (
        <video
          controls
          autoPlay
          className="w-full rounded-xl"
          src={`/api/challenge-asset/${challenge.id}/unlock-video`}
        />
      )}

      {challenge.unlockText && <p className="whitespace-pre-wrap text-brand-sand/85">{challenge.unlockText}</p>}

      {challenge.unlockImage && (
        // eslint-disable-next-line @next/next/no-img-element -- own dynamic bytea-backed route, not a static asset Next/Image can optimize meaningfully
        <img
          src={`/api/challenge-asset/${challenge.id}/unlock-image`}
          alt=""
          className="w-full rounded-xl object-contain"
        />
      )}

      {challenge.unlockLinkUrl && (
        <a
          href={challenge.unlockLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex w-full items-center justify-center"
        >
          {challenge.unlockLinkLabel || challenge.unlockLinkUrl}
        </a>
      )}
    </div>
  );
}
