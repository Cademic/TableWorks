namespace ASideNote.Application.Interfaces;

/// <summary>Result of an image upload.</summary>
public record ImageUploadResult(string Url, string StorageKey, long SizeBytes);

/// <summary>Handles image upload and deletion in object storage (e.g. R2/S3).</summary>
public interface IImageStorageService
{
    /// <summary>Uploads image bytes for a notebook. Key format: notebooks/{notebookId}/{guid}.{ext}</summary>
    Task<ImageUploadResult> UploadAsync(Guid notebookId, Stream content, string contentType, CancellationToken cancellationToken = default);

    /// <summary>Uploads image bytes for a board. Key format: boards/{boardId}/{guid}.{ext}</summary>
    Task<ImageUploadResult> UploadForBoardAsync(Guid boardId, Stream content, string contentType, CancellationToken cancellationToken = default);

    /// <summary>Deletes the object if the URL refers to our storage. Returns the storage key when deleted, otherwise null.</summary>
    Task<string?> DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default);
}
