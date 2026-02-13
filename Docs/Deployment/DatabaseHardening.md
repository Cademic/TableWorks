# Database Hardening and Reliability (P1)

Target: complete within 30 days of launch.

## Backup and Restore

### Render Managed Postgres Backups
- Render provides automatic daily backups with retention based on plan
- **Action**: Verify backup schedule and retention in Render dashboard
- **Action**: Perform a restore drill within first 2 weeks of launch
  1. Create a temporary Postgres instance
  2. Restore from latest backup
  3. Verify data integrity
  4. Delete temporary instance
  5. Document the procedure and time taken

### Manual Backup (Belt and Suspenders)
```bash
pg_dump -h <host> -U <user> -d <db> -F c -f backup_$(date +%Y%m%d).dump
```

## Migration Safety Policy

### Expand/Contract Pattern
For breaking schema changes, use two deploys:
1. **Expand**: Add new column (nullable), deploy code that writes to both old and new
2. **Contract**: Remove old column after all data migrated

### Forbidden Without Manual Approval
- `DROP TABLE`
- `DROP COLUMN` with data
- `ALTER COLUMN` type changes that lose data
- Any migration that cannot be reversed

### Pre-Migration Checklist
- [ ] Migration tested on staging with production-like data
- [ ] Rollback migration tested
- [ ] Backup taken before applying to production
- [ ] Estimated downtime documented (if any)

## Index Review

Verify these indexes exist and are used:

| Table | Index Columns | Purpose |
|-------|--------------|---------|
| Users | `Email` (unique) | Login lookup |
| Users | `Username` (unique) | Username uniqueness |
| Notes | `UserId`, `CreatedAt`, `UpdatedAt`, `BoardId` | User note queries |
| IndexCards | `UserId`, `BoardId` | User card queries |
| Projects | `OwnerId`, `Status` | User project queries |
| RefreshTokens | `TokenHash` (unique), `UserId` | Token validation |
| EmailVerificationTokens | `TokenHash` (unique), `UserId` | Verification lookup |
| ExternalLogins | `Provider, ProviderUserId` (unique) | OAuth lookup |
| AuditLogs | `UserId`, `Timestamp`, `ActionType` | Audit queries |

### Index Health Check
```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Find missing indexes (slow queries)
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

## Future: Read-Only Role
Create a read-only database role for analytics/admin tooling:
```sql
CREATE ROLE readonly_user WITH LOGIN PASSWORD '<strong_password>';
GRANT CONNECT ON DATABASE asidenote TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```
