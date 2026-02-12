using ASideNote.Application.DTOs.Drawings;

namespace ASideNote.Application.Interfaces;

public interface IDrawingService
{
    Task<DrawingDto> GetByBoardIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default);
    Task<DrawingDto> SaveAsync(Guid userId, Guid boardId, SaveDrawingRequest request, CancellationToken cancellationToken = default);
}
