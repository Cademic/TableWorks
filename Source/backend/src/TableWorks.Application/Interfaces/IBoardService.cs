using TableWorks.Application.DTOs.Boards;
using TableWorks.Application.DTOs.Common;

namespace TableWorks.Application.Interfaces;

public interface IBoardService
{
    Task<PaginatedResponse<BoardSummaryDto>> GetBoardsAsync(Guid userId, BoardListQuery query, CancellationToken cancellationToken = default);
    Task<BoardSummaryDto> GetBoardByIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default);
    Task<BoardSummaryDto> CreateBoardAsync(Guid userId, CreateBoardRequest request, CancellationToken cancellationToken = default);
    Task UpdateBoardAsync(Guid userId, Guid boardId, UpdateBoardRequest request, CancellationToken cancellationToken = default);
    Task DeleteBoardAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default);
}
