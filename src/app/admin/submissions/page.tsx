import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { reviewSubmissionAction } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const pending = await prisma.submission.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { employee: true, challenge: true },
    orderBy: { submittedAt: "asc" },
  });

  const recent = await prisma.submission.findMany({
    where: { status: { not: "PENDING_REVIEW" } },
    include: { employee: true, challenge: true },
    orderBy: { submittedAt: "desc" },
    take: 25,
  });

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Submissions</h1>

      <h2 className="mb-3 font-terminal text-sm uppercase text-brand-yellow">
        Pending review ({pending.length})
      </h2>
      {pending.length === 0 && (
        <p className="surface-card mb-8 p-4 text-sm text-brand-sand/50">Nothing waiting on you. Nice.</p>
      )}
      <div className="mb-10 space-y-3">
        {pending.map((s) => (
          <div key={s.id} className="surface-card border-brand-yellow/25 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-brand-sand">{s.employee.displayName}</span>
              <span className="text-brand-sand/50">{s.challenge.title}</span>
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

      <h2 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Recent decisions</h2>
      <div className="space-y-2">
        {recent.map((s) => (
          <div key={s.id} className="surface-card flex justify-between px-4 py-3 text-sm">
            <span className="text-brand-sand/80">
              {s.employee.displayName} — {s.challenge.title}
            </span>
            <span className={s.status === "CORRECT" ? "text-brand-light-green" : "text-brand-red"}>
              {s.status === "CORRECT" ? `+${s.xpAwarded} XP` : "incorrect"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
