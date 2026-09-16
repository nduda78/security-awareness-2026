import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { buildReactionSummaries } from "@/lib/actions/chat";

// Polled by ChatRoomClient.tsx every few seconds for anything newer than
// the last message it already has - a deliberately simple "near real-time"
// mechanism (not real websockets/SSE) since there's no persistent-
// connection infra in this environment and a few seconds of latency is a
// fine trade-off for an internal engagement feature. `after` is the ISO
// createdAt of the newest message the client already has; omit it (or
// pass nothing) to get the most recent page.
//
// Reactions don't bump a message's createdAt, so a plain "after" filter
// would never surface someone else reacting to a message you already
// have. To keep that reasonably fresh without complex change-tracking,
// every poll also re-aggregates reactions for the most recent 50 messages
// in the whole room and returns them separately as `reactionUpdates` -
// the client merges those into whatever it already has, regardless of
// whether they came back in `messages` this time.
export async function GET(req: NextRequest) {
  const identity = await getAgentIdentity();
  if (!identity) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const viewer = await prisma.employee.findUnique({ where: { email: identity.email }, select: { id: true } });

  const after = req.nextUrl.searchParams.get("after");
  const afterDate = after ? new Date(after) : null;

  const [messages, recentForReactions] = await Promise.all([
    prisma.chatMessage.findMany({
      where: afterDate ? { createdAt: { gt: afterDate } } : undefined,
      orderBy: { createdAt: afterDate ? "asc" : "desc" },
      take: afterDate ? 200 : 100, // bounded either way - a burst of catch-up or the initial page
      include: { employee: { select: { email: true, displayName: true, rogueOverride: true } } },
    }),
    prisma.chatMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true } }),
  ]);

  const ordered = afterDate ? messages : [...messages].reverse();
  const reactionMap = await buildReactionSummaries(
    recentForReactions.map((m) => m.id),
    viewer?.id ?? null
  );

  return NextResponse.json({
    messages: ordered.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      employeeSlug: m.employee.email,
      employeeName: m.employee.displayName,
      reactions: reactionMap.get(m.id) ?? [],
      authorIsRogue: m.employee.rogueOverride,
    })),
    reactionUpdates: Object.fromEntries(reactionMap),
  });
}
