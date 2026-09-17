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
  | "aurora"
  | "fireflies"
  | "lightning";
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
  "fireflies",
  "lightning",
];

export type BorderStyle =
  | "pulse"
  | "shimmer"
  | "marching-ants"
  | "neon"
  | "glitch"
  | "foil"
  | "pulse-glitch"
  | "rainbow"
  | "ember";
export const BORDER_STYLES: BorderStyle[] = [
  "pulse",
  "shimmer",
  "marching-ants",
  "neon",
  "glitch",
  "foil",
  "pulse-glitch",
  "rainbow",
  "ember",
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

export interface AchievementEntry {
  text: string;
  icon: IconKey;
}

export const DEFAULT_ACHIEVEMENT_ICON: IconKey = "trophy";

export interface ResolvedFlare {
  achievements: AchievementEntry[];
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
  /// Freeform admin note stashed on the badge back, for later challenge
  /// use - no validation, any text goes through as-is.
  secretBackText: string | null;
  /// Cursor-tracking holographic sheen overlay on the front face - a
  /// simple on/off capability (see CardVisual), independent of
  /// backgroundEffect so it can be combined with any of them (or none).
  holoSheen: boolean;
  /// "Graded slab" treatment (foil sheen sweep + a Gem MT 10 grading chip
  /// on the front face - see CardVisual/CardFront) - another simple
  /// on/off capability, independent of backgroundEffect/borderStyle/
  /// holoSheen so it can be combined with any of them (or none).
  psaGrade: boolean;
  warnings: FlareWarning[];
}

export interface RawFlareInput {
  achievements?: AchievementEntry[] | null;
  outlineColor?: string | null;
  backgroundColor?: string | null;
  backgroundEffect?: string | null;
  codenameOverride?: string | null;
  motto?: string | null;
  iconOverride?: string | null;
  borderStyle?: string | null;
  ribbonText?: string | null;
  nameSuffix?: string | null;
  secretBackText?: string | null;
  holoSheen?: boolean | null;
  psaGrade?: boolean | null;
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
    achievements: (raw.achievements ?? []).filter((a) => !!a?.text?.trim()),
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
    secretBackText: raw.secretBackText?.trim() || null,
    holoSheen: !!raw.holoSheen,
    psaGrade: !!raw.psaGrade,
    warnings,
  };
}

// Achievements textarea line syntax: plain text, or an optional recognized
// icon-key prefix ("crown: October Champion") to override the default
// trophy icon for just that one entry. Anything that doesn't match a known
// icon key is treated as plain text (never rejected/warned - this is a
// cosmetic freeform field, not something that should block a save).
export function parseAchievementLine(line: string): AchievementEntry {
  const trimmed = line.trim();
  const match = trimmed.match(/^([a-z-]+):\s*(.+)$/i);
  if (match) {
    const iconKey = match[1].toLowerCase();
    if (ICONS.includes(iconKey as IconKey)) {
      return { text: match[2].trim(), icon: iconKey as IconKey };
    }
  }
  return { text: trimmed, icon: DEFAULT_ACHIEVEMENT_ICON };
}

export function parseAchievementsInput(raw: string): AchievementEntry[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseAchievementLine);
}

/** Reverse of parseAchievementsInput, for repopulating the editor textarea. */
export function formatAchievementsForInput(entries: AchievementEntry[]): string {
  return entries.map((e) => (e.icon !== DEFAULT_ACHIEVEMENT_ICON ? `${e.icon}: ${e.text}` : e.text)).join("\n");
}

// BadgeFlare.achievements is stored as a JSON-encoded string column (SQLite
// has no native scalar-array type Prisma can map to, unlike the old Postgres
// String[] column). These two helpers are the only place that (de)serializes
// it, so every call site crosses the DB boundary the same safe way.
// Tolerates the legacy shape (a plain JSON array of strings, from before
// per-achievement icons existed) by normalizing each string entry to the
// default icon - existing real data written before this feature keeps
// rendering exactly as it did.
export function parseAchievements(raw: string | null | undefined): AchievementEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries: AchievementEntry[] = [];
    for (const item of parsed) {
      if (typeof item === "string") {
        const text = item.trim();
        if (text) entries.push({ text, icon: DEFAULT_ACHIEVEMENT_ICON });
      } else if (item && typeof item === "object" && typeof item.text === "string") {
        const text = item.text.trim();
        if (!text) continue;
        const iconRaw = typeof item.icon === "string" ? item.icon.toLowerCase() : "";
        entries.push({ text, icon: ICONS.includes(iconRaw as IconKey) ? (iconRaw as IconKey) : DEFAULT_ACHIEVEMENT_ICON });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export function serializeAchievements(achievements: AchievementEntry[]): string {
  return JSON.stringify(achievements ?? []);
}

/** Logs flare warnings server-side (build/request time) without throwing. */
export function logFlareWarnings(email: string, warnings: FlareWarning[]) {
  for (const w of warnings) {
    console.warn(`[flare] ${email}: ${w.field}="${w.value}" — ${w.reason}`);
  }
}
