import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { getViewerClearanceInfo } from "@/lib/leaderboard";
import { meetsClearance, TierKey, TIER_BY_KEY } from "@/lib/tiers";
import { submitAnswerAction } from "@/lib/actions/submit";
import { ChallengeRewardDetails, UnlockTeaserPills } from "@/components/ChallengeRewardPills";
import { Icon } from "@/components/Icon";
import { Linkify } from "@/components/Linkify";

export const dynamic = "force-dynamic";

export default async function ChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string; already?: string; outOfAttempts?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const identity = await getAgentIdentity();

  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge) notFound();

  const viewer = identity ? await getViewerClearanceInfo(identity.email) : null;
  const cleared = viewer ? meetsClearance(viewer, challenge.minClearance as TierKey) : false;

  if (!cleared) {
    const requiredTier = TIER_BY_KEY[challenge.minClearance as TierKey];
    return (
      <div className="fade-in-up mx-auto max-w-2xl">
        <div className="surface-card p-8 text-center">
          <Icon name="lock" className="mx-auto mb-3 h-8 w-8 text-brand-red" />
          <h1 className="mb-2 font-display text-xl font-semibold text-brand-sand">Clearance Insufficient</h1>
          <p className="text-sm text-brand-sand/55">
            This mission requires <span style={{ color: requiredTier.color }}>{requiredTier.label}</span> clearance
            {requiredTier.key !== "ROGUE" ? " or higher" : ""}. You don&apos;t have access to this briefing.
          </p>
        </div>
      </div>
    );
  }

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

  const choices: string[] | null = challenge.choices ? JSON.parse(challenge.choices) : null;
  const isUnlock = challenge.rewardMode === "UNLOCK";
  const isFreeText = challenge.answerType === "FREE_TEXT_REVIEW";

  // Every non-free-text answer type now supports a configurable attempts
  // cap (Challenge.maxAttempts, null = unlimited) - all derived directly
  // from the stored submission rather than the redirect's query params, so
  // this renders correctly on any page load, not just right after
  // submitting. Knowing your attempt count is meaningless without knowing
  // whether you were right or wrong, so any challenge with room for a
  // retry now reveals that immediately - a deliberate departure from the
  // "no immediate reveal" rule that otherwise still applies once a
  // challenge is truly one-shot (maxAttempts effectively 1, or free text).
  const attemptsUsed = existing?.attempts ?? 0;
  const attemptsRemaining = challenge.maxAttempts === null ? null : Math.max(0, challenge.maxAttempts - attemptsUsed);
  const outOfAttempts =
    !isFreeText && existing?.status === "INCORRECT" && challenge.maxAttempts !== null && attemptsUsed >= challenge.maxAttempts;
  const canRetryNow = !isFreeText && !outOfAttempts && (!existing || existing.status === "INCORRECT");

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
            <UnlockTeaserPills
              challenge={{
                hasAudio: !!challenge.unlockAudio,
                unlockText: challenge.unlockText,
                unlockLinkUrl: challenge.unlockLinkUrl,
                hasImage: !!challenge.unlockImage,
                hasVideo: !!challenge.unlockVideo,
              }}
            />
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

      <p className="surface-card mb-6 whitespace-pre-wrap p-5 text-brand-sand/75">
        <Linkify text={challenge.description} />
      </p>

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

      {isOpen && existing?.status === "CORRECT" && (
        isUnlock ? (
          <UnlockedContent challenge={challenge} />
        ) : (
          <div className="rounded-xl border border-brand-light-green/40 bg-brand-light-green/10 p-4 text-sm text-brand-light-green">
            Correct! You earned +{existing.xpAwarded} XP.
          </div>
        )
      )}

      {isOpen && existing?.status === "PENDING_REVIEW" && (
        <div className="rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 p-4 text-sm text-brand-yellow">
          Submitted — pending Security team review.
        </div>
      )}

      {isOpen && outOfAttempts && (
        <div className="rounded-xl border border-brand-red/40 bg-brand-red/10 p-4 text-sm font-medium text-brand-red">
          <Icon name="skull" className="mr-1.5 inline h-4 w-4" />
          Out of attempts — you used all {challenge.maxAttempts} {challenge.maxAttempts === 1 ? "try" : "tries"}{" "}
          without getting it right. This challenge is now locked.
        </div>
      )}

      {isOpen && canRetryNow && (
        <div className="space-y-4">
          {existing?.status === "INCORRECT" && (
            <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">
              Not quite — take another look and try again.
              {attemptsRemaining !== null &&
                ` You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left.`}
            </div>
          )}
          {!existing && attemptsRemaining !== null && (
            <p className="font-terminal text-xs text-brand-sand/45">
              You have {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} to get this right.
            </p>
          )}
          {answerForm}
        </div>
      )}

      {isOpen && isFreeText && !existing && answerForm}

      {isOpen && isFreeText && existing?.status === "INCORRECT" && (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-4 text-sm text-brand-red">
          Your submission wasn&apos;t approved by the Security team. This challenge is now closed for you.
        </div>
      )}
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

      {challenge.unlockText && (
        <p className="whitespace-pre-wrap text-brand-sand/85">
          <Linkify text={challenge.unlockText} />
        </p>
      )}

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
