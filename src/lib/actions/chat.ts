"use server";

import { prisma } from "@/lib/prisma";
import { getAgentIdentity, isAdminSession } from "@/lib/session";
import { CHAT_MAX_LENGTH } from "@/lib/chat";
import { revalidatePath } from "next/cache";

export interface PostedMessage {
  id: string;
  body: string;
  createdAt: string; // ISO
  employeeSlug: string;
  employeeName: string;
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
    },
  };
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
