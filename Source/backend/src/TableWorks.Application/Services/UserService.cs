using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.Users;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class UserService : IUserService
{
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<UserPreferences> _prefsRepo;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        IRepository<User> userRepo,
        IRepository<UserPreferences> prefsRepo,
        IUnitOfWork unitOfWork)
    {
        _userRepo = userRepo;
        _prefsRepo = prefsRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    public async Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        // Check uniqueness for email
        if (user.Email != request.Email)
        {
            var emailExists = await _userRepo.Query()
                .AnyAsync(u => u.Email == request.Email && u.Id != userId, cancellationToken);
            if (emailExists)
                throw new InvalidOperationException("Email is already in use.");
        }

        // Check uniqueness for username
        if (user.Username != request.Username)
        {
            var usernameExists = await _userRepo.Query()
                .AnyAsync(u => u.Username == request.Username && u.Id != userId, cancellationToken);
            if (usernameExists)
                throw new InvalidOperationException("Username is already in use.");
        }

        user.Username = request.Username;
        user.Email = request.Email;
        _userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserPreferencesDto> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var prefs = await _prefsRepo.Query()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (prefs is null)
        {
            return new UserPreferencesDto
            {
                Theme = "System",
                AutoSaveInterval = 2,
                DefaultView = "Table"
            };
        }

        return new UserPreferencesDto
        {
            Theme = prefs.Theme,
            EmailNotifications = prefs.EmailNotificationsJson,
            AutoSaveInterval = prefs.AutoSaveInterval,
            DefaultView = prefs.DefaultView
        };
    }

    public async Task UpdatePreferencesAsync(Guid userId, UpdatePreferencesRequest request, CancellationToken cancellationToken = default)
    {
        var prefs = await _prefsRepo.Query()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (prefs is null)
        {
            prefs = new UserPreferences
            {
                UserId = userId,
                Theme = request.Theme,
                AutoSaveInterval = request.AutoSaveInterval,
                DefaultView = request.DefaultView,
                UpdatedAt = DateTime.UtcNow
            };
            await _prefsRepo.AddAsync(prefs, cancellationToken);
        }
        else
        {
            prefs.Theme = request.Theme;
            prefs.AutoSaveInterval = request.AutoSaveInterval;
            prefs.DefaultView = request.DefaultView;
            prefs.UpdatedAt = DateTime.UtcNow;
            _prefsRepo.Update(prefs);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
