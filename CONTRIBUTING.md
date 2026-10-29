# Contributing

Thanks for taking a look at Plan B. This repo is a two-package TypeScript
project (`server/` API and `client/` web app) that shares its API contract in
`shared/types.ts`.

## Prerequisites

- Node.js 20 or newer (see `.nvmrc`)
- npm 10 or newer

## Setup

```bash
npm ci                       # root tooling (prettier)
npm ci --prefix server       # API
npm ci --prefix client       # web app
cp .env.example server/.env  # optional: add Cloudflare credentials for live AI
```

The app runs without any API key: AI endpoints fall back to curated content and
label the response `source: "fallback"`.

## Run it

```bash
npm run dev:server   # http://localhost:3000
npm run dev:client   # http://localhost:5173 (proxies /api)
```

## Before opening a pull request

```bash
npm run verify
```

`verify` runs, in order: `format:check`, `lint`, `typecheck`, `test`, `build`.
The same command set runs in CI on every push and pull request.

Individual steps:

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm test`              | Server (Vitest) + client (Vitest) tests       |
| `npm run test:coverage` | Server test coverage report                   |
| `npm run typecheck`     | `tsc --noEmit` in both packages               |
| `npm run lint`          | ESLint in both packages                       |
| `npm run format`        | Apply Prettier to the repo                    |

## Project conventions

- **Engines are pure.** `server/src/engine/*` takes plain inputs and returns
  plain outputs. No I/O, no clock access — `today` is always passed in so tests
  are deterministic.
- **The LLM never produces numbers.** Money, dates, task order and totals come
  from the engines. AI output is validated with Zod and cap-checked before it
  reaches the client.
- **Money is integer rupees.** Rounding remainders are absorbed deliberately so
  budget lines always sum to the total.
- **Validation lives at the edge.** Every request body is parsed with a Zod
  schema from `server/src/validation/schemas.ts`; handlers stay thin.
- **Fail soft on AI.** AI endpoints degrade to curated content instead of
  returning a 5xx, and the response always tells the client which source it is.

## Adding a feature

1. Add or extend the type in `shared/types.ts`.
2. Put deterministic logic in `server/src/engine/` and unit-test it.
3. Add the Zod schema and route in `server/src/routes/`.
4. Wire the client through `client/src/lib/api.ts`.
5. Run `npm run verify`.

## Reporting bugs

Open an issue with the request body (no secrets), the expected result and the
actual result. Security issues should follow [SECURITY.md](SECURITY.md) instead
of the public tracker.
