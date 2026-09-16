import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";
import { upsertChallengeAction, deleteChallengeAction } from "@/lib/actions/admin";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS } from "@/lib/flare";
import { AssetUploader } from "@/components/AssetUploader";
import { ChallengeFileField } from "@/components/ChallengeFileField";
import { TIER_BY_KEY } from "@/lib/tiers";

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
  };
}) {
  const parsedChoices: unknown = typeof challenge?.choices === "string" ? JSON.parse(challenge.choices) : null;
  const choicesText = Array.isArray(parsedChoices) ? (parsedChoices as string[]).join("\n") : "";
  return (
    <form action={upsertChallengeAction} className="mt-4 space-y-4">
      {challenge && <input type="hidden" name="id" value={challenge.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Slug (URL-safe)" name="slug" defaultValue={challenge?.slug} required />
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Reward mode</label>
          <select name="rewardMode" defaultValue={challenge?.rewardMode ?? "XP"} className="input-modern w-full">
            <option value="XP">XP (+ optional badge flare / prize)</option>
            <option value="UNLOCK">Unlock content (no XP — reveals audio/text/link/image)</option>
          </select>
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
          <select name="answerType" defaultValue={challenge?.answerType ?? "EXACT"} className="input-modern w-full">
            <option value="EXACT">Exact match</option>
            <option value="CASE_INSENSITIVE">Case-insensitive match</option>
            <option value="CONTAINS">Contains (substring)</option>
            <option value="REGEX">Regex</option>
            <option value="MULTIPLE_CHOICE">Multiple choice</option>
            <option value="FREE_TEXT_REVIEW">Free text (manual review)</option>
          </select>
          <p className="mt-1 text-[11px] text-brand-sand/35">
            Contains: correct if the submitted answer includes this text anywhere (case-insensitive). Regex: this
            field is a JS regex pattern (no slashes/flags) tested case-insensitively against the submitted answer.
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
        <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
          Choices (multiple choice only, one per line)
        </label>
        <textarea name="choices" rows={3} defaultValue={choicesText} className="input-modern w-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Opens at" name="opensAt" type="datetime-local" defaultValue={toInputDate(challenge?.opensAt ?? null)} />
        <Field label="Closes at" name="closesAt" type="datetime-local" defaultValue={toInputDate(challenge?.closesAt ?? null)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-sand/70">
        <input type="checkbox" name="isActive" defaultChecked={challenge?.isActive ?? true} className="accent-brand-light-green" />
        Active
      </label>
      <button className="btn-primary">Save challenge</button>
    </form>
  );
}

export default async function AdminChallengesPage() {
  if (!(await isAdminSession())) redirect("/admin");

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
      createdAt: true,
    },
  });

  return (
    <div className="fade-in-up">
      <AdminNav />
      <h1 className="mb-6 font-display text-2xl font-semibold">Challenges</h1>

      <details className="surface-card group mb-8 p-4 open:border-brand-yellow/30">
        <summary className="cursor-pointer font-terminal text-sm uppercase text-brand-yellow">
          + New Challenge
        </summary>
        <ChallengeForm />
      </details>

      <div className="space-y-3">
        {challenges.map((c) => (
            <details key={c.id} className="surface-card p-4">
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
                <span
                  className="font-terminal text-xs"
                  style={{ color: TIER_BY_KEY[c.minClearance as keyof typeof TIER_BY_KEY]?.color }}
                >
                  • {TIER_BY_KEY[c.minClearance as keyof typeof TIER_BY_KEY]?.shortLabel ?? c.minClearance}
                  {c.minClearance !== "ROGUE" ? "+" : ""}
                </span>{" "}
                {rewardTags(c).map((tag, i) => (
                  <span key={i} className="font-terminal text-xs text-brand-purple">
                    {" "}
                    • {tag}
                  </span>
                ))}{" "}
                {!c.isActive && <span className="font-terminal text-xs text-brand-sand/40">(inactive)</span>}
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
        ))}
      </div>
    </div>
  );
}
