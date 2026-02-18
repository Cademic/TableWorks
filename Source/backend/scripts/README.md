# Database scripts

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
