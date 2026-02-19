namespace ASideNote.Core.Entities;

/// <summary>Tracks a stored image for per-user storage quota.</summary>
public sealed class UserStorageItem
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
}
