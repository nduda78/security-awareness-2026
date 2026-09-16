import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { buildAgentRoster } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { toggleRogueAction, grantManualXpAction, toggleAdminAction, toggleHiddenAction } from "@/lib/actions/admin";
import { ResetPinButton } from "@/components/ResetPinButton";
import { DeleteEmployeeButton } from "@/components/DeleteEmployeeButton";
import { getAgentIdentity } from "@/lib/session";

const PERMANENT_ADMIN_EMAIL = "nick-duda";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { saved, error } = await searchParams;

  const roster = await buildAgentRoster();
  roster.sort((a, b) => b.xp - a.xp);
  const currentIdentity = await getAgentIdentity();
  const hiddenByEmail = new Map((await prisma.employee.findMany({ select: { email: true, isHidden: true } })).map((e) => [e.email, e.isHidden]));

  const employeeFlags = new Map(
    (await prisma.employee.findMany({ select: { email: true, pinHash: true, isAdmin: true } })).map((e) => [
      e.email,
      { claimed: e.pinHash !== null, isAdmin: e.isAdmin },
    ])
  );

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Agents</h1>
      {saved && <div className="mb-4 rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Saved.</div>}
      {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

      <div className="surface-card overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-sand/10 text-left font-terminal text-[11px] uppercase tracking-wide text-brand-sand/40">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Handle</th>
              <th className="px-3 py-3">XP</th>
              <th className="px-3 py-3">Tier</th>
              <th className="px-3 py-3">ROGUE override</th>
              <th className="px-3 py-3">Hide from Leaderboard</th>
              <th className="px-3 py-3">Manual XP grant</th>
              <th className="px-3 py-3">PIN</th>
              <th className="px-3 py-3">Admin</th>
              <th className="px-3 py-3">Delete</th>
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
                  <form action={toggleHiddenAction} className="flex items-center gap-1.5">
                    <input type="hidden" name="email" value={r.email} />
                    <input
                      type="checkbox"
                      name="hidden"
                      defaultChecked={hiddenByEmail.get(r.email) ?? false}
                      className="accent-brand-cyan"
                    />
                    <button className="btn-secondary !border-brand-cyan/30 !px-2 !py-0.5 !text-[10px] !text-brand-cyan">
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
                  {employeeFlags.get(r.email)?.claimed ? (
                    <ResetPinButton email={r.email} displayName={r.displayName} />
                  ) : (
                    <span className="font-terminal text-[10px] uppercase text-brand-sand/35">Unclaimed</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.email === PERMANENT_ADMIN_EMAIL ? (
                    <span className="font-terminal text-[10px] uppercase text-brand-light-green/80">
                      Permanent
                    </span>
                  ) : (
                    <form action={toggleAdminAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="email" value={r.email} />
                      <input
                        type="checkbox"
                        name="admin"
                        defaultChecked={employeeFlags.get(r.email)?.isAdmin ?? false}
                        className="accent-brand-light-green"
                      />
                      <button className="btn-secondary !px-2 !py-0.5 !text-[10px]">Save</button>
                    </form>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {r.email === PERMANENT_ADMIN_EMAIL || r.email === currentIdentity?.email ? (
                    <span className="font-terminal text-[10px] uppercase text-brand-sand/25">—</span>
                  ) : (
                    <DeleteEmployeeButton email={r.email} displayName={r.displayName} />
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
