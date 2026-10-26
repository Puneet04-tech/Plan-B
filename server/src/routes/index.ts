"use strict";
import { Router } from "express";
import { z } from "zod";
import { createIdeasProvider } from "../llm/factory";
import { CloudflareProvider } from "../llm/cloudflare";
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

// Qualitative recovery tips via LLM (optional provider method); numbers stay
// in the engine, so this endpoint is purely advisory.
router.post("/recovery-tips", async (req: Request, res: Response) => {
  try {
    const { scenario, eventType } = z
      .object({ scenario: z.string().min(1).max(80), eventType: z.string().min(1).max(40) })
      .parse(req.body);
    const provider = createIdeasProvider();
    if (!provider.recoveryTips) {
      res.json({ success: true, data: { tips: [], source: 'fallback' } });
      return;
    }
    const tips = await provider.recoveryTips(scenario, eventType);
    res.json({ success: true, data: { tips, source: provider instanceof CloudflareProvider ? 'ai' : 'fallback' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    // A failed tips call must never break the disruption flow.
    console.error('recovery-tips failed:', error instanceof Error ? error.message : error);
    res.json({ success: true, data: { tips: [], source: 'fallback' } });
  }
});

// Context-aware chat grounded in the user's real plan.
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, plan } = z
      .object({ message: z.string().min(1).max(500), plan: z.any().optional() })
      .parse(req.body);
    const provider = createIdeasProvider();
    const planSummary = plan
      ? `eventType=${plan.setup?.eventType}, city=${plan.setup?.city}, guests=${plan.setup?.guests}, budget=${plan.setup?.budget}, total=${plan.budget?.total}, contingency=${plan.budget?.contingency?.amount}, topLines=${(plan.budget?.lines ?? []).map((l: { label: string; amount: number }) => `${l.label}=${l.amount}`).join(', ')}`
      : 'no plan generated yet';
    if (!provider.chat) {
      res.json({ success: true, data: { reply: `I can help with budget, vendors and timelines. Generate a plan first so I can ground answers in your real numbers. (Offline mode.)`, source: 'fallback' } });
      return;
    }
    const reply = await provider.chat(message, planSummary);
    res.json({ success: true, data: { reply, source: provider instanceof CloudflareProvider ? 'ai' : 'fallback' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    console.error('chat failed:', error instanceof Error ? error.message : error);
    res.json({ success: true, data: { reply: 'I could not reach the AI service just now — please retry.', source: 'fallback' } });
  }
});

// Budget optimizer grounded in the user's actual budget lines.
router.post("/ai/budget-optimizer", async (req: Request, res: Response) => {
  try {
    const plan = z.object({ plan: z.any() }).parse(req.body).plan;
    const lines = plan?.budget?.lines ?? [];
    if (!lines.length) {
      res.status(400).json({ success: false, error: 'A plan with budget lines is required' });
      return;
    }
    const provider = createIdeasProvider();
    const budgetSummary = lines.map((l: { label: string; amount: number; percent?: number }) => `${l.label}=₹${l.amount}${l.percent ? ` (${l.percent}%)` : ''}`).join(', ');
    if (!provider.optimizeBudget) {
      res.json({ success: true, data: { suggestions: [], source: 'fallback' } });
      return;
    }
    const suggestions = await provider.optimizeBudget(budgetSummary);
    // Recompute savings server-side so the UI never trusts model math.
    const validated = suggestions.suggestions.map((s) => ({
      ...s,
      savings: Math.max(0, s.currentCost - s.suggestedCost),
      fitsBudget: true,
    }));
    res.json({ success: true, data: { suggestions: validated, source: provider instanceof CloudflareProvider ? 'ai' : 'fallback' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    console.error('budget-optimizer failed:', error instanceof Error ? error.message : error);
    res.json({ success: true, data: { suggestions: [], source: 'fallback' } });
  }
});

// Risk analysis grounded in the actual plan facts.
router.post("/ai/risk-analysis", async (req: Request, res: Response) => {
  try {
    const plan = z.object({ plan: z.any() }).parse(req.body).plan;
    if (!plan?.budget || !plan?.setup) {
      res.status(400).json({ success: false, error: 'A valid plan is required' });
      return;
    }
    const provider = createIdeasProvider();
    const rushDays = plan.timeline?.daysAvailable ?? plan.timeline?.totalDays ?? 0;
    const planSummary = [
      `eventType=${plan.setup.eventType}, city=${plan.setup.city}, guests=${plan.setup.guests}`,`eventDate=${plan.setup.eventDate}, daysAvailable=${rushDays}, rushMode=${plan.timeline?.rushMode ?? false}`,`budgetTotal=${plan.budget.total}, perGuest=${plan.budget.realism?.perGuest}, verdict=${plan.budget.realism?.verdict}`,`topLines=${plan.budget.lines.map((l: { label: string; amount: number }) => `${l.label}=₹${l.amount}`).join(', ')}`,`vendorsNeedingBackup=${(plan.vendors?.items ?? []).filter((v: { needsBackup: boolean }) => v.needsBackup).map((v: { category: string }) => v.category).join(', ')}`,
    ].join('\n');
    if (!provider.analyzeRisks) {
      res.json({ success: true, data: { risks: [], source: 'fallback' } });
      return;
    }
    const analysis = await provider.analyzeRisks(planSummary);
    res.json({ success: true, data: { risks: analysis.risks, source: provider instanceof CloudflareProvider ? 'ai' : 'fallback' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      handleZodError(res, error);
      return;
    }
    console.error('risk-analysis failed:', error instanceof Error ? error.message : error);
    res.json({ success: true, data: { risks: [], source: 'fallback' } });
  }
});

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rate limiting is applied in app.ts to keep this file focused on routing.

export default router;
