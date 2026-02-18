using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.Notebooks;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class NotebookService : INotebookService
{
    private const int MaxNotebooksPerUser = 5;

    private readonly IRepository<Notebook> _notebookRepo;
    private readonly IRepository<Project> _projectRepo;
    private readonly IRepository<ProjectMember> _memberRepo;
    private readonly IUnitOfWork _unitOfWork;

    public NotebookService(
        IRepository<Notebook> notebookRepo,
        IRepository<Project> projectRepo,
        IRepository<ProjectMember> memberRepo,
        IUnitOfWork unitOfWork)
    {
        _notebookRepo = notebookRepo;
        _projectRepo = projectRepo;
        _memberRepo = memberRepo;
        _unitOfWork = unitOfWork;
    }

    private async Task<string?> GetProjectRoleAsync(Guid userId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await _projectRepo.Query()
            .Where(p => p.Id == projectId)
            .Select(p => new { p.OwnerId })
            .FirstOrDefaultAsync(cancellationToken);
        if (project is null) return null;
        if (project.OwnerId == userId) return "Owner";
        var member = await _memberRepo.Query()
            .Where(m => m.ProjectId == projectId && m.UserId == userId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        return member ?? null;
    }

    public async Task<PaginatedResponse<NotebookSummaryDto>> GetNotebooksAsync(Guid userId, NotebookListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _notebookRepo.Query()
            .Where(n => n.UserId == userId);

        var total = await q.CountAsync(cancellationToken);

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "createdat" => query.SortOrder == "asc" ? q.OrderBy(n => n.CreatedAt) : q.OrderByDescending(n => n.CreatedAt),
            "name" => query.SortOrder == "asc" ? q.OrderBy(n => n.Name) : q.OrderByDescending(n => n.Name),
            _ => query.SortOrder == "asc" ? q.OrderBy(n => n.UpdatedAt) : q.OrderByDescending(n => n.UpdatedAt),
        };

        var notebooks = await q
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(n => new NotebookSummaryDto
            {
                Id = n.Id,
                Name = n.Name,
                ProjectId = n.ProjectId,
                IsPinned = n.IsPinned,
                PinnedAt = n.PinnedAt,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return new PaginatedResponse<NotebookSummaryDto>
        {
            Items = notebooks,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }

    public async Task<NotebookDetailDto> GetNotebookByIdAsync(Guid userId, Guid notebookId, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .Where(n => n.Id == notebookId && n.UserId == userId)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        return new NotebookDetailDto
        {
            Id = notebook.Id,
            Name = notebook.Name,
            IsPinned = notebook.IsPinned,
            PinnedAt = notebook.PinnedAt,
            CreatedAt = notebook.CreatedAt,
            UpdatedAt = notebook.UpdatedAt,
            ContentJson = notebook.ContentJson ?? "{\"type\":\"doc\",\"content\":[]}"
        };
    }

    public async Task<NotebookSummaryDto> CreateNotebookAsync(Guid userId, CreateNotebookRequest request, CancellationToken cancellationToken = default)
    {
        var count = await _notebookRepo.Query()
            .CountAsync(n => n.UserId == userId, cancellationToken);
        if (count >= MaxNotebooksPerUser)
            throw new InvalidOperationException("Maximum 5 notebooks allowed. Delete one to create another.");

        var now = DateTime.UtcNow;
        var notebook = new Notebook
        {
            UserId = userId,
            Name = request.Name.Trim(),
            ProjectId = request.ProjectId,
            ContentJson = "{\"type\":\"doc\",\"content\":[]}",
            CreatedAt = now,
            UpdatedAt = now
        };

        await _notebookRepo.AddAsync(notebook, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new NotebookSummaryDto
        {
            Id = notebook.Id,
            Name = notebook.Name,
            IsPinned = false,
            PinnedAt = null,
            CreatedAt = notebook.CreatedAt,
            UpdatedAt = notebook.UpdatedAt
        };
    }

    public async Task UpdateNotebookAsync(Guid userId, Guid notebookId, UpdateNotebookRequest request, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        notebook.Name = request.Name.Trim();
        notebook.UpdatedAt = DateTime.UtcNow;

        _notebookRepo.Update(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateNotebookContentAsync(Guid userId, Guid notebookId, UpdateNotebookContentRequest request, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        notebook.ContentJson = request.ContentJson ?? "{\"type\":\"doc\",\"content\":[]}";
        notebook.UpdatedAt = DateTime.UtcNow;

        _notebookRepo.Update(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteNotebookAsync(Guid userId, Guid notebookId, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        _notebookRepo.Delete(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task TogglePinAsync(Guid userId, Guid notebookId, bool isPinned, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        notebook.IsPinned = isPinned;
        notebook.PinnedAt = isPinned ? DateTime.UtcNow : null;
        notebook.UpdatedAt = DateTime.UtcNow;

        _notebookRepo.Update(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<NotebookSummaryDto>> GetPinnedNotebooksAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _notebookRepo.Query()
            .Where(n => n.UserId == userId && n.IsPinned)
            .OrderBy(n => n.PinnedAt)
            .Select(n => new NotebookSummaryDto
            {
                Id = n.Id,
                Name = n.Name,
                ProjectId = n.ProjectId,
                IsPinned = true,
                PinnedAt = n.PinnedAt,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task AddNotebookToProjectAsync(Guid userId, Guid projectId, Guid notebookId, CancellationToken cancellationToken = default)
    {
        var role = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (role is null || role == "Viewer")
            throw new UnauthorizedAccessException("You do not have permission to add notebooks to this project.");

        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found or you are not the notebook owner.");

        notebook.ProjectId = projectId;
        notebook.UpdatedAt = DateTime.UtcNow;

        _notebookRepo.Update(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveNotebookFromProjectAsync(Guid userId, Guid projectId, Guid notebookId, CancellationToken cancellationToken = default)
    {
        var role = await GetProjectRoleAsync(userId, projectId, cancellationToken);
        if (role is null || role == "Viewer")
            throw new UnauthorizedAccessException("You do not have permission to remove notebooks from this project.");

        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.ProjectId == projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found in this project.");

        notebook.ProjectId = null;
        notebook.UpdatedAt = DateTime.UtcNow;

        _notebookRepo.Update(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
