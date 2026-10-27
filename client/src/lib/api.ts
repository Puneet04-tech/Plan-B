"use strict";

import axios from "axios";
import type {
  ApiError,
  ApiSuccess,
  BudgetSuggestion,
  IdeasResponse,
  PlanBundle,
  PlanRequest,
  DisruptionResult,
  RiskFactor,
  ScenarioType,
} from "@shared/types";

// In dev the Vite proxy serves /api; in production set VITE_API_BASE_URL to the
// backend origin (e.g. https://plan-b-api.onrender.com) — no trailing slash.
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL ?? "") + "/api",
  timeout: 30000,
});

function unwrap<T>(payload: ApiSuccess<T> | ApiError): T {
  if (payload.success) return payload.data;
  throw new Error(payload.error || "Request failed");
}

export async function fetchPlan(request: PlanRequest): Promise<PlanBundle> {
  const res = await api.post<ApiSuccess<PlanBundle> | ApiError>(
    "/plan",
    request,
  );
  return unwrap<PlanBundle>(res.data);
}

export async function fetchIdeas(request: PlanRequest): Promise<IdeasResponse> {
  const res = await api.post<ApiSuccess<IdeasResponse> | ApiError>(
    "/ideas",
    request,
  );
  return unwrap<IdeasResponse>(res.data);
}

export async function fetchDisruption(
  plan: PlanBundle,
  scenario: ScenarioType,
): Promise<DisruptionResult> {
  const res = await api.post<ApiSuccess<DisruptionResult> | ApiError>(
    "/disrupt",
    { plan, scenario },
  );
  return unwrap<DisruptionResult>(res.data);
}

export interface RecoveryTipsResponse {
  tips: string[];
  source: 'ai' | 'fallback';
}

export async function fetchRecoveryTips(
  scenarioLabel: string,
  eventType: string,
): Promise<RecoveryTipsResponse> {
  const res = await api.post<ApiSuccess<RecoveryTipsResponse> | ApiError>(
    '/recovery-tips',
    { scenario: scenarioLabel, eventType },
  );
  return unwrap<RecoveryTipsResponse>(res.data);
}

export interface ChatResponse {
  reply: string;
  source: 'ai' | 'fallback';
}

export async function fetchChat(message: string, plan?: PlanBundle): Promise<ChatResponse> {
  const res = await api.post<ApiSuccess<ChatResponse> | ApiError>('/chat', { message, plan });
  return unwrap<ChatResponse>(res.data);
}

export interface BudgetOptimizerResponse {
  suggestions: BudgetSuggestion[];
  source: 'ai' | 'fallback';
}

export async function fetchBudgetOptimizer(plan: PlanBundle): Promise<BudgetOptimizerResponse> {
  const res = await api.post<ApiSuccess<BudgetOptimizerResponse> | ApiError>('/ai/budget-optimizer', { plan });
  return unwrap<BudgetOptimizerResponse>(res.data);
}

export interface RiskAnalysisResponse {
  risks: RiskFactor[];
  source: 'ai' | 'fallback';
}

export async function fetchRiskAnalysis(plan: PlanBundle): Promise<RiskAnalysisResponse> {
  const res = await api.post<ApiSuccess<RiskAnalysisResponse> | ApiError>('/ai/risk-analysis', { plan });
  return unwrap<RiskAnalysisResponse>(res.data);
}

export { unwrap };
