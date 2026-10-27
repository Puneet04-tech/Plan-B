"use strict";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import planRoutes from "./routes";

dotenv.config();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "https://fonts.googleapis.com"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "connect-src": ["'self'", "http://localhost:3000", "https://localhost:3000"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

app.use(
  cors({
    // Comma-separated allowlist; wildcard `*` matches any origin (demo mode).
    origin: (origin, cb) => {
      const raw = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";
      const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
      if (allowed.includes("*") || !origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
    maxAge: 86400,
  }),
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
