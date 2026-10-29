"use strict";

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { ApiSuccess } from "@shared/types";

type AnySchema<T> = {
  safeParse: (
    input: unknown,
  ) => { success: true; data: T } | { success: false; error: ZodError };
};

/** One place that knows the success/error envelope shape. */
export function sendData<T>(res: Response, data: T): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.json(body);
}

export function sendError(res: Response, status: number, error: string): void {
  res.status(status).json({ success: false, error });
}

/** Map a Zod failure onto the documented 400 envelope with field paths. */
export function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    success: false,
    error: "Validation failed",
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

/**
 * Parse a request body and answer with a 400 when it does not match the
 * schema. Returns `undefined` after responding, so handlers can early-return.
 */
export function parseBody<T>(
  schema: AnySchema<T>,
  body: unknown,
  res: Response,
): T | undefined {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  sendValidationError(res, parsed.error);
  return undefined;
}

/** Wrap an async route so a rejection reaches the Express error handler. */
export function asyncRoute(
  handler: (req: Request, res: Response) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}
