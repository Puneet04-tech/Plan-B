"use strict";

import axios from "axios";
import type {
  ApiError,
  ApiSuccess,
  IdeasResponse,
  PlanBundle,
  PlanRequest,
  DisruptionResult,
  ScenarioType,
} from "@shared/types";

const api = axios.create({ baseURL: "/api", timeout: 30000 });

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

export { unwrap };
