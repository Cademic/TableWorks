using Amazon.S3;
using Microsoft.Extensions.Options;

namespace ASideNote.Infrastructure.Services;

/// <summary>Provides IAmazonS3 when R2 is configured.</summary>
public interface IR2ClientProvider
{
    IAmazonS3? Client { get; }
}

public sealed class R2ClientProvider : IR2ClientProvider
{
    private readonly IAmazonS3 _s3;

    public R2ClientProvider(IAmazonS3 s3)
    {
        _s3 = s3;
    }

    public IAmazonS3? Client => _s3;
}

public sealed class NullR2ClientProvider : IR2ClientProvider
{
    public IAmazonS3? Client => null;
}
