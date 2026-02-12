using ASideNote.Application.DTOs.Users;

namespace ASideNote.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task<UserPreferencesDto> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdatePreferencesAsync(Guid userId, UpdatePreferencesRequest request, CancellationToken cancellationToken = default);
}
