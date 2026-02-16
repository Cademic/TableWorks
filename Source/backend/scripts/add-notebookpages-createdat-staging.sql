-- NotebookPage entity has CreatedAt but the table was created without it.
-- Run once against asidenote_db_staging to fix 500 when loading a notebook by ID.

ALTER TABLE "NotebookPages"
ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();
