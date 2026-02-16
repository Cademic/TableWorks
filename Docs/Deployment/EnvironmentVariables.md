# Environment Variable Reference

All environment variables used by ASideNote across environments.

## Backend (ASP.NET Core API)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASPNETCORE_ENVIRONMENT` | Yes | `Development` | `Development`, `Staging`, or `Production` |
| `INTERNAL_DATABASE_URL` or `DATABASE_URL` | Yes (Render) | *(none)* | Full PostgreSQL connection URL. When set (e.g. by linking Render Postgres to the API), overrides all DB_* vars. Use INTERNAL_DATABASE_URL for private networking. |
| `DB_HOST` | Yes* | `localhost` | PostgreSQL host (*ignored if INTERNAL_DATABASE_URL/DATABASE_URL is set) |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | Yes* | `asidenote` | PostgreSQL database name |
| `DB_USER` | Yes* | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | Yes* | `postgres` | PostgreSQL password |
| `JWT_SECRET` | Yes | *(weak dev default)* | JWT signing key (min 32 chars, unique per env) |
| `CORS_ORIGINS` | Yes (staging/prod) | `http://localhost:5173` | Comma-separated allowed frontend origins. Include `http://localhost:5173` if you run the frontend locally against the deployed API (e.g. `http://localhost:5173,https://asidenote.net`). |
| `GOOGLE_CLIENT_ID` | Yes (staging/prod) | *(none)* | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (staging/prod) | *(none)* | Google OAuth 2.0 client secret |
| `RESEND_API_KEY` | Yes (staging/prod) | *(none)* | Resend API key for transactional email |
| `EMAIL_FROM_ADDRESS` | Yes (staging/prod) | `noreply@yourdomain.com` | Sender email address |
| `EMAIL_FROM_NAME` | No | `ASideNote` | Sender display name |
| `FRONTEND_URL` | Yes (staging/prod) | `http://localhost:5173` | Frontend base URL (for verification links, OAuth redirects) |
| `BACKEND_URL` | Yes (staging/prod) | `http://localhost:5000` | Backend base URL (for OAuth callback URLs) |

## Frontend (Vite/React)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes (staging/prod) | *(empty = use proxy)* | Full API base URL (e.g. `https://api.yourdomain.com/api/v1`) |
| `VITE_GOOGLE_CLIENT_ID` | Yes (staging/prod) | *(none)* | Google OAuth 2.0 client ID (same as backend) |

## Environment Matrix

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `ASPNETCORE_ENVIRONMENT` | `Development` | `Staging` | `Production` |
| `DB_HOST` | `localhost` | Render internal host | Render internal host |
| `DB_PASSWORD` | `postgres` | Generated | Generated |
| `JWT_SECRET` | Dev placeholder | Unique random | Unique random |
| `CORS_ORIGINS` | `http://localhost:5173` | Staging URL | Production URL |
| `GOOGLE_CLIENT_ID` | Test project | Staging project | Production project |
| `GOOGLE_CLIENT_SECRET` | Test secret | Staging secret | Production secret |
| `RESEND_API_KEY` | Test key | Staging key | Production key |
| `FRONTEND_URL` | `http://localhost:5173` | Staging URL | `https://yourdomain.com` |
| `BACKEND_URL` | `http://localhost:5000` | Staging API URL | `https://api.yourdomain.com` |
| `VITE_API_BASE_URL` | *(empty)* | Staging API URL | `https://api.yourdomain.com/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Test ID | Staging ID | Production ID |

## Security Notes

- Never commit `.env` files or real secrets to version control.
- Use Render environment variable groups to share common vars across services.
- Rotate `JWT_SECRET` and `GOOGLE_CLIENT_SECRET` on a defined schedule (see Secrets Policy).
- Database credentials are managed by Render for managed Postgres instances.
