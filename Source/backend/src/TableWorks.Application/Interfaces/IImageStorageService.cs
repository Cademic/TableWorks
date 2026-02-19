namespace ASideNote.Application.Interfaces;

/// <summary>Stores and retrieves image blobs (e.g. Cloudflare R2). Returns public URLs for stored images.</summary>
public interface IImageStorageService
{
    /// <summary>Upload an image stream and return the public URL.</summary>
    /// <param name="data">Image content stream.</param>
    /// <param name="contentType">MIME type (e.g. image/jpeg, image/png).</param>
    /// <param name="key">Storage key (e.g. notebooks/{notebookId}/{guid}.jpg).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Public URL for the stored image.</returns>
    Task<string> UploadAsync(Stream data, string contentType, string key, CancellationToken cancellationToken = default);

    /// <summary>Delete an image from storage if the URL belongs to this service (e.g. our R2 bucket). No-op for external or base64 URLs.</summary>
    Task DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default);
}
