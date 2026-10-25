"use strict";
import { Router } from "express";
import { z } from "zod";
import { createIdeasProvider } from "../llm/factory";
import { buildBudget, ideaCaps } from "../engine/budget";
import { buildTimeline } from "../engine/scheduler";
import { buildVendorPlan } from "../engine/vendors";
import { applyScenario } from "../engine/disruptions";
import {
  PlanRequestSchema,
  DisruptRequestSchema,
} from "../validation/schemas";
import type { EventType, PlanBundle, ScenarioType } from "@shared/types";
import type { Request, Response } from "express";

const router = Router();

// ---------------------------------------------------------------- helpers ---

function makePlan(
  input: z.infer<typeof PlanRequestSchema>,
  today: number,
): PlanBundle {
  const eventType = input.eventType as EventType;
  const budget = buildBudget(eventType, input.guests, input.budget);
  const timeline = buildTimeline(eventType, input.eventDate, today);
  const vendors = buildVendorPlan(eventType, budget);
  return {
    setup: {
      eventType,
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

function handleZodError(res: Response, error: unknown): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(400).json({ success: false, error: message });
}

// ----------------------------------------------------------------- routes ---

router.post("/plan", (req: Request, res: Response) => {
  try {
    const input = PlanRequestSchema.parse(req.body);
    const plan = makePlan(input, Date.now());
    res.json({ success: true, data: plan });
  } catch (error) {
    handleZodError(res, error);
  }
});

router.post("/ideas", async (req: Request, res: Response) => {
  try {
    const input = PlanRequestSchema.parse(req.body);
    const eventType = input.eventType as EventType;
    const budget = buildBudget(eventType, input.guests, input.budget);
    const provider = createIdeasProvider();
    const result = await provider.generate({
      eventType,
      city: input.city,
      guests: input.guests,
      budget: input.budget,
      theme: input.theme,
      caps: ideaCaps(budget),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    handleZodError(res, error);
  }
});

router.post("/disrupt", (req: Request, res: Response) => {
  try {
    const { plan, scenario } = DisruptRequestSchema.parse(req.body) as {
      plan: PlanBundle;
      scenario: ScenarioType;
    };
    if (!plan || !plan.budget || !plan.setup) {
      res
        .status(400)
        .json({ success: false, error: "A valid plan is required" });
      return;
    }
    const result = applyScenario(plan, scenario, Date.now());
    res.json({ success: true, data: result });
  } catch (error) {
    handleZodError(res, error);
  }
});

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rate limiting is applied in app.ts to keep this file focused on routing.

export default router;
