using System.Text;
using Asp.Versioning;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Serilog;
using TableWorks.API.Middleware;
using TableWorks.Application.Interfaces;
using TableWorks.Application.Services;
using TableWorks.Core.Interfaces;
using TableWorks.Infrastructure.Data;
using TableWorks.Infrastructure.Repositories;
using TableWorks.Infrastructure.Services;

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
        Title = "TableWorks API",
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
// CORS
// ---------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ---------------------------------------------------------------------------
// JWT Authentication
// ---------------------------------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSecret = jwtSection["Secret"] ?? "CHANGE_ME_IN_DEVELOPMENT_AND_PRODUCTION";

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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// ---------------------------------------------------------------------------
// AutoMapper, FluentValidation, Health Checks
// ---------------------------------------------------------------------------
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddValidatorsFromAssemblyContaining<TableWorks.Application.Validators.Auth.RegisterRequestValidator>();
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
app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("FrontendDevPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

// ==========================================================================
// Helper methods
// ==========================================================================

static string ResolveConnectionString(IConfiguration configuration)
{
    var connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=tableworks;Username=postgres;Password=postgres";

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
