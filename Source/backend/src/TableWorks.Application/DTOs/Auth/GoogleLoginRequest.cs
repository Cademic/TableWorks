namespace ASideNote.Application.DTOs.Auth;

public sealed class GoogleLoginRequest
{
    /// <summary>
    /// The Google ID token received from the frontend Google Sign-In flow.
    /// </summary>
    public string IdToken { get; set; } = string.Empty;
}
