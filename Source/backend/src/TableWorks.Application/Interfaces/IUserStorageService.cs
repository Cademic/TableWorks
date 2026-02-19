namespace ASideNote.Application.Interfaces;

/// <summary>Manages per-user storage quotas for image uploads.</summary>
public interface IUserStorageService
{
    /// <summary>Returns true if the user can upload additionalBytes without exceeding their limit.</summary>
    Task<bool> CanUploadAsync(Guid userId, long additionalBytes, CancellationToken cancellationToken = default);

    /// <summary>Records an upload; inserts UserStorageItem and updates User.StorageUsedBytes.</summary>
    Task RecordUploadAsync(Guid userId, string storageKey, long sizeBytes, CancellationToken cancellationToken = default);

    /// <summary>Records a deletion; removes UserStorageItem and subtracts from User.StorageUsedBytes.</summary>
    Task RecordDeletionByKeyAsync(string storageKey, CancellationToken cancellationToken = default);

    /// <summary>Returns the user's storage usage and limit in bytes.</summary>
    Task<(long UsedBytes, long LimitBytes)> GetStorageUsageAsync(Guid userId, CancellationToken cancellationToken = default);
}
