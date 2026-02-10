using TableWorks.Application.DTOs.Admin;
using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.Interfaces;

public interface IAdminService
{
    Task<PaginatedResponse<AdminUserDto>> GetUsersAsync(AdminUserListQuery query, CancellationToken cancellationToken = default);
    Task<AdminUserDetailDto> GetUserDetailAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AdminNoteDto>> GetNotesAsync(AdminNoteListQuery query, CancellationToken cancellationToken = default);
    Task DeleteNoteAsync(Guid noteId, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AuditLogDto>> GetAuditLogsAsync(AuditLogListQuery query, CancellationToken cancellationToken = default);
}
