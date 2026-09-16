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
