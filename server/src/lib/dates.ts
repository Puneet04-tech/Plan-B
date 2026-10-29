"use strict";

/**
 * Date helpers shared by the timeline and disruption engines.
 *
 * All arithmetic happens in UTC milliseconds; every date the user sees is an
 * India Standard Time (UTC+05:30) calendar day. Keeping this in one module
 * means the two engines can never drift apart on what "today" means.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** IST offset from UTC in minutes (UTC+05:30). */
export const IST_OFFSET_MINUTES = 330;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Shift a UTC-millis instant into IST so its UTC getters read IST fields. */
function toIstDate(ms: number): Date {
  return new Date(ms + IST_OFFSET_MINUTES * 60 * 1000);
}

/** Convert a UTC-millis timestamp to the IST calendar day as `yyyy-mm-dd`. */
export function toIstIso(ms: number): string {
  return toIstDate(ms).toISOString().slice(0, 10);
}

/** Format a UTC-millis timestamp as a human IST date, e.g. `6 Nov 2026`. */
export function formatDisplayDate(ms: number): string {
  const ist = toIstDate(ms);
  const month = MONTHS[ist.getUTCMonth()] ?? "Jan";
  return `${ist.getUTCDate()} ${month} ${ist.getUTCFullYear()}`;
}

/**
 * Parse a `yyyy-mm-dd` string as midnight IST, returned as UTC millis.
 * Returns `Number.NaN` for malformed input so callers (and the Zod layer)
 * can produce their own error messages.
 */
export function tryParseIstDate(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return Number.NaN;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  const utcMidnight = Date.UTC(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(utcMidnight)) return Number.NaN;
  // Reject dates that roll over, e.g. 2026-02-31.
  const asIso = new Date(utcMidnight).toISOString().slice(0, 10);
  if (asIso !== iso) return Number.NaN;
  return utcMidnight - IST_OFFSET_MINUTES * 60 * 1000;
}

/** Whole IST days between two UTC-millis instants. */
export function daysBetween(fromMs: number, toMs: number): number {
  return Math.round((toMs - fromMs) / DAY_MS);
}
