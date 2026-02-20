using Microsoft.EntityFrameworkCore;
using ASideNote.Application.DTOs.Drawings;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;

namespace ASideNote.Application.Services;

public sealed class DrawingService : IDrawingService
{
    private readonly IRepository<Drawing> _drawingRepo;
    private readonly IRepository<Board> _boardRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBoardAccessService _boardAccess;
    private readonly IBoardHubBroadcaster _boardHub;

    public DrawingService(
        IRepository<Drawing> drawingRepo,
        IRepository<Board> boardRepo,
        IUnitOfWork unitOfWork,
        IBoardAccessService boardAccess,
        IBoardHubBroadcaster boardHub)
    {
        _drawingRepo = drawingRepo;
        _boardRepo = boardRepo;
        _unitOfWork = unitOfWork;
        _boardAccess = boardAccess;
        _boardHub = boardHub;
    }

    public async Task<DrawingDto> GetByBoardIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default)
    {
        if (!await _boardAccess.HasReadAccessAsync(userId, boardId, cancellationToken))
            throw new KeyNotFoundException("Board not found.");

        // One logical drawing per board: load by BoardId
        var drawing = await _drawingRepo.Query()
            .Where(d => d.BoardId == boardId)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (drawing is null)
        {
            return new DrawingDto
            {
                Id = Guid.Empty,
                BoardId = boardId,
                CanvasJson = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        return new DrawingDto
        {
            Id = drawing.Id,
            BoardId = drawing.BoardId,
            CanvasJson = drawing.CanvasJson,
            CreatedAt = drawing.CreatedAt,
            UpdatedAt = drawing.UpdatedAt
        };
    }

    public async Task<DrawingDto> SaveAsync(Guid userId, Guid boardId, SaveDrawingRequest request, CancellationToken cancellationToken = default)
    {
        if (!await _boardAccess.HasWriteAccessAsync(userId, boardId, cancellationToken))
            throw new KeyNotFoundException("Board not found.");

        var board = await _boardRepo.Query()
            .FirstOrDefaultAsync(b => b.Id == boardId, cancellationToken)
            ?? throw new KeyNotFoundException("Board not found.");

        var now = DateTime.UtcNow;

        var drawing = await _drawingRepo.Query()
            .FirstOrDefaultAsync(d => d.BoardId == boardId, cancellationToken);

        if (drawing is null)
        {
            drawing = new Drawing
            {
                BoardId = boardId,
                UserId = board.UserId,
                CanvasJson = request.CanvasJson,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _drawingRepo.AddAsync(drawing, cancellationToken);
        }
        else
        {
            drawing.CanvasJson = request.CanvasJson;
            drawing.UpdatedAt = now;
            _drawingRepo.Update(drawing);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        board.UpdatedAt = now;
        _boardRepo.Update(board);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _boardHub.NotifyDrawingUpdatedAsync(boardId, cancellationToken);

        return new DrawingDto
        {
            Id = drawing.Id,
            BoardId = drawing.BoardId,
            CanvasJson = drawing.CanvasJson,
            CreatedAt = drawing.CreatedAt,
            UpdatedAt = drawing.UpdatedAt
        };
    }
}
