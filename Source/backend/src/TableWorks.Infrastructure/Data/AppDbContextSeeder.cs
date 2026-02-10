using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TableWorks.Core.Entities;

namespace TableWorks.Infrastructure.Data;

public static class AppDbContextSeeder
{
    private static readonly Guid AdminUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static async Task SeedAsync(AppDbContext dbContext, ILogger logger)
    {
        await SeedAdminUserAsync(dbContext, logger);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(AppDbContext dbContext, ILogger logger)
    {
        var adminExists = await dbContext.Users.AnyAsync(u => u.Id == AdminUserId);

        if (adminExists)
        {
            logger.LogInformation("Admin user already exists – skipping seed.");
            return;
        }

        var adminUser = new User
        {
            Id = AdminUserId,
            Username = "admin",
            Email = "admin@tableworks.local",
            PasswordHash = string.Empty,
            Role = "Admin",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await dbContext.Users.AddAsync(adminUser);

        var adminPreferences = new UserPreferences
        {
            Id = Guid.NewGuid(),
            UserId = AdminUserId,
            Theme = "System",
            AutoSaveInterval = 2,
            DefaultView = "Table",
            UpdatedAt = DateTime.UtcNow
        };

        await dbContext.UserPreferences.AddAsync(adminPreferences);

        logger.LogInformation("Seeded admin user (id: {AdminUserId}).", AdminUserId);
    }
}
