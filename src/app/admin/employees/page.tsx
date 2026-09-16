import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { buildAgentRoster } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { toggleRogueAction, grantManualXpAction, toggleAdminAction, toggleHiddenAction } from "@/lib/actions/admin";
import { getAgentIdentity } from "@/lib/session";
import { AgentsTable, type AgentRow } from "@/components/AgentsTable";

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
  const currentIdentity = await getAgentIdentity();
  const hiddenByEmail = new Map((await prisma.employee.findMany({ select: { email: true, isHidden: true } })).map((e) => [e.email, e.isHidden]));

  const employeeFlags = new Map(
    (await prisma.employee.findMany({ select: { email: true, pinHash: true, isAdmin: true } })).map((e) => [
      e.email,
      { claimed: e.pinHash !== null, isAdmin: e.isAdmin },
    ])
  );

  const rows: AgentRow[] = roster.map((r) => ({
    email: r.email,
    displayName: r.displayName,
    xp: r.xp,
    tierLabel: r.tier.label,
    tierColor: r.tier.color,
    tierOrder: r.tier.order,
    rogueOverride: r.rogueOverride,
    hidden: hiddenByEmail.get(r.email) ?? false,
    claimed: employeeFlags.get(r.email)?.claimed ?? false,
    isAdmin: employeeFlags.get(r.email)?.isAdmin ?? false,
  }));

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Agents</h1>
      {saved && <div className="mb-4 rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Saved.</div>}
      {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

      <AgentsTable
        rows={rows}
        permanentAdminEmail={PERMANENT_ADMIN_EMAIL}
        currentEmail={currentIdentity?.email ?? null}
        toggleRogueAction={toggleRogueAction}
        toggleHiddenAction={toggleHiddenAction}
        grantManualXpAction={grantManualXpAction}
        toggleAdminAction={toggleAdminAction}
      />
    </div>
  );
}
