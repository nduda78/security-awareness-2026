import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { upsertChallengeAction, deleteChallengeAction } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 16);
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
      />
    </div>
  );
}

function ChallengeForm({
  challenge,
}: {
  challenge?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    answerType: string;
    correctAnswer: string | null;
    choices: unknown;
    xpValue: number;
    isActive: boolean;
    opensAt: Date | null;
    closesAt: Date | null;
  };
}) {
  const choicesText = Array.isArray(challenge?.choices) ? (challenge!.choices as string[]).join("\n") : "";
  return (
    <form action={upsertChallengeAction} className="mt-4 space-y-3">
      {challenge && <input type="hidden" name="id" value={challenge.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Slug (URL-safe)" name="slug" defaultValue={challenge?.slug} required />
        <Field label="XP value" name="xpValue" type="number" defaultValue={String(challenge?.xpValue ?? 50)} required />
      </div>
      <Field label="Title" name="title" defaultValue={challenge?.title} required />
      <div>
        <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={challenge?.description}
          className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">Answer type</label>
          <select
            name="answerType"
            defaultValue={challenge?.answerType ?? "EXACT"}
            className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="EXACT">Exact match</option>
            <option value="CASE_INSENSITIVE">Case-insensitive match</option>
            <option value="MULTIPLE_CHOICE">Multiple choice</option>
            <option value="FREE_TEXT_REVIEW">Free text (manual review)</option>
          </select>
        </div>
        <Field
          label="Correct answer (blank for review type)"
          name="correctAnswer"
          defaultValue={challenge?.correctAnswer ?? ""}
        />
      </div>
      <div>
        <label className="mb-1 block font-terminal text-xs uppercase text-brand-sand/50">
          Choices (multiple choice only, one per line)
        </label>
        <textarea
          name="choices"
          rows={3}
          defaultValue={choicesText}
          className="w-full rounded-md border border-brand-sand/20 bg-black/30 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Opens at" name="opensAt" type="datetime-local" defaultValue={toInputDate(challenge?.opensAt ?? null)} />
        <Field label="Closes at" name="closesAt" type="datetime-local" defaultValue={toInputDate(challenge?.closesAt ?? null)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={challenge?.isActive ?? true} />
        Active
      </label>
      <button className="rounded-md bg-brand-light-green px-4 py-2 font-terminal text-xs uppercase text-brand-dark-green">
        Save challenge
      </button>
    </form>
  );
}

export default async function AdminChallengesPage() {
  if (!(await isAdminSession())) redirect("/admin");

  const challenges = await prisma.challenge.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <AdminNav />
      <h2 className="mb-6 text-2xl font-bold">Challenges</h2>

      <details className="mb-8 rounded-md border border-brand-sand/15 bg-black/20 p-4">
        <summary className="cursor-pointer font-terminal text-sm uppercase text-brand-yellow">
          + New Challenge
        </summary>
        <ChallengeForm />
      </details>

      <div className="space-y-4">
        {challenges.map((c) => (
          <details key={c.id} className="rounded-md border border-brand-sand/15 bg-black/20 p-4">
            <summary className="flex cursor-pointer items-center justify-between font-medium">
              <span>
                {c.title} <span className="font-terminal text-xs text-brand-yellow">+{c.xpValue} XP</span>{" "}
                {!c.isActive && <span className="font-terminal text-xs text-brand-sand/40">(inactive)</span>}
              </span>
              <span className="font-terminal text-xs text-brand-sand/40">/{c.slug}</span>
            </summary>
            <ChallengeForm challenge={c} />
            <form action={deleteChallengeAction} className="mt-2">
              <input type="hidden" name="id" value={c.id} />
              <button className="font-terminal text-xs uppercase text-brand-red hover:underline">
                Delete challenge
              </button>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}
