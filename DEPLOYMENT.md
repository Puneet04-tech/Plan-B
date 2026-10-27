# Render + Vercel deployment guide

Plan B is deployed as **two pieces**:

| Piece                    | Platform                      | What it runs                                             |
| ------------------------ | ----------------------------- | -------------------------------------------------------- |
| **API** (`server/`)      | **Render** (Node web service) | Express + engines + Cloudflare Workers AI proxy          |
| **Frontend** (`client/`) | **Vercel** (static site)      | Vite React build, `/api` calls pointed at the Render URL |

---

## 1. Deploy the API to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo. `render.yaml` at the root defines the `plan-b-api` Node service (build: `cd server && npm ci && npm run build`, start: `cd server && npm start`, health check `/api/health`).
3. In the service's **Environment** tab add:
   - `ALLOWED_ORIGIN` = your Vercel URL + localhost, comma-separated, e.g.
     `https://plan-b.vercel.app,http://localhost:5173`
   - `CLOUDFLARE_API_TOKEN` (secret) — optional; without it the API serves fallback AI content, clearly labeled "Offline" in the UI
   - `CLOUDFLARE_ACCOUNT_ID` (secret)
4. Deploy. Note the service URL, e.g. `https://plan-b-api.onrender.com`.
   - Verify: open `https://plan-b-api.onrender.com/api/health` → `{"status":"ok",...}`

> Free Render instances sleep after ~15 min idle; the first request after a cold start takes ~30 s.

## 2. Deploy the frontend to Vercel

1. In Vercel: **Add New → Project**, import the repo.
2. Vercel reads `vercel.json` automatically:
   - build: `cd client && npm install && npm run build`
   - output: `client/dist`
   - SPA rewrite so deep links serve `index.html`
   - hardened response headers (CSP, X-Frame-Options, nosniff, Referrer-Policy)
3. In **Settings → Environment Variables** add:
   - `VITE_API_BASE_URL` = the Render URL from step 1, **no trailing slash**
     (e.g. `https://plan-b-api.onrender.com`)
4. Deploy. Vercel prints the app URL, e.g. `https://plan-b.vercel.app`.

## 3. Wire the two together

- Render: set `ALLOWED_ORIGIN` to include the Vercel URL (step 1.3) and redeploy.
- Vercel: `VITE_API_BASE_URL` must point at the Render URL (step 2.3). Vite inlines `VITE_*` vars at build time — change it and redeploy.

## 4. Verify

1. `curl https://<render-url>/api/health` → `{"status":"ok"}`
2. Open the Vercel URL → landing page loads, Generate Plan works.
3. If Cloudflare keys are set, the Ideas/Chat/Optimizer/Risk tabs show **"Live AI"**; otherwise they show **"Offline"** — both work.
4. Check the browser console for CORS errors (means `ALLOWED_ORIGIN` is missing the Vercel URL).

---

## Local development (unchanged)

```bash
cd server && npm run dev     # API on :3000
cd client && npm run dev     # UI on :5173 — Vite proxies /api, no env needed
```

`VITE_API_BASE_URL` is only needed for production builds; leave it unset locally.
