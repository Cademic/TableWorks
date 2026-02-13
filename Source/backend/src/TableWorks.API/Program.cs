using System.Threading.RateLimiting;
using System.Text;
using Asp.Versioning;
using DotNetEnv;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Serilog;
using ASideNote.API.Middleware;
using ASideNote.Application.Interfaces;
using ASideNote.Application.Services;
using ASideNote.Core.Interfaces;
using ASideNote.Infrastructure.Data;
using ASideNote.Infrastructure.Repositories;
using ASideNote.Infrastructure.Services;

// ---------------------------------------------------------------------------
// Load .env file (development convenience – no-op if file doesn't exist)
// Search upward from the working directory to find the nearest .env file.
// ---------------------------------------------------------------------------
LoadEnvFile();

static void LoadEnvFile()
{
    var dir = Directory.GetCurrentDirectory();
    while (dir is not null)
    {
        var envPath = Path.Combine(dir, ".env");
        if (File.Exists(envPath))
        {
            Env.Load(envPath);
            return;
        }
        dir = Directory.GetParent(dir)?.FullName;
    }
    // No .env found – that's fine in production (env vars set by host).
}

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Serilog
// ---------------------------------------------------------------------------
builder.Host.UseSerilog((context, loggerConfiguration) =>
{
    loggerConfiguration.ReadFrom.Configuration(context.Configuration);
    loggerConfiguration.WriteTo.Console();
});

// ---------------------------------------------------------------------------
// Controllers & API Explorer
// ---------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ---------------------------------------------------------------------------
// API Versioning
// ---------------------------------------------------------------------------
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// ---------------------------------------------------------------------------
// Swagger / OpenAPI
// ---------------------------------------------------------------------------
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ASideNote API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token in the format: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ---------------------------------------------------------------------------
// Database – PostgreSQL via EF Core (env-var overrides supported)
// ---------------------------------------------------------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = ResolveConnectionString(builder.Configuration);
    options.UseNpgsql(connectionString);
});

// ---------------------------------------------------------------------------
// CORS – environment-aware origin allowlist
// ---------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS");
    var origins = !string.IsNullOrWhiteSpace(corsOrigins)
        ? corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : new[] { "http://localhost:5173" };

    options.AddPolicy("AllowedOrigins", policy =>
    {
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ---------------------------------------------------------------------------
// JWT Authentication
// ---------------------------------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? jwtSection["Secret"]
    ?? (builder.Environment.IsDevelopment()
        ? "DEV_ONLY_FALLBACK_SECRET_CHANGE_IN_PRODUCTION_MIN_32_CHARS"
        : throw new InvalidOperationException("JWT_SECRET environment variable is required in non-development environments."));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

// ---------------------------------------------------------------------------
// Google OAuth (optional – enabled when GOOGLE_CLIENT_ID is set)
// ---------------------------------------------------------------------------
var googleClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
var googleClientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle("Google", googleOptions =>
        {
            googleOptions.ClientId = googleClientId;
            googleOptions.ClientSecret = googleClientSecret;
            googleOptions.CallbackPath = "/api/v1/auth/google-callback";
        });
}

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Auth endpoints: 10 requests per minute per IP
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // General API: 100 requests per minute per IP
    options.AddPolicy("general", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

// ---------------------------------------------------------------------------
// AutoMapper, FluentValidation, Health Checks
// ---------------------------------------------------------------------------
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddValidatorsFromAssemblyContaining<ASideNote.Application.Validators.Auth.RegisterRequestValidator>();
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("postgres");

// ---------------------------------------------------------------------------
// HttpContext accessor
// ---------------------------------------------------------------------------
builder.Services.AddHttpContextAccessor();

// ---------------------------------------------------------------------------
// Repositories & Unit of Work
// ---------------------------------------------------------------------------
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ---------------------------------------------------------------------------
// Infrastructure Services
// ---------------------------------------------------------------------------
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// ---------------------------------------------------------------------------
// Email Service (Resend)
// ---------------------------------------------------------------------------
var resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY");
if (!string.IsNullOrWhiteSpace(resendApiKey))
{
    builder.Services.AddOptions();
    builder.Services.AddHttpClient<Resend.ResendClient>();
    builder.Services.Configure<Resend.ResendClientOptions>(options =>
    {
        options.ApiToken = resendApiKey;
    });
    builder.Services.AddTransient<Resend.IResend, Resend.ResendClient>();
    builder.Services.AddScoped<IEmailService, ResendEmailService>();
}
else
{
    // Development fallback: log emails instead of sending
    builder.Services.AddScoped<IEmailService, ASideNote.Infrastructure.Services.ConsoleEmailService>();
}

// ---------------------------------------------------------------------------
// Application Services
// ---------------------------------------------------------------------------
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INoteService, NoteService>();
builder.Services.AddScoped<IIndexCardService, IndexCardService>();
builder.Services.AddScoped<IBoardConnectionService, BoardConnectionService>();
builder.Services.AddScoped<IBoardService, BoardService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IDrawingService, DrawingService>();
builder.Services.AddScoped<ICalendarEventService, CalendarEventService>();

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
var app = builder.Build();

// ---------------------------------------------------------------------------
// Migration status logging (always)
// ---------------------------------------------------------------------------
await LogMigrationStatusAsync(app);

// ---------------------------------------------------------------------------
// Optional dev-only auto-migrate
// ---------------------------------------------------------------------------
if (ShouldApplyMigrationsOnStartup(app))
{
    await ApplyMigrationsAsync(app);
}

// ---------------------------------------------------------------------------
// Seed-only entry point: dotnet run --seed
// ---------------------------------------------------------------------------
if (ShouldRunSeedOnly(args))
{
    await SeedDatabaseAsync(app);
    return;
}

// ---------------------------------------------------------------------------
// Middleware pipeline
// ---------------------------------------------------------------------------

// Swagger: enabled in Development/Staging, restricted in Production
if (!app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }

    await next();
});

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("AllowedOrigins");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Health checks
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // liveness: app is up, no dependency checks
});
app.MapHealthChecks("/health/ready"); // readiness: includes DB check

app.MapControllers();

app.Run();

// ==========================================================================
// Helper methods
// ==========================================================================

static string ResolveConnectionString(IConfiguration configuration)
{
    var connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=asidenote;Username=postgres;Password=postgres";

    var connectionBuilder = new NpgsqlConnectionStringBuilder(connectionString);

    var host = Environment.GetEnvironmentVariable("DB_HOST");
    var portValue = Environment.GetEnvironmentVariable("DB_PORT");
    var database = Environment.GetEnvironmentVariable("DB_NAME");
    var username = Environment.GetEnvironmentVariable("DB_USER");
    var password = Environment.GetEnvironmentVariable("DB_PASSWORD");

    if (!string.IsNullOrWhiteSpace(host))
        connectionBuilder.Host = host;

    if (!string.IsNullOrWhiteSpace(portValue) && int.TryParse(portValue, out var port))
        connectionBuilder.Port = port;

    if (!string.IsNullOrWhiteSpace(database))
        connectionBuilder.Database = database;

    if (!string.IsNullOrWhiteSpace(username))
        connectionBuilder.Username = username;

    if (!string.IsNullOrWhiteSpace(password))
        connectionBuilder.Password = password;

    return connectionBuilder.ConnectionString;
}

static bool ShouldRunSeedOnly(string[] args)
{
    return args.Any(a => a.Equals("--seed", StringComparison.OrdinalIgnoreCase));
}

static bool ShouldApplyMigrationsOnStartup(WebApplication app)
{
    var shouldApply = app.Configuration.GetValue("Database:ApplyMigrationsOnStartup", false);
    return shouldApply && app.Environment.IsDevelopment();
}

static async Task LogMigrationStatusAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseSetup");
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        var pendingMigrations = (await dbContext.Database.GetPendingMigrationsAsync()).ToList();

        if (pendingMigrations.Count == 0)
        {
            logger.LogInformation("Database migrations are up to date.");
        }
        else
        {
            logger.LogWarning(
                "Pending EF Core migrations detected ({Count}): {Migrations}",
                pendingMigrations.Count,
                string.Join(", ", pendingMigrations));
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Could not check migration status – is the database reachable?");
    }
}

static async Task ApplyMigrationsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseSetup");
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    logger.LogInformation("Applying EF Core migrations on startup (Development mode).");
    await dbContext.Database.MigrateAsync();
    logger.LogInformation("EF Core migrations applied successfully.");
}

static async Task SeedDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseSeeder");
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    logger.LogInformation("Running database seed...");
    await dbContext.Database.MigrateAsync();
    await AppDbContextSeeder.SeedAsync(dbContext, logger);
    logger.LogInformation("Database seed completed.");
}
