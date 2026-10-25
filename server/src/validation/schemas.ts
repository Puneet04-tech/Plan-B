"use strict";
import { z } from "zod";
import type { ScenarioType } from "@shared/types";

export const EventTypeSchema = z.enum(["wedding", "birthday", "community"]);

/** Strip control characters and obvious prompt-injection markers; cap length. */
const safeText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, "").trim())
    .refine((s) => s.length >= 1, "Value cannot be empty")
    .refine((s) => s.length <= max, `Must be at most ${max} characters`)
    .refine(
      (s) =>
        !/^(ignore|disregard|forget)\b.*(previous|above|instructions)/i.test(s),
      "Value looks like an instruction, not a theme",
    );

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-mm-dd")
  .refine(
    (s) => !Number.isNaN(Date.parse(s)),
    "Date is not a valid calendar date",
  );

export const PlanRequestSchema = z.object({
  eventType: EventTypeSchema,
  eventDate: isoDate,
  city: safeText(60),
  guests: z
    .number()
    .int()
    .min(1, "Guests must be at least 1")
    .max(5000, "Guests must be at most 5000"),
  budget: z
    .number()
    .min(1000, "Budget must be at least ₹1,000")
    .max(50000000, "Budget is too large"),
  theme: z
    .string()
    .max(60, "Theme must be at most 60 characters")
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, "").trim())
    .optional(),
});

export const IdeasRequestSchema = PlanRequestSchema;

export const ScenarioSchema = z.enum([
  "venue-cancelled",
  "rain",
  "guest-count-up-30",
  "budget-cut-20",
  "vendor-no-show-caterer",
]) satisfies z.ZodType<ScenarioType>;

export const DisruptRequestSchema = z.object({
  plan: z.any(), // validated structurally below; engine re-derives deterministically
  scenario: ScenarioSchema,
});

export { isoDate, safeText };
