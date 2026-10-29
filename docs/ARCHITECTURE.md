# Architecture

Plan B is a two-package TypeScript project with a shared type contract.

```
plan-b/
├── shared/types.ts        API contract imported by both packages
├── server/                Express API (TypeScript, Node 20)
│   ├── src/engine/        deterministic pure engines
│   ├── src/llm/           provider interface + Cloudflare/fallback providers
│   ├── src/routes/        thin HTTP handlers
│   ├── src/services/      plan assembly + prompt grounding summaries
│   ├── src/validation/    Zod request schemas
│   ├── src/http/          response envelope helpers
│   ├── src/lib/           IST date helpers
│   ├── src/data/          editable assumptions (ranges, vendor templates)
│   └── tests/             Vitest: engines, validation, routes, provider
└── client/                React 18 + Vite web app
    ├── src/components/    one component per feature surface
    ├── src/lib/           API client, i18n, theme, localStorage helpers
    └── src/index.css      design tokens and layout
```

## Request flow

```
React view
  → client/src/lib/api.ts (axios, unwraps the { success, data } envelope)
    → POST /api/<route>
      → routes/*.ts        parse body with Zod
        → engine/*         compute numbers (pure, deterministic)
        → llm/*            optional creative content
      → { success: true, data } | { success: false, error, details }
```

The server is stateless. The client keeps the returned `PlanBundle` in React
state and sends it back when it needs a replan, so no session store is required.

## Why the split between engines and LLM

The product promise is "realistic numbers that survive a surprise". That means:

1. **Budgets, dates and task order are computed, never generated.** The engines
   in `server/src/engine/` are pure functions of their inputs plus an injected
   `today` timestamp. They are covered by unit tests that assert exact totals,
   rounding behaviour and date edge cases.
2. **The model only writes prose and ideas.** Ideas are cap-checked against the
   real budget lines; chat and risk prompts are grounded in a deterministic
   summary of the plan; savings are recomputed server-side.
3. **Every AI path degrades instead of failing.** `createIdeasProvider()` returns
   the Cloudflare provider when credentials exist, otherwise a curated
   `FallbackProvider`. Handlers also fall back if the call throws, and the
   response says which source produced it.

## Invariants worth protecting

| Invariant                                              | Where it is enforced                        |
| ------------------------------------------------------ | ------------------------------------------- |
| Budget lines sum exactly to the total                  | `engine/budget.ts` (remainder to largest)   |
| Template percentages sum to 100 including contingency  | `engine/budget.ts`, tested                  |
| A replanned budget still reconciles                    | `engine/disruptions.ts`, tested per scenario |
| Dependencies are never due after their dependent        | `engine/scheduler.ts`                       |
| Dates are IST calendar days and never in the past      | `engine/scheduler.ts`, `lib/dates.ts`       |
| Trimming hits low-priority lines before venue/catering | `data/ranges.ts` `trimPriority`             |
| LLM output is schema-valid and within caps             | `llm/ai-outputs.ts`, `llm/cloudflare.ts`    |

## Frontend structure

`App.tsx` owns the top-level state (current plan, ideas, loading, error, theme,
language) and composes feature views. Views are presentational and receive the
plan as props; only `lib/api.ts` talks to the network and only
`lib/vendorStorage.ts` touches `localStorage`.

The UI never recomputes money or dates: it renders what the API returned, which
keeps a single source of truth for every number the user sees.

## Adding an AI feature

1. Define the output shape in `server/src/llm/ai-outputs.ts` with a Zod schema.
2. Add an optional method to `IdeasProvider` in `server/src/llm/provider.ts`.
3. Implement it once in `CloudflareProvider` using the shared `runJson` helper.
4. Add the route in `server/src/routes/ai.ts` with a grounding summary from
   `server/src/services/plan.ts` and a fallback response.
5. Surface it in the client via `lib/api.ts` and a small view component.
