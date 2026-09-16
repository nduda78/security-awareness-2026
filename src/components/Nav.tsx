import Image from "next/image";
import Link from "next/link";
import { getAgentIdentity, isAdminSession } from "@/lib/session";
import { signOutAction } from "@/lib/actions/identify";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard", icon: "shield" },
  { href: "/challenges", label: "Challenges", icon: "lightning" },
  { href: "/rules", label: "Rules", icon: "file" },
  { href: "/profile", label: "My Profile", icon: "crown" },
];

export async function Nav() {
  const identity = await getAgentIdentity();
  const isAdmin = await isAdminSession();
  return (
    <header className="sticky top-0 z-40 border-b border-brand-sand/10 bg-brand-dark-green/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-y-3 gap-x-4 px-4 py-5 sm:px-6 sm:py-6">
        <Link href="/leaderboard" className="flex shrink-0 items-center gap-4">
          <Image
            src="/brand/dutchie-logo.png"
            alt="Dutchie"
            width={160}
            height={44}
            className="h-9 w-auto sm:h-11"
            priority
          />
          <span className="hidden h-10 w-px bg-brand-sand/15 sm:block" />
          <div className="hidden sm:block">
            <div className="section-eyebrow whitespace-nowrap text-[11px] leading-none">Security Clearance Program</div>
            <div className="whitespace-nowrap font-display text-lg font-semibold leading-tight text-brand-sand/90">
              2026 Awareness Month
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
              <Icon name={l.icon} className="h-4 w-4 opacity-70" />
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/challenges"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 font-terminal text-sm font-medium uppercase tracking-wide text-brand-purple/80 transition hover:bg-brand-purple/10 hover:text-brand-purple"
            >
              <Icon name="lock" className="h-4 w-4 opacity-70" />
              Admin
            </Link>
          )}
          {identity && (
            <form action={signOutAction} className="ml-1 flex items-center gap-2.5 border-l border-brand-sand/10 pl-3">
              <span className="hidden font-terminal text-sm text-brand-sand/40 md:inline">
                {identity.displayName}
              </span>
              <button className="rounded-full px-2.5 py-1.5 font-terminal text-sm uppercase text-brand-sand/40 transition hover:text-brand-red">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
