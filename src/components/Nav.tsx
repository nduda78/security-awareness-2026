import Image from "next/image";
import Link from "next/link";
import { getAgentIdentity, isAdminSession } from "@/lib/session";
import { signOutAction } from "@/lib/actions/identify";
import { prisma } from "@/lib/prisma";
import { mentionsSlug } from "@/lib/chat";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard", corrupted: "DATA_LEAK", icon: "shield" },
  { href: "/challenges", label: "Challenges", corrupted: "EXPLOITS", icon: "lightning" },
  { href: "/chat", label: "Chat Room", corrupted: "COMMS_LEAK", icon: "chat" },
  { href: "/rules", label: "Rules", corrupted: "README.SYS", icon: "file" },
  { href: "/profile", label: "My Profile", corrupted: "MY_DOSSIER", icon: "crown" },
];

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

// Text-only reflavoring for the site-wide "compromised" theme (see
// VirusOverlay.tsx / settings.ts) - never touches badge or challenge
// content, just the surrounding site chrome. Nav is already a server
// component (it needs the agent identity + admin session anyway), so this
// is just a plain conditional swap - no client-side state needed.
export async function Nav({ compromised = false }: { compromised?: boolean }) {
  const identity = await getAgentIdentity();
  const isAdmin = await isAdminSession();
  const unreadMention = identity ? await hasUnreadMention(identity.email) : false;
  return (
    <header className="sticky top-0 z-40 border-b border-brand-sand/10 bg-brand-dark-green/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-y-3 gap-x-4 px-4 py-5 sm:px-6 sm:py-6">
        <Link href="/leaderboard" className="flex shrink-0 items-center gap-4">
          <Image
            src="/brand/dutchie-logo.png"
            alt="Dutchie"
            width={160}
            height={44}
            className="site-logo h-9 w-auto sm:h-11"
            priority
          />
          <span className="hidden h-10 w-px bg-brand-sand/15 sm:block" />
          <div className="hidden sm:block">
            <div className="section-eyebrow whitespace-nowrap text-[11px] leading-none">
              {compromised ? "SYSTEM COMPROMISED" : "Security Clearance Program"}
            </div>
            <div className="site-wordmark whitespace-nowrap font-display text-lg font-semibold leading-tight text-brand-sand/90">
              {compromised ? "BREACH IN PROGRESS" : "2026 Awareness Month"}
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 font-terminal text-sm font-medium uppercase tracking-wide text-brand-sand/65 transition hover:bg-brand-sand/8 hover:text-brand-sand"
            >
              <span className="relative">
                <Icon name={l.icon} className="h-4 w-4 opacity-70" />
                {l.href === "/chat" && unreadMention && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-red ring-2 ring-brand-dark-green" />
                )}
              </span>
              {compromised ? l.corrupted : l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/challenges"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 font-terminal text-sm font-medium uppercase tracking-wide text-brand-cyan transition hover:bg-brand-cyan/10"
            >
              <Icon name="lock" className="h-4 w-4 opacity-70" />
              {compromised ? "ROOT_ACCESS" : "Admin"}
            </Link>
          )}
          {identity && (
            <form action={signOutAction} className="ml-1 flex items-center gap-2.5 border-l border-brand-sand/10 pl-3">
              <span className="hidden font-terminal text-sm text-brand-sand/40 md:inline">
                {identity.displayName}
              </span>
              <button className="rounded-full px-2.5 py-1.5 font-terminal text-sm uppercase text-brand-sand/40 transition hover:text-brand-red">
                {compromised ? "Disconnect" : "Sign out"}
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
