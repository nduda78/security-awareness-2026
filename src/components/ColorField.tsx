"use client";

import { useState } from "react";

const HEX_RE = /^#[0-9a-f]{6}$/i;

/**
 * A text input for a CSS color (accepts anything CSS accepts — named
 * colors like "royalblue", short hex, etc.) paired with a native hex color
 * picker swatch. The picker is just a convenience: only the text input has
 * a `name` and gets submitted, so typing a non-hex value still works fine,
 * it just means the swatch button shows a neutral fallback until the text
 * value is a valid 6-digit hex.
 *
 * Fully controlled (value/onChange from the parent) so the parent can also
 * drive a live badge preview from the same state.
 */
export function ColorField({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const pickerValue = HEX_RE.test(value) ? value.toLowerCase() : "#ffffff";

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 font-terminal text-xs uppercase text-brand-sand/45">
        {label}
        {disabled && <span className="text-brand-sand/25">(not unlocked yet)</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-brand-sand/15 bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        />
        <input
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "#ff6a00, hotpink, royalblue"}
          disabled={disabled}
          className="input-modern w-full disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-brand-sand/35">{hint}</p>}
    </div>
  );
}

/**
 * Self-contained version of ColorField for forms that don't otherwise need
 * to lift this field's state up (e.g. no live preview watching it) — just
 * holds its own useState internally. Still submits fine in a plain
 * <form action={...}> since the underlying <input name=...> is present in
 * the DOM regardless of who owns the React state.
 */
export function StandaloneColorField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return <ColorField label={label} name={name} value={value} onChange={setValue} placeholder={placeholder} />;
}
