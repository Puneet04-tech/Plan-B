"use strict";

import type {
  BudgetPlan,
  BudgetLine,
  EventType,
  Realism,
  IdeaCategory,
} from "@shared/types";
import { PER_GUEST_RANGES, BUDGET_LABELS } from "../data/ranges";

/** Percentage template. Each MUST sum to exactly 100 including contingency. */
interface TemplateEntry {
  key: string;
  percent: number;
  /** categories whose cost scales with guest count */
  perGuest?: boolean;
  /** which idea category maps onto this budget line (for idea caps) */
  ideaCategory?: IdeaCategory;
}

export class BudgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetError";
  }
}

const TEMPLATES: Record<EventType, TemplateEntry[]> = {
  community: [
    { key: "venue", percent: 18 },
    { key: "catering", percent: 22, perGuest: true, ideaCategory: "menu" },
    { key: "decor", percent: 8, ideaCategory: "decor" },
    { key: "soundLights", percent: 10 },
    { key: "permitsSecurity", percent: 6 },
    { key: "promotion", percent: 8 },
    { key: "activities", percent: 12, ideaCategory: "activities" },
    { key: "volunteersMisc", percent: 6 },
    { key: "entertainment", percent: 0, ideaCategory: "entertainment" }, // folded into activities for community
    { key: "contingency", percent: 10 },
  ],
  birthday: [
    { key: "venue", percent: 15 },
    { key: "catering", percent: 30, perGuest: true, ideaCategory: "menu" },
    { key: "decor", percent: 12, ideaCategory: "decor" },
    { key: "entertainment", percent: 15, ideaCategory: "entertainment" },
    { key: "cake", percent: 8, perGuest: true },
    { key: "photography", percent: 5 },
    { key: "returnGifts", percent: 5 },
    { key: "contingency", percent: 10 },
  ],
  wedding: [
    { key: "venue", percent: 20 },
    { key: "catering", percent: 30, perGuest: true, ideaCategory: "menu" },
    { key: "decor", percent: 12, ideaCategory: "decor" },
    { key: "photography", percent: 8 },
    { key: "entertainment", percent: 7, ideaCategory: "entertainment" },
    { key: "attireMakeup", percent: 8 },
    { key: "invitations", percent: 2 },
    { key: "logisticsMisc", percent: 3 },
    { key: "contingency", percent: 10 },
  ],
};

export interface ValidateInput {
  eventType: EventType;
  guests: number;
  budget: number;
}

export function validateBudgetInput(input: ValidateInput): void {
  if (!TEMPLATES[input.eventType]) {
    throw new BudgetError(`Unsupported event type: ${input.eventType}`);
  }
  if (!Number.isFinite(input.budget) || input.budget <= 0) {
    throw new BudgetError("Budget must be a positive number");
  }
  if (!Number.isInteger(input.guests) || input.guests < 1) {
    throw new BudgetError("Guests must be an integer of at least 1");
  }
}

/** Compute the realism verdict from per-guest spend vs editable ranges. */
export function computeRealism(eventType: EventType, perGuest: number): Realism {
  const range = PER_GUEST_RANGES[eventType];
  if (perGuest < range.min) {
    return {
      verdict: "tight",
      perGuest,
      rangeMin: range.min,
      rangeMax: range.max,
      reason: `₹${Math.round(perGuest).toLocaleString("en-IN")} per guest is below the typical ₹${range.min.toLocaleString("en-IN")}–₹${range.max.toLocaleString("en-IN")} range for a ${eventType} event.`,
    };
  }
  if (perGuest > range.max) {
    return {
      verdict: "generous",
      perGuest,
      rangeMin: range.min,
      rangeMax: range.max,
      reason: `₹${Math.round(perGuest).toLocaleString("en-IN")} per guest is above the typical ₹${range.min.toLocaleString("en-IN")}–₹${range.max.toLocaleString("en-IN")} range — you have room for upgrades.`,
    };
  }
  return {
    verdict: "comfortable",
    perGuest,
    rangeMin: range.min,
    rangeMax: range.max,
    reason: `₹${Math.round(perGuest).toLocaleString("en-IN")} per guest sits within the typical ₹${range.min.toLocaleString("en-IN")}–₹${range.max.toLocaleString("en-IN")} range for a ${eventType} event.`,
  };
}

/**
 * Allocate the budget across template lines using integer rupees.
 * Rounding remainder goes to the largest non-contingency category so the
 * lines sum EXACTLY to the total.
 */
export function buildBudget(
  eventType: EventType,
  guests: number,
  budget: number,
): BudgetPlan {
  validateBudgetInput({ eventType, guests, budget });

  const template = TEMPLATES[eventType];
  const lines: BudgetLine[] = [];
  let allocated = 0;

  for (const entry of template) {
    const raw = (budget * entry.percent) / 100;
    const amount = Math.floor(raw);
    allocated += amount;
    lines.push({
      key: entry.key,
      label: BUDGET_LABELS[entry.key] ?? entry.key,
      amount,
      percent: entry.percent,
      perGuest: entry.perGuest ? Math.floor(amount / guests) : undefined,
      ideaCategory: entry.ideaCategory,
    });
  }

  // Distribute rounding remainder to the largest non-contingency category.
  const remainder = budget - allocated;
  if (remainder > 0) {
    const largest = lines
      .filter((l) => l.key !== "contingency")
      .reduce((a, b) => (b.amount > a.amount ? b : a));
    largest.amount += remainder;
    if (largest.perGuest !== undefined) {
      largest.perGuest = Math.floor(largest.amount / guests);
    }
  }

  const contingencyLine = lines.find((l) => l.key === "contingency")!;
  const perGuest = budget / guests;

  return {
    lines,
    total: budget,
    perGuest: Math.floor(perGuest),
    contingency: {
      key: "contingency",
      label: BUDGET_LABELS.contingency,
      amount: contingencyLine.amount,
      percent: contingencyLine.percent,
    },
    realism: computeRealism(eventType, perGuest),
  };
}

/** Idea caps derived from the budget: max spend per idea category. */
export function ideaCaps(plan: BudgetPlan): Record<IdeaCategory, number> {
  const caps: Record<string, number> = {
    decor: 0,
    menu: 0,
    activities: 0,
    entertainment: 0,
  };
  for (const line of plan.lines) {
    if (line.ideaCategory) {
      caps[line.ideaCategory] += line.amount;
    }
  }
  return caps as Record<IdeaCategory, number>;
}

export { TEMPLATES as BUDGET_TEMPLATES };
