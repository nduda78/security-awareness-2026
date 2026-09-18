// Shared validation rules for the bytea-backed Challenge assets
// (questionImage / unlockImage / unlockAudio / unlockVideo). Used by both
// the still-image/audio bundled-with-Save path (actions/admin.ts, for
// brand-new challenges that don't have an id yet) and the dedicated
// upload-on-select route (api/admin/challenge-asset) used for editing an
// existing challenge.

export const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4MB — question/unlock images can be a bit bigger than badge photos

export const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/mp4"]);
export const AUDIO_MAX_BYTES = 15 * 1024 * 1024; // 15MB — generous enough for a few minutes of mp3

export const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
// Kept modest — large multipart bodies sent in one go (whether via a Server
// Action or a plain route) can be flaky on a slow connection against this
// dev server. The upload-on-select flow (see api/admin/challenge-asset)
// sidesteps most of that by shipping each asset as its own small, isolated
// request instead of bundling it with the rest of the challenge form.
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export type AssetField = "questionImage" | "unlockImage" | "unlockAudio" | "unlockVideo";

export const ASSET_FIELD_CONFIG: Record<
  AssetField,
  { dataField: string; mimeField: string; allowedTypes: Set<string>; maxBytes: number }
> = {
  questionImage: {
    dataField: "questionImage",
    mimeField: "questionImageMimeType",
    allowedTypes: IMAGE_TYPES,
    maxBytes: IMAGE_MAX_BYTES,
  },
  unlockImage: {
    dataField: "unlockImage",
    mimeField: "unlockImageMimeType",
    allowedTypes: IMAGE_TYPES,
    maxBytes: IMAGE_MAX_BYTES,
  },
  unlockAudio: {
    dataField: "unlockAudio",
    mimeField: "unlockAudioMimeType",
    allowedTypes: AUDIO_TYPES,
    maxBytes: AUDIO_MAX_BYTES,
  },
  unlockVideo: {
    dataField: "unlockVideo",
    mimeField: "unlockVideoMimeType",
    allowedTypes: VIDEO_TYPES,
    maxBytes: VIDEO_MAX_BYTES,
  },
};
