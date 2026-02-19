using ASideNote.Application.Interfaces;

namespace ASideNote.Infrastructure.Services;

/// <summary>No-op implementation for development when R2 is not configured.</summary>
public sealed class NoOpImageStorageService : IImageStorageService
{
    public Task<ImageUploadResult> UploadAsync(Guid notebookId, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("R2 storage is not configured. Set R2__AccessKeyId, R2__SecretAccessKey, R2__Bucket, R2__AccountId.");
    }

    public Task<string?> DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<string?>(null);
    }
}
