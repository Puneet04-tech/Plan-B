"use strict";

import { z } from "zod";
import { RecoveryTipsSchema } from "./recovery";

/** Zod schema for one chat assistant reply. */
export const ChatReplySchema = z.object({
  reply: z.string().min(1).max(1200),
});

export type ChatReply = z.infer<typeof ChatReplySchema>;

/** Server-validated budget optimization suggestions. */
export const BudgetSuggestionSchema = z.object({
  category: z.string().min(1).max(60),
  currentCost: z.number().nonnegative(),
  suggestedCost: z.number().nonnegative(),
  description: z.string().min(1).max(400),
  type: z.enum(["reduce", "reallocate", "negotiate"]),
});

export type BudgetSuggestion = z.infer<typeof BudgetSuggestionSchema>;

export const BudgetSuggestionsSchema = z.object({
  suggestions: z.array(BudgetSuggestionSchema).max(5),
});

/** Server-validated risk factors. */
export const RiskFactorSchema = z.object({
  category: z.enum(["budget", "timeline", "vendor", "weather", "logistics"]),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  probability: z.number().min(0).max(1),
  impact: z.number().min(0).max(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  mitigation: z.string().min(1).max(300),
});

export type RiskFactor = z.infer<typeof RiskFactorSchema>;

export const RiskAnalysisSchema = z.object({
  risks: z.array(RiskFactorSchema).max(8),
});
