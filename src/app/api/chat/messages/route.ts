import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";

// Polled by ChatRoomClient.tsx every few seconds for anything newer than
// the last message it already has - a deliberately simple "near real-time"
// mechanism (not real websockets/SSE) since there's no persistent-
// connection infra in this environment and a few seconds of latency is a
// fine trade-off for an internal engagement feature. `after` is the ISO
// createdAt of the newest message the client already has; omit it (or
// pass nothing) to get the most recent page.
export async function GET(req: NextRequest) {
  const identity = await getAgentIdentity();
  if (!identity) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const after = req.nextUrl.searchParams.get("after");
  const afterDate = after ? new Date(after) : null;

  const messages = await prisma.chatMessage.findMany({
    where: afterDate ? { createdAt: { gt: afterDate } } : undefined,
    orderBy: { createdAt: afterDate ? "asc" : "desc" },
    take: afterDate ? 200 : 100, // bounded either way - a burst of catch-up or the initial page
    include: { employee: { select: { email: true, displayName: true } } },
  });

  const ordered = afterDate ? messages : [...messages].reverse();

  return NextResponse.json({
    messages: ordered.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      employeeSlug: m.employee.email,
      employeeName: m.employee.displayName,
    })),
  });
}
