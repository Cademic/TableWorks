using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.Auth;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<RefreshToken> _refreshTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthService(
        IRepository<User> userRepo,
        IRepository<RefreshToken> refreshTokenRepo,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _userRepo = userRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingEmail = await _userRepo.Query()
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (existingEmail)
            throw new InvalidOperationException("A user with this email already exists.");

        var existingUsername = await _userRepo.Query()
            .AnyAsync(u => u.Username == request.Username, cancellationToken);
        if (existingUsername)
            throw new InvalidOperationException("A user with this username already exists.");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = "User",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepo.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokenService.HashRefreshToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepo.AddAsync(refreshTokenEntity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Token = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresIn = _tokenService.AccessTokenExpirationMinutes * 60
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.Query()
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated.");

        user.LastLoginAt = DateTime.UtcNow;
        _userRepo.Update(user);

        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokenService.HashRefreshToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepo.AddAsync(refreshTokenEntity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Token = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresIn = _tokenService.AccessTokenExpirationMinutes * 60
        };
    }

    public async Task<TokenResponse> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.HashRefreshToken(request.RefreshToken);

        var storedToken = await _refreshTokenRepo.Query()
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null || storedToken.RevokedAt is not null || storedToken.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        if (storedToken.User is null || !storedToken.User.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated.");

        // Revoke old token
        storedToken.RevokedAt = DateTime.UtcNow;

        // Create new tokens
        var newAccessToken = _tokenService.GenerateAccessToken(storedToken.User);
        var newRawRefreshToken = _tokenService.GenerateRefreshToken();
        var newTokenHash = _tokenService.HashRefreshToken(newRawRefreshToken);

        storedToken.ReplacedByTokenHash = newTokenHash;
        _refreshTokenRepo.Update(storedToken);

        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = storedToken.UserId,
            TokenHash = newTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        await _refreshTokenRepo.AddAsync(newRefreshTokenEntity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TokenResponse
        {
            Token = newAccessToken,
            RefreshToken = newRawRefreshToken,
            ExpiresIn = _tokenService.AccessTokenExpirationMinutes * 60
        };
    }

    public async Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var activeTokens = await _refreshTokenRepo.Query()
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
            _refreshTokenRepo.Update(token);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
