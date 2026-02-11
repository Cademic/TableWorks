using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.BoardConnections;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class BoardConnectionService : IBoardConnectionService
{
    private readonly IRepository<BoardConnection> _connRepo;
    private readonly IUnitOfWork _unitOfWork;

    public BoardConnectionService(IRepository<BoardConnection> connRepo, IUnitOfWork unitOfWork)
    {
        _connRepo = connRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<BoardConnectionDto>> GetConnectionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var connections = await _connRepo.Query()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return connections.Select(MapToDto).ToList();
    }

    public async Task<BoardConnectionDto> CreateConnectionAsync(Guid userId, CreateBoardConnectionRequest request, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var connection = new BoardConnection
        {
            UserId = userId,
            FromItemId = request.FromItemId,
            ToItemId = request.ToItemId,
            CreatedAt = now
        };

        await _connRepo.AddAsync(connection, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(connection);
    }

    public async Task DeleteConnectionAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default)
    {
        var connection = await _connRepo.Query()
            .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Connection not found.");

        _connRepo.Delete(connection);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static BoardConnectionDto MapToDto(BoardConnection c) => new()
    {
        Id = c.Id,
        FromItemId = c.FromItemId,
        ToItemId = c.ToItemId,
        CreatedAt = c.CreatedAt
    };
}
