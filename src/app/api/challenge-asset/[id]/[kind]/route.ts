import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves the bytea-backed image/audio assets attached to a Challenge (question
// image, unlock image, unlock audio) — same reasoning as /api/photo/[email]:
// no cloud storage bucket in this environment, Postgres is already the
// durable store for everything else here.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;

  let bytes: Buffer | null = null;
  let mimeType: string | null = null;
  let fallbackMime = "application/octet-stream";

  if (kind === "question-image") {
    const c = await prisma.challenge.findUnique({
      where: { id },
      select: { questionImage: true, questionImageMimeType: true },
    });
    bytes = c?.questionImage ?? null;
    mimeType = c?.questionImageMimeType ?? null;
    fallbackMime = "image/jpeg";
  } else if (kind === "unlock-image") {
    const c = await prisma.challenge.findUnique({
      where: { id },
      select: { unlockImage: true, unlockImageMimeType: true },
    });
    bytes = c?.unlockImage ?? null;
    mimeType = c?.unlockImageMimeType ?? null;
    fallbackMime = "image/jpeg";
  } else if (kind === "unlock-audio") {
    const c = await prisma.challenge.findUnique({
      where: { id },
      select: { unlockAudio: true, unlockAudioMimeType: true },
    });
    bytes = c?.unlockAudio ?? null;
    mimeType = c?.unlockAudioMimeType ?? null;
    fallbackMime = "audio/mpeg";
  } else {
    return new NextResponse(null, { status: 404 });
  }

  if (!bytes) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeType || fallbackMime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
