namespace ASideNote.Application.Interfaces;

/// <summary>Result of an image upload.</summary>
public record ImageUploadResult(string Url, string StorageKey, long SizeBytes);

/// <summary>Handles image upload and deletion in object storage (e.g. R2/S3).</summary>
public interface IImageStorageService
{
    /// <summary>Uploads image bytes and returns the public URL, storage key, and size. Key format: notebooks/{notebookId}/{guid}.{ext}</summary>
    Task<ImageUploadResult> UploadAsync(Guid notebookId, Stream content, string contentType, CancellationToken cancellationToken = default);

    /// <summary>Deletes the object if the URL refers to our storage. Returns the storage key when deleted, otherwise null.</summary>
    Task<string?> DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default);
}
