"use strict";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import planRoutes from "./routes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173" }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Stricter limits on LLM-adjacent and disruption endpoints.
const ideasLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
const disruptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/ideas", ideasLimiter);
app.use("/api/disrupt", disruptLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", planRoutes);

// 404 before error handler; no stack traces or secrets in responses.
app.use((req: express.Request, res: express.Response) => {
  res
    .status(404)
    .json({
      success: false,
      error: `Route ${req.method} ${req.path} not found`,
    });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  },
);

export default app;
