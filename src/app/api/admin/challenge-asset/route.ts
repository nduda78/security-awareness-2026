import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/session";
import { ASSET_FIELD_CONFIG, type AssetField } from "@/lib/assetUpload";

// Dedicated upload endpoint for an existing challenge's image/audio/video
// assets — used instead of bundling large files into the "Save challenge"
// Server Action. Uploading immediately when a file is chosen (rather than
// only on Save) means:
//   1. Each asset ships as its own small, isolated request instead of one
//      big multipart body carrying every field + every file at once, which
//      is both more reliable on a slow connection and lets the client show
//      real upload progress (see AssetUploader.tsx).
//   2. A challenge's other text fields can be edited/saved independently of
//      its media.
export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const formData = await req.formData();
  const challengeId = String(formData.get("challengeId") ?? "");
  const field = String(formData.get("field") ?? "") as AssetField;
  const file = formData.get("file");

  if (!challengeId || !(field in ASSET_FIELD_CONFIG)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  const config = ASSET_FIELD_CONFIG[field];
  if (!config.allowedTypes.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type (${file.type || "unknown"}).` }, { status: 400 });
  }
  if (file.size > config.maxBytes) {
    return NextResponse.json(
      { error: `Too large — max ${Math.floor(config.maxBytes / (1024 * 1024))}MB.` },
      { status: 400 }
    );
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, select: { id: true } });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { [config.dataField]: buffer, [config.mimeField]: file.type } as never,
  });

  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");

  return NextResponse.json({ ok: true });
}

// Clears a single asset field without touching anything else on the
// challenge — the "Remove current" action for an existing challenge.
export async function DELETE(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { challengeId, field } = (await req.json()) as { challengeId?: string; field?: string };
  if (!challengeId || !field || !(field in ASSET_FIELD_CONFIG)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const config = ASSET_FIELD_CONFIG[field as AssetField];

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, select: { id: true } });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { [config.dataField]: null, [config.mimeField]: null } as never,
  });

  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");

  return NextResponse.json({ ok: true });
}
