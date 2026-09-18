import Link from "next/link";
import { formatEasternDayKey, formatEasternTime } from "@/lib/easternTime";

export interface ScheduleEvent {
  slug: string;
  title: string;
  kind: "opens" | "closes";
  at: Date;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The event itself is "2026 Cybersecurity Awareness Month" - October
// 2026 - so that's the default view every time the calendar loads with
// no explicit ?cal= param, regardless of the server/viewer's actual
// current month. Prev/Next (via ?cal=yyyy-MM) still browse away from it
// freely - this only affects the initial default.
const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH = 10;

function parseMonthParam(cal: string | undefined): { year: number; month: number } {
  const match = cal?.match(/^(\d{4})-(\d{2})$/);
  if (match) return { year: Number(match[1]), month: Number(match[2]) };
  return { year: DEFAULT_YEAR, month: DEFAULT_MONTH };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Month-grid view of every challenge's Opens At / Closes At, at the top
 * of the admin Challenges page - browsable via Prev/Next month links
 * (?cal=yyyy-MM), so a scheduled "surprise" challenge for later in the
 * event doesn't require opening each row's form just to remember when
 * it lands. Days are bucketed in Eastern time (formatEasternDayKey),
 * same as every other date shown/entered anywhere in the app.
 */
export function AdminScheduleCalendar({
  events,
  cal,
}: {
  events: ScheduleEvent[];
  cal: string | undefined;
}) {
  const { year, month } = parseMonthParam(cal);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const totalDays = daysInMonth(year, month);
  const todayKey = formatEasternDayKey(new Date());

  const byDay = new Map<string, ScheduleEvent[]>();
  for (const e of events) {
    const key = formatEasternDayKey(e.at);
    const list = byDay.get(key) ?? [];
    list.push(e);
    byDay.set(key, list);
  }

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const cells: { day: number | null; key: string | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, key: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });

  const hasAnyEvents = events.length > 0;

  return (
    <div className="surface-card mb-8 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/admin/challenges?cal=${monthParam(prevMonth.year, prevMonth.month)}`}
          className="rounded-lg px-2 py-1 font-terminal text-xs uppercase text-brand-sand/50 hover:bg-brand-sand/5 hover:text-brand-sand"
        >
          ‹ Prev
        </Link>
        <h2 className="font-display text-base font-semibold text-brand-sand">{monthLabel}</h2>
        <Link
          href={`/admin/challenges?cal=${monthParam(nextMonth.year, nextMonth.month)}`}
          className="rounded-lg px-2 py-1 font-terminal text-xs uppercase text-brand-sand/50 hover:bg-brand-sand/5 hover:text-brand-sand"
        >
          Next ›
        </Link>
      </div>

      {!hasAnyEvents && (
        <p className="mb-3 font-terminal text-[11px] text-brand-sand/35">
          No challenges have an Opens At or Closes At set yet.
        </p>
      )}

      <div className="grid grid-cols-7 gap-1 font-terminal text-[10px] uppercase tracking-wide text-brand-sand/35">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-1 py-1 text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          const dayEvents = cell.key ? byDay.get(cell.key) ?? [] : [];
          const isToday = cell.key === todayKey;
          return (
            <div
              key={i}
              className={`min-h-[64px] rounded-lg p-1.5 ${
                cell.day === null
                  ? ""
                  : isToday
                    ? "bg-brand-cyan/10 ring-1 ring-brand-cyan/40"
                    : "bg-brand-sand/[0.03]"
              }`}
            >
              {cell.day !== null && (
                <>
                  <div className={`mb-1 font-terminal text-[10px] ${isToday ? "text-brand-cyan" : "text-brand-sand/40"}`}>
                    {cell.day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <Link
                        key={j}
                        href={`#challenge-${e.slug}`}
                        title={`${e.kind === "opens" ? "Opens" : "Closes"} ${formatEasternTime(e.at)} \u2014 ${e.title}`}
                        className={`block truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight ${
                          e.kind === "opens"
                            ? "bg-brand-light-green/20 text-brand-light-green"
                            : "bg-brand-red/20 text-brand-red"
                        }`}
                      >
                        {e.kind === "opens" ? "▶" : "■"} {e.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="px-1 font-terminal text-[9px] text-brand-sand/35">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 font-terminal text-[10px] uppercase tracking-wide text-brand-sand/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-light-green" /> Opens
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-red" /> Closes
        </span>
      </div>
    </div>
  );
}
