"use strict";

import { buildBudget } from "../engine/budget";
import { buildTimeline } from "../engine/scheduler";
import { buildVendorPlan } from "../engine/vendors";
import type { PlanBundle } from "@shared/types";
import type { PlanRequestInput } from "../validation/schemas";

const inr = (value: number): string => `₹${Math.round(value).toLocaleString("en-IN")}`;

/**
 * Deterministic plan assembly. No LLM involvement: given the same input and
 * `today`, this always produces the same bundle.
 */
export function buildPlanBundle(input: PlanRequestInput, today: number): PlanBundle {
  const budget = buildBudget(input.eventType, input.guests, input.budget);
  const timeline = buildTimeline(input.eventType, input.eventDate, today);
  const vendors = buildVendorPlan(input.eventType, budget);
  return {
    setup: {
      eventType: input.eventType,
      eventDate: input.eventDate,
      city: input.city,
      guests: input.guests,
      budget: input.budget,
      theme: input.theme,
    },
    budget,
    timeline,
    vendors,
    readiness: {
      score: 0,
      bookedVendors: 0,
      totalVendors: vendors.items.length,
    },
  };
}

/** Grounding text for the chat assistant: real facts, never model guesses. */
export function summarizePlanForChat(plan: PlanBundle): string {
  const topLines = plan.budget.lines
    .map((line) => `${line.label}=${line.amount}`)
    .join(", ");
  return [
    `eventType=${plan.setup.eventType}, city=${plan.setup.city}`,
    `guests=${plan.setup.guests}, budget=${plan.setup.budget}`,
    `total=${plan.budget.total}, contingency=${plan.budget.contingency.amount}`,
    `topLines=${topLines}`,
  ].join(", ");
}

/** Grounding text for the risk analyst: schedule pressure, vendors, budget. */
export function summarizePlanForRisks(plan: PlanBundle): string {
  const daysAvailable = plan.timeline.daysAvailable ?? plan.timeline.totalDays;
  const backups = plan.vendors.items
    .filter((vendor) => vendor.needsBackup)
    .map((vendor) => vendor.category)
    .join(", ");
  return [
    `eventType=${plan.setup.eventType}, city=${plan.setup.city}, guests=${plan.setup.guests}`,
    `eventDate=${plan.setup.eventDate}, daysAvailable=${daysAvailable}, rushMode=${plan.timeline.rushMode}`,
    `budgetTotal=${plan.budget.total}, perGuest=${plan.budget.realism.perGuest}, verdict=${plan.budget.realism.verdict}`,
    `topLines=${plan.budget.lines.map((line) => `${line.label}=${inr(line.amount)}`).join(", ")}`,
    `vendorsNeedingBackup=${backups}`,
  ].join("\n");
}

/** Grounding text for the budget optimizer: only lines that already exist. */
export function summarizeBudgetLines(plan: PlanBundle): string {
  return plan.budget.lines
    .map(
      (line) =>
        `${line.label}=${inr(line.amount)}${line.percent ? ` (${line.percent}%)` : ""}`,
    )
    .join(", ");
}
