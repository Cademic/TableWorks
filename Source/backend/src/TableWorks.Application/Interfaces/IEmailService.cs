namespace ASideNote.Application.Interfaces;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string username, string verificationUrl, CancellationToken cancellationToken = default);
}
