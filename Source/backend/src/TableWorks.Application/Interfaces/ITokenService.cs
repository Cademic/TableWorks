using TableWorks.Core.Entities;

namespace TableWorks.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string HashRefreshToken(string token);
    int AccessTokenExpirationMinutes { get; }
}
