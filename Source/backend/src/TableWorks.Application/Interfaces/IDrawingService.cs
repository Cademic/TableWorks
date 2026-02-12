using TableWorks.Application.DTOs.Drawings;

namespace TableWorks.Application.Interfaces;

public interface IDrawingService
{
    Task<DrawingDto> GetByBoardIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default);
    Task<DrawingDto> SaveAsync(Guid userId, Guid boardId, SaveDrawingRequest request, CancellationToken cancellationToken = default);
}
