import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { buildAgentRoster } from "@/lib/leaderboard";
import { AdminNav } from "@/components/AdminNav";
import { toggleRogueAction, grantManualXpAction } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const roster = await buildAgentRoster();
  roster.sort((a, b) => b.xp - a.xp);

  return (
    <div>
      <AdminNav />
      <h2 className="mb-6 text-2xl font-bold">Employees</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-sand/15 text-left text-brand-sand/50">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">XP</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">ROGUE override</th>
              <th className="py-2 pr-4">Manual XP grant</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.email} className="border-b border-brand-sand/5">
                <td className="py-2 pr-4">{r.displayName}</td>
                <td className="py-2 pr-4 text-brand-sand/60">{r.email}</td>
                <td className="py-2 pr-4">{r.xp}</td>
                <td className="py-2 pr-4" style={{ color: r.tier.color }}>
                  {r.tier.label}
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleRogueAction} className="flex items-center gap-1">
                    <input type="hidden" name="email" value={r.email} />
                    <input type="checkbox" name="rogue" defaultChecked={r.rogueOverride} />
                    <button className="rounded bg-brand-red/70 px-2 py-0.5 font-terminal text-[10px] uppercase text-brand-sand">
                      Save
                    </button>
                  </form>
                </td>
                <td className="py-2 pr-4">
                  <form action={grantManualXpAction} className="flex gap-1">
                    <input type="hidden" name="email" value={r.email} />
                    <input
                      name="xp"
                      type="number"
                      placeholder="XP"
                      className="w-16 rounded border border-brand-sand/20 bg-black/30 px-1 py-0.5 text-xs"
                    />
                    <input
                      name="reason"
                      placeholder="reason"
                      className="w-24 rounded border border-brand-sand/20 bg-black/30 px-1 py-0.5 text-xs"
                    />
                    <button className="rounded bg-brand-light-green px-2 py-0.5 font-terminal text-[10px] uppercase text-brand-dark-green">
                      Grant
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
