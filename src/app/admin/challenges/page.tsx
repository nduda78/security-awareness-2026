import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { upsertChallengeAction, deleteChallengeAction } from "@/lib/actions/admin";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS } from "@/lib/flare";
import { AssetUploader } from "@/components/AssetUploader";
import { ChallengeFileField } from "@/components/ChallengeFileField";
import { RewardModeProvider, RewardModeSelect, UnlockOnly } from "@/components/RewardModeContext";
import { AnswerTypeProvider, AnswerTypeSelect, ConnectionsOnly } from "@/components/AnswerTypeContext";
import { TIERS } from "@/lib/tiers";
import { Icon } from "@/components/Icon";
import type { IconKey } from "@/lib/flare";
import { toEasternInputValue, formatEasternDateTime } from "@/lib/easternTime";
import { AdminScheduleCalendar, type ScheduleEvent } from "@/components/AdminScheduleCalendar";
import { parseConnectionsGroups } from "@/lib/connections";

export const dynamic = "force-dynamic";

function rewardTags(c: {
  rewardBackgroundEffect: string | null;
  rewardBorderStyle: string | null;
  rewardIcon: string | null;
  rewardRibbonText: string | null;
  rewardNameSuffix: string | null;
  rewardOutlineColorPicker: boolean;
  rewardBackgroundColorPicker: boolean;
  rewardPrize: string | null;
}): string[] {
  const tags: string[] = [];
  if (c.rewardBackgroundEffect) tags.push(`${c.rewardBackgroundEffect} bg`);
  if (c.rewardBorderStyle) tags.push(`${c.rewardBorderStyle} border`);
  if (c.rewardIcon) tags.push(`${c.rewardIcon} icon`);
  if (c.rewardRibbonText) tags.push(`"${c.rewardRibbonText}" ribbon`);
  if (c.rewardNameSuffix) tags.push(`"${c.rewardNameSuffix}" suffix`);
  if (c.rewardOutlineColorPicker) tags.push("outline color picker");
  if (c.rewardBackgroundColorPicker) tags.push("background color picker");
  if (c.rewardPrize) tags.push(c.rewardPrize);
  return tags;
}

function unlockTags(c: {
  unlockAudioMimeType: string | null;
  unlockText: string | null;
  unlockLinkUrl: string | null;
  unlockImageMimeType: string | null;
  unlockVideoMimeType: string | null;
}): string[] {
  const tags: string[] = [];
  if (c.unlockAudioMimeType) tags.push("audio");
  if (c.unlockText) tags.push("text");
  if (c.unlockLinkUrl) tags.push("link");
  if (c.unlockImageMimeType) tags.push("image");
  if (c.unlockVideoMimeType) tags.push("video");
  return tags;
}

// Was a naive d.toISOString().slice(0,16), which silently rendered/parsed
// the input in UTC (or whatever the browser's own local zone happened to
// be) - ambiguous for an admin who has no idea what "14:47" even means.
// toEasternInputValue always shows/expects Eastern wall-clock time, and
// the "(Eastern Time)" field labels below make that explicit.

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="input-modern w-full"
      />
    </div>
  );
}



function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <select name={name} defaultValue={defaultValue ?? ""} className="input-modern w-full">
        <option value="">(none)</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
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
    maxAttempts?: number | null;
    minClearance?: string;
    rewardBackgroundEffect: string | null;
    rewardBorderStyle: string | null;
    rewardIcon: string | null;
    rewardRibbonText: string | null;
    rewardNameSuffix: string | null;
    rewardOutlineColorPicker?: boolean;
    rewardBackgroundColorPicker?: boolean;
    rewardPrize: string | null;
    rewardMode?: string;
    questionImageMimeType?: string | null;
    unlockAudioMimeType?: string | null;
    unlockText?: string | null;
    unlockLinkUrl?: string | null;
    unlockLinkLabel?: string | null;
    unlockImageMimeType?: string | null;
    unlockVideoMimeType?: string | null;
    isActive: boolean;
    opensAt: Date | null;
    closesAt: Date | null;
    webhookUrl?: string | null;
  };
}) {
  const parsedChoices: unknown = typeof challenge?.choices === "string" ? JSON.parse(challenge.choices) : null;
  const choicesText = Array.isArray(parsedChoices) ? (parsedChoices as string[]).join("\n") : "";
  const connectionsGroups =
    challenge?.answerType === "CONNECTIONS" ? parseConnectionsGroups(challenge.correctAnswer) : [];
  const CONNECTIONS_GROUP_PLACEHOLDERS = ["MFA Methods", "Chat Apps", "Phishing Variants", "Access Tools"];
  return (
    <form action={upsertChallengeAction} className="mt-4 space-y-4">
      <RewardModeProvider defaultValue={challenge?.rewardMode ?? "XP"}>
      <AnswerTypeProvider defaultValue={challenge?.answerType ?? "EXACT"}>
      {challenge && <input type="hidden" name="id" value={challenge.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Slug (URL-safe)" name="slug" defaultValue={challenge?.slug} required />
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Reward mode</label>
          <RewardModeSelect />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
          Who can see this (minimum clearance)
        </label>
        <select name="minClearance" defaultValue={challenge?.minClearance ?? "UNCLASSIFIED"} className="input-modern w-full">
          <option value="UNCLASSIFIED">Unclassified (and any level higher)</option>
          <option value="SECRET">Secret (and any level higher)</option>
          <option value="TOP_SECRET">Top Secret (and any level higher)</option>
          <option value="ROGUE">Rogue only (standalone — not part of the ladder)</option>
        </select>
        <p className="mt-1 text-[11px] text-brand-sand/35">
          Unclassified/Secret/Top Secret form a ladder — anyone at or above the chosen level sees it. Rogue is its
          own separate flag: a Rogue-only challenge is visible only to Rogue-flagged employees, regardless of their
          real XP tier.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="XP value (ignored for Unlock mode)" name="xpValue" type="number" defaultValue={String(challenge?.xpValue ?? 50)} required />
        {challenge ? (
          <AssetUploader
            challengeId={challenge.id}
            field="questionImage"
            label="Question image (optional, any challenge)"
            accept="image/*"
            kind="image"
            currentUrl={`/api/challenge-asset/${challenge.id}/question-image`}
            hasCurrent={!!challenge?.questionImageMimeType}
            hint="Shown above the answer form — e.g. a phishing screenshot to inspect. Uploads immediately, separately from Save."
          />
        ) : (
          <ChallengeFileField
            label="Question image (optional, any challenge)"
            name="questionImage"
            removeName="questionImageRemove"
            accept="image/*"
            hint="Shown above the answer form — e.g. a phishing screenshot to inspect. Save the challenge first, then add media via edit for more reliable uploads."
          />
        )}
      </div>

      <UnlockOnly>
      <div className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/[0.04] p-3">
        <div className="mb-3 font-terminal text-xs uppercase text-brand-cyan">
          Unlock content (Unlock mode only)
        </div>
        <p className="mb-3 text-[11px] text-brand-sand/35">
          Revealed immediately on a correct answer, in any combination. Unlock-mode challenges allow
          unlimited attempts — there&apos;s no XP at stake, so a wrong guess just lets them try again.
        </p>
        {challenge ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AssetUploader
              challengeId={challenge.id}
              field="unlockAudio"
              label="Audio"
              accept="audio/*"
              kind="audio"
              currentUrl={`/api/challenge-asset/${challenge.id}/unlock-audio`}
              hasCurrent={!!challenge?.unlockAudioMimeType}
            />
            <AssetUploader
              challengeId={challenge.id}
              field="unlockImage"
              label="Image"
              accept="image/*"
              kind="image"
              currentUrl={`/api/challenge-asset/${challenge.id}/unlock-image`}
              hasCurrent={!!challenge?.unlockImageMimeType}
            />
            <AssetUploader
              challengeId={challenge.id}
              field="unlockVideo"
              label="Video"
              accept="video/*"
              kind="video"
              currentUrl={`/api/challenge-asset/${challenge.id}/unlock-video`}
              hasCurrent={!!challenge?.unlockVideoMimeType}
              hint="MP4, WebM, or MOV — up to 20MB. Uploads immediately with a progress bar, separately from Save."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ChallengeFileField label="Audio" name="unlockAudio" removeName="unlockAudioRemove" accept="audio/*" />
            <ChallengeFileField label="Image" name="unlockImage" removeName="unlockImageRemove" accept="image/*" />
            <ChallengeFileField
              label="Video"
              name="unlockVideo"
              removeName="unlockVideoRemove"
              accept="video/*"
              hint="MP4, WebM, or MOV — up to 20MB. Save the challenge first, then add media via edit for more reliable uploads."
            />
          </div>
        )}
        <div className="mt-3">
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Text</label>
          <textarea
            name="unlockText"
            rows={2}
            defaultValue={challenge?.unlockText ?? ""}
            className="input-modern w-full"
            placeholder="Whatever you want to reveal — a clue, an explanation, congratulations text…"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Link URL" name="unlockLinkUrl" defaultValue={challenge?.unlockLinkUrl ?? ""} placeholder="https://…" />
          <Field label="Link label" name="unlockLinkLabel" defaultValue={challenge?.unlockLinkLabel ?? ""} placeholder="View the doc" />
        </div>
      </div>
      </UnlockOnly>

      <div className="rounded-lg border border-brand-purple/25 bg-brand-purple/[0.04] p-3">
        <div className="mb-3 font-terminal text-xs uppercase text-brand-purple">Badge flare reward</div>
        <p className="mb-3 text-[11px] text-brand-sand/35">
          Advertised on the challenge — the same fields as Badge Flare. Whatever&apos;s set here unlocks
          automatically for anyone who completes this challenge; they still choose whether to actually
          equip it themselves, on their own profile.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Background effect"
            name="rewardBackgroundEffect"
            defaultValue={challenge?.rewardBackgroundEffect ?? ""}
            options={BACKGROUND_EFFECTS}
          />
          <SelectField
            label="Border style"
            name="rewardBorderStyle"
            defaultValue={challenge?.rewardBorderStyle ?? ""}
            options={BORDER_STYLES}
          />
          <SelectField
            label="Icon"
            name="rewardIcon"
            defaultValue={challenge?.rewardIcon ?? ""}
            options={ICONS}
          />
          <Field
            label="Ribbon text"
            name="rewardRibbonText"
            defaultValue={challenge?.rewardRibbonText ?? ""}
            placeholder="Gold, Platinum, Diamond, or your own"
          />
          <Field
            label="Name suffix"
            name="rewardNameSuffix"
            defaultValue={challenge?.rewardNameSuffix ?? ""}
            placeholder="the Vigilant"
          />
          <label className="flex items-center gap-2 text-sm text-brand-sand/70">
            <input
              type="checkbox"
              name="rewardOutlineColorPicker"
              defaultChecked={challenge?.rewardOutlineColorPicker ?? false}
              className="accent-brand-cyan"
            />
            Unlocks: choose your own outline color
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-sand/70">
            <input
              type="checkbox"
              name="rewardBackgroundColorPicker"
              defaultChecked={challenge?.rewardBackgroundColorPicker ?? false}
              className="accent-brand-cyan"
            />
            Unlocks: choose your own background color
          </label>
          <Field
            label="Other prize"
            name="rewardPrize"
            defaultValue={challenge?.rewardPrize ?? ""}
            placeholder="Company hoodie, gift card, extra PTO day…"
          />
        </div>
      </div>
      <Field label="Title" name="title" defaultValue={challenge?.title} required />
      <div>
        <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Description</label>
        <textarea name="description" rows={3} defaultValue={challenge?.description} className="input-modern w-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Answer type</label>
          <AnswerTypeSelect />
          <p className="mt-1 text-[11px] text-brand-sand/35">
            Contains: correct if the submitted answer includes this text anywhere (case-insensitive). Regex: this
            field is a JS regex pattern (no slashes/flags) tested case-insensitively against the submitted answer.
            Security Connections ignores Correct answer/Choices below entirely — configure its 4 groups further down.
          </p>
        </div>
        <Field
          label="Correct answer (blank for review type)"
          name="correctAnswer"
          defaultValue={challenge?.correctAnswer ?? ""}
          placeholder="e.g. phishing, or a pattern like ^\\d{4}$ for Regex"
        />
      </div>
      <div>
        <Field
          label="Max attempts (blank = unlimited)"
          name="maxAttempts"
          type="number"
          defaultValue={challenge?.maxAttempts != null ? String(challenge.maxAttempts) : ""}
          placeholder="e.g. 5"
        />
        <p className="mt-1 text-[11px] text-brand-sand/35">
          How many times someone can (re)submit before it's permanently marked failed. Leave blank for
          unlimited retries. Ignored for Free text (manual review) — that type is always one-shot regardless.
          For Security Connections, this instead caps how many <em>wrong group guesses</em> are allowed before
          the puzzle locks — blank = unlimited guesses.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
          Choices (multiple choice only, one per line)
        </label>
        <textarea name="choices" rows={3} defaultValue={choicesText} className="input-modern w-full" />
      </div>
      <ConnectionsOnly>
        <div className="surface-card space-y-3 p-4">
          <div className="font-terminal text-xs uppercase text-brand-cyan/70">Security Connections groups</div>
          <p className="text-[11px] text-brand-sand/35">
            Exactly 4 groups, exactly 4 words each, all 16 words unique. The grid order players see is shuffled
            fresh every time this challenge is saved.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Field
                  label={`Group ${i + 1} label`}
                  name={`connGroup${i + 1}Label`}
                  defaultValue={connectionsGroups[i]?.label ?? ""}
                  placeholder={`e.g. ${CONNECTIONS_GROUP_PLACEHOLDERS[i]}`}
                />
                <div>
                  <label className="mb-1.5 block font-terminal text-[11px] uppercase text-brand-sand/40">
                    Words (one per line, exactly 4)
                  </label>
                  <textarea
                    name={`connGroup${i + 1}Words`}
                    rows={4}
                    defaultValue={connectionsGroups[i]?.words.join("\n") ?? ""}
                    className="input-modern w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ConnectionsOnly>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Opens at (Eastern Time)"
          name="opensAt"
          type="datetime-local"
          defaultValue={toEasternInputValue(challenge?.opensAt ?? null)}
        />
        <Field
          label="Closes at (Eastern Time)"
          name="closesAt"
          type="datetime-local"
          defaultValue={toEasternInputValue(challenge?.closesAt ?? null)}
        />
      </div>
      <div>
        <Field
          label="Webhook URL (optional)"
          name="webhookUrl"
          type="url"
          defaultValue={challenge?.webhookUrl ?? ""}
          placeholder="https://your-tines-webhook-url..."
        />
        <p className="mt-1 text-[11px] text-brand-sand/35">
          Two events POST here: once when the challenge itself becomes available (immediately, or exactly
          when its Opens At time arrives if scheduled), and once per agent who actually completes it. Leave
          blank to send nothing.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-sand/70">
        <input type="checkbox" name="isActive" defaultChecked={challenge?.isActive ?? true} className="accent-brand-light-green" />
        Active
      </label>
      <button className="btn-primary">Save challenge</button>
      </AnswerTypeProvider>
      </RewardModeProvider>
    </form>
  );
}

// One classification area (mirrors the public Challenges page's section
// headers: icon + color + label + a divider + a count) wrapped in its own
// <details> so the whole area can be collapsed independently of the
// individual challenge rows inside it.
function ChallengeGroup({
  icon,
  color,
  label,
  count,
  defaultOpen = true,
  children,
}: {
  icon: IconKey;
  color: string;
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="mb-3 flex cursor-pointer items-center gap-2.5 py-1">
        <Icon name={icon} className="h-4 w-4" style={{ color }} />
        <h2 className="font-terminal text-sm font-semibold uppercase tracking-widest" style={{ color }}>
          {label}
        </h2>
        <div className="h-px flex-1 bg-brand-sand/10" />
        <span className="font-terminal text-[11px] text-brand-sand/35">{count}</span>
      </summary>
      <div className="space-y-3 pb-2">{children}</div>
    </details>
  );
}

/**
 * Same button-badge visual language as the real Challenges page's
 * Completed/Under Review/Out of Attempts pills - shown only when either
 * Opens At or Closes At is actually set, and reflects the CURRENT state
 * against real time (this page is force-dynamic, so it's evaluated fresh
 * on every load): not yet reached its opens-at is "Scheduled", already
 * past its closes-at is "Closed", and everything else time-gated but
 * currently reachable is "Live".
 */
function SchedulePill({
  isActive,
  opensAt,
  closesAt,
}: {
  isActive: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
}) {
  if (!isActive) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-brand-sand/25 bg-brand-sand/15 px-2 py-0.5 font-terminal text-[10px] font-bold uppercase tracking-wide text-brand-sand/60">
        <span>○</span>
        Inactive
      </span>
    );
  }
  const now = new Date();
  const notYetOpen = opensAt && opensAt > now;
  const closed = closesAt && closesAt < now;

  const title = [
    opensAt ? `Opens ${formatEasternDateTime(opensAt)}` : null,
    closesAt ? `Closes ${formatEasternDateTime(closesAt)}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  if (notYetOpen) {
    return (
      <span
        className="ml-1 inline-flex items-center gap-1 rounded-full border border-brand-cyan/50 bg-brand-cyan px-2 py-0.5 font-terminal text-[10px] font-bold uppercase tracking-wide text-brand-dark-green"
        title={title}
      >
        <span>⏰</span>
        Scheduled
      </span>
    );
  }
  if (closed) {
    return (
      <span
        className="ml-1 inline-flex items-center gap-1 rounded-full border border-brand-red/50 bg-brand-red px-2 py-0.5 font-terminal text-[10px] font-bold uppercase tracking-wide text-white"
        title={title}
      >
        <span>✗</span>
        Closed
      </span>
    );
  }
  return (
    <span
      className="ml-1 inline-flex items-center gap-1 rounded-full border border-brand-light-green/50 bg-brand-light-green px-2 py-0.5 font-terminal text-[10px] font-bold uppercase tracking-wide text-brand-dark-green"
      title={title}
    >
      <span>●</span>
      Live
    </span>
  );
}

function ChallengeRow({ c }: { c: Required<NonNullable<Parameters<typeof ChallengeForm>[0]["challenge"]>> }) {
  return (
    <details id={`challenge-${c.slug}`} className="surface-card scroll-mt-24 p-4">
      <summary className="flex cursor-pointer items-center justify-between font-medium">
        <span>
          {c.title}{" "}
          {c.rewardMode === "UNLOCK" ? (
            <span className="font-terminal text-xs text-brand-cyan">
              unlocks: {unlockTags(c).join(", ") || "nothing set yet"}
            </span>
          ) : (
            <span className="font-terminal text-xs text-brand-yellow">+{c.xpValue} XP</span>
          )}{" "}
          {rewardTags(c).map((tag, i) => (
            <span key={i} className="font-terminal text-xs text-brand-purple">
              {" "}
              • {tag}
            </span>
          ))}{" "}
          <SchedulePill isActive={c.isActive} opensAt={c.opensAt} closesAt={c.closesAt} />
        </span>
        <span className="font-terminal text-xs text-brand-sand/40">/{c.slug}</span>
      </summary>
      <ChallengeForm challenge={c} />
      <form action={deleteChallengeAction} className="mt-3">
        <input type="hidden" name="id" value={c.id} />
        <button className="font-terminal text-xs uppercase text-brand-red hover:underline">
          Delete challenge
        </button>
      </form>
    </details>
  );
}

export default async function AdminChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string }>;
}) {
  if (!(await isAdminSession())) redirect("/admin");
  const { cal } = await searchParams;

  // Explicit select excludes the bytea asset columns (questionImage,
  // unlockImage, unlockAudio) — this list only needs to know whether one is
  // set (via its mimeType sibling), not the actual bytes.
  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      answerType: true,
      correctAnswer: true,
      choices: true,
      xpValue: true,
      maxAttempts: true,
      rewardMode: true,
      minClearance: true,
      questionImageMimeType: true,
      unlockAudioMimeType: true,
      unlockText: true,
      unlockLinkUrl: true,
      unlockLinkLabel: true,
      unlockImageMimeType: true,
      unlockVideoMimeType: true,
      rewardBackgroundEffect: true,
      rewardBorderStyle: true,
      rewardIcon: true,
      rewardRibbonText: true,
      rewardNameSuffix: true,
      rewardOutlineColorPicker: true,
      rewardBackgroundColorPicker: true,
      rewardPrize: true,
      isActive: true,
      opensAt: true,
      closesAt: true,
      webhookUrl: true,
      createdAt: true,
    },
  });

  // Manual Bonus challenges (see grantManualXpAction) are synthetic,
  // per-employee, inactive audit records - not real missions anyone
  // browses or attempts - so they get pulled out of the normal clearance
  // grouping entirely into their own always-there-but-collapsed area,
  // rather than cluttering up whichever tier they happened to default to.
  const isManualBonus = (c: (typeof challenges)[number]) => c.slug.startsWith("manual-bonus-");
  const manualBonusChallenges = challenges.filter(isManualBonus);
  const regularChallenges = challenges.filter((c) => !isManualBonus(c));

  const infoChallenges = regularChallenges.filter((c) => c.rewardMode === "UNLOCK");
  const xpChallenges = regularChallenges.filter((c) => c.rewardMode !== "UNLOCK");

  const tierGroups = [...TIERS]
    .sort((a, b) => a.order - b.order)
    .map((tier) => ({ tier, members: xpChallenges.filter((c) => c.minClearance === tier.key) }))
    .filter((g) => g.members.length > 0);

  // Manual Bonus challenges are excluded - they're synthetic per-employee
  // audit records, not real scheduled missions anyone would look for on a
  // calendar.
  const scheduleEvents: ScheduleEvent[] = regularChallenges.flatMap((c) => {
    const list: ScheduleEvent[] = [];
    if (c.opensAt) list.push({ slug: c.slug, title: c.title, kind: "opens", at: c.opensAt });
    if (c.closesAt) list.push({ slug: c.slug, title: c.title, kind: "closes", at: c.closesAt });
    return list;
  });

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Challenges</h1>

      <AdminScheduleCalendar events={scheduleEvents} cal={cal} />

      <details className="surface-card group mb-8 p-4 open:border-brand-yellow/30">
        <summary className="cursor-pointer font-terminal text-sm uppercase text-brand-yellow">
          + New Challenge
        </summary>
        <ChallengeForm />
      </details>

      <div className="space-y-8">
        {tierGroups.map(({ tier, members }) => (
          <ChallengeGroup
            key={tier.key}
            icon={tier.icon as IconKey}
            color={tier.color}
            label={`${tier.label} Clearance`}
            count={members.length}
          >
            {members.map((c) => (
              <ChallengeRow key={c.id} c={c} />
            ))}
          </ChallengeGroup>
        ))}

        {infoChallenges.length > 0 && (
          <ChallengeGroup icon="file" color="var(--brand-cyan)" label="Info" count={infoChallenges.length}>
            {infoChallenges.map((c) => (
              <ChallengeRow key={c.id} c={c} />
            ))}
          </ChallengeGroup>
        )}

        {manualBonusChallenges.length > 0 && (
          <ChallengeGroup
            icon="crown"
            color="var(--brand-purple)"
            label="Manual Bonus"
            count={manualBonusChallenges.length}
            defaultOpen={false}
          >
            {manualBonusChallenges.map((c) => (
              <ChallengeRow key={c.id} c={c} />
            ))}
          </ChallengeGroup>
        )}
      </div>
    </div>
  );
}
