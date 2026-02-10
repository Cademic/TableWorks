# Database Operations Baseline

## Overview

TableWorks uses PostgreSQL as its primary data store, accessed via Entity Framework Core
with the Npgsql provider. This document defines the operational policies and procedures
for database management across environments.

## Backup Policy

| Parameter | Value | Requirement Source |
|-----------|-------|--------------------|
| Frequency | Daily automated backups | NFR5.3, NFR7.4 |
| Retention | Minimum 30 days | NFR7.4 |
| Recovery Point Objective (RPO) | Maximum 24 hours data loss | NFR5.4 |
| Point-in-Time Recovery (PITR) | Required | NFR7.5 |
| Recovery Testing | Monthly restore-to-staging validation | Best practice |

### Implementation Notes

- **Local Development**: No backup requirements. Use `docker compose down -v` to reset.
- **Staging/Production**: Enable PostgreSQL continuous archiving (WAL archiving) for PITR.
  Configure `pg_basebackup` or equivalent cloud-managed backup (e.g., AWS RDS automated
  backups, Azure Flexible Server scheduled backups).
- **Backup storage**: Store in a separate fault domain (different region/account) for
  disaster recovery resilience.

## Database Roles and Security

### Least-Privilege Role Strategy

| Role | Permissions | Used By |
|------|------------|---------|
| `tableworks_app` | SELECT, INSERT, UPDATE, DELETE on application tables | Application runtime |
| `tableworks_migrator` | ALL on schema + tables (DDL + DML) | Migration tooling / CI |
| `postgres` (superuser) | Full access | Local development only |

### Security Requirements

| Requirement | Implementation | Source |
|-------------|---------------|--------|
| Encryption in transit | Require TLS for non-localhost connections | NFR2.3 |
| Encryption at rest | Enable storage-level encryption (cloud-managed or LUKS) | NFR2.8 |
| SQL injection prevention | EF Core parameterized queries (ORM-enforced) | NFR2.5 |
| Network isolation | Restrict DB port to application subnet only | Best practice |
| Connection secrets | Environment variables / secret store (never in source) | Best practice |

### Secret Management

| Environment | Mechanism |
|-------------|-----------|
| Local dev | `.env` file (git-ignored) |
| CI/CD | Pipeline secret variables |
| Staging/Prod | Cloud secret manager (e.g., AWS Secrets Manager, Azure Key Vault) |

## Health Checks

The API exposes a `/health` endpoint that includes a PostgreSQL connectivity check
registered via `AddDbContextCheck<AppDbContext>("postgres")`.

- Returns `Healthy` when the database is reachable and responsive.
- Returns `Unhealthy` when the connection fails, enabling load balancers and
  orchestrators to route traffic away from degraded instances.

## Transaction Integrity

- EF Core wraps `SaveChangesAsync` calls in implicit transactions (NFR5.5).
- Multi-step operations that span multiple aggregates should use explicit
  `IDbContextTransaction` for atomicity.
- The `IUnitOfWork` abstraction coordinates saves across repositories.

## Monitoring Recommendations (Staging/Production)

- Track connection pool usage, query latency (p50/p95/p99), and lock contention.
- Alert on replication lag (if read replicas are introduced).
- Log slow queries (> 500ms) via `log_min_duration_statement`.
- Integrate with APM (e.g., Application Insights, Datadog) for correlated traces.
