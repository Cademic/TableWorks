using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.Drawings;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class DrawingService : IDrawingService
{
    private readonly IRepository<Drawing> _drawingRepo;
    private readonly IRepository<Board> _boardRepo;
    private readonly IUnitOfWork _unitOfWork;

    public DrawingService(
        IRepository<Drawing> drawingRepo,
        IRepository<Board> boardRepo,
        IUnitOfWork unitOfWork)
    {
        _drawingRepo = drawingRepo;
        _boardRepo = boardRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<DrawingDto> GetByBoardIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default)
    {
        // Verify the board belongs to the user
        var boardExists = await _boardRepo.Query()
            .AnyAsync(b => b.Id == boardId && b.UserId == userId, cancellationToken);

        if (!boardExists)
            throw new KeyNotFoundException("Board not found.");

        var drawing = await _drawingRepo.Query()
            .Where(d => d.BoardId == boardId && d.UserId == userId)
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
        // Verify the board belongs to the user
        var boardExists = await _boardRepo.Query()
            .AnyAsync(b => b.Id == boardId && b.UserId == userId, cancellationToken);

        if (!boardExists)
            throw new KeyNotFoundException("Board not found.");

        var now = DateTime.UtcNow;

        var drawing = await _drawingRepo.Query()
            .FirstOrDefaultAsync(d => d.BoardId == boardId && d.UserId == userId, cancellationToken);

        if (drawing is null)
        {
            drawing = new Drawing
            {
                BoardId = boardId,
                UserId = userId,
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

        // Update the board's UpdatedAt timestamp
        var board = await _boardRepo.Query()
            .FirstOrDefaultAsync(b => b.Id == boardId && b.UserId == userId, cancellationToken);

        if (board is not null)
        {
            board.UpdatedAt = now;
            _boardRepo.Update(board);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
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
}
