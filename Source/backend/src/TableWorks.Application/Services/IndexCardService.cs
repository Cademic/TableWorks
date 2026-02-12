using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.Common;
using ASideNote.Application.DTOs.IndexCards;
using ASideNote.Application.DTOs.Tags;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class IndexCardService : IIndexCardService
{
    private readonly IRepository<IndexCard> _cardRepo;
    private readonly IRepository<IndexCardTag> _cardTagRepo;
    private readonly IUnitOfWork _unitOfWork;

    public IndexCardService(
        IRepository<IndexCard> cardRepo,
        IRepository<IndexCardTag> cardTagRepo,
        IUnitOfWork unitOfWork)
    {
        _cardRepo = cardRepo;
        _cardTagRepo = cardTagRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResponse<IndexCardSummaryDto>> GetIndexCardsAsync(Guid userId, IndexCardListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _cardRepo.Query()
            .Where(c => c.UserId == userId && !c.IsArchived)
            .Include(c => c.IndexCardTags)
                .ThenInclude(ct => ct.Tag)
            .AsQueryable();

        // Filters
        if (query.BoardId.HasValue)
            q = q.Where(c => c.BoardId == query.BoardId.Value);

        if (query.FolderId.HasValue)
            q = q.Where(c => c.FolderId == query.FolderId.Value);

        if (query.ProjectId.HasValue)
            q = q.Where(c => c.ProjectId == query.ProjectId.Value);

        if (!string.IsNullOrWhiteSpace(query.TagIds))
        {
            var tagIdList = query.TagIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : (Guid?)null)
                .Where(g => g.HasValue)
                .Select(g => g!.Value)
                .ToList();

            if (tagIdList.Count > 0)
                q = q.Where(c => c.IndexCardTags.Any(ct => tagIdList.Contains(ct.TagId)));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(c => c.Title != null && c.Title.Contains(query.Search));

        // Count before pagination
        var total = await q.CountAsync(cancellationToken);

        // Sorting
        q = query.SortBy?.ToLowerInvariant() switch
        {
            "createdat" => query.SortOrder == "asc" ? q.OrderBy(c => c.CreatedAt) : q.OrderByDescending(c => c.CreatedAt),
            "title" => query.SortOrder == "asc" ? q.OrderBy(c => c.Title) : q.OrderByDescending(c => c.Title),
            _ => query.SortOrder == "asc" ? q.OrderBy(c => c.UpdatedAt) : q.OrderByDescending(c => c.UpdatedAt),
        };

        // Pagination
        var cards = await q
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var items = cards.Select(MapToSummary).ToList();

        return new PaginatedResponse<IndexCardSummaryDto>
        {
            Items = items,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }

    public async Task<IndexCardDetailDto> CreateIndexCardAsync(Guid userId, CreateIndexCardRequest request, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var card = new IndexCard
        {
            UserId = userId,
            Title = request.Title,
            Content = request.Content,
            FolderId = request.FolderId,
            ProjectId = request.ProjectId,
            BoardId = request.BoardId,
            PositionX = request.PositionX,
            PositionY = request.PositionY,
            Width = request.Width,
            Height = request.Height,
            Color = request.Color,
            Rotation = request.Rotation,
            CreatedAt = now,
            UpdatedAt = now,
            LastSavedAt = now
        };

        await _cardRepo.AddAsync(card, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Add tags
        if (request.TagIds.Count > 0)
        {
            foreach (var tagId in request.TagIds)
            {
                await _cardTagRepo.AddAsync(new IndexCardTag { IndexCardId = card.Id, TagId = tagId }, cancellationToken);
            }
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return await GetIndexCardByIdAsync(userId, card.Id, cancellationToken);
    }

    public async Task<IndexCardDetailDto> GetIndexCardByIdAsync(Guid userId, Guid cardId, CancellationToken cancellationToken = default)
    {
        var card = await _cardRepo.Query()
            .Include(c => c.IndexCardTags)
                .ThenInclude(ct => ct.Tag)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Index card not found.");

        return MapToDetail(card);
    }

    public async Task PatchIndexCardAsync(Guid userId, Guid cardId, PatchIndexCardRequest request, CancellationToken cancellationToken = default)
    {
        var card = await _cardRepo.Query()
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Index card not found.");

        if (request.PatchTitle)
            card.Title = request.Title;
        if (request.Content is not null)
            card.Content = request.Content;
        if (request.PositionX.HasValue)
            card.PositionX = request.PositionX;
        if (request.PositionY.HasValue)
            card.PositionY = request.PositionY;
        if (request.Width.HasValue)
            card.Width = request.Width;
        if (request.Height.HasValue)
            card.Height = request.Height;
        if (request.Color is not null)
            card.Color = request.Color;
        if (request.Rotation.HasValue)
            card.Rotation = request.Rotation;
        card.UpdatedAt = DateTime.UtcNow;
        card.LastSavedAt = DateTime.UtcNow;
        _cardRepo.Update(card);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteIndexCardAsync(Guid userId, Guid cardId, CancellationToken cancellationToken = default)
    {
        var card = await _cardRepo.Query()
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Index card not found.");

        _cardRepo.Delete(card);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static IndexCardSummaryDto MapToSummary(IndexCard card) => new()
    {
        Id = card.Id,
        Title = card.Title,
        Content = card.Content,
        FolderId = card.FolderId,
        ProjectId = card.ProjectId,
        Tags = card.IndexCardTags.Select(ct => new TagDto
        {
            Id = ct.Tag!.Id,
            Name = ct.Tag.Name,
            Color = ct.Tag.Color
        }).ToList(),
        CreatedAt = card.CreatedAt,
        UpdatedAt = card.UpdatedAt,
        PositionX = card.PositionX,
        PositionY = card.PositionY,
        Width = card.Width,
        Height = card.Height,
        Color = card.Color,
        Rotation = card.Rotation
    };

    private static IndexCardDetailDto MapToDetail(IndexCard card) => new()
    {
        Id = card.Id,
        Title = card.Title,
        Content = card.Content,
        FolderId = card.FolderId,
        ProjectId = card.ProjectId,
        Tags = card.IndexCardTags.Select(ct => new TagDto
        {
            Id = ct.Tag!.Id,
            Name = ct.Tag.Name,
            Color = ct.Tag.Color
        }).ToList(),
        CreatedAt = card.CreatedAt,
        UpdatedAt = card.UpdatedAt,
        LastSavedAt = card.LastSavedAt,
        PositionX = card.PositionX,
        PositionY = card.PositionY,
        Width = card.Width,
        Height = card.Height,
        Color = card.Color,
        Rotation = card.Rotation
    };
}
