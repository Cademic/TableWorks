using ASideNote.Application.DTOs.Auth;

namespace ASideNote.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<TokenResponse> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default);
    Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default);
    Task VerifyEmailAsync(string token, CancellationToken cancellationToken = default);
    Task ResendVerificationAsync(string email, CancellationToken cancellationToken = default);
    Task<AuthResponse> GoogleLoginAsync(string idToken, CancellationToken cancellationToken = default);
}
