using Microsoft.Extensions.Logging;
using ASideNote.Application.Interfaces;

namespace ASideNote.Infrastructure.Services;

/// <summary>
/// Development-only fallback that logs email content to the console instead of sending.
/// </summary>
public sealed class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;

    public ConsoleEmailService(ILogger<ConsoleEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendVerificationEmailAsync(string toEmail, string username, string verificationUrl, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[DEV EMAIL] Verification email for {Username} ({Email}):\n  URL: {Url}",
            username, toEmail, verificationUrl);

        return Task.CompletedTask;
    }
}
