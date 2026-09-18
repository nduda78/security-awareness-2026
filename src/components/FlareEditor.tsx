"use client";

import { useMemo, useState } from "react";
import { upsertFlareAction, adminUploadPhotoAction, adminRemovePhotoAction } from "@/lib/actions/admin";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS, parseAchievementsInput } from "@/lib/flare";
import { applyFlareToCard, type ClientAgentCard } from "@/lib/client-types";
import { parseEasternInputValue } from "@/lib/easternTime";
import { ColorField } from "./ColorField";
import { BadgeCard, CardVisual, deriveBadgeVisualProps } from "./BadgeCard";
import { PhotoUploader } from "./PhotoUploader";

export function FlareEditor({
  email,
  baseCard,
  defaultCodename,
  photoStatus,
  initial,
}: {
  email: string;
  baseCard: ClientAgentCard;
  defaultCodename: string;
  photoStatus: { uploaded: boolean; removed: boolean; error?: string };
  initial: {
    achievements: string;
    outlineColor: string;
    backgroundColor: string;
    backgroundEffect: string;
    borderStyle: string;
    iconOverride: string;
    ribbonText: string;
    codenameOverride: string;
    motto: string;
    nameSuffix: string;
    secretBackText: string;
    holoSheen: boolean;
    psaGrade: boolean;
    process420: boolean;
    expiresAt: string;
  };
}) {
  const [achievements, setAchievements] = useState(initial.achievements);
  const [outlineColor, setOutlineColor] = useState(initial.outlineColor);
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor);
  const [backgroundEffect, setBackgroundEffect] = useState(initial.backgroundEffect);
  const [borderStyle, setBorderStyle] = useState(initial.borderStyle);
  const [iconOverride, setIconOverride] = useState(initial.iconOverride);
  const [ribbonText, setRibbonText] = useState(initial.ribbonText);
  const [codenameOverride, setCodenameOverride] = useState(initial.codenameOverride);
  const [motto, setMotto] = useState(initial.motto);
  const [nameSuffix, setNameSuffix] = useState(initial.nameSuffix);
  const [secretBackText, setSecretBackText] = useState(initial.secretBackText);
  const [holoSheen, setHoloSheen] = useState(initial.holoSheen);
  const [psaGrade, setPsaGrade] = useState(initial.psaGrade);
  const [process420, setProcess420] = useState(initial.process420);
  const [expiresAt, setExpiresAt] = useState(initial.expiresAt);

  const previewCard = useMemo(
    () =>
      applyFlareToCard(baseCard, defaultCodename, {
        achievements: parseAchievementsInput(achievements),
        outlineColor,
        backgroundColor,
        backgroundEffect,
        codenameOverride,
        motto,
        iconOverride,
        borderStyle,
        ribbonText,
        nameSuffix,
        secretBackText,
        holoSheen,
        psaGrade,
        process420,
        expiresAt: parseEasternInputValue(expiresAt),
      }),
    [
      baseCard,
      defaultCodename,
      achievements,
      outlineColor,
      backgroundColor,
      backgroundEffect,
      codenameOverride,
      motto,
      iconOverride,
      borderStyle,
      ribbonText,
      nameSuffix,
      secretBackText,
      holoSheen,
      psaGrade,
      process420,
      expiresAt,
    ]
  );

  const { outline, icon, isRogue } = deriveBadgeVisualProps(previewCard);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        {process420 && (
          <div className="mb-3 rounded-xl border border-brand-red/40 bg-brand-red/10 p-3 text-center font-terminal text-[11px] uppercase tracking-wide text-brand-red">
            Process 420 override active — every other flare field below is ignored
          </div>
        )}
        <div className="mb-2 font-terminal text-xs uppercase text-brand-sand/45">Live preview — front</div>
        <BadgeCard card={previewCard} />
        <p className="mb-6 mt-3 text-center text-xs text-brand-sand/35">
          Updates as you edit below — nothing is saved until you click Save flare.
        </p>

        <div className="mb-2 font-terminal text-xs uppercase text-brand-sand/45">Back</div>
        <div className="mx-auto w-full max-w-[460px]">
          <CardVisual
            card={previewCard}
            outline={outline}
            icon={icon}
            isRogue={isRogue}
            flipped
            onClick={() => {}}
            tiltEnabled={false}
          />
        </div>

        <div className="surface-card mt-6 p-4">
          <div className="mb-2 font-terminal text-xs uppercase text-brand-sand/45">Badge photo override</div>
          {photoStatus.uploaded && (
            <div className="mb-3 rounded-lg bg-brand-light-green/15 p-2.5 text-xs text-brand-light-green">
              Photo updated.
            </div>
          )}
          {photoStatus.removed && (
            <div className="mb-3 rounded-lg bg-brand-sand/10 p-2.5 text-xs text-brand-sand/60">Photo removed.</div>
          )}
          {photoStatus.error && (
            <div className="mb-3 rounded-lg bg-brand-red/15 p-2.5 text-xs text-brand-red">{photoStatus.error}</div>
          )}
          <p className="mb-3 text-xs text-brand-sand/40">
            Uploads/replaces this agent&apos;s badge photo directly — saves immediately, same as their own
            self-service upload on the profile page.
          </p>
          <PhotoUploader
            uploadAction={adminUploadPhotoAction.bind(null, email)}
            removeAction={adminRemovePhotoAction.bind(null, email)}
            hasPhoto={!!baseCard.photoUrl}
          />
        </div>
      </div>

      <form action={upsertFlareAction} className="surface-card space-y-4 p-5">
        <input type="hidden" name="email" value={email} />
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
            Achievements (one per line)
          </label>
          <textarea
            name="achievements"
            rows={3}
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            className="input-modern w-full"
          />
          <p className="mt-1 text-[11px] text-brand-sand/35">
            Trophy icon by default. Prefix a line with a recognized icon name and a colon to use a different one,
            e.g. <span className="text-brand-sand/50">crown: October Champion</span>. Options: {ICONS.join(", ")}.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Outline color"
            name="outlineColor"
            value={outlineColor}
            onChange={setOutlineColor}
            placeholder="#ff6a00, hotpink, royalblue"
          />
          <ColorField label="Background color" name="backgroundColor" value={backgroundColor} onChange={setBackgroundColor} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Background effect"
            name="backgroundEffect"
            value={backgroundEffect}
            onChange={setBackgroundEffect}
            options={["", ...BACKGROUND_EFFECTS]}
          />
          <SelectField
            label="Border style"
            name="borderStyle"
            value={borderStyle}
            onChange={setBorderStyle}
            options={["", ...BORDER_STYLES]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Icon override" name="iconOverride" value={iconOverride} onChange={setIconOverride} options={["", ...ICONS]} />
          <TextField
            label="Ribbon text"
            name="ribbonText"
            value={ribbonText}
            onChange={setRibbonText}
            placeholder="Gold, or an inside joke"
          />
        </div>
        <TextField
          label="Codename override"
          name="codenameOverride"
          value={codenameOverride}
          onChange={setCodenameOverride}
          hint={'Replaces the quoted name under their name, e.g. “Golden Falcon.”'}
        />
        <TextField
          label="Motto / tagline"
          name="motto"
          value={motto}
          onChange={setMotto}
          hint="Replaces their fun fact line instead of showing it."
        />
        <TextField label="Name suffix" name="nameSuffix" value={nameSuffix} onChange={setNameSuffix} placeholder="the Master" />
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
            Secret back text (game master)
          </label>
          <textarea
            name="secretBackText"
            rows={3}
            value={secretBackText}
            onChange={(e) => setSecretBackText(e.target.value)}
            placeholder="e.g. a code word, coordinates, or clue for a later challenge"
            className="input-modern w-full"
          />
          <p className="mt-1 text-[11px] text-brand-sand/35">
            Shows only on this agent&apos;s badge back, in a &quot;Classified Note&quot; box. Not shown anywhere
            else in the app - safe to stash a hint or code word here for a challenge you&apos;ll run later.
          </p>
        </div>
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/[0.06] p-3">
          <label className="flex items-center gap-2 font-terminal text-xs uppercase text-brand-red">
            <input
              type="checkbox"
              name="process420"
              checked={process420}
              onChange={(e) => setProcess420(e.target.checked)}
              className="accent-brand-red"
            />
            Process 420 (ultimate override)
          </label>
          <p className="mt-1.5 text-[11px] text-brand-sand/40">
            &quot;You beat the villain, now you ARE him.&quot; When enabled, this completely overrides every
            other flare field on this page (colors, background, border, icon, ribbon, suffix, motto, codename,
            holo sheen, graded slab) with a single fixed compromised look - red outline, skull icon, glitching
            watermarked card, forced codename &quot;PROCESS_420&quot;. Achievements and the secret back text
            still work normally. Meant as a one-time legendary reward, not something to combine with anything
            else below.
          </p>
        </div>
        <label className="flex items-center gap-2 font-terminal text-xs uppercase text-brand-sand/45">
          <input
            type="checkbox"
            name="holoSheen"
            checked={holoSheen}
            onChange={(e) => setHoloSheen(e.target.checked)}
            className="accent-brand-cyan"
          />
          Holographic cursor sheen
        </label>
        <p className="-mt-3 text-[11px] text-brand-sand/35">
          A rainbow glint that follows the cursor across the badge on hover - independent of (and stacks with) any
          background effect above.
        </p>
        <label className="flex items-center gap-2 font-terminal text-xs uppercase text-brand-sand/45">
          <input
            type="checkbox"
            name="psaGrade"
            checked={psaGrade}
            onChange={(e) => setPsaGrade(e.target.checked)}
            className="accent-brand-cyan"
          />
          Graded slab (PSA-style)
        </label>
        <p className="-mt-3 text-[11px] text-brand-sand/35">
          A holographic foil sheen sweeps across the badge and a &quot;Gem MT 10&quot; grading chip appears next to
          the tier badge - independent of (and stacks with) everything else above.
        </p>
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">
            Expires at (Eastern Time)
          </label>
          <input
            name="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="input-modern w-full"
          />
        </div>
        <button
          className="btn-primary"
          style={{ background: "linear-gradient(135deg, var(--brand-purple), #401f36)", color: "var(--brand-sand)" }}
        >
          Save flare
        </button>
      </form>
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <input
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-modern w-full"
      />
      {hint && <p className="mt-1 text-[11px] text-brand-sand/35">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <select name={name} value={value} onChange={(e) => onChange(e.target.value)} className="input-modern w-full">
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "(none)"}
          </option>
        ))}
      </select>
    </div>
  );
}
