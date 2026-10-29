"use strict";

import { Router } from "express";
import { parseBody, sendData } from "../http/respond";
import { buildPlanBundle } from "../services/plan";
import { PlanRequestSchema } from "../validation/schemas";

const router = Router();

/** Deterministic plan: budget + timeline + vendor checklist, no LLM. */
router.post("/plan", (req, res) => {
  const input = parseBody(PlanRequestSchema, req.body, res);
  if (!input) return;
  sendData(res, buildPlanBundle(input, Date.now()));
});

export default router;
