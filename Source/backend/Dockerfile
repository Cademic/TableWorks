# =============================================================================
# ASideNote API – Multi-stage Docker build
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Restore dependencies (cached layer)
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS restore
WORKDIR /src

# Copy solution and all project files first (for layer caching)
COPY ASideNote.sln ./
COPY src/TableWorks.API/ASideNote.API.csproj            src/TableWorks.API/
COPY src/TableWorks.Application/ASideNote.Application.csproj  src/TableWorks.Application/
COPY src/TableWorks.Infrastructure/ASideNote.Infrastructure.csproj  src/TableWorks.Infrastructure/
COPY src/TableWorks.Core/ASideNote.Core.csproj           src/TableWorks.Core/
COPY tests/TableWorks.Tests/ASideNote.Tests.csproj       tests/TableWorks.Tests/

RUN dotnet restore ASideNote.sln

# ---------------------------------------------------------------------------
# Stage 2: Build & publish
# ---------------------------------------------------------------------------
FROM restore AS publish
WORKDIR /src

# Copy everything and publish in Release mode
COPY . .
RUN dotnet publish src/TableWorks.API/ASideNote.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore
# Entrypoint runs migrations on container start then starts the API
COPY entrypoint.sh /app/publish/entrypoint.sh
RUN sed -i 's/\r$//' /app/publish/entrypoint.sh && chmod +x /app/publish/entrypoint.sh

# ---------------------------------------------------------------------------
# Stage 3: Runtime (Playwright .NET image for server-side PDF export)
# Uses official image so Chromium is available for notebook PDF export on Render.
# Version must match Microsoft.Playwright package (see Infrastructure.csproj).
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright/dotnet:v1.58.0-noble AS runtime
WORKDIR /app

COPY --from=publish /app/publish .

# Render uses port 10000 by default
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Run as root so Chromium can run (we only render our own HTML to PDF; see Playwright Docker docs).
# On Render: optional Docker run flag --ipc=host can help if Chromium OOMs (set in Render dashboard if needed).
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
