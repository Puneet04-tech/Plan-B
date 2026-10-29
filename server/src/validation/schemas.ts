"use strict";

import { z } from "zod";
import type { ScenarioType } from "@shared/types";

// --------------------------------------------------------------- primitives --

export const EventTypeSchema = z.enum(["wedding", "birthday", "community"]);

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const PROMPT_INJECTION = /^(ignore|disregard|forget)\b.*(previous|above|instructions)/i;

/** Strip control characters and obvious prompt-injection markers; cap length. */
export const safeText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, "").trim())
    .refine((s) => s.length >= 1, "Value cannot be empty")
    .refine((s) => s.length <= max, `Must be at most ${max} characters`)
    .refine(
      (s) => !PROMPT_INJECTION.test(s),
      "Value looks like an instruction, not a theme",
    );

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be yyyy-mm-dd")
  .refine((s) => {
    const parsed = Date.parse(`${s}T00:00:00Z`);
    if (Number.isNaN(parsed)) return false;
    // Reject roll-over dates such as 2026-02-31.
    return new Date(parsed).toISOString().slice(0, 10) === s;
  }, "Date is not a valid calendar date");

// ------------------------------------------------------------- plan request --

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
    .transform((s) => s.replace(CONTROL_CHARS, "").trim())
    .optional(),
});

export const IdeasRequestSchema = PlanRequestSchema;

export type PlanRequestInput = z.infer<typeof PlanRequestSchema>;

// -------------------------------------------------------------- plan bundle --

/**
 * Structural schema for the plan the client sends back to the stateless
 * endpoints (`/disrupt`, `/chat`, `/ai/*`). Everything is derived from
 * `shared/types.ts`; validating it here means a malformed payload is rejected
 * with a 400 instead of reaching an engine that assumes the shape.
 */
const BudgetLineSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  amount: z.number().nonnegative(),
  percent: z.number().nonnegative().max(100),
  perGuest: z.number().nonnegative().optional(),
  ideaCategory: z.enum(["decor", "menu", "activities", "entertainment"]).optional(),
});

const BudgetPlanSchema = z.object({
  lines: z.array(BudgetLineSchema).min(1).max(30),
  total: z.number().nonnegative(),
  perGuest: z.number().nonnegative(),
  contingency: z.object({
    key: z.literal("contingency"),
    label: z.string(),
    amount: z.number().nonnegative(),
    percent: z.number().nonnegative(),
  }),
  realism: z.object({
    verdict: z.enum(["tight", "comfortable", "generous"]),
    perGuest: z.number(),
    rangeMin: z.number(),
    rangeMax: z.number(),
    reason: z.string(),
  }),
});

const ScheduledTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  criticality: z.enum(["high", "medium", "low"]),
  dueDate: z.string(),
  displayDate: z.string(),
  status: z.enum(["overdue", "due-soon", "upcoming"]),
  isOnCriticalPath: z.boolean(),
  vendorCategory: z.string().optional(),
});

const TimelinePlanSchema = z.object({
  tasks: z.array(ScheduledTaskSchema).max(60),
  totalDays: z.number(),
  criticalPath: z.array(z.string()),
  criticalPathLabel: z.string(),
  rushMode: z.boolean(),
  rushMessage: z.string().optional(),
  eventDate: z.string(),
  daysAvailable: z.number(),
});

const VendorItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  budgetKey: z.string(),
  questions: z.array(z.string()),
  documents: z.array(z.string()),
  advancePaymentGuidance: z.string(),
  confirmLeadDays: z.number(),
  estimatedCost: z.number().nonnegative(),
  riskLevel: z.enum(["high", "medium", "low"]),
  needsBackup: z.boolean(),
  complianceNote: z.string().optional(),
});

export const PlanBundleSchema = z.object({
  setup: z.object({
    eventType: EventTypeSchema,
    eventDate: isoDate,
    city: z.string().min(1).max(60),
    guests: z.number().int().min(1).max(5000),
    budget: z.number().positive(),
    theme: z.string().max(60).optional(),
  }),
  budget: BudgetPlanSchema,
  timeline: TimelinePlanSchema,
  vendors: z.object({ items: z.array(VendorItemSchema).max(40) }),
  readiness: z.object({
    score: z.number().min(0).max(100),
    bookedVendors: z.number().nonnegative(),
    totalVendors: z.number().nonnegative(),
  }),
});

export type PlanBundleInput = z.infer<typeof PlanBundleSchema>;

// ---------------------------------------------------------------- scenarios --

export const ScenarioSchema = z.enum([
  "venue-cancelled",
  "rain",
  "guest-count-up-30",
  "budget-cut-20",
  "vendor-no-show-caterer",
]) satisfies z.ZodType<ScenarioType>;

export const DisruptRequestSchema = z.object({
  plan: PlanBundleSchema,
  scenario: ScenarioSchema,
});

// --------------------------------------------------------------- ai requests --

export const ChatRequestSchema = z.object({
  message: safeText(500),
  plan: PlanBundleSchema.optional(),
});

export const RecoveryTipsRequestSchema = z.object({
  scenario: safeText(80),
  eventType: safeText(40),
});

export const PlanOnlyRequestSchema = z.object({ plan: PlanBundleSchema });

export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;
