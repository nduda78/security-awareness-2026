import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { reviewSubmissionAction } from "@/lib/actions/admin";
import { formatEasternDateTime } from "@/lib/easternTime";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date): string {
  return formatEasternDateTime(d);
}

const AUDIT_LABELS: Record<string, string> = {
  FLARE_UPDATE: "Badge flare updated",
  ROGUE_OVERRIDE: "ROGUE override changed",
  MANUAL_XP_GRANT: "Manual XP grant",
  PHOTO_OVERRIDE: "Badge photo overridden",
  CLEARANCE_WEBHOOK: "Clearance webhook settings changed",
  REVIEW_WEBHOOK: "Review-needed webhook settings changed",
};

export default async function AdminSubmissionsPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const pending = await prisma.submission.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { employee: true, challenge: true },
    orderBy: { submittedAt: "asc" },
  });

  // Bounded but generous — grouped by person below, so this needs to cover
  // more ground than a flat "last 25" list did.
  const recent = await prisma.submission.findMany({
    where: { status: { not: "PENDING_REVIEW" } },
    include: { employee: true, challenge: true },
    orderBy: { submittedAt: "desc" },
    take: 300,
  });

  const byPerson = new Map<
    string,
    { displayName: string; email: string; submissions: typeof recent }
  >();
  for (const s of recent) {
    const existing = byPerson.get(s.employee.email);
    if (existing) {
      existing.submissions.push(s);
    } else {
      byPerson.set(s.employee.email, {
        displayName: s.employee.displayName,
        email: s.employee.email,
        submissions: [s],
      });
    }
  }
  const people = Array.from(byPerson.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));

  const audits = await prisma.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Audit Log</h1>

      <h2 className="mb-3 font-terminal text-sm uppercase text-brand-yellow">
        Pending review ({pending.length})
      </h2>
      {pending.length === 0 && (
        <p className="surface-card mb-8 p-4 text-sm text-brand-sand/50">Nothing waiting on you. Nice.</p>
      )}
      <div className="mb-10 space-y-3">
        {pending.map((s) => (
          <div key={s.id} className="surface-card border-brand-yellow/25 p-4">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-brand-sand">{s.employee.displayName}</span>
              <span className="text-brand-sand/50">{s.challenge.title}</span>
              <span className="font-terminal text-[11px] text-brand-sand/35">{formatDateTime(s.submittedAt)}</span>
            </div>
            <p className="mb-3 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm text-brand-sand/80">
              {s.answerRaw}
            </p>
            <div className="flex gap-2">
              <form action={reviewSubmissionAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="decision" value="approve" />
                <button className="btn-primary !px-3 !py-1.5 !text-[11px]">
                  Approve (+{s.challenge.xpValue} XP)
                </button>
              </form>
              <form action={reviewSubmissionAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="decision" value="reject" />
                <button
                  className="btn-secondary !px-3 !py-1.5 !text-[11px] !border-brand-red/40 !text-brand-red"
                >
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">
        Recent decisions, by person ({people.length})
      </h2>
      {people.length === 0 && (
        <p className="surface-card mb-10 p-4 text-sm text-brand-sand/50">No decisions yet.</p>
      )}
      <div className="mb-10 space-y-2">
        {people.map((p) => (
          <details key={p.email} className="surface-card group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-brand-sand">
                <span className="text-brand-sand/40 transition-transform group-open:rotate-90">›</span>
                {p.displayName}
              </span>
              <span className="font-terminal text-[11px] text-brand-sand/40">
                {p.submissions.length} decision{p.submissions.length === 1 ? "" : "s"} · most recent{" "}
                {formatDateTime(p.submissions[0].submittedAt)}
              </span>
            </summary>
            <div className="mt-3 space-y-1.5 border-t border-brand-sand/10 pt-3">
              {p.submissions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="text-brand-sand/70">{s.challenge.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-terminal text-[11px] text-brand-sand/35">
                      {formatDateTime(s.submittedAt)}
                    </span>
                    <span className={s.status === "CORRECT" ? "text-brand-light-green" : "text-brand-red"}>
                      {s.status === "CORRECT" ? `+${s.xpAwarded} XP` : "incorrect"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <h2 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">
        Admin activity ({audits.length})
      </h2>
      <p className="mb-3 text-sm text-brand-sand/40">
        Badge flare edits, ROGUE overrides, and manual XP grants — everything that isn&apos;t already visible above.
      </p>
      {audits.length === 0 && (
        <p className="surface-card p-4 text-sm text-brand-sand/50">No admin activity yet.</p>
      )}
      <div className="space-y-2">
        {audits.map((a) => (
          <div key={a.id} className="surface-card flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="pill !py-0.5 !text-[10px]">{AUDIT_LABELS[a.action] ?? a.action}</span>
              <span className="text-brand-sand/70">{a.detail}</span>
            </span>
            <span className="font-terminal text-[11px] text-brand-sand/35">{formatDateTime(a.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
