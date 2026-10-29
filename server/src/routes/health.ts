"use strict";

import { Router } from "express";

const router = Router();

/** Liveness probe used by Render's health check. */
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
