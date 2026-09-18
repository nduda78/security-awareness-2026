import { getAgentIdentity, isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { mentionsSlug } from "@/lib/chat";
import { NavChrome } from "./NavChrome";

/**
 * True if the signed-in employee has an unread @mention waiting in the
 * Chat Room - i.e. any message created after their lastChatReadAt that
 * mentions their slug. The DB `contains` filter is just a coarse
 * pre-filter to keep the row count small; mentionsSlug() does the real
 * word-boundary check in JS afterward (a plain substring match could
 * false-positive on "@nick-duda" matching a mention of "@nick-duda-2").
 */
async function hasUnreadMention(email: string): Promise<boolean> {
  const employee = await prisma.employee.findUnique({ where: { email }, select: { lastChatReadAt: true } });
  if (!employee) return false;
  const since = employee.lastChatReadAt ?? new Date(0);
  const candidates = await prisma.chatMessage.findMany({
    where: { createdAt: { gt: since }, body: { contains: `@${email}` } },
    select: { body: true },
    take: 200,
  });
  return candidates.some((c) => mentionsSlug(c.body, email));
}

// Nav stays an async Server Component just for its data fetching
// (identity, admin session, unread-mention check) - the actual chrome/
// text rendering (including the compromised-theme label swap) lives in
// NavChrome.tsx, a client component that reacts to useCompromisedRoute()
// rather than a plain server-computed boolean, so it can also flip on
// while a specific viewer is on a route that forces the theme (e.g.
// Security Connections #3), not just the global admin toggle.
export async function Nav() {
  const identity = await getAgentIdentity();
  const isAdmin = await isAdminSession();
  const unreadMention = identity ? await hasUnreadMention(identity.email) : false;
  return <NavChrome identity={identity} isAdmin={isAdmin} unreadMention={unreadMention} />;
}
