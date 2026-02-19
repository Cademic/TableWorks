using Amazon.S3;
using Amazon.S3.Model;
using ASideNote.Application.Interfaces;
using ASideNote.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace ASideNote.Infrastructure.Services;

public sealed class R2ImageStorageService : IImageStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly R2Options _options;

    public R2ImageStorageService(IAmazonS3 s3, IOptions<R2Options> options)
    {
        _s3 = s3;
        _options = options.Value;
    }

    public async Task<ImageUploadResult> UploadAsync(Guid notebookId, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        var ext = GetExtensionFromContentType(contentType);
        var key = $"notebooks/{notebookId}/{Guid.NewGuid():N}{ext}";

        long sizeBytes;
        MemoryStream? ms = null;
        Stream stream = content;
        if (!content.CanSeek)
        {
            ms = new MemoryStream();
            await content.CopyToAsync(ms, cancellationToken);
            ms.Position = 0;
            stream = ms;
        }
        sizeBytes = stream.Length;

        try
        {
            var request = new PutObjectRequest
            {
                BucketName = _options.Bucket!,
                Key = key,
                InputStream = stream,
                ContentType = contentType,
                DisablePayloadSigning = true
            };

            await _s3.PutObjectAsync(request, cancellationToken);

            var url = string.IsNullOrWhiteSpace(_options.PublicBaseUrl)
                ? $"{_options.ServiceUrl}/{_options.Bucket}/{key}"
                : $"{_options.PublicBaseUrl.TrimEnd('/')}/{key}";
            return new ImageUploadResult(url, key, sizeBytes);
        }
        finally
        {
            ms?.Dispose();
        }
    }

    public async Task<string?> DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default)
    {
        var key = UrlToStorageKey(url);
        if (key is null)
            return null;

        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _options.Bucket!,
                Key = key
            };
            await _s3.DeleteObjectAsync(request, cancellationToken);
            return key;
        }
        catch
        {
            return null;
        }
    }

    private string? UrlToStorageKey(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;
        if (url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return null;
        string? key = null;
        if (!string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
        {
            var baseUrl = _options.PublicBaseUrl.TrimEnd('/') + "/";
            if (url.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase))
                key = url[baseUrl.Length..].TrimStart('/');
        }
        if (key is null && url.Contains($"/{_options.Bucket}/", StringComparison.OrdinalIgnoreCase))
        {
            var idx = url.IndexOf($"/{_options.Bucket}/", StringComparison.OrdinalIgnoreCase);
            key = url[(idx + _options.Bucket!.Length + 2)..].Split('?')[0];
        }
        if (key is null || !key.StartsWith("notebooks/", StringComparison.Ordinal))
            return null;
        return key;
    }

    private static string GetExtensionFromContentType(string contentType)
    {
        return contentType?.ToLowerInvariant() switch
        {
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            "image/svg+xml" => ".svg",
            _ => ".bin"
        };
    }
}
