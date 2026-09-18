import Link from "next/link";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/admin/challenges", label: "Challenges", icon: "lightning" },
  { href: "/admin/answers", label: "Answers", icon: "file" },
  { href: "/admin/submissions", label: "Audit Log", icon: "shield" },
  { href: "/admin/flare", label: "Badge Flare", icon: "trophy" },
  { href: "/admin/employees", label: "Agents", icon: "crown" },
  { href: "/admin/settings", label: "Settings", icon: "lock" },
];

export function AdminNav() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-3 border-b border-brand-purple/25 pb-5">
      <div className="flex flex-wrap justify-center gap-1.5">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-terminal text-xs uppercase tracking-wide text-brand-cyan transition hover:bg-brand-cyan/10"
          >
            <Icon name={l.icon} className="h-3.5 w-3.5 opacity-70" />
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
