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
# Stage 3: Runtime (minimal image)
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

COPY --from=publish /app/publish .

# Render uses port 10000 by default
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

USER appuser

# Run migrations on start (creates Notebooks/NotebookPages etc.) then start the API
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
