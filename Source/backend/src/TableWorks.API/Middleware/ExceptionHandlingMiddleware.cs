using System.IO;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Npgsql;

namespace ASideNote.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (InvalidOperationException exception)
        {
            _logger.LogWarning(exception, "Invalid operation: {Message}", exception.Message);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;

            var payload = new
            {
                error = "Conflict",
                message = exception.Message
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (KeyNotFoundException exception)
        {
            _logger.LogWarning(exception, "Not found: {Message}", exception.Message);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;

            var payload = new
            {
                error = "NotFound",
                message = exception.Message
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (UnauthorizedAccessException exception)
        {
            _logger.LogWarning(exception, "Unauthorized: {Message}", exception.Message);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;

            var payload = new
            {
                error = "Unauthorized",
                message = exception.Message
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception occurred.");

            // Development-only: append to local debug log (skip on Render/Linux to avoid wrong path)
            if (_env.IsDevelopment())
            {
                try
                {
                    var logPath = Path.Combine(Directory.GetCurrentDirectory(), ".cursor", "debug.log");
                    var dir = Path.GetDirectoryName(logPath);
                    if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                    var inner = exception.InnerException;
                    var line = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), location = "ExceptionHandlingMiddleware.cs", message = "500 returned", data = new { exType = exception.GetType().FullName, exMessage = exception.Message, innerType = inner?.GetType().FullName, innerMessage = inner?.Message }, hypothesisId = "H5" }) + Environment.NewLine;
                    await File.AppendAllTextAsync(logPath, line);
                }
                catch { }
            }

            context.Response.ContentType = "application/json";

            // Missing table (e.g. Notebooks/NotebookPages) = schema out of date; return 503 so deployers know to run migrations
            if (TryGetMissingTableDetails(exception, out var relationMessage))
            {
                _logger.LogWarning("Database schema is out of date (missing table): {Relation}. Run EF Core migrations. See Docs/Deployment/RunMigrationsOnRender.md", relationMessage);
                context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                var payload = new
                {
                    error = "ServiceUnavailable",
                    message = "Database schema is out of date. Please run EF Core migrations (see deployment docs).",
                    code = "SchemaOutOfDate",
                    relation = relationMessage
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
                return;
            }

            // Missing column (e.g. ContentJson, ShowEventsOnMainCalendar) = schema out of date; return 503 with script hint
            if (TryGetMissingColumnDetails(exception, out var columnMessage))
            {
                _logger.LogWarning("Database schema is out of date (missing column): {Column}. Run scripts/apply-missing-columns.sql", columnMessage);
                context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                var payload = new
                {
                    error = "ServiceUnavailable",
                    message = "Database schema is out of date. Run scripts/apply-missing-columns.sql (see Source/backend/scripts/README.md).",
                    code = "SchemaOutOfDate",
                    column = columnMessage
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
                return;
            }

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var defaultPayload = new
            {
                error = "InternalServerError",
                message = "An unexpected error occurred."
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(defaultPayload));
        }
    }

    /// <summary>True if the exception is a PostgreSQL "relation does not exist"; sets relationMessage to the DB error message (e.g. relation "Notebooks" does not exist).</summary>
    private static bool TryGetMissingTableDetails(Exception ex, out string? relationMessage)
    {
        relationMessage = null;
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException pg && pg.SqlState == "42P01")
            {
                relationMessage = pg.Message;
                return true;
            }
        }
        return false;
    }

    /// <summary>True if the exception is a PostgreSQL "undefined_column" (42703); sets columnMessage to the DB error message.</summary>
    private static bool TryGetMissingColumnDetails(Exception ex, out string? columnMessage)
    {
        columnMessage = null;
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException pg && pg.SqlState == "42703")
            {
                columnMessage = pg.Message;
                return true;
            }
        }
        return false;
    }
}
