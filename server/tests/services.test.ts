import { describe, expect, it } from "vitest";
import {
  buildPlanBundle,
  summarizeBudgetLines,
  summarizePlanForChat,
  summarizePlanForRisks,
} from "../src/services/plan";

const TODAY = Date.UTC(2026, 9, 25);
const request = {
  eventType: "wedding" as const,
  eventDate: "2026-12-25",
  city: "Mumbai",
  guests: 100,
  budget: 500000,
  theme: "Classic Elegance",
};

describe("buildPlanBundle", () => {
  it("is deterministic for the same input and day", () => {
    const first = buildPlanBundle(request, TODAY);
    const second = buildPlanBundle(request, TODAY);
    expect(second).toEqual(first);
  });

  it("carries the setup through and counts vendors", () => {
    const plan = buildPlanBundle(request, TODAY);
    expect(plan.setup).toEqual({
      eventType: "wedding",
      eventDate: "2026-12-25",
      city: "Mumbai",
      guests: 100,
      budget: 500000,
      theme: "Classic Elegance",
    });
    expect(plan.readiness.totalVendors).toBe(plan.vendors.items.length);
    expect(plan.readiness.score).toBe(0);
  });

  it("omits the theme when it is not supplied", () => {
    const plan = buildPlanBundle(
      {
        eventType: request.eventType,
        eventDate: request.eventDate,
        city: request.city,
        guests: request.guests,
        budget: request.budget,
      },
      TODAY,
    );
    expect(plan.setup.theme).toBeUndefined();
  });
});

describe("grounding summaries", () => {
  const plan = buildPlanBundle(request, TODAY);

  it("summarizes the plan for chat with real totals", () => {
    const summary = summarizePlanForChat(plan);
    expect(summary).toContain("eventType=wedding");
    expect(summary).toContain("city=Mumbai");
    expect(summary).toContain(`total=${plan.budget.total}`);
    expect(summary).toContain(`contingency=${plan.budget.contingency.amount}`);
    expect(summary).toContain("Venue=");
  });

  it("summarizes the plan for risk analysis with schedule facts", () => {
    const summary = summarizePlanForRisks(plan);
    expect(summary).toContain("daysAvailable=");
    expect(summary).toContain("rushMode=");
    expect(summary).toContain("verdict=");
    expect(summary).toContain("vendorsNeedingBackup=");
  });

  it("summarizes budget lines with currency and percentages", () => {
    const summary = summarizeBudgetLines(plan);
    expect(summary).toContain("₹");
    expect(summary).toContain("%");
    // One `label=amount` pair per budget line (amounts also contain commas).
    expect(summary.match(/=/g)?.length).toBe(plan.budget.lines.length);
  });
});
