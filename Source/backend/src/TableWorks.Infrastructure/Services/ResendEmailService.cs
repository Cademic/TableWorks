using Microsoft.Extensions.Logging;
using Resend;
using ASideNote.Application.Interfaces;

namespace ASideNote.Infrastructure.Services;

public sealed class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromAddress;
    private readonly string _fromName;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(IResend resend, ILogger<ResendEmailService> logger)
    {
        _resend = resend;
        _logger = logger;
        _fromAddress = Environment.GetEnvironmentVariable("EMAIL_FROM_ADDRESS") ?? "noreply@asidenote.com";
        _fromName = Environment.GetEnvironmentVariable("EMAIL_FROM_NAME") ?? "ASideNote";
    }

    public async Task SendVerificationEmailAsync(string toEmail, string username, string verificationUrl, CancellationToken cancellationToken = default)
    {
        var htmlBody = $"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 600; color: #111; margin-bottom: 8px;">Verify your email</h1>
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                    Hi {username}, thanks for signing up for ASideNote. Please confirm your email address by clicking the button below.
                </p>
                <a href="{verificationUrl}" 
                   style="display: inline-block; background-color: #111; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                    Verify Email Address
                </a>
                <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
                    If you didn't create an account, you can safely ignore this email. This link expires in 24 hours.
                </p>
            </div>
            """;

        try
        {
            var message = new EmailMessage
            {
                From = $"{_fromName} <{_fromAddress}>",
                Subject = "Verify your ASideNote email address",
                HtmlBody = htmlBody
            };
            message.To.Add(toEmail);

            await _resend.EmailSendAsync(message, cancellationToken);
            _logger.LogInformation("Verification email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", toEmail);
            throw;
        }
    }
}
