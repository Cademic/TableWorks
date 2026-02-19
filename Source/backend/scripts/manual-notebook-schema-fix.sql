-- Manual fix: align notebook schema with current app (drop old NotebookPages, add ContentJson, add NotebookVersions).
-- Run this against your Render PostgreSQL when EF migrations can't be applied cleanly.
-- Use the same database your live API uses (get External Database URL from Render).

-- 1) Drop old table (required before adding ContentJson if you have the old schema)
DROP TABLE IF EXISTS "NotebookPages" CASCADE;

-- 2) Add ContentJson to Notebooks if missing (new single-doc schema)
ALTER TABLE "Notebooks"
  ADD COLUMN IF NOT EXISTS "ContentJson" jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}';

-- 3) Create NotebookVersions table if missing
CREATE TABLE IF NOT EXISTS "NotebookVersions" (
  "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "NotebookId" uuid NOT NULL,
  "ContentJson" jsonb NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "Label" text NULL,
  CONSTRAINT "PK_NotebookVersions" PRIMARY KEY ("Id"),
  CONSTRAINT "FK_NotebookVersions_Notebooks_NotebookId" FOREIGN KEY ("NotebookId")
    REFERENCES "Notebooks" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_NotebookVersions_NotebookId" ON "NotebookVersions" ("NotebookId");
CREATE INDEX IF NOT EXISTS "IX_NotebookVersions_CreatedAt" ON "NotebookVersions" ("CreatedAt");

-- 4) Tell EF Core these migrations are applied (so it won't try to run them again)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES
  ('20260218000000_NotebookContentJsonDropNotebookPages', '8.0.8'),
  ('20260218061936_AddNotebookVersions', '8.0.8')
ON CONFLICT ("MigrationId") DO NOTHING;
