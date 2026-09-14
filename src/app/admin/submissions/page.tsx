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
    <div>
      <AdminNav />
      <h2 className="mb-6 text-2xl font-bold">Submissions</h2>

      <h3 className="mb-3 font-terminal text-sm uppercase text-brand-yellow">
        Pending review ({pending.length})
      </h3>
      {pending.length === 0 && <p className="mb-8 text-sm text-brand-sand/50">Nothing waiting on you. Nice.</p>}
      <div className="mb-10 space-y-3">
        {pending.map((s) => (
          <div key={s.id} className="rounded-md border border-brand-yellow/30 bg-black/20 p-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium">{s.employee.displayName}</span>
              <span className="text-brand-sand/50">{s.challenge.title}</span>
            </div>
            <p className="mb-3 whitespace-pre-wrap rounded bg-black/30 p-2 text-sm text-brand-sand/80">
              {s.answerRaw}
            </p>
            <div className="flex gap-2">
              <form action={reviewSubmissionAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="decision" value="approve" />
                <button className="rounded bg-brand-light-green px-3 py-1 font-terminal text-xs uppercase text-brand-dark-green">
                  Approve (+{s.challenge.xpValue} XP)
                </button>
              </form>
              <form action={reviewSubmissionAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="decision" value="reject" />
                <button className="rounded bg-brand-red/80 px-3 py-1 font-terminal text-xs uppercase text-brand-sand">
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-3 font-terminal text-sm uppercase text-brand-sand/50">Recent decisions</h3>
      <div className="space-y-2">
        {recent.map((s) => (
          <div key={s.id} className="flex justify-between rounded-md border border-brand-sand/10 bg-black/20 p-3 text-sm">
            <span>
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
