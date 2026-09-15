import Image from "next/image";
import Link from "next/link";
import { getAgentIdentity } from "@/lib/session";
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
  return (
    <header className="sticky top-0 z-40 border-b border-brand-sand/10 bg-brand-dark-green/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/leaderboard" className="flex items-center gap-3">
          <Image
            src="/brand/dutchie-logo.png"
            alt="Dutchie"
            width={132}
            height={36}
            className="h-7 w-auto sm:h-8"
            priority
          />
          <span className="hidden h-8 w-px bg-brand-sand/15 sm:block" />
          <div className="hidden sm:block">
            <div className="section-eyebrow leading-none">Security Clearance Program</div>
            <div className="font-display text-sm font-semibold leading-tight text-brand-sand/90">
              2026 Awareness Month
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-terminal text-xs font-medium uppercase tracking-wide text-brand-sand/65 transition hover:bg-brand-sand/8 hover:text-brand-sand"
            >
              <Icon name={l.icon} className="h-3.5 w-3.5 opacity-70" />
              {l.label}
            </Link>
          ))}
          {identity && (
            <form action={signOutAction} className="ml-1 flex items-center gap-2 border-l border-brand-sand/10 pl-3">
              <span className="hidden font-terminal text-[11px] text-brand-sand/40 md:inline">
                {identity.displayName}
              </span>
              <button className="rounded-full px-2.5 py-1 font-terminal text-[11px] uppercase text-brand-sand/40 transition hover:text-brand-red">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
