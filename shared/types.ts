"use strict";

// ---------------------------------------------------------------------------
// Shared types used by both server and client. This is the single source of
// truth for the API contract (server/src and client/src both import from here
// via path aliases).
// ---------------------------------------------------------------------------

export type EventType = "wedding" | "birthday" | "community";

export type Verdict = "tight" | "comfortable" | "generous";

export interface BudgetLine {
  /** machine key, e.g. "catering" */
  key: string;
  /** human label shown in the UI, e.g. "Catering" */
  label: string;
  amount: number;
  percent: number;
  /** per-guest figure for guest-driven categories, otherwise undefined */
  perGuest?: number;
  /** budget lines that idea categories map onto (used by the ideas caps) */
  ideaCategory?: IdeaCategory;
}

export type IdeaCategory = "decor" | "menu" | "activities" | "entertainment";

export interface Realism {
  verdict: Verdict;
  perGuest: number;
  rangeMin: number;
  rangeMax: number;
  reason: string;
}

export interface BudgetPlan {
  lines: BudgetLine[];
  total: number;
  perGuest: number;
  contingency: {
    key: "contingency";
    label: string;
    amount: number;
    percent: number;
  };
  realism: Realism;
}

export type TaskCriticality = "high" | "medium" | "low";
export type TaskStatus = "overdue" | "due-soon" | "upcoming";

export interface TaskTemplateItem {
  id: string;
  title: string;
  category: string;
  /** days before the event this should be done */
  leadDays: number;
  dependsOn: string[];
  criticality: TaskCriticality;
  vendorCategory?: string;
}

export interface ScheduledTask {
  id: string;
  title: string;
  category: string;
  criticality: TaskCriticality;
  dueDate: string; // ISO
  displayDate: string; // e.g. "6 Nov 2026"
  status: TaskStatus;
  isOnCriticalPath: boolean;
  vendorCategory?: string;
}

export interface TimelinePlan {
  tasks: ScheduledTask[];
  totalDays: number;
  criticalPath: string[];
  criticalPathLabel: string;
  rushMode: boolean;
  rushMessage?: string;
  eventDate: string; // ISO
  daysAvailable: number;
}

export type VendorStatus = "to-contact" | "quoted" | "booked";
export type RiskLevel = "high" | "medium" | "low";

export interface VendorItem {
  id: string;
  category: string;
  /** budget line key this vendor maps to */
  budgetKey: string;
  questions: string[];
  documents: string[];
  advancePaymentGuidance: string;
  /** days before the event the booking must be confirmed (links to scheduler) */
  confirmLeadDays: number;
  estimatedCost: number;
  riskLevel: RiskLevel;
  needsBackup: boolean;
  complianceNote?: string;
}

export interface VendorChecklistItem extends VendorItem {
  status: VendorStatus;
  contacted: boolean;
  notes: string;
}

export interface VendorPlan {
  items: VendorItem[];
}

// --- Disruptions ------------------------------------------------------------

export type ScenarioType =
  | "venue-cancelled"
  | "rain"
  | "guest-count-up-30"
  | "budget-cut-20"
  | "vendor-no-show-caterer";

export interface BudgetChange {
  category: string;
  from: number;
  to: number;
  reason: string;
}

export interface TaskChange {
  id: string;
  from: string; // display date or label before
  to: string; // display date or label after
  reason: string;
}

export interface AddedTask {
  title: string;
  dueDate: string;
  displayDate: string;
  criticality: TaskCriticality;
  reason: string;
}

export interface DisruptionDiff {
  scenario: ScenarioType;
  label: string;
  before: number;
  after: number;
  budgetChanges: BudgetChange[];
  taskChanges: TaskChange[];
  addedTasks: AddedTask[];
  warnings: string[];
  infeasible: boolean;
}

export interface DisruptionResult {
  plan: PlanBundle;
  diff: DisruptionDiff;
}

// --- Full plan ---------------------------------------------------------------

export interface EventSetup {
  eventType: EventType;
  /** ISO date string (yyyy-mm-dd) */
  eventDate: string;
  city: string;
  guests: number;
  budget: number;
  theme?: string;
}

export interface PlanBundle {
  setup: EventSetup;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  vendors: VendorPlan;
  readiness: {
    score: number; // 0-100
    bookedVendors: number;
    totalVendors: number;
  };
}

// --- Ideas -------------------------------------------------------------------

export interface IdeaItem {
  title: string;
  description: string;
  estimatedCost: number;
  category: IdeaCategory;
  fitsBudget: boolean;
  /** how much it exceeds its category cap by, when it fits=false */
  overBy?: number;
}

export interface Ideas {
  themeConcept: string; // free text, its cost lives in decor
  items: IdeaItem[];
}

export type IdeasSource = "ai" | "fallback";

export interface IdeasResponse {
  ideas: Ideas;
  source: IdeasSource;
}

// --- AI feature payloads (chat, optimizer, risk) ------------------------------

export type SuggestionType = "reduce" | "reallocate" | "negotiate";

export interface BudgetSuggestion {
  category: string;
  currentCost: number;
  suggestedCost: number;
  /** server-computed: currentCost - suggestedCost, never trusted from the model */
  savings: number;
  description: string;
  type: SuggestionType;
  fitsBudget: boolean;
}

export type RiskCategory = "budget" | "timeline" | "vendor" | "weather" | "logistics";
export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface RiskFactor {
  category: RiskCategory;
  title: string;
  description: string;
  probability: number;
  impact: number;
  severity: RiskSeverity;
  mitigation: string;
}

// --- API envelopes -----------------------------------------------------------

export interface PlanRequest {
  eventType: EventType;
  eventDate: string;
  city: string;
  guests: number;
  budget: number;
  theme?: string;
}

export interface DisruptRequest {
  plan: PlanBundle;
  scenario: ScenarioType;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}
