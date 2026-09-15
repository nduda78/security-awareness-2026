"use client";

import { useMemo, useState } from "react";
import { upsertFlareAction } from "@/lib/actions/admin";
import { BACKGROUND_EFFECTS, BORDER_STYLES, ICONS } from "@/lib/flare";
import { applyFlareToCard, type ClientAgentCard } from "@/lib/client-types";
import { ColorField } from "./ColorField";
import { BadgeCard } from "./BadgeCard";

export function FlareEditor({
  email,
  baseCard,
  defaultCodename,
  initial,
}: {
  email: string;
  baseCard: ClientAgentCard;
  defaultCodename: string;
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
    expiresAt: string;
    pinned: boolean;
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
  const [expiresAt, setExpiresAt] = useState(initial.expiresAt);
  const [pinned, setPinned] = useState(initial.pinned);

  const previewCard = useMemo(
    () =>
      applyFlareToCard(baseCard, defaultCodename, {
        achievements: achievements
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        outlineColor,
        backgroundColor,
        backgroundEffect,
        codenameOverride,
        motto,
        iconOverride,
        borderStyle,
        ribbonText,
        pinned,
        nameSuffix,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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
      pinned,
      nameSuffix,
      expiresAt,
    ]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-2 font-terminal text-xs uppercase text-brand-sand/45">Live preview</div>
        <BadgeCard card={previewCard} />
        <p className="mt-3 text-center text-xs text-brand-sand/35">
          Updates as you edit below — nothing is saved until you click Save flare.
        </p>
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
        <TextField label="Codename override" name="codenameOverride" value={codenameOverride} onChange={setCodenameOverride} />
        <TextField label="Motto / tagline" name="motto" value={motto} onChange={setMotto} />
        <TextField label="Name suffix" name="nameSuffix" value={nameSuffix} onChange={setNameSuffix} placeholder="the Master" />
        <div>
          <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">Expires at</label>
          <input
            name="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="input-modern w-full"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-sand/70">
          <input
            type="checkbox"
            name="pinned"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="accent-brand-purple"
          />
          Pin to top of tier
        </label>
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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
