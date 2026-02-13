# Deployment Runbook

## Architecture

```
GitHub (main/staging) → Render Auto-Deploy → Services
```

| Environment | Branch | Frontend | API | Database |
|-------------|--------|----------|-----|----------|
| Staging | `staging` | Render Static Site | Render Web Service | Render Managed Postgres |
| Production | `main` | Render Static Site | Render Web Service | Render Managed Postgres |

## Standard Deployment

### 1. Pre-Deploy Checklist

- [ ] All CI checks pass (backend tests, frontend lint/build, CodeQL)
- [ ] Migration plan reviewed (if schema changes)
- [ ] Environment variables verified for target environment
- [ ] Staging deployment tested and verified

### 2. Deploy to Staging

1. Merge feature branch → `staging`
2. Render auto-deploys frontend and API
3. Run smoke tests (see Smoke Test section)
4. Verify in staging environment

### 3. Promote to Production

1. Create PR from `staging` → `main`
2. Review and merge
3. Render auto-deploys
4. Run production smoke tests
5. Monitor error rates and latency for 30 minutes

### 4. Database Migrations

Migrations are **not** auto-applied in staging/production. Apply manually:

```bash
# From Source/Backend/ directory
dotnet ef database update \
  --project src/ASideNote.Infrastructure/ASideNote.Infrastructure.csproj \
  --startup-project src/ASideNote.API/ASideNote.API.csproj \
  --connection "Host=<host>;Port=5432;Database=<db>;Username=<user>;Password=<password>"
```

Or use the Render Shell to run migrations on the deployed service.

## Rollback Procedures

### Code-Only Rollback (No DB Changes)

1. In Render dashboard, select the API web service
2. Go to "Events" → find the last successful deploy
3. Click "Rollback to this deploy"
4. Repeat for frontend static site if needed
5. Verify health checks pass

### Code + Database Rollback

**Warning**: Only possible if the migration is reversible (no data loss).

1. Roll back the code first (see above)
2. Apply the reverse migration:
   ```bash
   dotnet ef database update <PreviousMigrationName> \
     --project src/ASideNote.Infrastructure/ASideNote.Infrastructure.csproj \
     --startup-project src/ASideNote.API/ASideNote.API.csproj \
     --connection "<connection-string>"
   ```
3. Verify application functionality

### What Is NOT Reversible
- Column drops with data
- Table drops
- Data transformations without backup

**Rule**: All destructive migrations require a manual approval step and a pre-migration backup.

## Smoke Tests

After each deploy, verify:

```bash
# Health checks
curl -sf https://api.yourdomain.com/health/live   # → 200
curl -sf https://api.yourdomain.com/health/ready   # → 200

# Auth endpoint
curl -sf -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"wrong"}' \
  -o /dev/null -w "%{http_code}"  # → 401 or 403 (not 500)

# Frontend loads
curl -sf https://yourdomain.com/ -o /dev/null -w "%{http_code}"  # → 200
```

## Incident Triage

1. Check Render dashboard for deploy status and health check failures
2. Check API logs in Render for error patterns
3. Verify database connectivity via `/health/ready`
4. Check for recent deploys that may have introduced the issue
5. If database-related: check Render Postgres metrics (connections, CPU, storage)
6. Escalation path: roll back to last known good deploy, then investigate

## Migration Safety Policy

- **Expand/Contract pattern**: Add new columns as nullable first, deploy code that writes to both, then make required in a later migration
- **Never** drop columns or tables in the same deploy as the code change
- **Always** test migrations against a copy of production data in staging
- **Document** migration purpose and reversibility in the migration file name
