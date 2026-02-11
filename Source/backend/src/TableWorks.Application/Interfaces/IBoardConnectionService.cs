using TableWorks.Application.DTOs.BoardConnections;

namespace TableWorks.Application.Interfaces;

public interface IBoardConnectionService
{
    Task<IReadOnlyList<BoardConnectionDto>> GetConnectionsAsync(Guid userId, Guid? boardId = null, CancellationToken cancellationToken = default);
    Task<BoardConnectionDto> CreateConnectionAsync(Guid userId, CreateBoardConnectionRequest request, CancellationToken cancellationToken = default);
    Task DeleteConnectionAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default);
}
