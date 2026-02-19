using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ASideNote.Infrastructure.Services;

public sealed class UserStorageService : IUserStorageService
{
    private readonly AppDbContext _db;

    public UserStorageService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> CanUploadAsync(Guid userId, long additionalBytes, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.StorageUsedBytes, u.StorageLimitBytes })
            .FirstOrDefaultAsync(cancellationToken);
        if (user is null)
            return false;
        return user.StorageUsedBytes + additionalBytes <= user.StorageLimitBytes;
    }

    public async Task RecordUploadAsync(Guid userId, string storageKey, long sizeBytes, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        var item = new UserStorageItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StorageKey = storageKey,
            SizeBytes = sizeBytes,
            CreatedAt = DateTime.UtcNow
        };
        await _db.UserStorageItems.AddAsync(item, cancellationToken);
        user.StorageUsedBytes += sizeBytes;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordDeletionByKeyAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var item = await _db.UserStorageItems
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.StorageKey == storageKey, cancellationToken);
        if (item is null)
            return;
        if (item.User is not null)
            item.User.StorageUsedBytes = Math.Max(0, item.User.StorageUsedBytes - item.SizeBytes);
        _db.UserStorageItems.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<(long UsedBytes, long LimitBytes)> GetStorageUsageAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.StorageUsedBytes, u.StorageLimitBytes })
            .FirstOrDefaultAsync(cancellationToken);
        return user is null ? (0, 524_288_000) : (user.StorageUsedBytes, user.StorageLimitBytes);
    }
}
