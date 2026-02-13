# Deployment Process

This document covers the end-to-end process used to deploy ASideNote to Render with a custom domain, managed PostgreSQL, Google OAuth, and Resend email verification.

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│   GoDaddy    │────▶│  Render (Hosting)     │     │  External Services│
│   DNS        │     │                       │     │                   │
│              │     │  ┌─────────────────┐  │     │  Google OAuth 2.0 │
│  asidenote   │     │  │ Static Site     │  │     │  Resend Email API │
│  .net        │     │  │ (React/Vite)    │  │     │                   │
│              │     │  └─────────────────┘  │     └───────────────────┘
│  A Record ──────▶  │                       │
│  CNAME www ─────▶  │  ┌─────────────────┐  │
│  CNAME api ─────▶  │  │ Web Service     │  │
│              │     │  │ (ASP.NET Core)  │  │
│  TXT SPF    │     │  │ Docker          │  │
│  CNAME DKIM │     │  └────────┬────────┘  │
│  TXT DMARC  │     │           │           │
│              │     │  ┌────────▼────────┐  │
└──────────────┘     │  │ Managed         │  │
                     │  │ PostgreSQL 16   │  │
                     │  └─────────────────┘  │
                     └───────────────────────┘
```

| Component | Service Type | Domain |
|-----------|-------------|--------|
| Frontend | Render Static Site | `asidenote.net`, `www.asidenote.net` |
| API | Render Web Service (Docker) | `api.asidenote.net` |
| Database | Render Managed PostgreSQL | Internal connection |

---

## Step 1: Prepare the Backend for Deployment

### 1.1 Create the Dockerfile

A multi-stage Dockerfile was created at `Source/Backend/Dockerfile`:

- **Stage 1 (restore):** Copies `.csproj` files and restores NuGet dependencies (cached layer for faster rebuilds).
- **Stage 2 (publish):** Copies all source code and publishes in Release mode.
- **Stage 3 (runtime):** Uses the minimal `aspnet:8.0` image, runs as a non-root user, and exposes port 10000 (Render's default).

A `.dockerignore` file was also created at `Source/Backend/.dockerignore` to exclude `.git`, `bin`, `obj`, `.env*`, and `node_modules` from the Docker build context.

### 1.2 Database Migrations on Deploy

Instead of running migrations manually, the `Program.cs` entry point was extended with a `--migrate` CLI flag. When Render's **Pre-Deploy Command** runs `dotnet ASideNote.API.dll --migrate`, the app applies all pending EF Core migrations and exits before the new code starts serving traffic.

### 1.3 Environment Variable Handling

The backend reads secrets from environment variables (set in Render's dashboard), with fallbacks to `appsettings.json` for local development. Key variables:

- `JWT_SECRET` — used for both token signing and validation
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` — transactional email
- `CORS_ORIGINS`, `FRONTEND_URL` — frontend URL allowlisting

A `DotNetEnv` integration in `Program.cs` loads `.env` files during local development (no-op in Docker where no `.env` file exists).

---

## Step 2: Prepare the Frontend for Deployment

### 2.1 Build Configuration

The Vite build (`npm run build`) produces static assets in `dist/`. Environment variables are baked in at build time:

- `VITE_API_BASE_URL` — full API URL (e.g., `https://api.asidenote.net/api/v1`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

### 2.2 SPA Routing

Since the frontend is a single-page application, a **Rewrite Rule** was added in Render's Static Site settings:

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/index.html` | Rewrite |

This ensures client-side routes like `/dashboard`, `/verify-email`, and `/login` work when accessed directly.

---

## Step 3: Create Render Services

### 3.1 Managed PostgreSQL

1. Created a new PostgreSQL instance in Render (same region as the API).
2. Noted the **internal connection** credentials (`Host`, `Port`, `Database`, `Username`, `Password`) for use in the API service's environment variables.

### 3.2 API Web Service

| Setting | Value |
|---------|-------|
| Type | Web Service |
| Repository | `Cademic/ASideNote` |
| Branch | `staging` |
| Root Directory | `Source/backend` |
| Runtime | Docker |
| Dockerfile Path | `./Dockerfile` |
| Pre-Deploy Command | `dotnet ASideNote.API.dll --migrate` |
| Health Check Path | `/health/ready` |

Environment variables were set in the Render dashboard (see `Docs/Deployment/EnvironmentVariables.md` for the full list).

### 3.3 Frontend Static Site

| Setting | Value |
|---------|-------|
| Type | Static Site |
| Repository | `Cademic/ASideNote` |
| Branch | `staging` |
| Root Directory | `Source/frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

Environment variables (`VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`) were set in the Render dashboard.

A **Rewrite Rule** (`/* → /index.html`, Rewrite) was added in the Redirects/Rewrites section.

---

## Step 4: Configure DNS (GoDaddy)

The domain `asidenote.net` was purchased from GoDaddy. The following DNS records were configured:

### Domain Records

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| A | `@` | Render-provided IP | Apex domain → frontend |
| CNAME | `www` | Render static site `.onrender.com` hostname | www subdomain → frontend |
| CNAME | `api` | Render web service `.onrender.com` hostname | API subdomain → backend |

### Email Authentication (Resend)

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` | SPF — authorize Resend to send email |
| CNAME | `resend._domainkey` | *(provided by Resend dashboard)* | DKIM — email signature verification |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:...` | DMARC — email authentication policy |

### TLS Certificate

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| CAA | `@` | `0 issue "letsencrypt.org"` | Allow Let's Encrypt to issue certificates |

Render automatically provisions and renews Let's Encrypt TLS certificates once DNS propagation completes.

---

## Step 5: Configure Google OAuth

In the [Google Cloud Console](https://console.cloud.google.com):

1. Created an OAuth 2.0 Client ID (Web application type).
2. Added **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://asidenote.net` (production)
   - `https://www.asidenote.net` (production www)
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as environment variables on both the backend (Render Web Service) and frontend (`VITE_GOOGLE_CLIENT_ID` on Render Static Site).

---

## Step 6: Configure Resend Email

1. Created a [Resend](https://resend.com) account and added the domain `asidenote.net`.
2. Added the SPF, DKIM, and DMARC DNS records provided by Resend (see Step 4).
3. Waited for domain verification to complete in the Resend dashboard.
4. Created an API key and set it as `RESEND_API_KEY` in the Render API service environment variables.
5. Set `EMAIL_FROM_ADDRESS` to `noreply@asidenote.net`.

---

## Step 7: Deploy and Verify

### Initial Deploy

1. Pushed all changes to the `staging` branch on GitHub.
2. Render auto-deployed both the frontend static site and the API web service.
3. The Pre-Deploy Command ran EF Core migrations against the Render PostgreSQL database.

### Verification

- `/health/live` and `/health/ready` returned 200.
- Frontend loaded at `https://asidenote.net`.
- User registration, email verification, and Google login all worked.
- CORS correctly allowed requests from the frontend to the API.

---

## Ongoing Deployment Workflow

After the initial deployment, the workflow for making changes is:

```
Local development → git push origin staging → Render auto-deploys
```

### Frontend Changes

1. Edit code in `Source/frontend/`.
2. Test locally with `npm run dev`.
3. Commit and push to `staging`.
4. Render rebuilds the static site (1-3 minutes).

### Backend Changes

1. Edit code in `Source/Backend/`.
2. Test locally with `dotnet run`.
3. If schema changed, create an EF Core migration:
   ```bash
   dotnet ef migrations add MigrationName \
     --project src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj \
     --startup-project src/TableWorks.API/ASideNote.API.csproj
   ```
4. Commit and push to `staging`.
5. Render rebuilds the Docker image and runs the pre-deploy migration command (2-5 minutes).

### Adding New Environment Variables

If new code requires a new environment variable:
1. Add it to the Render dashboard **before** deploying the code that uses it.
2. Document it in `Docs/Deployment/EnvironmentVariables.md`.

---

## Issues Encountered and Resolved

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| API deploy failed — "Root directory does not exist" | Git tracked `Source/backend` (lowercase), Render config had `Source/Backend` (uppercase) | Updated Render root directory to match Git's lowercase path |
| Frontend TypeScript build error (`Cannot find name 'process'`) | `vite.config.ts` used `process.env.NODE_ENV` without `@types/node` | Changed to use Vite's built-in `mode` parameter |
| Frontend 404 on client-side routes (`/verify-email`, `/dashboard`) | Static site had no SPA fallback | Added `/* → /index.html` Rewrite rule in Render |
| API health check 503 | PostgreSQL not connected — database credentials not configured | Created Render Postgres and set `DB_*` environment variables |
| Google login "Error 400: origin_mismatch" | Frontend production URLs missing from Google Cloud Console authorized origins | Added `https://asidenote.net` and `https://www.asidenote.net` as authorized origins |
| Resend domain verification stuck | Domain registered as `.com` instead of `.net` by mistake | Deleted incorrect domain, re-added as `asidenote.net` |
| TLS certificate not provisioning | DNS propagation delay | Waited for propagation; added `CAA` record for `letsencrypt.org` |
| All authenticated API requests returning 401 | JWT tokens signed with `appsettings.json` default secret, but validated against `JWT_SECRET` env var | Fixed `TokenService.cs` to read `JWT_SECRET` env var first |
| Token refresh failing on deployed site | Refresh endpoint called relative URL (frontend domain) instead of API domain | Changed `client.ts` to use `apiClient` instead of raw `axios` for refresh calls |

---

## Related Documentation

- [Environment Variables Reference](EnvironmentVariables.md)
- [Domain and DNS Setup](DomainDNSSetup.md)
- [Deployment Runbook](DeploymentRunbook.md)
- [Render Provisioning Guide](RenderProvisioning.md)
- [Email Deliverability Setup](EmailDeliverability.md)
- [Secrets Policy](SecretsPolicy.md)
- [Launch Checklist](LaunchChecklist.md)
- [Observability Plan](ObservabilityPlan.md)
