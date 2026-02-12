using ASideNote.Core.Entities;

namespace ASideNote.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string HashRefreshToken(string token);
    int AccessTokenExpirationMinutes { get; }
}
