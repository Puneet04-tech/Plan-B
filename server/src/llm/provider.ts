"use strict";

import type {
  BudgetSuggestion,
  EventType,
  IdeaCategory,
  Ideas,
  IdeasSource,
  RiskFactor,
} from "@shared/types";

/** Inputs for idea generation — caps come from the engine, never the LLM. */
export interface IdeasInput {
  eventType: EventType;
  city: string;
  guests: number;
  budget: number;
  theme?: string;
  caps: Record<IdeaCategory, number>;
}

export interface IdeasProviderResult {
  ideas: Ideas;
  source: IdeasSource;
}

export interface IdeasProvider {
  generate(input: IdeasInput): Promise<IdeasProviderResult>;
  generateStream?(input: IdeasInput): AsyncGenerator<string, void, unknown>;
  recoveryTips?(scenarioLabel: string, eventType: string): Promise<string[]>;
  chat?(userMessage: string, planSummary: string): Promise<string>;
  optimizeBudget?(budgetSummary: string): Promise<{ suggestions: Array<Omit<BudgetSuggestion, 'savings' | 'fitsBudget'>> }>;
  analyzeRisks?(planSummary: string): Promise<{ risks: RiskFactor[] }>;
}
