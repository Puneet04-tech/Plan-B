"use strict";

import { Router } from "express";
import aiRoutes from "./ai";
import disruptionRoutes from "./disruptions";
import healthRoutes from "./health";
import planRoutes from "./plan";

/**
 * API surface. Each feature owns a router so handlers, validation and tests
 * stay small and independently readable:
 *
 *   GET  /health              liveness probe
 *   POST /plan                deterministic budget + timeline + vendors
 *   POST /disrupt             replan after a disruption scenario
 *   POST /ideas               AI ideas (falls back to curated content)
 *   POST /chat                AI chat grounded in the current plan
 *   POST /recovery-tips       qualitative disruption advice
 *   POST /ai/budget-optimizer AI savings suggestions
 *   POST /ai/risk-analysis    AI risk register
 */
const router = Router();

router.use(healthRoutes);
router.use(planRoutes);
router.use(disruptionRoutes);
router.use(aiRoutes);

export default router;
