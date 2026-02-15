using System.IO;
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
    private const int MaxPages = 999;

    private readonly IRepository<Notebook> _notebookRepo;
    private readonly IRepository<NotebookPage> _pageRepo;
    private readonly IUnitOfWork _unitOfWork;

    public NotebookService(
        IRepository<Notebook> notebookRepo,
        IRepository<NotebookPage> pageRepo,
        IUnitOfWork unitOfWork)
    {
        _notebookRepo = notebookRepo;
        _pageRepo = pageRepo;
        _unitOfWork = unitOfWork;
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
                IsPinned = n.IsPinned,
                PinnedAt = n.PinnedAt,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt,
                PageCount = n.Pages.Count
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
            .Include(n => n.Pages.OrderBy(p => p.PageIndex))
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        var pageList = new List<string>();
        foreach (var p in notebook.Pages.OrderBy(x => x.PageIndex))
        {
            while (pageList.Count < p.PageIndex)
                pageList.Add(string.Empty);
            pageList.Add(p.Content ?? string.Empty);
        }

        return new NotebookDetailDto
        {
            Id = notebook.Id,
            Name = notebook.Name,
            IsPinned = notebook.IsPinned,
            PinnedAt = notebook.PinnedAt,
            CreatedAt = notebook.CreatedAt,
            UpdatedAt = notebook.UpdatedAt,
            Pages = pageList
        };
    }

    public async Task<NotebookSummaryDto> CreateNotebookAsync(Guid userId, CreateNotebookRequest request, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var notebook = new Notebook
        {
            UserId = userId,
            Name = request.Name.Trim(),
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
            UpdatedAt = notebook.UpdatedAt,
            PageCount = 0
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

    public async Task UpdateNotebookPagesAsync(Guid userId, Guid notebookId, UpdateNotebookPagesRequest request, CancellationToken cancellationToken = default)
    {
        // #region agent log
        const string logPath = @"d:\Projects\ASideNote\.cursor\debug.log";
        try
        {
            var dir = Path.GetDirectoryName(logPath);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
            var pagesCount = request.Pages?.Count ?? -1;
            var line = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), location = "NotebookService.cs:UpdateNotebookPagesAsync", message = "service entered", data = new { userId = userId.ToString(), notebookId = notebookId.ToString(), pagesCount }, hypothesisId = "H4" }) + Environment.NewLine;
            await File.AppendAllTextAsync(logPath, line, cancellationToken);
        }
        catch { }
        // #endregion

        var notebook = await _notebookRepo.Query()
            .Include(n => n.Pages)
            .FirstOrDefaultAsync(n => n.Id == notebookId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notebook not found.");

        var pages = request.Pages?.Take(MaxPages).ToList() ?? new List<string>();
        var now = DateTime.UtcNow;

        var existingByIndex = notebook.Pages.ToDictionary(p => p.PageIndex);

        for (var i = 0; i < pages.Count; i++)
        {
            var content = pages[i] ?? string.Empty;
            if (existingByIndex.TryGetValue(i, out var existingPage))
            {
                existingPage.Content = content;
                existingPage.UpdatedAt = now;
                // Entity already tracked via Include; change tracker will persist updates.
            }
            else
            {
                var page = new NotebookPage
                {
                    Id = Guid.NewGuid(),
                    NotebookId = notebookId,
                    PageIndex = i,
                    Content = content,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                await _pageRepo.AddAsync(page, cancellationToken);
            }
        }

        notebook.UpdatedAt = now;
        // Notebook already tracked; change tracker will persist updates.

        // #region agent log
        try
        {
            var line = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), location = "NotebookService.cs:UpdateNotebookPagesAsync", message = "before SaveChangesAsync", hypothesisId = "H5" }) + Environment.NewLine;
            await File.AppendAllTextAsync(logPath, line, cancellationToken);
        }
        catch { }
        // #endregion

        try
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // #region agent log
            try
            {
                var line = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), location = "NotebookService.cs:UpdateNotebookPagesAsync", message = "after SaveChangesAsync", hypothesisId = "H5" }) + Environment.NewLine;
                await File.AppendAllTextAsync(logPath, line, cancellationToken);
            }
            catch { }
            // #endregion
        }
        catch (Exception ex)
        {
            // #region agent log
            try
            {
                var line = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), location = "NotebookService.cs:UpdateNotebookPagesAsync", message = "SaveChangesAsync threw", data = new { exType = ex.GetType().Name, exMessage = ex.Message }, hypothesisId = "H5" }) + Environment.NewLine;
                await File.AppendAllTextAsync(logPath, line, cancellationToken);
            }
            catch { }
            // #endregion
            throw;
        }
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
                IsPinned = true,
                PinnedAt = n.PinnedAt,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt,
                PageCount = n.Pages.Count
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
