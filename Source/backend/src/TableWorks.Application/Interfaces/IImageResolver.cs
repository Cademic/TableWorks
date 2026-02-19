namespace ASideNote.Application.Interfaces;

/// <summary>Resolves image URLs to bytes for embedding in exports.</summary>
public interface IImageResolver
{
    /// <summary>Returns image bytes for the given URL, or null if resolution fails.</summary>
    Task<byte[]?> GetImageBytesAsync(string url, CancellationToken cancellationToken = default);
}
