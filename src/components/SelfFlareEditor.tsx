"use client";

import { useMemo, useState } from "react";
import { selfUpdateFlareAction } from "@/lib/actions/selfFlare";
import { applyFlareToCard, type ClientAgentCard } from "@/lib/client-types";
import type { UnlockedFlareOptions } from "@/lib/rewards";
import { resolveColor } from "@/lib/flare";
import { BadgeCard } from "./BadgeCard";

const FIELD_LABELS: Record<string, string> = {
  backgroundEffect: "Background effect",
  borderStyle: "Border style",
  iconOverride: "Icon",
  ribbonText: "Ribbon text",
  nameSuffix: "Name suffix",
  outlineColor: "Outline color",
  backgroundColor: "Background color",
};

export function SelfFlareEditor({
  baseCard,
  defaultCodename,
  passthrough,
  initial,
  unlocked,
  status,
}: {
  baseCard: ClientAgentCard;
  defaultCodename: string;
  passthrough: {
    achievements: string[];
    motto: string | null;
    codenameOverride: string | null;
  };
  initial: {
    backgroundEffect: string;
    borderStyle: string;
    iconOverride: string;
    ribbonText: string;
    nameSuffix: string;
    outlineColor: string;
    backgroundColor: string;
  };
  unlocked: UnlockedFlareOptions;
  status: { saved: boolean; rejectedFields: string[] };
}) {
  const [backgroundEffect, setBackgroundEffect] = useState(initial.backgroundEffect);
  const [borderStyle, setBorderStyle] = useState(initial.borderStyle);
  const [iconOverride, setIconOverride] = useState(initial.iconOverride);
  const [ribbonText, setRibbonText] = useState(initial.ribbonText);
  const [nameSuffix, setNameSuffix] = useState(initial.nameSuffix);
  const [outlineColor, setOutlineColor] = useState(initial.outlineColor);
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor);

  const previewCard = useMemo(
    () =>
      applyFlareToCard(baseCard, defaultCodename, {
        achievements: passthrough.achievements,
        outlineColor,
        backgroundColor,
        backgroundEffect,
        codenameOverride: passthrough.codenameOverride,
        motto: passthrough.motto,
        iconOverride,
        borderStyle,
        ribbonText,
        nameSuffix,
        expiresAt: null,
      }),
    [
      baseCard,
      defaultCodename,
      passthrough,
      backgroundEffect,
      borderStyle,
      iconOverride,
      ribbonText,
      nameSuffix,
      outlineColor,
      backgroundColor,
    ]
  );

  const totalUnlocked =
    unlocked.backgroundEffect.length +
    unlocked.borderStyle.length +
    unlocked.icon.length +
    unlocked.ribbonText.length +
    unlocked.nameSuffix.length +
    unlocked.outlineColor.length +
    unlocked.backgroundColor.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-2 font-terminal text-xs uppercase text-brand-sand/45">Live preview</div>
        <BadgeCard card={previewCard} />
        <p className="mt-3 text-center text-xs text-brand-sand/35">
          Updates as you pick below — nothing is saved until you click Save.
        </p>
      </div>

      <form action={selfUpdateFlareAction} className="surface-card space-y-4 p-5">
        {status.saved && (
          <div className="rounded-lg bg-brand-light-green/15 p-2.5 text-xs text-brand-light-green">
            Badge flare updated.
          </div>
        )}
        {status.rejectedFields.length > 0 && (
          <div className="rounded-lg bg-brand-red/15 p-2.5 text-xs text-brand-red">
            Couldn&apos;t apply {status.rejectedFields.map((f) => FIELD_LABELS[f] ?? f).join(", ")} — that
            option isn&apos;t unlocked (yet).
          </div>
        )}

        {totalUnlocked === 0 && (
          <p className="rounded-lg bg-brand-cyan/10 p-3 text-xs text-brand-sand/60">
            You haven&apos;t unlocked any badge flare yet. Complete a challenge that rewards one (see the
            Rewards section on its mission briefing) and the option shows up here automatically.
          </p>
        )}

        <UnlockedSelect
          label="Background effect"
          name="backgroundEffect"
          value={backgroundEffect}
          onChange={setBackgroundEffect}
          options={unlocked.backgroundEffect}
        />
        <UnlockedSelect
          label="Border style"
          name="borderStyle"
          value={borderStyle}
          onChange={setBorderStyle}
          options={unlocked.borderStyle}
        />
        <UnlockedSelect
          label="Icon"
          name="iconOverride"
          value={iconOverride}
          onChange={setIconOverride}
          options={unlocked.icon}
        />
        <UnlockedSelect
          label="Ribbon text"
          name="ribbonText"
          value={ribbonText}
          onChange={setRibbonText}
          options={unlocked.ribbonText}
        />
        <UnlockedSelect
          label="Name suffix"
          name="nameSuffix"
          value={nameSuffix}
          onChange={setNameSuffix}
          options={unlocked.nameSuffix}
        />
        <UnlockedColorSelect
          label="Outline color"
          name="outlineColor"
          value={outlineColor}
          onChange={setOutlineColor}
          options={unlocked.outlineColor}
        />
        <UnlockedColorSelect
          label="Background color"
          name="backgroundColor"
          value={backgroundColor}
          onChange={setBackgroundColor}
          options={unlocked.backgroundColor}
        />

        <button
          className="btn-primary"
          style={{ background: "linear-gradient(135deg, var(--brand-cyan), #0f5f78)", color: "var(--brand-dark-green)" }}
        >
          Save
        </button>
      </form>
    </div>
  );
}

function UnlockedSelect({
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
  // Always keep the currently-selected value selectable, even if it somehow
  // isn't in the freshly-unlocked pool (e.g. an admin set it by hand) \u2014
  // never silently yank someone's current pick out from under them.
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  const locked = allOptions.length === 0;

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-terminal text-xs uppercase text-brand-sand/45">
        {label}
        {locked && <span className="text-brand-sand/25">(nothing unlocked yet)</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        className="input-modern w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        <option value="">(none)</option>
        {allOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Same unlocked-pool-only dropdown as UnlockedSelect, but for the two color
 * reward fields — adds a small resolved-color swatch next to the select so
 * picking between e.g. "royal purple" and "#39ff14" is visual, not just
 * text. The swatch is display-only; the select itself is what submits.
 */
function UnlockedColorSelect({
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
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  const locked = allOptions.length === 0;
  const swatch = value ? resolveColor(value, name, []) : null;

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-terminal text-xs uppercase text-brand-sand/45">
        {label}
        {locked && <span className="text-brand-sand/25">(nothing unlocked yet)</span>}
      </label>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-lg border border-brand-sand/15"
          style={{ background: swatch ?? "transparent" }}
        />
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          className="input-modern w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="">(none)</option>
          {allOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
