import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity, isAdminSession } from "@/lib/session";
import { ChatRoomClient } from "@/components/ChatRoomClient";
import { isCompromisedModeEnabled } from "@/lib/settings";
import { buildReactionSummaries, getPresence, heartbeatAction } from "@/lib/actions/chat";
import { buildAgentRoster } from "@/lib/leaderboard";
import { announceJustOpenedChallenges } from "@/lib/challengeDrops";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage() {
  const identity = await getAgentIdentity();
  if (!identity) redirect("/identify?next=/chat");

  await heartbeatAction();
  await announceJustOpenedChallenges();

  const [recent, agentRoster, isAdmin, compromised, presence] = await Promise.all([
    prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { employee: { select: { email: true, displayName: true, rogueOverride: true, isSystemAccount: true } } },
    }),
    buildAgentRoster(),
    isAdminSession(),
    isCompromisedModeEnabled(),
    getPresence(identity.email),
  ]);

  const viewer = await prisma.employee.findUnique({ where: { email: identity.email }, select: { id: true } });
  const reactionMap = await buildReactionSummaries(recent.map((m) => m.id), viewer?.id ?? null);

  const initialMessages = [...recent].reverse().map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    employeeSlug: m.employee.email,
    employeeName: m.employee.displayName,
    reactions: reactionMap.get(m.id) ?? [],
    authorIsRogue: m.employee.rogueOverride,
    authorIsSystem: m.employee.isSystemAccount,
  }));

  // Reuses buildAgentRoster() (same data the Leaderboard/badges use) rather
  // than a plain employee list, so the composer's mention autocomplete AND
  // the chat feed's name coloring/hover-preview/`/flex` (all in
  // ChatRoomClient.tsx) can use each agent's tier color/icon/XP/codename
  // without any extra per-message queries - it's fetched once per page
  // load, same cost as before.
  const roster = agentRoster.map((c) => ({
    slug: c.email,
    displayName: c.displayName,
    tierColor: c.tier.color,
    tierIcon: c.tier.icon,
    tierLabel: c.tier.label,
    outlineColor: c.flare?.outlineColor ?? null,
    iconOverride: c.flare?.iconOverride ?? null,
    xp: c.xp,
    codename: c.codename,
    photoUrl: c.photoUrl,
  }));

  return (
    <div className="fade-in-up">
      <div className="mb-4">
        <div className="section-eyebrow mb-2">{compromised ? "Unsecured Channel" : "Secure Channel"}</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {compromised ? (
            <>
              <span className="gradient-text">Br3ach</span> Room
            </>
          ) : (
            <>
              <span className="gradient-text">Chat</span> Room
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-brand-sand/60">
          {compromised ? (
            <>
              Encryption status: none. Everything typed here is being read by someone, possibly including you. Type{" "}
              <span className="font-terminal text-brand-cyan">@</span> to tag another agent — they&apos;ll be flagged
              whether they like it or not.
            </>
          ) : (
            <>
              Banter, brag about your clearance, or call out whoever&apos;s still UNCLASSIFIED. Type{" "}
              <span className="font-terminal text-brand-cyan">@</span> to tag another agent — they&apos;ll see it
              flagged next time they check in.
            </>
          )}
        </p>
      </div>
      <ChatRoomClient
        initialMessages={initialMessages}
        roster={roster}
        currentSlug={identity.email}
        isAdmin={isAdmin}
        initialPresence={presence}
      />
    </div>
  );
}
