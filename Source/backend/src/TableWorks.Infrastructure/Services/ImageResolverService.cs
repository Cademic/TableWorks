using Amazon.S3.Model;
using ASideNote.Application.Interfaces;
using ASideNote.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ASideNote.Infrastructure.Services;

public sealed class ImageResolverService : IImageResolver
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly R2Options _r2Options;
    private readonly ILogger<ImageResolverService> _logger;
    private readonly IR2ClientProvider _r2Provider;

    public ImageResolverService(
        IHttpClientFactory httpClientFactory,
        IOptions<R2Options> r2Options,
        ILogger<ImageResolverService> logger,
        IR2ClientProvider r2Provider)
    {
        _httpClientFactory = httpClientFactory;
        _r2Options = r2Options.Value;
        _logger = logger;
        _r2Provider = r2Provider;
    }

    public async Task<byte[]?> GetImageBytesAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;

        if (url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return DecodeDataUrl(url);

        var s3 = _r2Provider.Client;
        if (_r2Options.IsConfigured && s3 is not null && IsOurR2Url(url))
        {
            var key = UrlToStorageKey(url);
            if (key is not null)
            {
                try
                {
                    var request = new GetObjectRequest
                    {
                        BucketName = _r2Options.Bucket!,
                        Key = key
                    };
                    using var response = await s3.GetObjectAsync(request, cancellationToken);
                    await using var ms = new MemoryStream();
                    await response.ResponseStream.CopyToAsync(ms, cancellationToken);
                    return ms.ToArray();
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Failed to fetch image from R2 for key {Key}", key);
                    return null;
                }
            }
        }

        return await FetchViaHttpAsync(url, cancellationToken);
    }

    private static byte[]? DecodeDataUrl(string dataUrl)
    {
        var commaIdx = dataUrl.IndexOf(',');
        if (commaIdx < 0)
            return null;
        var base64 = dataUrl[(commaIdx + 1)..];
        try
        {
            return Convert.FromBase64String(base64);
        }
        catch
        {
            return null;
        }
    }

    private bool IsOurR2Url(string url)
    {
        if (string.IsNullOrWhiteSpace(_r2Options.PublicBaseUrl))
            return url.Contains(_r2Options.Bucket ?? "", StringComparison.OrdinalIgnoreCase);
        var baseUrl = _r2Options.PublicBaseUrl.TrimEnd('/') + "/";
        return url.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase);
    }

    private string? UrlToStorageKey(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;
        string? key = null;
        if (!string.IsNullOrWhiteSpace(_r2Options.PublicBaseUrl))
        {
            var baseUrl = _r2Options.PublicBaseUrl.TrimEnd('/') + "/";
            if (url.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase))
                key = url[baseUrl.Length..].TrimStart('/').Split('?')[0];
        }
        if (key is null && !string.IsNullOrEmpty(_r2Options.Bucket) &&
            url.Contains($"/{_r2Options.Bucket}/", StringComparison.OrdinalIgnoreCase))
        {
            var idx = url.IndexOf($"/{_r2Options.Bucket}/", StringComparison.OrdinalIgnoreCase);
            key = url[(idx + _r2Options.Bucket!.Length + 2)..].Split('?')[0];
        }
        return string.IsNullOrEmpty(key) || !key.StartsWith("notebooks/", StringComparison.Ordinal) ? null : key;
    }

    private async Task<byte[]?> FetchViaHttpAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var bytes = await client.GetByteArrayAsync(url, cancellationToken);
            return bytes;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to fetch image from URL");
            return null;
        }
    }
}
