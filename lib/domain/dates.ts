import type { Day } from "./types";
import { DAYS } from "./slots";

// Week boundaries. Dates are ISO strings (YYYY-MM-DD) in the household's local calendar.

const MS_DAY = 86_400_000;

function parse(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Today's date in the local calendar as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, n: number): string {
  return iso(parse(date) + n * MS_DAY);
}

/** The Monday on or before the date. */
export function mondayOnOrBefore(date: string): string {
  const dow = new Date(parse(date)).getUTCDay(); // 0 Sunday .. 6 Saturday
  const back = (dow + 6) % 7;
  return addDays(date, -back);
}

/** "This week": the week the date falls in. */
export function currentWeekStart(date: string): string {
  return mondayOnOrBefore(date);
}

/** "Next week": the Monday strictly after the date. */
export function planningWeekStart(date: string): string {
  return addDays(mondayOnOrBefore(date), 7);
}

/** The date of a weekday within the week. */
export function dayDate(weekStart: string, day: Day): string {
  return addDays(weekStart, DAYS.indexOf(day));
}

/** Which weekday a date is, or null on weekends. */
export function dayOf(date: string): Day | null {
  const dow = new Date(parse(date)).getUTCDay();
  return dow >= 1 && dow <= 5 ? DAYS[dow - 1] : null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sep 21" */
export function shortDate(date: string): string {
  const d = new Date(parse(date));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Day of month only, "21". */
export function dayNumber(date: string): string {
  return String(new Date(parse(date)).getUTCDate());
}

/** "Sep 21 to 25", or "Sep 28 to Oct 2" across a month boundary. */
export function weekRange(weekStart: string): string {
  const end = addDays(weekStart, 4);
  const a = new Date(parse(weekStart));
  const b = new Date(parse(end));
  if (a.getUTCMonth() === b.getUTCMonth()) return `${shortDate(weekStart)} to ${b.getUTCDate()}`;
  return `${shortDate(weekStart)} to ${shortDate(end)}`;
}

/** Saturday or Sunday before the week, for the prep day label. */
export function prepDate(weekStart: string, prepDay: "Saturday" | "Sunday"): string {
  return addDays(weekStart, prepDay === "Sunday" ? -1 : -2);
}

/**
 * How a week reads relative to today: "This week", "Next week", "In 3
 * weeks", "Last week". Used by the week picker so the date range is not the
 * only thing telling you where you are.
 */
export function relativeWeek(weekStart: string, today: string): string {
  const here = currentWeekStart(today);
  const diff = Math.round((parse(weekStart) - parse(here)) / (7 * MS_DAY));
  if (diff === 0) return "This week";
  if (diff === 1) return "Next week";
  if (diff === -1) return "Last week";
  if (diff > 1) return `In ${diff} weeks`;
  return `${-diff} weeks ago`;
}
