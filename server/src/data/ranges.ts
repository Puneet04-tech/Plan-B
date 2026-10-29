"use strict";

import type { EventType } from "@shared/types";

// Per-guest budget ranges in INR. These are ASSUMPTIONS (documented in the
// README) — edit them here to tune the realism verdicts.

export interface GuestRange {
  min: number;
  max: number;
}

export const PER_GUEST_RANGES: Record<EventType, GuestRange> = {
  community: { min: 300, max: 1500 },
  birthday: { min: 800, max: 3000 },
  wedding: { min: 1500, max: 6000 },
};

// Rush premium applied to venue when a disruption forces a replacement booking.
export const RUSH_PREMIUM = 0.15;

// Trim order (lowest priority first) used when a disruption has to free up
// budget. Values that scale guest counts (catering) and fixed commitments
// (venue) are last so a replan never guts the core of the event. Documented in
// the README.
export const TRIM_ORDER = [
  "promotion",
  "activities",
  "decor",
  "soundLights",
  "entertainment",
  "returnGifts",
  "invitations",
  "attireMakeup",
  "cake",
  "photography",
  "logisticsMisc",
  "volunteersMisc",
  "permitsSecurity",
  "venue",
  "catering",
  "contingency",
];

/**
 * Rank a budget-line key for trimming (ascending = trimmed first). Unknown
 * keys sort after every documented key instead of before them, which is what
 * a bare `indexOf` would do with its `-1` result.
 */
export function trimPriority(key: string): number {
  const index = TRIM_ORDER.indexOf(key);
  return index === -1 ? TRIM_ORDER.length : index;
}

// Budget line label mapping (single source of truth for the UI).
export const BUDGET_LABELS: Record<string, string> = {
  venue: "Venue",
  catering: "Catering",
  decor: "Decor",
  soundLights: "Sound & Lights",
  permitsSecurity: "Permits & Security",
  promotion: "Promotion",
  activities: "Activities",
  volunteersMisc: "Volunteers & Misc",
  entertainment: "Entertainment",
  cake: "Cake",
  photography: "Photography",
  returnGifts: "Return Gifts",
  attireMakeup: "Attire & Makeup",
  invitations: "Invitations",
  logisticsMisc: "Logistics & Misc",
  contingency: "Contingency",
};
