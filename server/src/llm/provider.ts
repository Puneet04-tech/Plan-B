"use strict";

import type {
  BudgetPlan,
  EventType,
  IdeaCategory,
  Ideas,
  IdeasSource,
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
}
