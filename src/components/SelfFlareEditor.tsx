"use client";

import { useMemo, useState } from "react";
import { selfUpdateFlareAction } from "@/lib/actions/selfFlare";
import { applyFlareToCard, type ClientAgentCard } from "@/lib/client-types";
import type { UnlockedFlareOptions } from "@/lib/rewards";
import { ColorField } from "./ColorField";
import { BadgeCard, CardVisual, deriveBadgeVisualProps } from "./BadgeCard";

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

  const { outline, icon, isRogue } = deriveBadgeVisualProps(previewCard);

  const totalUnlocked =
    unlocked.backgroundEffect.length +
    unlocked.borderStyle.length +
    unlocked.icon.length +
    unlocked.ribbonText.length +
    unlocked.nameSuffix.length +
    (unlocked.canPickOutlineColor ? 1 : 0) +
    (unlocked.canPickBackgroundColor ? 1 : 0) +
    (unlocked.canPickRibbonText ? 1 : 0) +
    (unlocked.canPickNameSuffix ? 1 : 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-2 font-terminal text-xs uppercase text-brand-sand/45">Live preview — front</div>
        <BadgeCard card={previewCard} showProfileLink={false} />

        <div className="mb-2 mt-6 font-terminal text-xs uppercase text-brand-sand/45">Back</div>
        <CardVisual
          card={previewCard}
          outline={outline}
          icon={icon}
          isRogue={isRogue}
          flipped
          onClick={() => {}}
          tiltEnabled={false}
        />
        <p className="mt-3 text-center text-xs text-brand-sand/35">
          Updates as you customize — nothing is saved until you click Save.
        </p>
      </div>

      <form action={selfUpdateFlareAction} className="surface-card space-y-4 p-5">
        {status.saved && (
          <div className="rounded-lg bg-brand-light-green/15 p-2.5 text-xs text-brand-light-green">
            Badge flare updated.
          </div>
        )}
        {(() => {
          const invalidFormat = status.rejectedFields.filter((f) => f.endsWith("Invalid")).map((f) => f.replace(/Invalid$/, ""));
          const notUnlocked = status.rejectedFields.filter((f) => !f.endsWith("Invalid"));
          return (
            <>
              {notUnlocked.length > 0 && (
                <div className="rounded-lg bg-brand-red/15 p-2.5 text-xs text-brand-red">
                  Couldn&apos;t apply {notUnlocked.map((f) => FIELD_LABELS[f] ?? f).join(", ")} — that option
                  isn&apos;t unlocked (yet).
                </div>
              )}
              {invalidFormat.length > 0 && (
                <div className="rounded-lg bg-brand-red/15 p-2.5 text-xs text-brand-red">
                  Couldn&apos;t apply {invalidFormat.map((f) => FIELD_LABELS[f] ?? f).join(", ")} — that
                  wasn&apos;t a color we recognized. Try a hex code (#ff6a00) or a plain color name.
                </div>
              )}
            </>
          );
        })()}

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
        {unlocked.canPickRibbonText ? (
          <FreeTextField
            label="Ribbon text"
            name="ribbonText"
            value={ribbonText}
            onChange={setRibbonText}
            placeholder="e.g. gold, platinum, diamond, or anything you like"
          />
        ) : (
          <UnlockedSelect
            label="Ribbon text"
            name="ribbonText"
            value={ribbonText}
            onChange={setRibbonText}
            options={unlocked.ribbonText}
          />
        )}
        {unlocked.canPickNameSuffix ? (
          <FreeTextField
            label="Name suffix"
            name="nameSuffix"
            value={nameSuffix}
            onChange={setNameSuffix}
            placeholder='e.g. "the O.G."'
          />
        ) : (
          <UnlockedSelect
            label="Name suffix"
            name="nameSuffix"
            value={nameSuffix}
            onChange={setNameSuffix}
            options={unlocked.nameSuffix}
          />
        )}
        <ColorField
          label="Outline color"
          name="outlineColor"
          value={outlineColor}
          onChange={setOutlineColor}
          disabled={!unlocked.canPickOutlineColor}
          hint={unlocked.canPickOutlineColor ? "Any color you like — hex, name, or a phrase like \u201chot pink.\u201d" : undefined}
        />
        <ColorField
          label="Background color"
          name="backgroundColor"
          value={backgroundColor}
          onChange={setBackgroundColor}
          disabled={!unlocked.canPickBackgroundColor}
          hint={unlocked.canPickBackgroundColor ? "Any color you like — hex, name, or a phrase like \u201chot pink.\u201d" : undefined}
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

function FreeTextField({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-terminal text-xs uppercase text-brand-sand/45">
        {label}
      </label>
      <input
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={60}
        className="input-modern w-full"
      />
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

