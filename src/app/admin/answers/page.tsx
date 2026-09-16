import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { AgentAnswersTable, type AnswerRow } from "@/components/AgentAnswersTable";
import { formatEasternDateTime } from "@/lib/easternTime";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date): string {
  return formatEasternDateTime(d);
}

/**
 * Agent answer management: every submission across every agent and every
 * challenge, in one flat searchable table, each with a Reset button that
 * deletes it outright (see resetSubmissionAction) - clearing whatever XP
 * it awarded and letting the agent submit a fresh answer, starting back
 * at 0 attempts. Distinct from /admin/submissions (the "Audit Log"), which
 * is a read-only history focused on free-text review decisions - this
 * page is the actual management tool: "I want to let this person retake
 * this challenge" or "I need to clear my own test answers while iterating
 * on a new question."
 */
export default async function AdminAnswersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { saved, error } = await searchParams;

  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      employee: { select: { displayName: true, email: true } },
      challenge: { select: { title: true, slug: true, answerType: true } },
    },
  });

  const rows: AnswerRow[] = submissions.map((s) => ({
    id: s.id,
    employeeName: s.employee.displayName,
    employeeEmail: s.employee.email,
    challengeTitle: s.challenge.title,
    challengeSlug: s.challenge.slug,
    answerType: s.challenge.answerType,
    status: s.status as AnswerRow["status"],
    xpAwarded: s.xpAwarded,
    attempts: s.attempts,
    answerRaw: s.answerRaw,
    submittedAt: formatDateTime(s.submittedAt),
  }));

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-2 font-display text-2xl font-semibold">Answers</h1>
      <p className="mb-6 text-sm text-brand-sand/50">
        Every answer any agent has submitted, across every challenge. Reset one to clear the XP it awarded and let
        that agent take the challenge again from scratch — handy both for genuine retakes and for clearing your
        own test answers while you&apos;re iterating on a new question.
      </p>
      {saved && <div className="mb-4 rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Reset.</div>}
      {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

      {rows.length === 0 ? (
        <p className="surface-card p-8 text-center text-brand-sand/50">Nobody has submitted an answer yet.</p>
      ) : (
        <AgentAnswersTable rows={rows} />
      )}
    </div>
  );
}
