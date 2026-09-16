import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { buildAgentRoster } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { toggleRogueAction, grantManualXpAction } from "@/lib/actions/admin";
import { ResetPinButton } from "@/components/ResetPinButton";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const roster = await buildAgentRoster();
  roster.sort((a, b) => b.xp - a.xp);

  const pinStatusByEmail = new Map(
    (await prisma.employee.findMany({ select: { email: true, pinHash: true } })).map((e) => [
      e.email,
      e.pinHash !== null,
    ])
  );

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Employees</h1>

      <div className="surface-card overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-sand/10 text-left font-terminal text-[11px] uppercase tracking-wide text-brand-sand/40">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Handle</th>
              <th className="px-3 py-3">XP</th>
              <th className="px-3 py-3">Tier</th>
              <th className="px-3 py-3">ROGUE override</th>
              <th className="px-3 py-3">Manual XP grant</th>
              <th className="px-3 py-3">PIN</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.email} className="border-b border-brand-sand/5 last:border-0">
                <td className="px-3 py-2.5 font-medium text-brand-sand">{r.displayName}</td>
                <td className="px-3 py-2.5 text-brand-sand/50">{r.email}</td>
                <td className="px-3 py-2.5 font-terminal">{r.xp}</td>
                <td className="px-3 py-2.5 font-terminal text-xs uppercase" style={{ color: r.tier.color }}>
                  {r.tier.label}
                </td>
                <td className="px-3 py-2.5">
                  <form action={toggleRogueAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="email" value={r.email} />
                    <input type="checkbox" name="rogue" defaultChecked={r.rogueOverride} className="accent-brand-red" />
                    <button className="btn-secondary !border-brand-red/30 !px-2 !py-0.5 !text-[10px] !text-brand-red">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  <form action={grantManualXpAction} className="flex gap-1">
                    <input type="hidden" name="email" value={r.email} />
                    <input name="xp" type="number" placeholder="XP" className="input-modern w-16 !px-2 !py-1 !text-xs" />
                    <input name="reason" placeholder="reason" className="input-modern w-24 !px-2 !py-1 !text-xs" />
                    <button className="btn-primary !px-2 !py-1 !text-[10px]">Grant</button>
                  </form>
                </td>
                <td className="px-3 py-2.5">
                  {pinStatusByEmail.get(r.email) ? (
                    <ResetPinButton email={r.email} displayName={r.displayName} />
                  ) : (
                    <span className="font-terminal text-[10px] uppercase text-brand-sand/35">Unclaimed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
