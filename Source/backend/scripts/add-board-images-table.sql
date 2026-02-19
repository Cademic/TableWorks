-- Add BoardImages table (image cards on note boards).
-- Run this when you get 503 on GET/POST /api/v1/boards/{id}/image-cards
-- and cannot run "dotnet ef database update" because the API is running.
--
-- Usage: psql -U postgres -d asidenote -f add-board-images-table.sql
-- Or run the statements below in pgAdmin Query Tool against the asidenote database.

-- Create table (idempotent: skip if already exists)
CREATE TABLE IF NOT EXISTS "BoardImages" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "BoardId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ImageUrl" character varying(2048) NOT NULL,
    "PositionX" double precision NOT NULL,
    "PositionY" double precision NOT NULL,
    "Width" double precision NULL,
    "Height" double precision NULL,
    "Rotation" double precision NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_BoardImages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_BoardImages_Boards_BoardId" FOREIGN KEY ("BoardId") REFERENCES "Boards" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_BoardImages_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Indexes (idempotent: CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "IX_BoardImages_BoardId" ON "BoardImages" ("BoardId");
CREATE INDEX IF NOT EXISTS "IX_BoardImages_UserId" ON "BoardImages" ("UserId");

-- Mark migration as applied so EF won't try to run it again
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260218120000_AddBoardImages', '8.0.8')
ON CONFLICT ("MigrationId") DO NOTHING;
