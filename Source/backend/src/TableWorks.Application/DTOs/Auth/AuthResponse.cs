namespace ASideNote.Application.DTOs.Auth;

public sealed class AuthResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    /// <summary>Profile picture key (e.g. preset avatar). Set for new users; included so UI can show avatar without an extra profile fetch.</summary>
    public string? ProfilePictureKey { get; set; }
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
}
