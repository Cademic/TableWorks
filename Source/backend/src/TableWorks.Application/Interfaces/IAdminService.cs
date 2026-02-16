using ASideNote.Application.DTOs.Admin;
using ASideNote.Application.DTOs.Common;

namespace ASideNote.Application.Interfaces;

public interface IAdminService
{
    Task<AdminStatsDto> GetAdminStatsAsync(CancellationToken cancellationToken = default);
    Task<AdminAnalyticsDto> GetAdminAnalyticsAsync(CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AdminUserDto>> GetUsersAsync(AdminUserListQuery query, CancellationToken cancellationToken = default);
    Task<AdminUserDetailDto> GetUserDetailAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);
    Task UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequest request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task RemoveUserFriendAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AdminNoteDto>> GetNotesAsync(AdminNoteListQuery query, CancellationToken cancellationToken = default);
    Task DeleteNoteAsync(Guid noteId, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AuditLogDto>> GetAuditLogsAsync(AuditLogListQuery query, CancellationToken cancellationToken = default);
}
