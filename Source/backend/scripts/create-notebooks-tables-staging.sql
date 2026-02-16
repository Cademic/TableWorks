-- Run this when __EFMigrationsHistory has 20260215120000_AddNotebooksAndNotebookPages
-- but Notebooks/NotebookPages tables don't exist (e.g. relation "Notebooks" does not exist).
-- Then start the API so 20260216031245_AddNotebookProjectId can apply.
--
-- Local (Docker): docker exec -i asidenote-postgres psql -U postgres -d asidenote < scripts/create-notebooks-tables-staging.sql
-- Or: psql "postgresql://postgres:postgres@localhost:5432/asidenote" -f scripts/create-notebooks-tables-staging.sql

-- Create Notebooks table (skip if already exists)
CREATE TABLE IF NOT EXISTS "Notebooks" (
  "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "UserId" uuid NOT NULL,
  "Name" text NOT NULL,
  "IsPinned" boolean NOT NULL DEFAULT false,
  "PinnedAt" timestamp with time zone NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "PK_Notebooks" PRIMARY KEY ("Id"),
  CONSTRAINT "FK_Notebooks_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_Notebooks_CreatedAt" ON "Notebooks" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notebooks_UpdatedAt" ON "Notebooks" ("UpdatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notebooks_UserId" ON "Notebooks" ("UserId");

-- Create NotebookPages table (skip if already exists)
-- Matches 20260215120000_AddNotebooksAndNotebookPages (no CreatedAt; AddNotebookProjectId adds it)
CREATE TABLE IF NOT EXISTS "NotebookPages" (
  "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "NotebookId" uuid NOT NULL,
  "PageIndex" integer NOT NULL,
  "Content" text NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT "PK_NotebookPages" PRIMARY KEY ("Id"),
  CONSTRAINT "FK_NotebookPages_Notebooks_NotebookId" FOREIGN KEY ("NotebookId") REFERENCES "Notebooks" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_NotebookPages_NotebookId" ON "NotebookPages" ("NotebookId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_NotebookPages_NotebookId_PageIndex" ON "NotebookPages" ("NotebookId", "PageIndex");

-- Mark migration as applied so EF Core does not try to run it again
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260215120000_AddNotebooksAndNotebookPages', '8.0.8')
ON CONFLICT ("MigrationId") DO NOTHING;
