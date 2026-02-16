# Render Service Provisioning Guide

## Services to Create

### Staging Environment

| Service | Type | Name |
|---------|------|------|
| Frontend | Static Site | `asidenote-frontend-staging` |
| API | Web Service | `asidenote-api-staging` |
| Database | Managed PostgreSQL | `asidenote-db-staging` |

### Production Environment

| Service | Type | Name |
|---------|------|------|
| Frontend | Static Site | `asidenote-frontend-prod` |
| API | Web Service | `asidenote-api-prod` |
| Database | Managed PostgreSQL | `asidenote-db-prod` |

## Frontend Static Site Configuration

| Setting | Staging | Production |
|---------|---------|------------|
| Repository | `your-org/TableWorks` | `your-org/TableWorks` |
| Branch | `staging` | `main` |
| Root Directory | `Source/frontend` | `Source/frontend` |
| Build Command | `npm ci && npm run build` | `npm ci && npm run build` |
| Publish Directory | `dist` | `dist` |
| Auto-Deploy | Yes | Yes |

**Environment Variables:**
- `VITE_API_BASE_URL` = `https://asidenote-api-staging.onrender.com/api/v1` (staging) or `https://api.yourdomain.com/api/v1` (prod)
- `VITE_GOOGLE_CLIENT_ID` = per-environment Google OAuth client ID

**Headers:** Add in Render dashboard or `render.yaml`:
```
/*: Cache-Control: public, max-age=31536000, immutable
/index.html: Cache-Control: no-cache
```

## API Web Service Configuration

| Setting | Staging | Production |
|---------|---------|------------|
| Repository | `your-org/TableWorks` | `your-org/TableWorks` |
| Branch | `staging` | `main` |
| Root Directory | `Source/Backend` | `Source/Backend` |
| Runtime | Docker or .NET | Docker or .NET |
| Build Command | `dotnet publish src/TableWorks.API/ASideNote.API.csproj -c Release -o out` | Same |
| Start Command | `dotnet out/ASideNote.API.dll` | Same |
| **Pre-Deploy Command** | `dotnet out/ASideNote.API.dll --migrate` | Same (required so Notebooks and other tables exist) |
| Health Check Path | `/health/ready` | `/health/ready` |
| Auto-Deploy | Yes | Yes |
| Instance Type | Free/Starter | Starter+ |

**Environment Variables** (see [EnvironmentVariables.md](EnvironmentVariables.md) for full list):
- `ASPNETCORE_ENVIRONMENT` = `Staging` / `Production`
- `ASPNETCORE_URLS` = `http://+:10000` (Render default port)
- **Database**: Link the API Web Service to the Managed PostgreSQL service in Render so `INTERNAL_DATABASE_URL` is set automatically. The API uses this for the connection string; no need to set `DB_HOST`/`DB_PASSWORD` etc. manually.
- **CORS_ORIGINS**: Comma-separated allowed frontend origins (e.g. `https://asidenote.net`). To run the frontend locally against the deployed API, include `http://localhost:5173` (e.g. `http://localhost:5173,https://asidenote.net`).
- All auth/email secrets per environment

## Database Configuration

| Setting | Staging | Production |
|---------|---------|------------|
| Plan | Free/Starter | Starter+ |
| PostgreSQL Version | 16 | 16 |
| Region | Same as API | Same as API |

**Connection**: Use Render's internal connection string (provided automatically).

## Post-Provisioning Checklist

1. [ ] All six services created and connected
2. [ ] Environment variables set for each service
3. [ ] Health checks configured and passing
4. [ ] Auto-deploy from correct branches
5. [ ] Database migrations applied to staging
6. [ ] Smoke tests pass on staging
7. [ ] Custom domain attached to production (see DNS guide)
