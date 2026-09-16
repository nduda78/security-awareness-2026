// Badge flare resolution: turns admin-entered free-ish text into safe,
// validated rendering values. Any unrecognized/invalid value is logged as a
// warning and ignored (falls back to "no flare for this field") — this
// must never throw or break rendering, per the design rule in
// BUILD_PROMPT.md ("admins should be able to experiment freely").

// A small set of informal color phrases -> real CSS colors. Extend freely.
const INFORMAL_COLOR_MAP: Record<string, string> = {
  "hot pink": "#ff69b4",
  "bright blue": "#1e90ff",
  "electric blue": "#00c8ff",
  "royal purple": "#7851a9",
  "money green": "#00b140",
  "danger red": "#e5484d",
  "safety orange": "#ff6a13",
  gold: "#d4af37",
  "sunset orange": "#ff8c42",
  "midnight black": "#0b0b0f",
  "ice blue": "#a5f2f3",
  "toxic green": "#39ff14",
};

const CSS_NAMED_COLORS = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "black",
  "white",
  "gray",
  "grey",
  "gold",
  "silver",
  "teal",
  "cyan",
  "magenta",
  "lime",
  "navy",
  "maroon",
  "olive",
  "crimson",
  "coral",
  "salmon",
  "khaki",
  "violet",
  "indigo",
  "turquoise",
  "tomato",
  "chocolate",
  "orchid",
  "plum",
  "skyblue",
  "hotpink",
  "deeppink",
]);

export type BackgroundEffect =
  | "holo"
  | "crt"
  | "gradient-sweep"
  | "starfield"
  | "matrix"
  | "smoke"
  | "confetti"
  | "circuit"
  | "aurora";
export const BACKGROUND_EFFECTS: BackgroundEffect[] = [
  "holo",
  "crt",
  "gradient-sweep",
  "starfield",
  "matrix",
  "smoke",
  "confetti",
  "circuit",
  "aurora",
];

export type BorderStyle = "pulse" | "shimmer" | "marching-ants" | "neon" | "glitch" | "foil" | "pulse-glitch";
export const BORDER_STYLES: BorderStyle[] = [
  "pulse",
  "shimmer",
  "marching-ants",
  "neon",
  "glitch",
  "foil",
  "pulse-glitch",
];

export type IconKey = "crown" | "flame" | "trophy" | "lightning" | "skull" | "shield" | "lock" | "file";
export const ICONS: IconKey[] = ["crown", "flame", "trophy", "lightning", "skull", "shield", "lock", "file"];

export const RECOGNIZED_RIBBONS = new Set(["gold", "platinum", "diamond"]);

export interface FlareWarning {
  field: string;
  value: string;
  reason: string;
}

/**
 * Resolves a color string (hex, CSS name, or informal phrase) to a value
 * safe to hand to CSS. Returns null + a warning if it can't be resolved.
 */
export function resolveColor(
  raw: string | null | undefined,
  field: string,
  warnings: FlareWarning[]
): string | null {
  if (!raw || !raw.trim()) return null;
  const value = raw.trim();

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return value;

  const lower = value.toLowerCase();
  if (INFORMAL_COLOR_MAP[lower]) return INFORMAL_COLOR_MAP[lower];
  if (CSS_NAMED_COLORS.has(lower.replace(/\s+/g, ""))) return lower.replace(/\s+/g, "");

  warnings.push({ field, value, reason: "unrecognized color — ignored" });
  return null;
}

export function resolveBackgroundEffect(
  raw: string | null | undefined,
  warnings: FlareWarning[]
): BackgroundEffect | null {
  if (!raw || !raw.trim()) return null;
  const value = raw.trim().toLowerCase() as BackgroundEffect;
  if (BACKGROUND_EFFECTS.includes(value)) return value;
  warnings.push({ field: "backgroundEffect", value: raw, reason: "unknown effect — ignored" });
  return null;
}

export function resolveBorderStyle(
  raw: string | null | undefined,
  warnings: FlareWarning[]
): BorderStyle | null {
  if (!raw || !raw.trim()) return null;
  const value = raw.trim().toLowerCase() as BorderStyle;
  if (BORDER_STYLES.includes(value)) return value;
  warnings.push({ field: "borderStyle", value: raw, reason: "unknown border style — ignored" });
  return null;
}

export function resolveIcon(raw: string | null | undefined, warnings: FlareWarning[]): IconKey | null {
  if (!raw || !raw.trim()) return null;
  const value = raw.trim().toLowerCase() as IconKey;
  if (ICONS.includes(value)) return value;
  warnings.push({ field: "iconOverride", value: raw, reason: "unknown icon — ignored" });
  return null;
}

export interface ResolvedFlare {
  achievements: string[];
  outlineColor: string | null;
  backgroundColor: string | null;
  backgroundEffect: BackgroundEffect | null;
  codenameOverride: string | null;
  motto: string | null;
  iconOverride: IconKey | null;
  borderStyle: BorderStyle | null;
  ribbonText: string | null;
  ribbonRecognized: boolean;
  nameSuffix: string | null;
  warnings: FlareWarning[];
}

export interface RawFlareInput {
  achievements?: string[] | null;
  outlineColor?: string | null;
  backgroundColor?: string | null;
  backgroundEffect?: string | null;
  codenameOverride?: string | null;
  motto?: string | null;
  iconOverride?: string | null;
  borderStyle?: string | null;
  ribbonText?: string | null;
  nameSuffix?: string | null;
  expiresAt?: Date | null;
}

/**
 * Resolves a raw BadgeFlare row into safe render values. If expiresAt is in
 * the past, the whole row is treated as if it didn't exist (returns null).
 */
export function resolveFlare(raw: RawFlareInput | null | undefined, now: Date = new Date()): ResolvedFlare | null {
  if (!raw) return null;
  if (raw.expiresAt && raw.expiresAt.getTime() < now.getTime()) return null;

  const warnings: FlareWarning[] = [];

  const ribbonText = raw.ribbonText?.trim() || null;

  return {
    achievements: (raw.achievements ?? []).filter((a) => !!a && !!a.trim()),
    outlineColor: resolveColor(raw.outlineColor, "outlineColor", warnings),
    backgroundColor: resolveColor(raw.backgroundColor, "backgroundColor", warnings),
    backgroundEffect: resolveBackgroundEffect(raw.backgroundEffect, warnings),
    codenameOverride: raw.codenameOverride?.trim() || null,
    motto: raw.motto?.trim() || null,
    iconOverride: resolveIcon(raw.iconOverride, warnings),
    borderStyle: resolveBorderStyle(raw.borderStyle, warnings),
    ribbonText,
    ribbonRecognized: ribbonText ? RECOGNIZED_RIBBONS.has(ribbonText.toLowerCase()) : false,
    nameSuffix: raw.nameSuffix?.trim() || null,
    warnings,
  };
}

// BadgeFlare.achievements is stored as a JSON-encoded string column (SQLite
// has no native scalar-array type Prisma can map to, unlike the old Postgres
// String[] column). These two helpers are the only place that (de)serializes
// it, so every call site crosses the DB boundary the same safe way.
export function parseAchievements(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((a): a is string => typeof a === "string") : [];
  } catch {
    return [];
  }
}

export function serializeAchievements(achievements: string[]): string {
  return JSON.stringify(achievements ?? []);
}

/** Logs flare warnings server-side (build/request time) without throwing. */
export function logFlareWarnings(email: string, warnings: FlareWarning[]) {
  for (const w of warnings) {
    console.warn(`[flare] ${email}: ${w.field}="${w.value}" — ${w.reason}`);
  }
}
