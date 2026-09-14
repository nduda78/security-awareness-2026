import Link from "next/link";
import { getAgentIdentity } from "@/lib/session";
import { signOutAction } from "@/lib/actions/identify";

const LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/challenges", label: "Challenges" },
  { href: "/rules", label: "Rules" },
  { href: "/profile", label: "My Profile" },
];

export async function Nav() {
  const identity = await getAgentIdentity();
  return (
    <header className="scanlines relative border-b border-brand-sand/15 bg-black/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-terminal text-xs uppercase tracking-widest text-brand-light-green">
            Dutchie Security // Clearance Program
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            2026 DUTCHIE CYBERSECURITY AWARENESS MONTH
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-terminal text-xs uppercase tracking-wide text-brand-sand/70 hover:text-brand-yellow"
            >
              {l.label}
            </Link>
          ))}
          {identity && (
            <form action={signOutAction} className="flex items-center gap-2">
              <span className="font-terminal text-xs text-brand-sand/40">{identity.displayName}</span>
              <button className="font-terminal text-xs uppercase text-brand-sand/40 hover:text-brand-red">
                sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
