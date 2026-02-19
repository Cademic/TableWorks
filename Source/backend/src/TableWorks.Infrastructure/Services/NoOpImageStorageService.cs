using ASideNote.Application.Interfaces;

namespace ASideNote.Infrastructure.Services;

/// <summary>No-op implementation for development when R2 credentials are not configured.</summary>
public sealed class NoOpImageStorageService : IImageStorageService
{
    public Task<string> UploadAsync(Stream data, string contentType, string key, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException(
            "Image storage is not configured. Set R2__AccessKeyId, R2__SecretAccessKey, R2__Bucket, and R2__PublicUrl in appsettings or environment variables.");
    }

    public Task DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
