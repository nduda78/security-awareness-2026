import { notFound } from "next/navigation";
import { buildAgentRoster, overallRank, rankWithinTier } from "@/lib/leaderboard";
import { toClientCard } from "@/lib/client-types";
import { resolveUniqueCodenames } from "@/lib/identity";
import { getUnlockedFlareOptions } from "@/lib/rewards";
import { prisma } from "@/lib/prisma";
import { getAgentIdentity } from "@/lib/session";
import { ProfileBadgeWithDownload } from "@/components/ProfileBadgeWithDownload";
import { Icon } from "@/components/Icon";
import { uploadPhotoAction, removePhotoAction } from "@/lib/actions/photo";
import { PhotoUploader } from "@/components/PhotoUploader";
import { SelfFlareEditor } from "@/components/SelfFlareEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<{
    photoError?: string;
    photoUploaded?: string;
    photoRemoved?: string;
    flareSaved?: string;
    flareRejected?: string;
  }>;
}) {
  const { email: emailParam } = await params;
  const email = decodeURIComponent(emailParam).toLowerCase();
  const { photoError, photoUploaded, photoRemoved, flareSaved, flareRejected } = await searchParams;

  const roster = await buildAgentRoster();
  const card = roster.find((c) => c.email === email);
  if (!card) notFound();

  const identity = await getAgentIdentity();
  const isOwnProfile = identity?.email === email;

  const { rank: overall, total: overallTotal } = overallRank(roster, email);
  const { rank: tierRank, total: tierTotal } = rankWithinTier(roster, card);
  const clientCard = toClientCard(card, tierRank, tierTotal);

  const employee = await prisma.employee.findUnique({ where: { email } });
  const submissions = employee
    ? await prisma.submission.findMany({
        where: { employeeId: employee.id, status: { in: ["CORRECT", "PENDING_REVIEW"] } },
        include: { challenge: true },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  const unlockedFlare = isOwnProfile && employee ? await getUnlockedFlareOptions(employee.id) : null;
  let defaultCodename = clientCard.codename;
  if (isOwnProfile) {
    const emailsInStableOrder = roster.map((c) => c.email).sort();
    defaultCodename = resolveUniqueCodenames(emailsInStableOrder, new Map()).get(email) ?? clientCard.codename;
  }

  return (
    <div className="fade-in-up space-y-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="w-full max-w-[420px] shrink-0">
          <ProfileBadgeWithDownload card={clientCard} showProfileLink={!isOwnProfile} />
        </div>
        <div className="w-full">
          <div className="section-eyebrow mb-1">Personnel Record</div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{card.renderedName}</h1>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total XP" value={String(card.xp)} accent="var(--brand-yellow)" />
            <Stat label="Overall Rank" value={`#${overall} / ${overallTotal}`} />
            <Stat label={`Rank in ${card.tier.shortLabel}`} value={`#${tierRank} / ${tierTotal}`} />
            <Stat label="Challenges Done" value={String(card.challengesCompleted)} accent="var(--brand-light-green)" />
          </div>

          <div className="surface-card mt-4 p-5">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-brand-sand/70">
              Progress
            </h3>
            {card.progress.next ? (
              <>
                <div className="mb-2 flex justify-between font-terminal text-xs uppercase tracking-wide">
                  <span style={{ color: card.tier.color }}>{card.tier.label}</span>
                  <span className="text-brand-sand/50">{card.progress.next.label}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${card.progress.progressPct}%`,
                      background: `linear-gradient(90deg, ${card.tier.color}, ${card.progress.next.color})`,
                    }}
                  />
                </div>
                <div className="mt-2 text-sm text-brand-sand/55">
                  {card.progress.xpToNext} XP to {card.progress.next.label}
                </div>
              </>
            ) : (
              <div className="text-sm text-brand-sand/55">
                {card.tier.key === "ROGUE" ? "Off the grid. No further progress tracked." : "Maximum clearance reached."}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {card.flare?.achievements.length ? (
              <div className="surface-card p-4">
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-brand-sand/70">
                  Achievements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {card.flare.achievements.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-1.5 text-sm text-brand-yellow"
                    >
                      <Icon name="trophy" className="h-4 w-4" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {isOwnProfile && (
              <div className="surface-card p-4">
                <h3 className="mb-3 flex items-center gap-2 font-terminal text-xs uppercase tracking-wide text-brand-sand/50">
                  <Icon name="lock" className="h-3.5 w-3.5" />
                  Badge Photo
                </h3>
                {photoUploaded === "1" && (
                  <div className="mb-3 rounded-lg bg-brand-light-green/15 p-2.5 text-xs text-brand-light-green">
                    Photo updated.
                  </div>
                )}
                {photoRemoved === "1" && (
                  <div className="mb-3 rounded-lg bg-brand-sand/10 p-2.5 text-xs text-brand-sand/60">
                    Photo removed.
                  </div>
                )}
                {photoError && (
                  <div className="mb-3 rounded-lg bg-brand-red/15 p-2.5 text-xs text-brand-red">{photoError}</div>
                )}
                <PhotoUploader
                  uploadAction={uploadPhotoAction}
                  removeAction={removePhotoAction}
                  hasPhoto={!!clientCard.photoUrl}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-brand-sand/70">
            Challenge History
          </h3>
          {submissions.length === 0 ? (
            <p className="surface-card p-4 text-sm text-brand-sand/50">No challenges completed yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <div key={s.id} className="surface-card flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-brand-sand">{s.challenge.title}</div>
                    <div className="text-xs text-brand-sand/45">
                      {s.submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="font-terminal text-xs font-semibold">
                    {s.status === "CORRECT" ? (
                      <span className="text-brand-light-green">+{s.xpAwarded} XP</span>
                    ) : (
                      <span className="text-brand-yellow">pending review</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && unlockedFlare && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-brand-sand/70">
            <Icon name="trophy" className="h-4 w-4" />
            Customize Agent Badge
          </h3>
          <SelfFlareEditor
            baseCard={clientCard}
            defaultCodename={defaultCodename}
            passthrough={{
              achievements: card.flare?.achievements ?? [],
              motto: card.flare?.motto ?? null,
              codenameOverride: card.flare?.codenameOverride ?? null,
            }}
            initial={{
              backgroundEffect: card.flare?.backgroundEffect ?? "",
              borderStyle: card.flare?.borderStyle ?? "",
              iconOverride: card.flare?.iconOverride ?? "",
              ribbonText: card.flare?.ribbonText ?? "",
              nameSuffix: card.flare?.nameSuffix ?? "",
              outlineColor: card.flare?.outlineColor ?? "",
              backgroundColor: card.flare?.backgroundColor ?? "",
            }}
            unlocked={unlockedFlare}
            status={{ saved: flareSaved === "1", rejectedFields: flareRejected ? flareRejected.split(",") : [] }}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="surface-card p-3.5">
      <div className="font-terminal text-[10px] uppercase tracking-wide text-brand-sand/40">{label}</div>
      <div className="font-display text-lg font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}
