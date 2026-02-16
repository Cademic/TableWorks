#!/bin/sh
set -e
# Run pending EF Core migrations (e.g. Notebooks/NotebookPages) then start the API.
echo "Running database migrations..."
if ! dotnet ASideNote.API.dll --migrate; then
  echo "Migrations failed. Check INTERNAL_DATABASE_URL / DATABASE_URL and DB connectivity."
  exit 1
fi
echo "Migrations complete. Starting API."
exec dotnet ASideNote.API.dll "$@"
