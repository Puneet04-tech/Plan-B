# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately
through GitHub's **Security → Report a vulnerability** flow on this repository,
or email the maintainer listed in `package.json`. Include reproduction steps and
the impact you expect. You will get an acknowledgement within a few days.

## Security model

Plan B is stateless: it stores no user accounts, no plans and no personal data
on the server. The threat surface is the HTTP API and the optional LLM call.

| Area                | Control                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Transport headers   | `helmet` with an explicit CSP and HSTS in production                                                        |
| CORS                | Explicit origin allowlist via `ALLOWED_ORIGIN`; methods and headers restricted                              |
| Body size           | JSON and urlencoded bodies capped at 100 kB                                                                 |
| Rate limiting       | 20 req/min on `/api/ideas`, 60 req/min on `/api/disrupt`                                                    |
| Input validation    | Zod schema on every request body; control characters stripped; both `/plan` and `/disrupt` fully validated   |
| Prompt injection    | User text is wrapped in a `<<<DATA … >>>` block; the system prompt states it is data, not instructions      |
| LLM output          | Every model response is parsed with Zod before use; over-cap ideas are trimmed or dropped                   |
| LLM arithmetic      | Never trusted — savings and totals are recomputed server-side                                               |
| Secrets             | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are server-side env vars; never shipped to the client      |
| Error responses     | Generic messages only; stack traces are logged, never returned                                              |
| Client-side storage | Only the vendor checklist status is kept in `localStorage`; no credentials                                  |

## Supported versions

The `master` branch receives fixes. There are no long-term support branches.
