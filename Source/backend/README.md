# ASideNote Backend

ASP.NET Core 8 Web API with PostgreSQL via Entity Framework Core.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker](https://docs.docker.com/get-docker/) (for local PostgreSQL)
- `dotnet-ef` CLI tool: `dotnet tool install --global dotnet-ef`

## Quick Start

### 1. Start PostgreSQL

```bash
# Copy environment defaults
cp .env.example .env

# Start the database container
docker compose up -d

# Verify it is healthy
docker compose ps
```

### 2. Apply Migrations

From `Source/backend/`, run (single line; works in PowerShell and bash):

```bash
dotnet ef database update --project src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj --startup-project src/TableWorks.API/ASideNote.API.csproj
```

### 3. Run the API

```bash
dotnet run --project src/TableWorks.API/ASideNote.API.csproj
```

The API is available at `https://localhost:5001` (or `http://localhost:5000`).
Swagger UI: `http://localhost:5000/swagger`

### 4. Seed the Database (optional)

```bash
dotnet run --project src/TableWorks.API/ASideNote.API.csproj -- --seed
```

## Docker Compose Commands

| Action | Command |
|--------|---------|
| Start services | `docker compose up -d` |
| Stop services | `docker compose down` |
| View logs | `docker compose logs -f postgres` |
| Reset database volume | `docker compose down -v` |
| Start with pgAdmin | `docker compose --profile tools up -d` |

## EF Core Migration Commands

All commands run from the `Source/backend/` directory. Use single-line commands in PowerShell (avoid `\` line continuation).

```powershell
# Create a new migration
dotnet ef migrations add <MigrationName> --project src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj --startup-project src/TableWorks.API/ASideNote.API.csproj --output-dir Data/Migrations

# Apply all pending migrations
dotnet ef database update --project src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj --startup-project src/TableWorks.API/ASideNote.API.csproj

# List applied and pending migrations
dotnet ef migrations list --project src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj --startup-project src/TableWorks.API/ASideNote.API.csproj

# Rollback the latest migration
dotnet ef migrations remove --project src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj --startup-project src/TableWorks.API/ASideNote.API.csproj
```

**If the database isn't updating:**

1. Run from **`Source/backend/`** (the folder that contains `src/`). Paths are relative to the current directory.
2. Check pending migrations: run `dotnet ef migrations list ...` (same project/startup-project). Pending migrations show `(Pending)`.
3. Ensure the startup project uses the same connection as your app (same `appsettings.json` and `.env`; the API loads `.env` from the current directory when you run the command).

## Environment Variables

The API reads from `appsettings.json` but allows env-var overrides:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `asidenote` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |

## Development Notes

- In `Development` environment, migrations are auto-applied on startup (`Database:ApplyMigrationsOnStartup`).
- In `Production`, migrations must be applied explicitly via the CLI or CI pipeline.
- The `.env` file is git-ignored. Copy `.env.example` and adjust for your local setup.
