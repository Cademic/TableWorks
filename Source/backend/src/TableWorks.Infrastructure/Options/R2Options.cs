namespace ASideNote.Infrastructure.Options;

/// <summary>R2 (S3-compatible) storage configuration. Env: R2__AccessKeyId, R2__SecretAccessKey, R2__Bucket, R2__AccountId, R2__PublicBaseUrl.</summary>
public sealed class R2Options
{
    public const string SectionName = "R2";

    public string? AccessKeyId { get; set; }
    public string? SecretAccessKey { get; set; }
    public string? Bucket { get; set; }
    public string? AccountId { get; set; }
    /// <summary>Public base URL for served images, e.g. https://images.example.com</summary>
    public string? PublicBaseUrl { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(AccessKeyId) &&
        !string.IsNullOrWhiteSpace(SecretAccessKey) &&
        !string.IsNullOrWhiteSpace(Bucket) &&
        !string.IsNullOrWhiteSpace(AccountId);

    public string ServiceUrl => $"https://{AccountId}.r2.cloudflarestorage.com";
}
