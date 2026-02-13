namespace ASideNote.Application.DTOs.Auth;

public sealed class ResendVerificationRequest
{
    public string Email { get; set; } = string.Empty;
}
