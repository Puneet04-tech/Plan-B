"use strict";

import { Router } from "express";
import { CloudflareProvider } from "../llm/cloudflare";
import { FallbackProvider } from "../llm/fallback";
import { createIdeasProvider } from "../llm/factory";
import type { IdeasProvider } from "../llm/provider";
import { buildBudget, ideaCaps } from "../engine/budget";
import { parseBody, sendData } from "../http/respond";
import { asyncRoute } from "../http/respond";
import {
  summarizeBudgetLines,
  summarizePlanForChat,
  summarizePlanForRisks,
} from "../services/plan";
import {
  ChatRequestSchema,
  PlanOnlyRequestSchema,
  PlanRequestSchema,
  RecoveryTipsRequestSchema,
} from "../validation/schemas";

const router = Router();

const fallbackProvider = new FallbackProvider();

/** True when the answer really came from Workers AI, not curated content. */
const sourceOf = (provider: IdeasProvider): "ai" | "fallback" =>
  provider instanceof CloudflareProvider ? "ai" : "fallback";

function logFailure(endpoint: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${endpoint}] ${message}`);
}

/** Personalized ideas. Falls back to curated content if the model fails. */
router.post(
  "/ideas",
  asyncRoute(async (req, res) => {
    const input = parseBody(PlanRequestSchema, req.body, res);
    if (!input) return;

    const budget = buildBudget(input.eventType, input.guests, input.budget);
    const provider = createIdeasProvider();
    const request = {
      eventType: input.eventType,
      city: input.city,
      guests: input.guests,
      budget: input.budget,
      theme: input.theme,
      caps: ideaCaps(budget),
    };

    try {
      sendData(res, await provider.generate(request));
    } catch (error) {
      logFailure("ideas", error);
      sendData(res, await fallbackProvider.generate(request));
    }
  }),
);

/** Qualitative recovery tips; numbers stay in the deterministic engine. */
router.post(
  "/recovery-tips",
  asyncRoute(async (req, res) => {
    const input = parseBody(RecoveryTipsRequestSchema, req.body, res);
    if (!input) return;

    const provider = createIdeasProvider();
    if (!provider.recoveryTips) {
      sendData(res, { tips: [], source: "fallback" });
      return;
    }
    try {
      sendData(res, {
        tips: await provider.recoveryTips(input.scenario, input.eventType),
        source: sourceOf(provider),
      });
    } catch (error) {
      // A failed tips call must never break the disruption flow.
      logFailure("recovery-tips", error);
      sendData(res, { tips: [], source: "fallback" });
    }
  }),
);

/** Context-aware chat grounded in the user's real plan. */
router.post(
  "/chat",
  asyncRoute(async (req, res) => {
    const input = parseBody(ChatRequestSchema, req.body, res);
    if (!input) return;

    const provider = createIdeasProvider();
    if (!provider.chat) {
      sendData(res, {
        reply:
          "I can help with budget, vendors and timelines. Generate a plan first so I can ground answers in your real numbers. (Offline mode.)",
        source: "fallback",
      });
      return;
    }
    try {
      const planSummary = input.plan
        ? summarizePlanForChat(input.plan)
        : "no plan generated yet";
      sendData(res, {
        reply: await provider.chat(input.message, planSummary),
        source: sourceOf(provider),
      });
    } catch (error) {
      logFailure("chat", error);
      sendData(res, {
        reply: "I could not reach the AI service just now — please retry.",
        source: "fallback",
      });
    }
  }),
);

/** Budget optimizer grounded in the user's actual budget lines. */
router.post(
  "/ai/budget-optimizer",
  asyncRoute(async (req, res) => {
    const { plan } = parseBody(PlanOnlyRequestSchema, req.body, res) ?? {};
    if (!plan) return;

    const provider = createIdeasProvider();
    if (!provider.optimizeBudget) {
      sendData(res, { suggestions: [], source: "fallback" });
      return;
    }
    try {
      const { suggestions } = await provider.optimizeBudget(summarizeBudgetLines(plan));
      // Recompute savings server-side so the UI never trusts model math.
      sendData(res, {
        suggestions: suggestions.map((suggestion) => ({
          ...suggestion,
          savings: Math.max(0, suggestion.currentCost - suggestion.suggestedCost),
          fitsBudget: true,
        })),
        source: sourceOf(provider),
      });
    } catch (error) {
      logFailure("budget-optimizer", error);
      sendData(res, { suggestions: [], source: "fallback" });
    }
  }),
);

/** Risk analysis grounded in the actual plan facts. */
router.post(
  "/ai/risk-analysis",
  asyncRoute(async (req, res) => {
    const { plan } = parseBody(PlanOnlyRequestSchema, req.body, res) ?? {};
    if (!plan) return;

    const provider = createIdeasProvider();
    if (!provider.analyzeRisks) {
      sendData(res, { risks: [], source: "fallback" });
      return;
    }
    try {
      const { risks } = await provider.analyzeRisks(summarizePlanForRisks(plan));
      sendData(res, { risks, source: sourceOf(provider) });
    } catch (error) {
      logFailure("risk-analysis", error);
      sendData(res, { risks: [], source: "fallback" });
    }
  }),
);

export default router;
