# Run EF Core migrations against Render PostgreSQL from your machine.
# Usage:
#   1. Get "External Database URL" from Render Dashboard -> your PostgreSQL service -> Connections.
#   2. Run: .\scripts\run-migrations-render.ps1 -DatabaseUrl "postgres://user:pass@host/dbname?sslmode=require"
#   Or set $env:DATABASE_URL first, then: .\scripts\run-migrations-render.ps1

param(
    [Parameter(Mandatory = $false)]
    [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"
$backendRoot = $PSScriptRoot + "\.."

if ($DatabaseUrl) {
    $env:DATABASE_URL = $DatabaseUrl
}

if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL is not set." -ForegroundColor Red
    Write-Host "Either pass -DatabaseUrl 'postgres://...' or set the env var:"
    Write-Host '  $env:DATABASE_URL = "postgres://USER:PASSWORD@HOST/DATABASE?sslmode=require"'
    Write-Host ""
    Write-Host "Get the URL from Render: Dashboard -> PostgreSQL service -> Connections -> External Database URL"
    exit 1
}

# Ensure we're in backend root
Push-Location $backendRoot
try {
    Write-Host "Running migrations against the database in DATABASE_URL..." -ForegroundColor Cyan
    dotnet run --project src\TableWorks.API\ASideNote.API.csproj -- --migrate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Done. You can clear the env var with: Remove-Item Env:DATABASE_URL" -ForegroundColor Green
} finally {
    Pop-Location
}
