-- Fix: __EFMigrationsHistory says 20260215120000_AddNotebooksAndNotebookPages was applied,
-- but the Notebooks table is missing (e.g. table was dropped or DB was restored without tables).
-- Run this against your asidenote database, then start the API again so EF re-applies
-- 20260215120000_AddNotebooksAndNotebookPages (creates Notebooks/NotebookPages) and
-- 20260216031245_AddNotebookProjectId (adds ProjectId).
--
-- Usage: In pgAdmin, connect to database "asidenote", open Query Tool, paste and run.

DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '20260215120000_AddNotebooksAndNotebookPages';
