using TableWorks.Application.DTOs.Common;
using TableWorks.Application.DTOs.IndexCards;

namespace TableWorks.Application.Interfaces;

public interface IIndexCardService
{
    Task<PaginatedResponse<IndexCardSummaryDto>> GetIndexCardsAsync(Guid userId, IndexCardListQuery query, CancellationToken cancellationToken = default);
    Task<IndexCardDetailDto> CreateIndexCardAsync(Guid userId, CreateIndexCardRequest request, CancellationToken cancellationToken = default);
    Task<IndexCardDetailDto> GetIndexCardByIdAsync(Guid userId, Guid cardId, CancellationToken cancellationToken = default);
    Task PatchIndexCardAsync(Guid userId, Guid cardId, PatchIndexCardRequest request, CancellationToken cancellationToken = default);
    Task DeleteIndexCardAsync(Guid userId, Guid cardId, CancellationToken cancellationToken = default);
}
