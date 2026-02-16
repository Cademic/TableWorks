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
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;

            var payload = new
            {
                error = "Forbidden",
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
            if (IsMissingTableError(exception))
            {
                _logger.LogWarning("Database schema is out of date (missing table). Run EF Core migrations. See Docs/Deployment/RunMigrationsOnRender.md");
                context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                var payload = new
                {
                    error = "ServiceUnavailable",
                    message = "Database schema is out of date. Please run EF Core migrations (see deployment docs).",
                    code = "SchemaOutOfDate"
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

    /// <summary>True if the exception chain indicates a PostgreSQL "relation does not exist" (e.g. migrations not applied).</summary>
    private static bool IsMissingTableError(Exception ex)
    {
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException pg && pg.SqlState == "42P01")
                return true;
        }
        return false;
    }
}
