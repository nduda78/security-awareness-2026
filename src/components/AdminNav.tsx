import Link from "next/link";
import { adminLogoutAction } from "@/lib/actions/admin";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/admin/challenges", label: "Challenges", icon: "lightning" },
  { href: "/admin/submissions", label: "Audit Log", icon: "shield" },
  { href: "/admin/flare", label: "Badge Flare", icon: "trophy" },
  { href: "/admin/employees", label: "Employees", icon: "crown" },
];

export function AdminNav() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-brand-purple/25 pb-5">
      <div className="flex flex-wrap gap-1.5">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-terminal text-xs uppercase tracking-wide text-brand-sand/60 transition hover:bg-brand-purple/15 hover:text-brand-sand"
          >
            <Icon name={l.icon} className="h-3.5 w-3.5 opacity-70" />
            {l.label}
          </Link>
        ))}
      </div>
      <form action={adminLogoutAction}>
        <button className="font-terminal text-xs uppercase text-brand-sand/40 hover:text-brand-red">
          Log out
        </button>
      </form>
    </div>
  );
}
