import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves a user-uploaded profile photo straight out of SQLite (stored as a
// BLOB via Prisma's Bytes type). No cloud storage bucket exists in this
// environment, and SQLite is already the durable store for everything else
// in this app, so photos live there too rather than adding a new infra
// dependency.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const { email: emailParam } = await params;
  const email = decodeURIComponent(emailParam).toLowerCase();

  const employee = await prisma.employee.findUnique({
    where: { email },
    select: { photo: true, photoMimeType: true, photoUpdatedAt: true },
  });

  if (!employee?.photo) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(employee.photo), {
    headers: {
      "Content-Type": employee.photoMimeType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
