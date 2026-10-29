"use strict";

import { Router } from "express";
import { applyScenario } from "../engine/disruptions";
import { parseBody, sendData } from "../http/respond";
import { DisruptRequestSchema } from "../validation/schemas";

const router = Router();

/**
 * Apply a disruption scenario to a plan. The plan arrives from the client, so
 * it is structurally validated first; the engine then recomputes every number
 * deterministically.
 */
router.post("/disrupt", (req, res) => {
  const { plan, scenario } = parseBody(DisruptRequestSchema, req.body, res) ?? {};
  if (!plan || !scenario) return;
  sendData(res, applyScenario(plan, scenario, Date.now()));
});

export default router;
