"use client";

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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const pickerValue = HEX_RE.test(value) ? value.toLowerCase() : "#ffffff";

  return (
    <div>
      <label className="mb-1.5 block font-terminal text-xs uppercase text-brand-sand/45">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-brand-sand/15 bg-transparent p-0.5"
        />
        <input
          name={name}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "#ff6a00, hotpink, royalblue"}
          className="input-modern w-full"
        />
      </div>
    </div>
  );
}
