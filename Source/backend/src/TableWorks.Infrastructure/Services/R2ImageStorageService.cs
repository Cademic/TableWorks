using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using ASideNote.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ASideNote.Infrastructure.Services;

/// <summary>Cloudflare R2 storage implementation (S3-compatible API).</summary>
public sealed class R2ImageStorageService : IImageStorageService
{
    private readonly R2Options _options;
    private readonly ILogger<R2ImageStorageService> _logger;
    private readonly IAmazonS3 _s3;

    public R2ImageStorageService(IOptions<R2Options> options, ILogger<R2ImageStorageService> logger)
    {
        _options = options.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        if (string.IsNullOrWhiteSpace(_options.AccessKeyId) || string.IsNullOrWhiteSpace(_options.SecretAccessKey))
        {
            _logger.LogWarning("R2 credentials not configured; image upload will fail. Set R2__AccessKeyId and R2__SecretAccessKey.");
        }

        var serviceUrl = !string.IsNullOrWhiteSpace(_options.Endpoint)
            ? _options.Endpoint
            : $"https://{_options.AccountId}.r2.cloudflarestorage.com";

        var config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            ForcePathStyle = true,
            SignatureVersion = "v4",
        };

        var credentials = new BasicAWSCredentials(_options.AccessKeyId ?? "", _options.SecretAccessKey ?? "");
        _s3 = new AmazonS3Client(credentials, config);
    }

    public async Task<string> UploadAsync(Stream data, string contentType, string key, CancellationToken cancellationToken = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            InputStream = data,
            ContentType = contentType,
            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true,
        };

        await _s3.PutObjectAsync(request, cancellationToken);

        var publicUrl = !string.IsNullOrWhiteSpace(_options.PublicUrl)
            ? $"{_options.PublicUrl.TrimEnd('/')}/{key}"
            : throw new InvalidOperationException("R2__PublicUrl must be configured to return public image URLs.");

        return publicUrl;
    }

    public async Task DeleteByUrlIfOwnedAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(_options.PublicUrl)) return;
        var publicBase = _options.PublicUrl.TrimEnd('/');
        if (!url.StartsWith(publicBase, StringComparison.OrdinalIgnoreCase)) return;

        var key = url.Length == publicBase.Length ? "" : url[publicBase.Length..].TrimStart('/');
        if (string.IsNullOrEmpty(key)) return;

        try
        {
            await _s3.DeleteObjectAsync(_options.Bucket, key, cancellationToken);
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete R2 object {Key}: {Message}", key, ex.Message);
        }
    }
}

/// <summary>Configuration for Cloudflare R2 storage.</summary>
public sealed class R2Options
{
    public const string SectionName = "R2";

    public string? AccountId { get; set; }
    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string? Bucket { get; set; }
    public string? PublicUrl { get; set; }
    public string? Endpoint { get; set; }
}
