-- Adds video (mp4 etc.) as a third unlock-content media type, alongside
-- the existing audio and image options.
ALTER TABLE "Challenge" ADD COLUMN "unlockVideo" BYTEA;
ALTER TABLE "Challenge" ADD COLUMN "unlockVideoMimeType" TEXT;
