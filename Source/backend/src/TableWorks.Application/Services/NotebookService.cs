using System.Text.Json;
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
    private readonly IRepository<NotebookVersion> _versionRepo;
    private readonly IRepository<Project> _projectRepo;
    private readonly IRepository<ProjectMember> _memberRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IImageStorageService _imageStorage;

    public NotebookService(
        IRepository<Notebook> notebookRepo,
        IRepository<NotebookVersion> versionRepo,
        IRepository<Project> projectRepo,
        IRepository<ProjectMember> memberRepo,
        IUnitOfWork unitOfWork,
        IImageStorageService imageStorage)
    {
        _notebookRepo = notebookRepo;
        _versionRepo = versionRepo;
        _projectRepo = projectRepo;
        _memberRepo = memberRepo;
        _unitOfWork = unitOfWork;
        _imageStorage = imageStorage;
    }

    private static IReadOnlyList<string> ExtractImageUrls(string contentJson)
    {
        if (string.IsNullOrWhiteSpace(contentJson)) return Array.Empty<string>();
        try
        {
            using var doc = JsonDocument.Parse(contentJson);
            var list = new List<string>();
            CollectImageUrls(doc.RootElement, list);
            return list;
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static void CollectImageUrls(JsonElement node, List<string> urls)
    {
        if (node.TryGetProperty("type", out var type) && type.GetString() == "image"
            && node.TryGetProperty("attrs", out var attrs) && attrs.TryGetProperty("src", out var src))
        {
            var s = src.GetString();
            if (!string.IsNullOrWhiteSpace(s)) urls.Add(s);
        }
        if (node.TryGetProperty("content", out var content))
            foreach (var child in content.EnumerateArray())
                CollectImageUrls(child, urls);
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

        if (request.UpdatedAt.HasValue)
        {
            var clientUpdated = request.UpdatedAt.Value.Kind == DateTimeKind.Utc
                ? request.UpdatedAt.Value
                : DateTime.SpecifyKind(request.UpdatedAt.Value, DateTimeKind.Utc);
            if (Math.Abs((notebook.UpdatedAt - clientUpdated).TotalSeconds) > 1)
                throw new InvalidOperationException("Document was modified elsewhere. Reload to get the latest version.");
        }

        var oldUrls = ExtractImageUrls(notebook.ContentJson ?? "").ToHashSet(StringComparer.Ordinal);
        var newUrls = ExtractImageUrls(request.ContentJson ?? "").ToHashSet(StringComparer.Ordinal);
        var removedUrls = oldUrls.Except(newUrls);
        foreach (var url in removedUrls)
            await _imageStorage.DeleteByUrlIfOwnedAsync(url, cancellationToken);

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

        var imageUrls = ExtractImageUrls(notebook.ContentJson ?? "");
        foreach (var url in imageUrls)
            await _imageStorage.DeleteByUrlIfOwnedAsync(url, cancellationToken);

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

    public async Task<NotebookVersionDto> CreateVersionAsync(Guid userId, Guid notebookId, CreateNotebookVersionRequest? request, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        var version = new NotebookVersion
        {
            Id = Guid.NewGuid(),
            NotebookId = notebookId,
            ContentJson = notebook.ContentJson ?? "{\"type\":\"doc\",\"content\":[]}",
            CreatedAt = DateTime.UtcNow,
            Label = request?.Label
        };
        await _versionRepo.AddAsync(version, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new NotebookVersionDto
        {
            Id = version.Id,
            NotebookId = version.NotebookId,
            CreatedAt = version.CreatedAt,
            Label = version.Label
        };
    }

    public async Task<IReadOnlyList<NotebookVersionDto>> GetVersionsAsync(Guid userId, Guid notebookId, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .Where(n => n.Id == notebookId && n.UserId == userId)
            .AsNoTracking()
            .Select(n => n.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (notebook == default)
            throw new KeyNotFoundException("Notebook not found.");

        var versions = await _versionRepo.Query()
            .Where(v => v.NotebookId == notebookId)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new NotebookVersionDto
            {
                Id = v.Id,
                NotebookId = v.NotebookId,
                CreatedAt = v.CreatedAt,
                Label = v.Label
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);
        return versions;
    }

    public async Task<NotebookVersionDto?> GetVersionByIdAsync(Guid userId, Guid notebookId, Guid versionId, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .Where(n => n.Id == notebookId && n.UserId == userId)
            .AsNoTracking()
            .Select(n => n.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (notebook == default)
            throw new KeyNotFoundException("Notebook not found.");

        var version = await _versionRepo.Query()
            .Where(v => v.NotebookId == notebookId && v.Id == versionId)
            .AsNoTracking()
            .Select(v => new { v.Id, v.NotebookId, v.ContentJson, v.CreatedAt, v.Label })
            .FirstOrDefaultAsync(cancellationToken);
        if (version is null)
            return null;

        return new NotebookVersionDto
        {
            Id = version.Id,
            NotebookId = version.NotebookId,
            ContentJson = version.ContentJson,
            CreatedAt = version.CreatedAt,
            Label = version.Label
        };
    }

    public async Task RestoreVersionAsync(Guid userId, Guid notebookId, Guid versionId, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        var version = await _versionRepo.Query()
            .Where(v => v.NotebookId == notebookId && v.Id == versionId)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Version not found.");

        notebook.ContentJson = version.ContentJson ?? "{\"type\":\"doc\",\"content\":[]}";
        notebook.UpdatedAt = DateTime.UtcNow;
        _notebookRepo.Update(notebook);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
