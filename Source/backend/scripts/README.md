# Database scripts

## fix-notebooks-migration-history.sql

**When to use:** You see `relation "Notebooks" does not exist` when starting the API, and the log shows only one pending migration: `20260216031245_AddNotebookProjectId`.

**Cause:** The table `__EFMigrationsHistory` has a row for `20260215120000_AddNotebooksAndNotebookPages` (so EF thinks the Notebooks table was created), but the `Notebooks` table is missing (e.g. it was dropped, or the DB was restored without tables).

**Fix:** Run this script against the `asidenote` database (e.g. in pgAdmin Query Tool), then start the API again. EF will re-apply the Notebooks migration (creating `Notebooks` and `NotebookPages`) and then apply `AddNotebookProjectId`.

**Automatic fix:** In Development, the API now checks for this inconsistent state on startup and removes the bad history row automatically, so you may not need to run the script manually.
