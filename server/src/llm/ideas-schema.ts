"use strict";
import { z } from "zod";

// Zod schema used to validate Gemini's JSON output before it reaches the client
export const GeneratedIdeasSchema = z.object({
  themes: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      estimatedCost: z.number().nonnegative(),
      suitability: z.number().min(0).max(1),
    }),
  ),
  decor: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      estimatedCost: z.number().nonnegative(),
      setupTime: z.string(),
    }),
  ),
  menu: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      perPersonCost: z.number().nonnegative(),
      dietaryOptions: z.array(z.string()),
    }),
  ),
  activities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      duration: z.string(),
      estimatedCost: z.number().nonnegative(),
    }),
  ),
});
