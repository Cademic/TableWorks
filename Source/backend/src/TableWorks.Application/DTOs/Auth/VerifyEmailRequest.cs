namespace ASideNote.Application.DTOs.Auth;

public sealed class VerifyEmailRequest
{
    public string Token { get; set; } = string.Empty;
}
