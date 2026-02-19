# Database scripts

## Connecting to Render PostgreSQL (SQL shell)

Use the **External Database URL** from Render (Dashboard → your PostgreSQL service → Connections).

### Option A: `psql` (command line)

If you have [PostgreSQL client tools](https://www.postgresql.org/download/windows/) installed:

```powershell
# PowerShell: set password so psql doesn't prompt (replace with your actual URL components)
$env:PGPASSWORD = "your_password"
psql -h dpg-xxxxx.oregon-postgres.render.com -p 5432 -U your_user -d your_database_name "sslmode=require"
```

Or pass the full URL (works with recent psql):

```powershell
psql "postgresql://user:password@hostname.oregon-postgres.render.com:5432/database_name?sslmode=require"
```

Replace `user`, `password`, `hostname`, and `database_name` with the values from your Render External Database URL.

### Option B: GUI (DBeaver, pgAdmin, Azure Data Studio, etc.)

1. Create a new PostgreSQL connection.
2. **Host:** from the URL (e.g. `dpg-xxxxx.oregon-postgres.render.com`).
3. **Port:** 5432.
4. **Database:** database name from the URL (e.g. `asidenote_db_staging`).
5. **Username / Password:** from the URL.
6. Enable **SSL** (e.g. SSL mode = require).
7. Connect, then open a SQL editor and paste/run the script.

---

## manual-notebook-schema-fix.sql

**When to use:** The live API returns **503** on `GET /api/v1/notebooks/{id}` and you’ve confirmed (e.g. from the 503 response body or logs) that the database is missing `ContentJson` on `Notebooks` and/or the `NotebookVersions` table (or the old `NotebookPages` table is still present).

**What it does:** Drops `NotebookPages`, adds `ContentJson` to `Notebooks` if missing, creates `NotebookVersions` if missing, and marks the corresponding EF migrations as applied.

**Fix:** Connect to the **same database your live API uses** (see “Connecting to Render PostgreSQL” above), then run:

```bash
psql "postgresql://user:password@host:5432/dbname?sslmode=require" -f scripts/manual-notebook-schema-fix.sql
```

Or in a GUI: open the script file, paste into the SQL editor, and execute.

---

## add-board-images-table.sql

**When to use:** You get **503 Service Unavailable** on `GET` or `POST` `/api/v1/boards/{id}/image-cards`, and you cannot run `dotnet ef database update` because the API process is running (build fails with "file is locked").

**Cause:** The `BoardImages` table does not exist yet. The migration exists but was never applied.

**Fix:** Run the script against your database (e.g. pgAdmin Query Tool or `psql -U postgres -d asidenote -f add-board-images-table.sql`). It creates the `BoardImages` table and marks the migration as applied. You do **not** need to stop the API. After the script runs, refresh the board page; image-cards requests should succeed.

---

## mark-notebooks-migration-applied.sql

**When to use:** You see `relation "Notebooks" already exists` (42P07) or `column "ProjectId" of relation "Notebooks" already exists` (42701) when starting the API during migration apply.

**Cause:** The schema (Notebooks table, ProjectId column, etc.) already exists, but `__EFMigrationsHistory` is missing one or more migration rows, so EF tries to run them again.

**Fix:** Run this script against the `asidenote` database (e.g. pgAdmin Query Tool or psql). It inserts the four migration rows (Notebooks/NotebookPages, AddNotebookProjectId, AddProjectShowEventsOnMainCalendar, NotebookContentJsonDropNotebookPages) so EF considers them applied. Then run **apply-missing-columns.sql** (see below) so the schema actually has the new columns, then start the API again.

---

## apply-missing-columns.sql

**When to use:** The API returns **500** on `api/v1/projects`, `api/v1/calendar-events`, `api/v1/notebooks`, or `api/v1/admin/users` after you ran `mark-notebooks-migration-applied.sql` (or the DB was created/restored without running migrations).

**Cause:** `__EFMigrationsHistory` was updated so EF thinks migrations are applied, but the actual schema changes (new columns) were never applied. The app expects `Projects.ShowEventsOnMainCalendar` and `Notebooks.ContentJson`, so queries fail with "column does not exist".

**Fix:** Run this script against the `asidenote` database (e.g. pgAdmin Query Tool or psql). It adds the missing columns idempotently. Then start (or restart) the API.

---

## fix-notebooks-migration-history.sql

**When to use:** You see `relation "Notebooks" does not exist` when starting the API, and the log shows only one pending migration: `20260216031245_AddNotebookProjectId`.

**Cause:** The table `__EFMigrationsHistory` has a row for `20260215120000_AddNotebooksAndNotebookPages` (so EF thinks the Notebooks table was created), but the `Notebooks` table is missing (e.g. it was dropped, or the DB was restored without tables).

**Fix:** Run this script against the `asidenote` database (e.g. in pgAdmin Query Tool), then start the API again. EF will re-apply the Notebooks migration (creating `Notebooks` and `NotebookPages`) and then apply `AddNotebookProjectId`.

**Automatic fix:** In Development, the API now checks for this inconsistent state on startup and removes the bad history row automatically, so you may not need to run the script manually.
