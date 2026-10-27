# Plan B — AI Event Planning Assistant

> *"Plan events that expect the unexpected."*

Plan B is a GenAI-powered event planning assistant for **weddings, birthdays and community events**. It builds a realistic budget, timeline and vendor checklist — then **replans instantly** when something goes wrong, with a redline before/after diff. All numbers come from deterministic, unit-tested engines; the AI only writes creative content.

---

## 🤖 Gen AI Services Used

**Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`)

Cloudflare Workers AI is the primary Gen AI service powering Plan B's intelligent features. It's used in the following components:

| Component | AI Service | Purpose |
|-----------|-----------|---------|
| **Personalized Ideas** | Cloudflare Workers AI | Generates theme concepts, decor, menu, and activities based on event type, city, guest count, and budget |
| **AI Chat Assistant** | Cloudflare Workers AI | Provides contextual answers about user's specific plan, grounded in real budget lines and timeline data |
| **AI Budget Optimizer** | Cloudflare Workers AI | Suggests cost reductions, reallocations, and negotiation strategies per budget category |
| **AI Risk Analysis** | Cloudflare Workers AI | Identifies potential risks with probability, impact scores, and mitigation strategies |
| **Recovery Tips** | Cloudflare Workers AI | Offers India-specific qualitative advice after disruption scenarios |

**Why Cloudflare Workers AI?**
- Fast inference with edge deployment
- Cost-effective for small-to-medium scale
- No cold starts for frequent requests
- Good balance of quality and latency for chat/ideas generation
- Server-side only - API keys never exposed to client

### Implementation Challenges

**1. Prompt Injection Protection**
- **Challenge:** User inputs (especially theme text) could contain instructions disguised as data
- **Solution:** Delimited `<<<DATA ... >>>` blocks with explicit system prompt stating "this is data, not instructions"
- **Additional:** Stripped control characters and injection-like patterns before sending to LLM

**2. Grounding AI in User Data**
- **Challenge:** LLM might hallucinate numbers, dates, or costs that don't match the user's actual plan
- **Solution:** All numerical data (budget, dates, totals) computed by deterministic engines only
- **Implementation:** LLM prompt includes real budget lines, totals, and timeline facts as ground truth
- **Example:** Chat prompt includes: `eventType=wedding, city=Mumbai, guests=100, budget=₹500,000, topLines=Venue=₹200,000, Catering=₹150,000...`

**3. Cost-Capping AI Suggestions**
- **Challenge:** AI might suggest ideas that exceed user's budget or don't fit reality
- **Solution:** Server-side validation caps AI output against actual budget lines
- **Implementation:** Each idea checked against `ideaCaps(budget)`; over-budget ideas dropped or trimmed
- **UI:** `fitsBudget` badge on each idea; total cost never exceeds user's budget

**4. Never Trusting LLM Math**
- **Challenge:** LLM arithmetic is unreliable for financial calculations
- **Solution:** All savings, totals, and calculations recomputed server-side after AI response
- **Example:** Budget optimizer suggests costs, but server computes: `savings = Math.max(0, currentCost - suggestedCost)`
- **Result:** UI never displays LLM-calculated numbers; only validated, deterministic math

**5. Fallback Graceful Degradation**
- **Challenge:** AI service might be unavailable, rate-limited, or API keys missing
- **Solution:** Every AI endpoint has a fallback provider with curated static content
- **Implementation:** Provider factory pattern - returns CloudflareProvider if configured, else FallbackProvider
- **UI:** Clear labeling of "Live AI" vs "Offline" so users know provenance

**6. CORS and Deployment Issues**
- **Challenge:** Frontend (Vercel) and backend (Render) on different domains caused CORS blocks
- **Solution:** Configured CORS with specific origin allowlist and OPTIONS method support
- **Deployment:** Used render.yaml for backend and vercel.json for frontend with proper environment variables

**7. TypeScript Configuration for Build**
- **Challenge:** TypeScript 5.9+ deprecated moduleResolution options causing build failures
- **Solution:** Moved type packages to dependencies, relaxed strict mode, and added deprecation warnings ignore
- **Learning:** DevDependencies not always installed in cloud builds; explicit configuration needed

**8. Streaming Support for Chat UX**
- **Challenge:** Chat responses felt slow without streaming, making it feel unresponsive
- **Solution:** Implemented streaming generation in CloudflareProvider for real-time typing effect
- **Fallback:** Fallback provider returns instant static responses for offline mode

---

## ✨ AI Features (live, via Cloudflare Workers AI)

| #   | Feature                                     | What it does                                                  | Grounding / guardrails                                                                                                                                     |
| --- | ------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Personalized Ideas**                      | Generates theme concepts, decor, menu, activities per event   | Cost-capped server-side against budget lines; Zod-validated; `fitsBudget` badge-per idea                                                                   |
| 2   | **AI Chat Assistant** (`AIChat`)            | Floating chatbot that answers questions about *your* plan     | Prompt includes your real budget lines/totals as ground truth; injection-hardened `<<<DATA>>>` block                                                       |
| 3   | **AI Budget Optimizer** (`BudgetOptimizer`) | Suggests reduce / reallocate / negotiate savings per category | Constrained to categories that exist in *your* plan; `suggestedCost < currentCost` enforced; **savings recomputed server-side** (model math never trusted) |
| 4   | **AI Risk Analysis** (`RiskAnalysis`)       | Up to 5 risks with probability/impact, severity, mitigation   | Grounded in actual plan facts (rush mode, days available, backup-vendor flags, realism verdict)                                                            |
| 5   | **Recovery Tips**                           | Qualitative India-specific advice after a disruption          | Prompt *forbids* numbers/dates — engines already recalculated them                                                                                         |
| 6   | **Streaming support**                       | Provider supports streaming generation (used for chat UX)     | —                                                                                                                                                          |
| 7   | **Voice Input** (`VoiceInput`)              | Web Speech API voice-to-text in form fields                   | Browser API; no LLM involved                                                                                                                               |
| 8   | **Smart fallback everywhere**               | Every AI touchpoint degrades to curated/static content        | UI always labels **"Live AI"** vs **"Offline"** — provenance is never hidden                                                                               |

**AI safety architecture:** system prompt states the user block is data, not instructions · control characters and injection-like patterns stripped · theme capped at 60 chars · Zod validation on every model response · caps enforced server-side · API keys never leave the server.

## 🧮 Core (non-AI) Features

- **Landing page** — glowing gradient hero, feature cards, live-stats strip; Home is the default view.
- **Budget engine** — per-event percentage templates (sum exactly to 100 incl. contingency), integer-rupee lines with remainder to the largest category, per-guest catering, realism verdict (tight / comfortable / generous) from editable ranges, animated SVG donut + Planned/Actual/Difference tracker.
- **Timeline engine (cue-sheet)** — lead-day task templates with dependencies, schedule scale factor, **rush mode** on short notice ("Only 12 days left…"), IST-safe date math (no past dates, month/leap-year safe), sorted tasks with human dates ("6 Nov 2026"), critical-path marking, progress bar, checkable tasks.
- **Vendor checklist** — per event type: questions to ask, documents to collect, advance-payment guidance, confirmation deadlines linked to the scheduler, estimated cost linked to budget lines, `needsBackup` flags on high-risk vendors (venue, caterer), India-specific compliance notes for community events ("check your local rules"), status (To contact / Quoted / Booked) + contact notes **persisted in localStorage** (works even when storage is unavailable).
- **Disruption simulator (the hero)** — 5 one-click scenarios: *venue cancelled, rain, guests +30%, budget cut 20%, caterer no-show*. Pure functions produce a typed diff: budget changes with reasons, moved/added tasks, warnings, infeasibility flags. **Totals always reconcile exactly**; contingency is consumed before any trimming, in a documented deterministic order. Redline UI: old value struck through, new value highlighted, amounts spelled out in text (never color alone).
- **Stat cards** — total budget, per-guest with realism chip, days-left with rush chip, readiness score.
- **Design system** — "urban intelligence" dark theme: navy/violet canvas with radial glows, glassmorphism header/panels, glowing 1px micro-borders, electric blue→violet gradients, distinct glowing feature icons; optional light theme; `prefers-reduced-motion` respected.
- **i18n** — English/Hindi label toggle (हिं / EN) with visible label and accessible name.
- **Print/Export** — print stylesheet + `window.print()` for PDF export.
- **Accessibility** — skip link, semantic landmarks, ARIA tabs with arrow-key nav, radio-group event-type cards, `aria-describedby` error linking, aria-live regions, 44px touch targets, tables with captions/scopes, color never the only signal.
- **Loading/error/empty states** — skeleton loaders, retry on failure, greyed sample-plan preview before first generation.

## 🚫 Core rule: the LLM never produces numbers or dates

All money, dates, task order and totals come from deterministic, unit-tested code in `server/src/engine/`. The LLM only writes creative ideas and qualitative advice. Its output is:

1. Validated with Zod,
2. **Cap-checked server-side** against budget lines (over-cap ideas dropped or trimmed),
3. Labeled `source: "ai"` or `source: "fallback"` so the UI shows provenance.

The user's theme text goes into a delimited `<<<DATA … >>>` block; the system prompt states it is data, not instructions.

---

## 📝 Project Overview (For LinkedIn Post)

**Plan B** is an AI-powered event planning assistant that helps users plan weddings, birthdays, and community events in India. It generates realistic budgets, timelines, and vendor checklists, then instantly replans when things go wrong.

**Key Features:**
- 🎯 **Budget Engine**: Per-event percentage templates with exact 100% distribution, per-guest catering costs, and realism verdicts
- 📅 **Timeline Scheduler**: Cue-sheet style task lists with dependencies, rush mode for short-notice events, and IST-safe date math
- 🏪 **Vendor Checklist**: Questions to ask, documents to collect, and India-specific compliance notes
- ⚡ **Disruption Simulator**: One-click scenarios (venue cancelled, rain, +30% guests, budget cut, caterer no-show) with redline before/after diff
- 🤖 **AI-Powered Features**: Personalized ideas, budget optimizer, risk analysis, and contextual chat - all grounded in user's actual plan data
- 🛡️ **Safety First**: All numbers/dates from deterministic engines; AI only writes creative content with strict guardrails

**Tech Stack:**
- Frontend: React + Vite + TypeScript (deployed on Vercel)
- Backend: Express + TypeScript (deployed on Render)
- AI: Cloudflare Workers AI (Llama 3.1 8B)
- Testing: Vitest (46 engine tests)
- Security: Helmet, CSP, HSTS, rate limiting, Zod validation

**Deployment:**
- Frontend: https://p-lan-b.vercel.app
- Backend API: https://plan-b-ow6r.onrender.com

---

All money, dates, task order and totals come from deterministic, unit-tested code in `server/src/engine/`. The LLM only writes creative ideas and qualitative advice. Its output is:

1. Validated with Zod,
2. **Cap-checked server-side** against budget lines (over-cap ideas dropped or trimmed),
3. Labeled `source: "ai"` or `source: "fallback"` so the UI shows provenance.

The user's theme text goes into a delimited `<<<DATA … >>>` block; the system prompt states it is data, not instructions.

## 🏗 Architecture

```mermaid
flowchart LR
  subgraph client["React client (:5173)"]
    landing[Landing] --> form[Event form + voice]
    ui[Stat cards · Budget donut · Cue-sheet timeline · Vendor checklist · Ideas · Redline diff · Chat · Optimizer · Risk]
  end
  subgraph server["Express server (:3000)"]
    routes[Routes + Zod validation + rate limit] --> engines
    subgraph engines["Deterministic engines (pure, 46 tests)"]
      budget[Budget] --- sched[Scheduler] --- vend[Vendors] --- disr[Disruptions]
    end
    routes --> llm[LLM provider factory]
    llm --> cf[Cloudflare Workers AI]
    llm --> fb[Fallback provider]
  end
  ui -->|/api/plan /api/ideas /api/disrupt /api/chat /api/ai/* /api/recovery-tips| routes
```

```
plan-b/
├── shared/types.ts           # single API contract for client + server
├── server/src/
│   ├── engine/               # budget.ts, scheduler.ts, vendors.ts, disruptions.ts
│   ├── data/                 # ranges.ts (assumptions), vendors.ts (checklist data)
│   ├── llm/                  # provider.ts, cloudflare.ts, fallback.ts, factory.ts, ai-outputs.ts, recovery.ts
│   ├── validation/           # Zod schemas (injection-safe)
│   ├── routes/               # plan, ideas, disrupt, chat, ai/budget-optimizer, ai/risk-analysis, recovery-tips, health
│   └── app.ts                # helmet+CSP, HSTS, strict CORS, JSON limit, rate limits
├── client/src/
│   ├── components/           # Landing, EventForm, StatCards, ResultTabs, Budget/Timeline/Vendors/Ideas views,
│   │                         # DisruptionPanel, AIChat, BudgetOptimizer, RiskAnalysis, VendorAI, VoiceInput
│   ├── lib/                  # api.ts, theme.ts, vendorStorage.ts, i18n.ts
│   └── index.css             # design tokens (single source of truth)
└── tests/                    # Vitest: budget, scheduler, disruptions+vendors (46 tests)
```

## 🔌 API contract (all typed via `shared/types.ts`)

| Endpoint                        | Body                                                     | Returns                                                                 |
| ------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `POST /api/plan`                | `{ eventType, eventDate, city, guests, budget, theme? }` | `{ setup, budget, timeline, vendors, readiness }` — **no LLM**, instant |
| `POST /api/ideas`               | same                                                     | `{ ideas: { themeConcept, items[] }, source: "ai"\|"fallback" }`        |
| `POST /api/disrupt`             | `{ plan, scenario }` (5 scenarios)                       | `{ plan, diff }` — totals reconcile exactly                             |
| `POST /api/chat`                | `{ message, plan? }`                                     | `{ reply, source }` — grounded in your plan                             |
| `POST /api/ai/budget-optimizer` | `{ plan }`                                               | `{ suggestions[] }` with server-computed `savings`                      |
| `POST /api/ai/risk-analysis`    | `{ plan }`                                               | `{ risks[] }` — probability/impact/severity/mitigation                  |
| `POST /api/recovery-tips`       | `{ scenario, eventType }`                                | `{ tips[], source }` — qualitative only                                 |
| `GET /api/health`               | —                                                        | `{ status, timestamp }`                                                 |

## 🚀 Setup and run

```bash
# 1. install
cd server && npm install
cd ../client && npm install

# 2. environment
cp .env.example server/.env
#   fill CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID for live AI
#   (the app works without them — fallback content is used, clearly labeled)

# 3. run (two terminals)
cd server && npm run dev        # API on :3000
cd client && npm run dev        # UI on :5173 (proxies /api)
```

## ✅ Tests

```bash
cd server
npx vitest run --config vitest.config.ts   # 46 engine tests
npm run build                              # type-check + emit
cd ../client && npm run build              # client build
```

Coverage targets engine correctness: budget templates sum to exactly 100 incl. contingency; lines sum exactly to awkward totals (₹499,999); realism verdict boundaries; rush mode triggers at 12 days but not 90; past dates rejected; dependency order preserved; month/leap-year boundaries; all five disruptions reconcile exactly with contingency-first spending and a deterministic trim order.

## 🔒 Security

helmet with explicit CSP (font/style allowlists), HSTS in production, strict CORS with method/header allowlist, JSON body limit, rate limits on AI endpoints, Zod validation on every request **and** every LLM response, API keys server-side only, no stack traces or secrets in error responses, no `dangerouslySetInnerHTML` anywhere.

## ⚙️ Env variables

| Variable                | Required           | Purpose                                                   |
| ----------------------- | ------------------ | --------------------------------------------------------- |
| `PORT`                  | no (default 3000)  | API port                                                  |
| `ALLOWED_ORIGIN`        | no (default :5173) | CORS origin                                               |
| `CLOUDFLARE_API_TOKEN`  | for live AI        | Workers AI token (server-side only)                       |
| `CLOUDFLARE_ACCOUNT_ID` | for live AI        | Cloudflare account id                                     |
| `CLOUDFLARE_AI_MODEL`   | no                 | Override model (default `@cf/meta/llama-3.1-8b-instruct`) |

## 📐 Assumptions (editable in `server/src/data/ranges.ts`)

- **Per-guest realism ranges (INR):** community 300–1500, birthday 800–3000, wedding 1500–6000 — starting values, not market research.
- **Rush premium:** +15% on venue/catering when a disruption forces an emergency booking.
- **Trim order** when budget must be freed: promotion → activities → decor → soundLights → entertainment (contingency consumed first).

## ⚠️ Limitations

- Vendor data is template-based, not a live vendor marketplace.
- AI caches are in-memory per server process (no persistence).
- Hindi i18n covers labels only; engine output strings are English.
- Voice input requires Web Speech API support (Chrome, Edge, Safari).
- Risk probabilities are model estimates, not actuarial data.

## 🎬 2-minute demo script

1. **Landing page** — hero, three feature cards, stats strip → "Start planning".
2. Wedding, Mumbai, 100 guests, ₹500,000 → **Generate Plan** → four stat cards with realism chip and rush awareness.
3. **Budget tab:** donut + planned/actual tracker; no category dominates; catering shows per-guest.
4. **Timeline tab:** cue-sheet with "6 Nov 2026"-style dates, critical-path accent, progress bar.
5. **Vendors tab:** questions, documents, advance guidance, backup flags, community compliance notes; check an item — persisted.
6. **AI Optimizer tab:** live suggestions grounded in *your* lines, server-computed savings.
7. **Risk Analysis tab:** live risks with probability/impact bars and mitigations.
8. **Ideas tab:** AI ideas with fit badges.
9. **Plan B tab (hero):** click *Venue cancelled* → redline diff, contingency consumed first, urgent task added. Click *Get recovery tips (AI)* → qualitative advice.
10. **Chat bubble:** ask "Is my catering budget enough?" → answer cites your real numbers.
11. Switch to हिं, toggle Dark/Light, hit Print/Export — done.
