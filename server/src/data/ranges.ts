"use strict";

// Per-guest budget ranges in INR. These are ASSUMPTIONS (documented in the
// README) — edit them here to tune the realism verdicts.

export interface GuestRange {
  min: number;
  max: number;
}

export const PER_GUEST_RANGES: Record<string, GuestRange> = {
  community: { min: 300, max: 1500 },
  birthday: { min: 800, max: 3000 },
  wedding: { min: 1500, max: 6000 },
};

// Rush premium applied to venue when a disruption forces a replacement booking.
export const RUSH_PREMIUM = 0.15;

// Default trim order (lowest priority first) when a disruption needs to free
// budget. Documented in the README.
export const TRIM_ORDER = [
  "promotion",
  "activities",
  "decor",
  "soundLights",
  "entertainment",
];

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
