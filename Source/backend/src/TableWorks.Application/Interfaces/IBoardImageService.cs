using ASideNote.Application.DTOs.BoardImages;

namespace ASideNote.Application.Interfaces;

public interface IBoardImageService
{
    Task<IReadOnlyList<BoardImageSummaryDto>> GetByBoardIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default);
    Task<BoardImageSummaryDto> CreateAsync(Guid userId, Guid boardId, CreateBoardImageRequest request, CancellationToken cancellationToken = default);
    Task PatchAsync(Guid userId, Guid id, PatchBoardImageRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
