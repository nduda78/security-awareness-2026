import Link from "next/link";
import { adminLogoutAction } from "@/lib/actions/admin";

const LINKS = [
  { href: "/admin/challenges", label: "Challenges" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/flare", label: "Badge Flare" },
  { href: "/admin/employees", label: "Employees" },
];

export function AdminNav() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-brand-purple/30 pb-4">
      <div className="flex gap-4">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="font-terminal text-xs uppercase text-brand-sand/70 hover:text-brand-purple">
            {l.label}
          </Link>
        ))}
      </div>
      <form action={adminLogoutAction}>
        <button className="font-terminal text-xs uppercase text-brand-sand/40 hover:text-brand-red">
          log out
        </button>
      </form>
    </div>
  );
}
