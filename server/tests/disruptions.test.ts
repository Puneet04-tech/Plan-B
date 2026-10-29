import { describe, it, expect } from "vitest";
import { buildBudget } from "../src/engine/budget";
import { buildTimeline } from "../src/engine/scheduler";
import { buildVendorPlan } from "../src/engine/vendors";
import { applyScenario } from "../src/engine/disruptions";
import type { EventType, PlanBundle, ScenarioType } from "../../shared/types";

const TODAY = Date.UTC(2026, 9, 25);
const types: EventType[] = ["wedding", "birthday", "community"];
const scenarios: ScenarioType[] = [
  "venue-cancelled",
  "rain",
  "guest-count-up-30",
  "budget-cut-20",
  "vendor-no-show-caterer",
];

function makePlan(eventType: EventType, guests = 100, budget = 500000): PlanBundle {
  const eventDate = "2026-12-25";
  const b = buildBudget(eventType, guests, budget);
  return {
    setup: { eventType, eventDate, city: "Mumbai", guests, budget },
    budget: b,
    timeline: buildTimeline(eventType, eventDate, TODAY),
    vendors: buildVendorPlan(eventType, b),
    readiness: { score: 0, bookedVendors: 0, totalVendors: 0 },
  };
}

describe("disruption engine", () => {
  it.each(types.flatMap((t) => scenarios.map((s) => [t, s] as const)))(
    "%s + %s: totals reconcile exactly",
    (eventType, scenario) => {
      const plan = makePlan(eventType);
      const result = applyScenario(plan, scenario, TODAY);
      const sum = result.plan.budget.lines.reduce((s, l) => s + l.amount, 0);
      expect(sum).toBe(result.diff.after);
      expect(result.diff.after).toBeGreaterThan(0);
    },
  );

  it("venue-cancelled consumes contingency first", () => {
    const plan = makePlan("wedding");
    const contingencyBefore = plan.budget.lines.find(
      (l) => l.key === "contingency",
    )!.amount;
    const result = applyScenario(plan, "venue-cancelled", TODAY);
    const contingencyAfter = result.plan.budget.lines.find(
      (l) => l.key === "contingency",
    )!.amount;
    expect(contingencyAfter).toBeLessThan(contingencyBefore);
    expect(
      result.diff.budgetChanges.some((c) =>
        c.category.toLowerCase().includes("contingency"),
      ),
    ).toBe(true);
  });

  it("budget-cut-20 trims deterministically and reduces total", () => {
    const plan = makePlan("community");
    const result = applyScenario(plan, "budget-cut-20", TODAY);
    expect(result.diff.after).toBe(Math.round(plan.budget.total * 0.8));
    expect(result.diff.budgetChanges.length).toBeGreaterThan(0);
    // deterministic: run twice
    const result2 = applyScenario(plan, "budget-cut-20", TODAY);
    expect(JSON.stringify(result.diff.budgetChanges)).toBe(
      JSON.stringify(result2.diff.budgetChanges),
    );
  });

  it("guest-count-up-30 scales catering and warns on venue capacity", () => {
    const plan = makePlan("birthday");
    const cateringBefore = plan.budget.lines.find((l) => l.key === "catering")!.amount;
    const result = applyScenario(plan, "guest-count-up-30", TODAY);
    const cateringAfter = result.plan.budget.lines.find(
      (l) => l.key === "catering",
    )!.amount;
    expect(cateringAfter).toBeGreaterThanOrEqual(cateringBefore);
    expect(result.diff.warnings.some((w) => w.includes("capacity"))).toBe(true);
  });

  it("each scenario produces a before/after diff with reasons", () => {
    for (const scenario of scenarios) {
      const result = applyScenario(makePlan("wedding"), scenario, TODAY);
      expect(result.diff.label.length).toBeGreaterThan(0);
      const allChanges = [...result.diff.budgetChanges, ...result.diff.taskChanges];
      expect(allChanges.length > 0 || result.diff.addedTasks.length > 0).toBe(true);
      for (const change of result.diff.budgetChanges) {
        expect(change.reason.length).toBeGreaterThan(3);
      }
    }
  });
});

describe("vendor plan", () => {
  it.each(types)("%s checklist maps vendors to budget lines", (eventType) => {
    const plan = makePlan(eventType);
    expect(plan.vendors.items.length).toBeGreaterThan(3);
    for (const item of plan.vendors.items) {
      expect(plan.budget.lines.some((l) => l.key === item.budgetKey)).toBe(true);
      if (item.budgetKey === "venue" || item.budgetKey === "catering") {
        expect(item.needsBackup).toBe(true);
      }
    }
  });

  it("community includes compliance note", () => {
    const plan = makePlan("community");
    const security = plan.vendors.items.find((i) => i.budgetKey === "permitsSecurity");
    expect(security?.complianceNote).toContain("Check your local rules");
  });
});
