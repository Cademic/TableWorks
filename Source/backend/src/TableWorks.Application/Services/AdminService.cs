using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.Admin;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.DTOs.Notes;
using ASideNote.Application.DTOs.Projects;
using ASideNote.Application.DTOs.Tags;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class AdminService : IAdminService
{
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<Note> _noteRepo;
    private readonly IRepository<AuditLog> _auditLogRepo;
    private readonly IRepository<Project> _projectRepo;
    private readonly IUnitOfWork _unitOfWork;

    public AdminService(
        IRepository<User> userRepo,
        IRepository<Note> noteRepo,
        IRepository<AuditLog> auditLogRepo,
        IRepository<Project> projectRepo,
        IUnitOfWork unitOfWork)
    {
        _userRepo = userRepo;
        _noteRepo = noteRepo;
        _auditLogRepo = auditLogRepo;
        _projectRepo = projectRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResponse<AdminUserDto>> GetUsersAsync(AdminUserListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _userRepo.Query()
            .Include(u => u.Notes)
            .Include(u => u.OwnedProjects)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(u => u.Username.Contains(query.Search) || u.Email.Contains(query.Search));

        if (!string.IsNullOrWhiteSpace(query.Role))
            q = q.Where(u => u.Role == query.Role);

        if (query.IsActive.HasValue)
            q = q.Where(u => u.IsActive == query.IsActive.Value);

        var total = await q.CountAsync(cancellationToken);

        var users = await q
            .OrderByDescending(u => u.CreatedAt)
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var items = users.Select(u => new AdminUserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt,
            Stats = new AdminUserStatsDto
            {
                NoteCount = u.Notes.Count,
                ProjectCount = u.OwnedProjects.Count
            }
        }).ToList();

        return new PaginatedResponse<AdminUserDto>
        {
            Items = items,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }

    public async Task<AdminUserDetailDto> GetUserDetailAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.Query()
            .Include(u => u.Notes).ThenInclude(n => n.NoteTags).ThenInclude(nt => nt.Tag)
            .Include(u => u.OwnedProjects).ThenInclude(p => p.Members)
            .Include(u => u.AuditLogs)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        return new AdminUserDetailDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            Stats = new AdminUserStatsDto
            {
                NoteCount = user.Notes.Count,
                ProjectCount = user.OwnedProjects.Count
            },
            Notes = user.Notes.Take(20).Select(n => new NoteSummaryDto
            {
                Id = n.Id,
                Title = n.Title,
                FolderId = n.FolderId,
                ProjectId = n.ProjectId,
                Tags = n.NoteTags.Select(nt => new TagDto
                {
                    Id = nt.Tag!.Id,
                    Name = nt.Tag.Name,
                    Color = nt.Tag.Color
                }).ToList(),
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            }).ToList(),
            Projects = user.OwnedProjects.Take(20).Select(p => new ProjectSummaryDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                Deadline = p.Deadline,
                Status = p.Status,
                Progress = p.Progress,
                OwnerId = p.OwnerId,
                MemberCount = p.Members.Count,
                CreatedAt = p.CreatedAt
            }).ToList(),
            ActivityLog = user.AuditLogs.OrderByDescending(a => a.Timestamp).Take(50).Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                ActionType = a.ActionType,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                Details = a.DetailsJson,
                IpAddress = a.IpAddress,
                Timestamp = a.Timestamp
            }).ToList()
        };
    }

    public async Task UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = request.IsActive;
        _userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        _userRepo.Delete(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<PaginatedResponse<AdminNoteDto>> GetNotesAsync(AdminNoteListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _noteRepo.Query()
            .Include(n => n.User)
            .AsQueryable();

        if (query.UserId.HasValue)
            q = q.Where(n => n.UserId == query.UserId.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(n => n.Title != null && n.Title.Contains(query.Search));

        var total = await q.CountAsync(cancellationToken);

        var notes = await q
            .OrderByDescending(n => n.UpdatedAt)
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var items = notes.Select(n => new AdminNoteDto
        {
            Id = n.Id,
            Title = n.Title,
            UserId = n.UserId,
            Username = n.User?.Username ?? string.Empty,
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt
        }).ToList();

        return new PaginatedResponse<AdminNoteDto>
        {
            Items = items,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }

    public async Task DeleteNoteAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var note = await _noteRepo.GetByIdAsync(noteId, cancellationToken)
            ?? throw new KeyNotFoundException("Note not found.");

        _noteRepo.Delete(note);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<PaginatedResponse<AuditLogDto>> GetAuditLogsAsync(AuditLogListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _auditLogRepo.Query().AsQueryable();

        if (query.UserId.HasValue)
            q = q.Where(a => a.UserId == query.UserId.Value);

        if (!string.IsNullOrWhiteSpace(query.ActionType))
            q = q.Where(a => a.ActionType == query.ActionType);

        if (query.StartDate.HasValue)
            q = q.Where(a => a.Timestamp >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            q = q.Where(a => a.Timestamp <= query.EndDate.Value);

        var total = await q.CountAsync(cancellationToken);

        var logs = await q
            .OrderByDescending(a => a.Timestamp)
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var items = logs.Select(a => new AuditLogDto
        {
            Id = a.Id,
            UserId = a.UserId,
            ActionType = a.ActionType,
            EntityType = a.EntityType,
            EntityId = a.EntityId,
            Details = a.DetailsJson,
            IpAddress = a.IpAddress,
            Timestamp = a.Timestamp
        }).ToList();

        return new PaginatedResponse<AuditLogDto>
        {
            Items = items,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }
}
