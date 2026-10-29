import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import app from "../src/app";
import { buildPlanBundle } from "../src/services/plan";

const TODAY = Date.UTC(2026, 9, 25);
const planRequest = {
  eventType: "wedding" as const,
  eventDate: "2026-12-25",
  city: "Mumbai",
  guests: 100,
  budget: 500000,
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not expose a TCP port");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

const post = (path: string, body: unknown): Promise<Response> =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("API routes", () => {
  it("GET /api/health reports ok", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  it("POST /api/plan returns a full bundle", async () => {
    const response = await post("/api/plan", planRequest);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.budget.lines.length).toBeGreaterThan(0);
    expect(body.data.timeline.tasks.length).toBeGreaterThan(0);
    expect(body.data.vendors.items.length).toBeGreaterThan(0);
    const sum = body.data.budget.lines.reduce(
      (total: number, line: { amount: number }) => total + line.amount,
      0,
    );
    expect(sum).toBe(planRequest.budget);
  });

  it("POST /api/plan rejects invalid input with field details", async () => {
    const response = await post("/api/plan", { ...planRequest, guests: 0 });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation failed");
    expect(Array.isArray(body.details)).toBe(true);
    expect(body.details[0].path).toBe("guests");
  });

  it("POST /api/disrupt returns a reconciled replan", async () => {
    const plan = buildPlanBundle(planRequest, TODAY);
    const response = await post("/api/disrupt", { plan, scenario: "venue-cancelled" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    const sum = body.data.plan.budget.lines.reduce(
      (total: number, line: { amount: number }) => total + line.amount,
      0,
    );
    expect(sum).toBe(body.data.diff.after);
    expect(body.data.diff.budgetChanges.length).toBeGreaterThan(0);
  });

  it("POST /api/disrupt rejects an unknown scenario", async () => {
    const plan = buildPlanBundle(planRequest, TODAY);
    const response = await post("/api/disrupt", { plan, scenario: "meteor" });
    expect(response.status).toBe(400);
  });

  it("POST /api/ideas serves curated content when no API key is set", async () => {
    const response = await post("/api/ideas", planRequest);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.source).toBe("fallback");
    expect(body.data.ideas.items.length).toBeGreaterThan(0);
  });

  it("POST /api/chat answers in offline mode without a plan", async () => {
    const response = await post("/api/chat", { message: "Is my catering enough?" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.source).toBe("fallback");
    expect(body.data.reply.length).toBeGreaterThan(0);
  });

  it("POST /api/chat rejects an empty message", async () => {
    const response = await post("/api/chat", { message: "" });
    expect(response.status).toBe(400);
  });

  it("POST /api/ai/budget-optimizer degrades to an empty list offline", async () => {
    const plan = buildPlanBundle(planRequest, TODAY);
    const response = await post("/api/ai/budget-optimizer", { plan });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.suggestions).toEqual([]);
  });

  it("POST /api/ai/risk-analysis degrades to an empty list offline", async () => {
    const plan = buildPlanBundle(planRequest, TODAY);
    const response = await post("/api/ai/risk-analysis", { plan });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.risks).toEqual([]);
  });

  it("POST /api/recovery-tips returns qualitative fallback tips", async () => {
    const response = await post("/api/recovery-tips", {
      scenario: "Venue cancelled",
      eventType: "wedding",
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tips.length).toBeGreaterThan(0);
    expect(body.data.source).toBe("fallback");
  });

  it("answers unknown routes with a 404 envelope", async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
