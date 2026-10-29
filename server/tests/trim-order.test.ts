import { describe, expect, it } from "vitest";
import { BUDGET_TEMPLATES, buildBudget } from "../src/engine/budget";
import { buildTimeline } from "../src/engine/scheduler";
import { buildVendorPlan } from "../src/engine/vendors";
import { applyScenario } from "../src/engine/disruptions";
import { TRIM_ORDER, trimPriority } from "../src/data/ranges";
import type { EventType, PlanBundle } from "../../shared/types";

const TODAY = Date.UTC(2026, 9, 25);
const types: EventType[] = ["wedding", "birthday", "community"];

function makePlan(eventType: EventType): PlanBundle {
  const eventDate = "2026-12-25";
  const budget = buildBudget(eventType, 100, 500000);
  return {
    setup: { eventType, eventDate, city: "Mumbai", guests: 100, budget: 500000 },
    budget,
    timeline: buildTimeline(eventType, eventDate, TODAY),
    vendors: buildVendorPlan(eventType, budget),
    readiness: { score: 0, bookedVendors: 0, totalVendors: 0 },
  };
}

describe("budget trim order", () => {
  it("covers every budget-line key the templates use", () => {
    for (const eventType of types) {
      for (const entry of BUDGET_TEMPLATES[eventType]) {
        expect(TRIM_ORDER).toContain(entry.key);
      }
    }
  });

  it("ranks unknown keys last instead of first", () => {
    expect(trimPriority("promotion")).toBeLessThan(trimPriority("decor"));
    expect(trimPriority("venue")).toBeGreaterThan(trimPriority("decor"));
    expect(trimPriority("something-new")).toBe(TRIM_ORDER.length);
  });

  it("never guts catering before low-priority lines when the budget is cut", () => {
    for (const eventType of types) {
      const plan = makePlan(eventType);
      const before = plan.budget.lines.find((line) => line.key === "catering")!.amount;
      const result = applyScenario(plan, "budget-cut-20", TODAY);
      const after = result.plan.budget.lines.find(
        (line) => line.key === "catering",
      )!.amount;
      // The proportional cut is unavoidable; extra reconciling trims must not
      // hit catering before decor/promotion are exhausted.
      expect(after).toBeGreaterThanOrEqual(Math.floor(before * 0.78));
    }
  });

  it("cuts low-priority lines before the venue when it must free budget", () => {
    const plan = makePlan("community");
    // Force the venue-cancelled rush premium to exceed the contingency so the
    // reconciling trim actually runs.
    const poorContingency = structuredClone(plan);
    let moved = 0;
    for (const line of poorContingency.budget.lines) {
      if (line.key === "contingency") {
        moved = line.amount - 1;
        line.amount = 1;
      }
    }
    poorContingency.budget.contingency.amount = 1;
    // Park the freed money on catering so the plan still sums to its total.
    const catering = poorContingency.budget.lines.find(
      (line) => line.key === "catering",
    )!;
    catering.amount += moved;

    const result = applyScenario(poorContingency, "venue-cancelled", TODAY);
    const ratio = (key: string): number => {
      const before = poorContingency.budget.lines.find(
        (line) => line.key === key,
      )!.amount;
      const after = result.plan.budget.lines.find((line) => line.key === key)!.amount;
      return after / before;
    };

    expect(ratio("promotion")).toBeLessThan(1);
    expect(ratio("promotion")).toBeLessThan(ratio("venue"));
    // The venue must never be trimmed to zero by the reconciling pass.
    expect(
      result.plan.budget.lines.find((line) => line.key === "venue")!.amount,
    ).toBeGreaterThan(0);
  });
});
