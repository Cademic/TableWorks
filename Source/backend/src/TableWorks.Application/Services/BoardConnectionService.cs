using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.BoardConnections;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class BoardConnectionService : IBoardConnectionService
{
    private readonly IRepository<BoardConnection> _connRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBoardAccessService _boardAccess;
    private readonly IBoardHubBroadcaster _boardHub;

    public BoardConnectionService(
        IRepository<BoardConnection> connRepo,
        IUnitOfWork unitOfWork,
        IBoardAccessService boardAccess,
        IBoardHubBroadcaster boardHub)
    {
        _connRepo = connRepo;
        _unitOfWork = unitOfWork;
        _boardAccess = boardAccess;
        _boardHub = boardHub;
    }

    public async Task<IReadOnlyList<BoardConnectionDto>> GetConnectionsAsync(Guid userId, Guid? boardId = null, CancellationToken cancellationToken = default)
    {
        IQueryable<BoardConnection> q;

        if (boardId.HasValue && await _boardAccess.HasReadAccessAsync(userId, boardId.Value, cancellationToken))
        {
            q = _connRepo.Query()
                .Where(c => c.BoardId == boardId.Value);
        }
        else
        {
            q = _connRepo.Query()
                .Where(c => c.UserId == userId);

            if (boardId.HasValue)
                q = q.Where(c => c.BoardId == boardId.Value);
        }

        var connections = await q
            .OrderBy(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return connections.Select(MapToDto).ToList();
    }

    public async Task<BoardConnectionDto> CreateConnectionAsync(Guid userId, CreateBoardConnectionRequest request, CancellationToken cancellationToken = default)
    {
        if (request.BoardId.HasValue && !await _boardAccess.HasWriteAccessAsync(userId, request.BoardId.Value, cancellationToken))
            throw new UnauthorizedAccessException("You do not have permission to add connections to this board.");

        var now = DateTime.UtcNow;
        var connection = new BoardConnection
        {
            UserId = userId,
            FromItemId = request.FromItemId,
            ToItemId = request.ToItemId,
            BoardId = request.BoardId,
            CreatedAt = now
        };

        await _connRepo.AddAsync(connection, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (connection.BoardId.HasValue)
            await _boardHub.NotifyConnectionAddedAsync(connection.BoardId.Value, connection.Id, cancellationToken);

        return MapToDto(connection);
    }

    public async Task DeleteConnectionAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default)
    {
        var connection = await _connRepo.Query()
            .FirstOrDefaultAsync(c => c.Id == connectionId, cancellationToken)
            ?? throw new KeyNotFoundException("Connection not found.");

        if (connection.BoardId is null)
        {
            if (connection.UserId != userId)
                throw new KeyNotFoundException("Connection not found.");
        }
        else if (!await _boardAccess.HasWriteAccessAsync(userId, connection.BoardId.Value, cancellationToken))
        {
            throw new KeyNotFoundException("Connection not found.");
        }

        var boardId = connection.BoardId;
        _connRepo.Delete(connection);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (boardId.HasValue)
            await _boardHub.NotifyConnectionDeletedAsync(boardId.Value, connectionId, cancellationToken);
    }

    private static BoardConnectionDto MapToDto(BoardConnection c) => new()
    {
        Id = c.Id,
        FromItemId = c.FromItemId,
        ToItemId = c.ToItemId,
        CreatedAt = c.CreatedAt
    };
}
