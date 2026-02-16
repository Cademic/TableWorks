#!/bin/sh
set -e
# Run pending EF Core migrations (e.g. Notebooks/NotebookPages) then start the API.
dotnet ASideNote.API.dll --migrate
exec dotnet ASideNote.API.dll "$@"
