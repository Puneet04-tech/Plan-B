# API reference

Base URL: `http://localhost:3000/api` locally, or the Render service URL in
production. All requests and responses are JSON.

Every successful response uses the same envelope:

```json
{ "success": true, "data": {} }
```

Every failure uses:

```json
{ "success": false, "error": "Validation failed", "details": [{ "path": "guests", "message": "…" }] }
```

`details` is present only for `400` validation failures.

---

## `GET /health`

Liveness probe used by Render.

```json
{ "status": "ok", "timestamp": "2026-10-29T10:00:00.000Z" }
```

---

## `POST /plan`

Deterministic plan assembly. No LLM call, so it is fast and reproducible.

**Body**

| Field       | Type                                | Rules                    |
| ----------- | ----------------------------------- | ------------------------ |
| `eventType` | `"wedding" \| "birthday" \| "community"` | required            |
| `eventDate` | `string` (`yyyy-mm-dd`)             | real calendar date, not in the past |
| `city`      | `string`                            | 1–60 chars, control chars stripped |
| `guests`    | `number`                            | integer, 1–5000          |
| `budget`    | `number`                            | 1 000–50 000 000 INR     |
| `theme`     | `string`                            | optional, max 60 chars   |

**Response data**: `PlanBundle` — `setup`, `budget`, `timeline`, `vendors`,
`readiness`. Budget lines always sum to `budget.total`.

---

## `POST /disrupt`

Replans after a disruption and returns a before/after diff.

**Body**

```json
{ "plan": { "...PlanBundle": true }, "scenario": "venue-cancelled" }
```

Scenarios: `venue-cancelled`, `rain`, `guest-count-up-30`, `budget-cut-20`,
`vendor-no-show-caterer`.

**Response data**

```json
{
  "plan": { "...PlanBundle": true },
  "diff": {
    "scenario": "venue-cancelled",
    "label": "Venue cancelled",
    "before": 500000,
    "after": 500000,
    "budgetChanges": [{ "category": "Contingency", "from": 50000, "to": 35000, "reason": "…" }],
    "taskChanges": [],
    "addedTasks": [{ "title": "Book replacement venue", "dueDate": "2026-12-23", "displayDate": "23 Dec 2026", "criticality": "high", "reason": "…" }],
    "warnings": [],
    "infeasible": false
  }
}
```

The replanned budget still sums to `diff.after`, and contingency is spent before
any category is trimmed.

---

## `POST /ideas`

Personalized ideas, one set per category (decor, menu, activities,
entertainment).

**Body**: same as `/plan`.

**Response data**

```json
{
  "ideas": {
    "themeConcept": "Warm traditional celebration with modern touches",
    "items": [
      {
        "title": "Marigold & fabric drapes",
        "description": "…",
        "estimatedCost": 30000,
        "category": "decor",
        "fitsBudget": true
      }
    ]
  },
  "source": "ai"
}
```

`source` is `"ai"` for Workers AI and `"fallback"` for curated content. Ideas
above their category cap are trimmed or dropped before the response is built.

---

## `POST /chat`

Context-aware answer grounded in the caller's plan.

**Body**

```json
{ "message": "Is my catering budget enough?", "plan": { "...PlanBundle": "optional" } }
```

**Response data**: `{ "reply": "…", "source": "ai" | "fallback" }`

---

## `POST /recovery-tips`

Qualitative advice after a disruption. Numbers stay in the engine, so the prompt
forbids the model from producing any.

**Body**: `{ "scenario": "Venue cancelled", "eventType": "wedding" }`

**Response data**: `{ "tips": ["…"], "source": "ai" | "fallback" }`

---

## `POST /ai/budget-optimizer`

Cost suggestions constrained to categories that already exist in the plan.

**Body**: `{ "plan": { "...PlanBundle": true } }`

**Response data**

```json
{
  "suggestions": [
    {
      "category": "Decor",
      "currentCost": 60000,
      "suggestedCost": 45000,
      "savings": 15000,
      "description": "…",
      "type": "reduce",
      "fitsBudget": true
    }
  ],
  "source": "ai"
}
```

`savings` is recomputed on the server (`currentCost - suggestedCost`, floored at
zero) so model arithmetic is never trusted.

---

## `POST /ai/risk-analysis`

Risk register grounded in real plan facts (days available, rush mode, backup
vendors, budget realism).

**Body**: `{ "plan": { "...PlanBundle": true } }`

**Response data**

```json
{
  "risks": [
    {
      "category": "timeline",
      "title": "Compressed setup window",
      "description": "…",
      "probability": 0.6,
      "impact": 0.7,
      "severity": "high",
      "mitigation": "…"
    }
  ],
  "source": "ai"
}
```

---

## Status codes

| Code  | Meaning                                                             |
| ----- | ------------------------------------------------------------------- |
| `200` | Success (AI endpoints also return `200` when they fall back)         |
| `400` | Body failed validation; `details` lists the offending fields         |
| `404` | Unknown route                                                       |
| `429` | Rate limit exceeded (`/api/ideas` 20/min, `/api/disrupt` 60/min)     |
| `500` | Unexpected server error — the message is generic by design           |
