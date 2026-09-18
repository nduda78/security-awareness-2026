"use server";

import { prisma } from "@/lib/prisma";
import { getAgentIdentity, isAdminSession } from "@/lib/session";
import { CHAT_MAX_LENGTH, REACTION_EMOJIS } from "@/lib/chat";
import { revalidatePath } from "next/cache";

export interface ReactionSummary {
  emoji: string;
  count: number;
  /** Whether the current viewer is one of the people who left this reaction. */
  mine: boolean;
}

export interface PostedMessage {
  id: string;
  body: string;
  createdAt: string; // ISO
  employeeSlug: string;
  employeeName: string;
  reactions: ReactionSummary[];
  /// True if the author is ROGUE-flagged (Employee.rogueOverride) -
  /// "Process 420" and any future evil-agent persona get the same
  /// visual treatment for free (see ChatRoomClient.tsx), same as ROGUE
  /// already gets special styling on the badge/leaderboard.
  authorIsRogue: boolean;
  /// True if this message was auto-posted by the synthetic "Security
  /// System" account (see Employee.isSystemAccount) rather than typed by
  /// a real agent - rendered as a centered system pill in
  /// ChatRoomClient.tsx instead of a normal chat bubble.
  authorIsSystem: boolean;
}

export interface PresenceEntry {
  slug: string;
  displayName: string;
}

export interface Presence {
  online: PresenceEntry[];
  typing: PresenceEntry[];
}

const PRESENCE_WINDOW_MS = 15_000;
const TYPING_WINDOW_MS = 4_000;

/**
 * Who's currently active in the Chat Room (heartbeat within the last
 * ~15s) and who's currently typing (within the last ~4s) - both windows
 * a little wider than the 4s poll interval so a single missed beat
 * doesn't flicker someone offline. Excludes the viewer themselves from
 * both lists (no point telling you that you're online) and never
 * includes the system account.
 */
export async function getPresence(excludeSlug: string | null): Promise<Presence> {
  const now = Date.now();
  const [onlineRows, typingRows] = await Promise.all([
    prisma.employee.findMany({
      where: { chatActiveAt: { gte: new Date(now - PRESENCE_WINDOW_MS) }, isSystemAccount: false },
      select: { email: true, displayName: true },
    }),
    prisma.employee.findMany({
      where: { typingAt: { gte: new Date(now - TYPING_WINDOW_MS) }, isSystemAccount: false },
      select: { email: true, displayName: true },
    }),
  ]);
  const toEntry = (r: { email: string; displayName: string }) => ({ slug: r.email, displayName: r.displayName });
  return {
    online: onlineRows.filter((r) => r.email !== excludeSlug).map(toEntry),
    typing: typingRows.filter((r) => r.email !== excludeSlug).map(toEntry),
  };
}

/** Presence heartbeat - refreshed every poll tick while the Chat Room is open. */
export async function heartbeatAction(): Promise<void> {
  const identity = await getAgentIdentity();
  if (!identity) return;
  await prisma.employee.updateMany({ where: { email: identity.email }, data: { chatActiveAt: new Date() } });
}

/** Debounced typing heartbeat - set on keystrokes, cleared on send/blur/empty. */
export async function setTypingAction(isTyping: boolean): Promise<void> {
  const identity = await getAgentIdentity();
  if (!identity) return;
  await prisma.employee.updateMany({
    where: { email: identity.email },
    data: { typingAt: isTyping ? new Date() : null },
  });
}

let systemAccountIdCache: string | null = null;
async function getSystemAccountId(): Promise<string> {
  if (systemAccountIdCache) return systemAccountIdCache;
  const account = await prisma.employee.upsert({
    where: { email: "security-system" },
    update: {},
    create: { email: "security-system", displayName: "Security System", isSystemAccount: true, isHidden: true },
  });
  systemAccountIdCache = account.id;
  return account.id;
}

/**
 * Auto-posts an announcement into the Chat Room as the "Security System"
 * account - used for the activity feed (new challenge drops, tier-ups).
 * Called from other real Server Actions (admin.ts, submit.ts) where
 * that's fine, but ALSO from announceJustOpenedChallenges() during a
 * plain Server Component render (challenges/page.tsx, chat/page.tsx) -
 * revalidatePath() is illegal to call during a render (throws "used
 * revalidatePath during render" and 500s the whole page, not just this
 * feature) and unlike a Server Action, execution can't detect which
 * context it's in. Deliberately does NOT call revalidatePath here at
 * all: /chat already has `dynamic = "force-dynamic"`, so every request
 * re-fetches messages fresh regardless, and the live Chat Room UI never
 * depends on Next's router cache anyway - it polls its own Route Handler
 * (api/chat/messages) which always queries the DB directly.
 */
export async function postSystemMessage(body: string): Promise<void> {
  const employeeId = await getSystemAccountId();
  await prisma.chatMessage.create({ data: { employeeId, body } });
}

/** Aggregates ChatReaction rows for one message into emoji/count/mine. */
export async function buildReactionSummary(messageId: string, viewerEmployeeId: string | null): Promise<ReactionSummary[]> {
  const map = await buildReactionSummaries([messageId], viewerEmployeeId);
  return map.get(messageId) ?? [];
}

/** Same as buildReactionSummary but batched across many messages in one query - used for the initial page load and each poll tick. */
export async function buildReactionSummaries(
  messageIds: string[],
  viewerEmployeeId: string | null
): Promise<Map<string, ReactionSummary[]>> {
  if (messageIds.length === 0) return new Map();
  const rows = await prisma.chatReaction.findMany({ where: { messageId: { in: messageIds } } });
  const byMessage = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const r of rows) {
    const perEmoji = byMessage.get(r.messageId) ?? new Map<string, { count: number; mine: boolean }>();
    const cur = perEmoji.get(r.emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (viewerEmployeeId && r.employeeId === viewerEmployeeId) cur.mine = true;
    perEmoji.set(r.emoji, cur);
    byMessage.set(r.messageId, perEmoji);
  }
  const result = new Map<string, ReactionSummary[]>();
  for (const [messageId, perEmoji] of byMessage) {
    result.set(
      messageId,
      [...perEmoji.entries()].map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
    );
  }
  return result;
}

/**
 * Posts a new Chat Room message. Called directly from ChatRoomClient.tsx
 * (a client component) rather than via a <form action>, since a chat
 * composer needs to stay on the page and get the new message back
 * immediately for optimistic rendering - server actions are just async
 * functions and can be called directly from client event handlers, no
 * <form> or full page navigation required.
 */
export async function postChatMessageAction(rawBody: string): Promise<{ ok: true; message: PostedMessage } | { ok: false; error: string }> {
  const identity = await getAgentIdentity();
  if (!identity) return { ok: false, error: "You need to sign in first." };

  const body = rawBody.trim();
  if (!body) return { ok: false, error: "Message can't be empty." };
  if (body.length > CHAT_MAX_LENGTH) return { ok: false, error: `Keep it under ${CHAT_MAX_LENGTH} characters.` };

  const employee = await prisma.employee.upsert({
    where: { email: identity.email },
    update: {},
    create: { email: identity.email, displayName: identity.displayName },
  });

  const created = await prisma.chatMessage.create({
    data: { employeeId: employee.id, body },
  });

  revalidatePath("/chat");

  return {
    ok: true,
    message: {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      employeeSlug: employee.email,
      employeeName: employee.displayName,
      reactions: [],
      authorIsRogue: employee.rogueOverride,
      authorIsSystem: employee.isSystemAccount,
    },
  };
}

/**
 * Toggles one emoji reaction from the current viewer on one message - if
 * they've already left that exact emoji it's removed, otherwise it's
 * added. Returns the message's full updated reaction summary so the
 * caller can just replace its local copy rather than re-deriving a diff.
 */
export async function toggleReactionAction(
  messageId: string,
  emoji: string
): Promise<{ ok: true; reactions: ReactionSummary[] } | { ok: false; error: string }> {
  const identity = await getAgentIdentity();
  if (!identity) return { ok: false, error: "You need to sign in first." };
  if (!REACTION_EMOJIS.includes(emoji)) return { ok: false, error: "Not a valid reaction." };

  const employee = await prisma.employee.upsert({
    where: { email: identity.email },
    update: {},
    create: { email: identity.email, displayName: identity.displayName },
  });

  const existing = await prisma.chatReaction.findUnique({
    where: { messageId_employeeId_emoji: { messageId, employeeId: employee.id, emoji } },
  });
  if (existing) {
    await prisma.chatReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.chatReaction.create({ data: { messageId, employeeId: employee.id, emoji } });
  }

  const reactions = await buildReactionSummary(messageId, employee.id);
  revalidatePath("/chat");
  return { ok: true, reactions };
}

/** Author can delete their own message; admins can delete anyone's. */
export async function deleteChatMessageAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const identity = await getAgentIdentity();
  if (!identity) return { ok: false, error: "You need to sign in first." };

  const message = await prisma.chatMessage.findUnique({ where: { id }, include: { employee: true } });
  if (!message) return { ok: true }; // already gone - fine either way

  const admin = await isAdminSession();
  if (message.employee.email !== identity.email && !admin) {
    return { ok: false, error: "You can only delete your own messages." };
  }

  await prisma.chatMessage.delete({ where: { id } });
  revalidatePath("/chat");
  return { ok: true };
}

/**
 * Marks the Chat Room "read" as of right now for the current identity -
 * clears the unread-@mention indicator in Nav.tsx. Called from
 * ChatRoomClient.tsx on mount and again after every successful poll while
 * the page stays open, so a new mention that arrives while you're already
 * looking at the room doesn't leave the nav badge stuck on.
 */
export async function markChatReadAction(): Promise<void> {
  const identity = await getAgentIdentity();
  if (!identity) return;
  await prisma.employee.updateMany({
    where: { email: identity.email },
    data: { lastChatReadAt: new Date() },
  });
}
