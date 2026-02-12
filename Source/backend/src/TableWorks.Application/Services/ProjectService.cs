using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.Boards;
using TableWorks.Application.DTOs.Notes;
using TableWorks.Application.DTOs.Projects;
using TableWorks.Application.DTOs.Tags;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class ProjectService : IProjectService
{
    private readonly IRepository<Project> _projectRepo;
    private readonly IRepository<ProjectMember> _memberRepo;
    private readonly IRepository<User> _userRepo;
    private readonly IUnitOfWork _unitOfWork;

    public ProjectService(
        IRepository<Project> projectRepo,
        IRepository<ProjectMember> memberRepo,
        IRepository<User> userRepo,
        IUnitOfWork unitOfWork)
    {
        _projectRepo = projectRepo;
        _memberRepo = memberRepo;
        _userRepo = userRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ProjectSummaryDto>> GetProjectsAsync(Guid userId, ProjectListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _projectRepo.Query()
            .Include(p => p.Owner)
            .Include(p => p.Members)
            .Include(p => p.Boards)
            .Where(p => p.OwnerId == userId || p.Members.Any(m => m.UserId == userId))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Status))
            q = q.Where(p => p.Status == query.Status);

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "createdat" => query.SortOrder == "asc" ? q.OrderBy(p => p.CreatedAt) : q.OrderByDescending(p => p.CreatedAt),
            "startdate" => query.SortOrder == "asc" ? q.OrderBy(p => p.StartDate) : q.OrderByDescending(p => p.StartDate),
            "enddate" => query.SortOrder == "asc" ? q.OrderBy(p => p.EndDate) : q.OrderByDescending(p => p.EndDate),
            _ => query.SortOrder == "asc" ? q.OrderBy(p => p.UpdatedAt) : q.OrderByDescending(p => p.UpdatedAt),
        };

        var projects = await q.AsNoTracking().ToListAsync(cancellationToken);

        return projects.Select(p => new ProjectSummaryDto
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
            OwnerUsername = p.Owner?.Username ?? string.Empty,
            UserRole = p.OwnerId == userId ? "Owner" : (p.Members.FirstOrDefault(m => m.UserId == userId)?.Role ?? "Viewer"),
            MemberCount = p.Members.Count,
            BoardCount = p.Boards.Count,
            CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task<ProjectDetailDto> CreateProjectAsync(Guid userId, CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var nameExists = await _projectRepo.Query()
            .AnyAsync(p => p.OwnerId == userId && p.Name == request.Name, cancellationToken);
        if (nameExists)
            throw new InvalidOperationException($"You already have a project named \"{request.Name}\".");

        var now = DateTime.UtcNow;
        var project = new Project
        {
            OwnerId = userId,
            Name = request.Name,
            Description = request.Description,
            StartDate = request.StartDate.HasValue
                ? DateTime.SpecifyKind(request.StartDate.Value, DateTimeKind.Utc)
                : null,
            EndDate = request.EndDate.HasValue
                ? DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc)
                : null,
            Deadline = request.Deadline.HasValue
                ? DateTime.SpecifyKind(request.Deadline.Value, DateTimeKind.Utc)
                : null,
            Status = "Active",
            Progress = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _projectRepo.AddAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetProjectByIdAsync(userId, project.Id, cancellationToken);
    }

    public async Task<ProjectDetailDto> GetProjectByIdAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepo.Query()
            .Include(p => p.Owner)
            .Include(p => p.Members).ThenInclude(m => m.User)
            .Include(p => p.Boards)
            .Include(p => p.Notes).ThenInclude(n => n.NoteTags).ThenInclude(nt => nt.Tag)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found.");

        if (project.OwnerId != userId && !project.Members.Any(m => m.UserId == userId))
            throw new UnauthorizedAccessException("Access denied.");

        var userRole = project.OwnerId == userId
            ? "Owner"
            : (project.Members.FirstOrDefault(m => m.UserId == userId)?.Role ?? "Viewer");

        return new ProjectDetailDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Deadline = project.Deadline,
            Status = project.Status,
            Progress = project.Progress,
            OwnerId = project.OwnerId,
            OwnerUsername = project.Owner?.Username ?? string.Empty,
            UserRole = userRole,
            CreatedAt = project.CreatedAt,
            Members = project.Members.Select(m => new ProjectMemberDto
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? string.Empty,
                Email = m.User?.Email ?? string.Empty,
                Role = m.Role,
                JoinedAt = m.JoinedAt
            }).ToList(),
            Boards = project.Boards.Select(b => new BoardSummaryDto
            {
                Id = b.Id,
                Name = b.Name,
                Description = b.Description,
                BoardType = b.BoardType,
                ProjectId = b.ProjectId,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            }).ToList(),
            Notes = project.Notes.Select(n => new NoteSummaryDto
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
            }).ToList()
        };
    }

    public async Task UpdateProjectAsync(Guid userId, Guid projectId, UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepo.Query()
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found or access denied.");

        project.Name = request.Name;
        project.Description = request.Description;
        project.StartDate = request.StartDate.HasValue
            ? DateTime.SpecifyKind(request.StartDate.Value, DateTimeKind.Utc)
            : null;
        project.EndDate = request.EndDate.HasValue
            ? DateTime.SpecifyKind(request.EndDate.Value, DateTimeKind.Utc)
            : null;
        project.Deadline = request.Deadline.HasValue
            ? DateTime.SpecifyKind(request.Deadline.Value, DateTimeKind.Utc)
            : null;
        project.Status = request.Status;
        project.Progress = request.Progress;
        project.UpdatedAt = DateTime.UtcNow;

        _projectRepo.Update(project);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteProjectAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepo.Query()
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found or access denied.");

        _projectRepo.Delete(project);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task AddMemberAsync(Guid userId, Guid projectId, AddMemberRequest request, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepo.Query()
            .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found or access denied.");

        var invitedUser = await _userRepo.Query()
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken)
            ?? throw new KeyNotFoundException("User with that email not found.");

        var alreadyMember = await _memberRepo.Query()
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == invitedUser.Id, cancellationToken);
        if (alreadyMember)
            throw new InvalidOperationException("User is already a member of this project.");

        var member = new ProjectMember
        {
            ProjectId = projectId,
            UserId = invitedUser.Id,
            Role = request.Role,
            JoinedAt = DateTime.UtcNow,
            InvitedByUserId = userId
        };

        await _memberRepo.AddAsync(member, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProjectMemberDto>> GetMembersAsync(Guid userId, Guid projectId, CancellationToken cancellationToken = default)
    {
        var hasAccess = await _projectRepo.Query()
            .AnyAsync(p => p.Id == projectId &&
                (p.OwnerId == userId || p.Members.Any(m => m.UserId == userId)), cancellationToken);
        if (!hasAccess)
            throw new KeyNotFoundException("Project not found or access denied.");

        var members = await _memberRepo.Query()
            .Include(m => m.User)
            .Where(m => m.ProjectId == projectId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return members.Select(m => new ProjectMemberDto
        {
            UserId = m.UserId,
            Username = m.User?.Username ?? string.Empty,
            Email = m.User?.Email ?? string.Empty,
            Role = m.Role,
            JoinedAt = m.JoinedAt
        }).ToList();
    }

    public async Task UpdateMemberRoleAsync(Guid userId, Guid projectId, Guid memberId, UpdateMemberRoleRequest request, CancellationToken cancellationToken = default)
    {
        var isOwner = await _projectRepo.Query()
            .AnyAsync(p => p.Id == projectId && p.OwnerId == userId, cancellationToken);
        if (!isOwner)
            throw new UnauthorizedAccessException("Only the project owner can update member roles.");

        var member = await _memberRepo.Query()
            .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == memberId, cancellationToken)
            ?? throw new KeyNotFoundException("Member not found.");

        member.Role = request.Role;
        _memberRepo.Update(member);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid userId, Guid projectId, Guid memberId, CancellationToken cancellationToken = default)
    {
        var isOwner = await _projectRepo.Query()
            .AnyAsync(p => p.Id == projectId && p.OwnerId == userId, cancellationToken);
        if (!isOwner)
            throw new UnauthorizedAccessException("Only the project owner can remove members.");

        var member = await _memberRepo.Query()
            .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == memberId, cancellationToken)
            ?? throw new KeyNotFoundException("Member not found.");

        _memberRepo.Delete(member);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
