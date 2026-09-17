// Every date/time shown or entered anywhere in the platform is pinned to
// US Eastern time (America/New_York, correctly DST-aware - EDT in summer,
// EST in winter), regardless of what timezone the server process or the
// viewer's own browser happens to be set to. This is an internal event
// entirely run on Eastern time, so a naive "browser local time" reading
// (the previous behavior) was ambiguous - an admin scheduling a challenge
// "opens at" datetime-local input, or anyone reading a chat timestamp,
// had no way to know which timezone they were actually looking at.
//
// Node's built-in Date has no notion of "parse this wall-clock string in
// timezone X" - only Intl.DateTimeFormat can format an absolute instant
// into a given zone's wall-clock digits. getEasternOffsetMinutes uses that
// to work out the zone's current UTC offset (which correctly flips across
// the DST boundary), and parseEasternInputValue uses it in reverse to
// convert an Eastern wall-clock string typed into a form back into the
// correct absolute instant for storage.

export const EASTERN_TIME_ZONE = "America/New_York";

/** The Eastern time zone's offset from UTC, in minutes, at the moment `date` represents (e.g. -240 during EDT, -300 during EST). */
function getEasternOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

/**
 * Parses a `<input type="datetime-local">` value (e.g. "2026-09-16T14:47"),
 * treating those digits as Eastern wall-clock time, and returns the
 * correct absolute Date instant. Returns null for an empty/invalid input.
 */
export function parseEasternInputValue(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];
  // First guess: treat the typed digits as if they were UTC, just to get
  // an approximate instant close enough to look up the correct ET offset
  // for that date (needed since EDT/EST flips mid-year).
  const guessUtc = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const offsetMinutes = getEasternOffsetMinutes(guessUtc);
  return new Date(guessUtc.getTime() - offsetMinutes * 60_000);
}

/** Formats an absolute Date instant as an Eastern wall-clock `<input type="datetime-local">` value ("yyyy-MM-ddTHH:mm"). */
export function toEasternInputValue(date: Date | null): string {
  if (!date) return "";
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** "yyyy-MM-dd" calendar day key in Eastern time - for bucketing events onto a calendar grid, independent of the viewer/server's own timezone. */
export function formatEasternDayKey(date: Date): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Short "Sep 16, 2026" date, always in Eastern time regardless of viewer/server timezone. */
export function formatEasternDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "Sep 16" - no year, used for compact timestamps like chat message dates. */
export function formatEasternShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { timeZone: EASTERN_TIME_ZONE, month: "short", day: "numeric" });
}

/** "2:47 PM" - always Eastern, with an explicit "ET" suffix by default so it's never ambiguous which timezone is shown. */
export function formatEasternTime(date: Date, opts: { withZoneLabel?: boolean } = {}): string {
  const { withZoneLabel = true } = opts;
  const time = date.toLocaleTimeString("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  return withZoneLabel ? `${time} ET` : time;
}

/** "Sep 16, 2026, 2:47 PM ET" - full date+time, always Eastern. */
export function formatEasternDateTime(date: Date, opts: { withZoneLabel?: boolean } = {}): string {
  const { withZoneLabel = true } = opts;
  const formatted = date.toLocaleString("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return withZoneLabel ? `${formatted} ET` : formatted;
}
