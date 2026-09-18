import { Linkify } from "@/components/Linkify";
import { ZoomableImage } from "@/components/ZoomableImage";

/**
 * The optional audio/video/text/image bundle shown on a correct answer.
 * Originally only rendered for UNLOCK-mode challenges (see
 * UnlockedContent in challenges/[slug]/page.tsx); factored out here so
 * XP-mode challenges (plain answers, Connections, Securdle) can show the
 * exact same media below their "Correct! You earned +X XP" message too -
 * same unlockText/unlockImage/unlockAudio/unlockVideo columns, just
 * rendered as a celebration/story beat instead of "the" reward.
 */
export function SuccessExtras({
  challengeId,
  unlockAudio,
  unlockVideo,
  unlockText,
  unlockImage,
}: {
  challengeId: string;
  unlockAudio: Buffer | null | undefined;
  unlockVideo: Buffer | null | undefined;
  unlockText: string | null | undefined;
  unlockImage: Buffer | null | undefined;
}) {
  if (!unlockAudio && !unlockVideo && !unlockText && !unlockImage) return null;

  return (
    <div className="space-y-4">
      {unlockAudio && (
        <audio controls autoPlay className="w-full" src={`/api/challenge-asset/${challengeId}/unlock-audio`} />
      )}

      {unlockVideo && (
        <video
          controls
          autoPlay
          className="w-full rounded-xl"
          src={`/api/challenge-asset/${challengeId}/unlock-video`}
        />
      )}

      {unlockText && (
        <p className="whitespace-pre-wrap text-brand-sand/85">
          <Linkify text={unlockText} />
        </p>
      )}

      {unlockImage && (
        <ZoomableImage
          src={`/api/challenge-asset/${challengeId}/unlock-image`}
          className="w-full rounded-xl object-contain"
        />
      )}
    </div>
  );
}
