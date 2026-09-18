import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { buildAgentRoster, rankWithinTier } from "@/lib/leaderboard";
import { resolveUniqueCodenames } from "@/lib/identity";
import { toClientCard } from "@/lib/client-types";
import { FlareEditor } from "@/components/FlareEditor";
import { parseAchievements, formatAchievementsForInput } from "@/lib/flare";
import { toggleHiddenAction } from "@/lib/actions/admin";
import { toEasternInputValue } from "@/lib/easternTime";

export const dynamic = "force-dynamic";

export default async function AdminFlarePage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    saved?: string;
    error?: string;
    photoUploaded?: string;
    photoRemoved?: string;
    photoError?: string;
  }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { email: selectedEmail, saved, error, photoUploaded, photoRemoved, photoError } = await searchParams;

  const employees = await prisma.employee.findMany({ orderBy: { displayName: "asc" }, include: { flare: true } });
  const selected = selectedEmail ? employees.find((e) => e.email === selectedEmail.toLowerCase()) : undefined;

  let editorProps: { baseCard: ReturnType<typeof toClientCard>; defaultCodename: string } | null = null;
  if (selected) {
    const roster = await buildAgentRoster();
    const agentCard = roster.find((c) => c.email === selected.email);
    if (agentCard) {
      const { rank, total } = rankWithinTier(roster, agentCard);
      const baseCard = toClientCard(agentCard, rank, total);

      // What this employee's codename would be with NO admin override —
      // needed so the live preview can correctly fall back to it if the
      // override field is cleared or the whole flare has expired.
      const emailsInStableOrder = roster.map((c) => c.email).sort();
      const defaultCodenames = resolveUniqueCodenames(emailsInStableOrder, new Map());
      const defaultCodename = defaultCodenames.get(selected.email) ?? baseCard.codename;

      editorProps = { baseCard, defaultCodename };
    }
  }

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Badge Flare</h1>
      {saved && (
        <div className="mb-4 rounded-xl bg-brand-light-green/15 p-3 text-sm text-brand-light-green">Saved.</div>
      )}
      {error && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{error}</div>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="surface-card space-y-1 p-2">
          {employees.map((e) => (
            <a
              key={e.email}
              href={`/admin/flare?email=${encodeURIComponent(e.email)}`}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                selected?.email === e.email
                  ? "bg-brand-purple/25 text-brand-sand"
                  : "text-brand-sand/70 hover:bg-brand-sand/5 hover:text-brand-sand"
              }`}
            >
              {e.displayName}
              {e.flare && <span className="ml-2 text-brand-yellow">●</span>}
              {e.isHidden && (
                <span className="ml-2 font-terminal text-[9px] uppercase tracking-wide text-brand-cyan/70">hidden</span>
              )}
            </a>
          ))}
        </div>

        <div>
          {selected && (
            <form
              action={toggleHiddenAction}
              className="surface-card mb-4 flex items-center justify-between gap-3 p-3"
            >
              <div>
                <p className="font-terminal text-xs uppercase tracking-wide text-brand-cyan">
                  Hide from Leaderboard
                </p>
                <p className="mt-0.5 text-[11px] text-brand-sand/45">
                  Handy for building a “prop” agent (custom flare, fake stats) you want to reveal on your own
                  schedule — hidden agents don&apos;t count toward anyone else&apos;s rank either.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <input type="hidden" name="email" value={selected.email} />
                <input type="checkbox" name="hidden" defaultChecked={selected.isHidden} className="accent-brand-cyan" />
                <button className="btn-secondary !border-brand-cyan/30 !px-2 !py-0.5 !text-[10px] !text-brand-cyan">
                  Save
                </button>
              </div>
            </form>
          )}
          {!selected || !editorProps ? (
            <p className="text-sm text-brand-sand/50">Pick an agent on the left to edit their flare.</p>
          ) : (
            <FlareEditor
              email={selected.email}
              baseCard={editorProps.baseCard}
              defaultCodename={editorProps.defaultCodename}
              photoStatus={{ uploaded: photoUploaded === "1", removed: photoRemoved === "1", error: photoError }}
              initial={{
                achievements: formatAchievementsForInput(parseAchievements(selected.flare?.achievements)),
                outlineColor: selected.flare?.outlineColor ?? "",
                backgroundColor: selected.flare?.backgroundColor ?? "",
                backgroundEffect: selected.flare?.backgroundEffect ?? "",
                borderStyle: selected.flare?.borderStyle ?? "",
                iconOverride: selected.flare?.iconOverride ?? "",
                ribbonText: selected.flare?.ribbonText ?? "",
                codenameOverride: selected.flare?.codenameOverride ?? "",
                motto: selected.flare?.motto ?? "",
                nameSuffix: selected.flare?.nameSuffix ?? "",
                secretBackText: selected.flare?.secretBackText ?? "",
                holoSheen: selected.flare?.holoSheen ?? false,
                psaGrade: selected.flare?.psaGrade ?? false,
                process420: selected.flare?.process420 ?? false,
                expiresAt: selected.flare?.expiresAt ? toEasternInputValue(selected.flare.expiresAt) : "",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
