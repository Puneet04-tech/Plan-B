import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  daysBetween,
  formatDisplayDate,
  toIstIso,
  tryParseIstDate,
} from "../src/lib/dates";

describe("IST date helpers", () => {
  it("treats midnight IST as the previous day in UTC", () => {
    const ms = tryParseIstDate("2026-11-06");
    expect(toIstIso(ms)).toBe("2026-11-06");
    expect(new Date(ms).toISOString()).toBe("2026-11-05T18:30:00.000Z");
  });

  it("formats a human IST date", () => {
    const ms = tryParseIstDate("2026-11-06");
    expect(formatDisplayDate(ms)).toBe("6 Nov 2026");
  });

  it("keeps late-UTC timestamps on the next IST day", () => {
    // 20:00 UTC on 5 Nov is 01:30 IST on 6 Nov.
    const lateUtc = Date.UTC(2026, 10, 5, 20, 0, 0);
    expect(toIstIso(lateUtc)).toBe("2026-11-06");
  });

  it.each(["2026-02-31", "2026-13-01", "06-11-2026", "", "nov 6"])(
    "returns NaN for invalid date %s",
    (value) => {
      expect(Number.isNaN(tryParseIstDate(value))).toBe(true);
    },
  );

  it("accepts leap days", () => {
    expect(Number.isNaN(tryParseIstDate("2028-02-29"))).toBe(false);
    expect(Number.isNaN(tryParseIstDate("2026-02-29"))).toBe(true);
  });

  it("counts whole days between IST days", () => {
    const from = tryParseIstDate("2026-11-01");
    const to = tryParseIstDate("2026-11-06");
    expect(daysBetween(from, to)).toBe(5);
    expect(daysBetween(from, from + DAY_MS)).toBe(1);
  });
});
