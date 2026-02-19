-- Fix: API fails with "relation ""Notebooks"" already exists" or
-- "column ""ProjectId"" of relation ""Notebooks"" already exists" when applying migrations.
-- Cause: The schema (Notebooks, ProjectId, etc.) already exists, but __EFMigrationsHistory
-- is missing one or more migration rows, so EF tries to run them again.
--
-- Fix: Insert the migration rows so EF considers them applied. Then start the API again.
--
-- Usage: Connect to database "asidenote" (e.g. pgAdmin Query Tool or psql), then run this script.

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES
  ('20260215120000_AddNotebooksAndNotebookPages', '8.0.8'),
  ('20260216031245_AddNotebookProjectId', '8.0.8'),
  ('20260217044500_AddProjectShowEventsOnMainCalendar', '8.0.8'),
  ('20260218000000_NotebookContentJsonDropNotebookPages', '8.0.8')
ON CONFLICT ("MigrationId") DO NOTHING;
