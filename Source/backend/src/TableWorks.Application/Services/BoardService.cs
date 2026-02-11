using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.Boards;
using TableWorks.Application.DTOs.Common;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class BoardService : IBoardService
{
    private readonly IRepository<Board> _boardRepo;
    private readonly IRepository<Note> _noteRepo;
    private readonly IRepository<IndexCard> _indexCardRepo;
    private readonly IRepository<BoardConnection> _connectionRepo;
    private readonly IUnitOfWork _unitOfWork;

    public BoardService(
        IRepository<Board> boardRepo,
        IRepository<Note> noteRepo,
        IRepository<IndexCard> indexCardRepo,
        IRepository<BoardConnection> connectionRepo,
        IUnitOfWork unitOfWork)
    {
        _boardRepo = boardRepo;
        _noteRepo = noteRepo;
        _indexCardRepo = indexCardRepo;
        _connectionRepo = connectionRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResponse<BoardSummaryDto>> GetBoardsAsync(Guid userId, BoardListQuery query, CancellationToken cancellationToken = default)
    {
        var q = _boardRepo.Query()
            .Where(b => b.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.BoardType))
            q = q.Where(b => b.BoardType == query.BoardType);

        var total = await q.CountAsync(cancellationToken);

        q = query.SortBy?.ToLowerInvariant() switch
        {
            "createdat" => query.SortOrder == "asc" ? q.OrderBy(b => b.CreatedAt) : q.OrderByDescending(b => b.CreatedAt),
            "name" => query.SortOrder == "asc" ? q.OrderBy(b => b.Name) : q.OrderByDescending(b => b.Name),
            _ => query.SortOrder == "asc" ? q.OrderBy(b => b.UpdatedAt) : q.OrderByDescending(b => b.UpdatedAt),
        };

        var boards = await q
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(b => new BoardSummaryDto
            {
                Id = b.Id,
                Name = b.Name,
                Description = b.Description,
                BoardType = b.BoardType,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
                NoteCount = b.Notes.Count(n => !n.IsArchived),
                IndexCardCount = b.IndexCards.Count(ic => !ic.IsArchived)
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return new PaginatedResponse<BoardSummaryDto>
        {
            Items = boards,
            Page = query.Page,
            Limit = query.Limit,
            Total = total
        };
    }

    public async Task<BoardSummaryDto> GetBoardByIdAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default)
    {
        var board = await _boardRepo.Query()
            .Where(b => b.Id == boardId && b.UserId == userId)
            .Select(b => new BoardSummaryDto
            {
                Id = b.Id,
                Name = b.Name,
                Description = b.Description,
                BoardType = b.BoardType,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
                NoteCount = b.Notes.Count(n => !n.IsArchived),
                IndexCardCount = b.IndexCards.Count(ic => !ic.IsArchived)
            })
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Board not found.");

        return board;
    }

    public async Task<BoardSummaryDto> CreateBoardAsync(Guid userId, CreateBoardRequest request, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var board = new Board
        {
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            BoardType = request.BoardType,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _boardRepo.AddAsync(board, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetBoardByIdAsync(userId, board.Id, cancellationToken);
    }

    public async Task UpdateBoardAsync(Guid userId, Guid boardId, UpdateBoardRequest request, CancellationToken cancellationToken = default)
    {
        var board = await _boardRepo.Query()
            .FirstOrDefaultAsync(b => b.Id == boardId && b.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Board not found.");

        board.Name = request.Name;
        board.Description = request.Description;
        board.UpdatedAt = DateTime.UtcNow;

        _boardRepo.Update(board);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteBoardAsync(Guid userId, Guid boardId, CancellationToken cancellationToken = default)
    {
        var board = await _boardRepo.Query()
            .FirstOrDefaultAsync(b => b.Id == boardId && b.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Board not found.");

        // Delete all items associated with this board
        var notes = await _noteRepo.Query()
            .Where(n => n.BoardId == boardId)
            .ToListAsync(cancellationToken);
        foreach (var note in notes)
            _noteRepo.Delete(note);

        var cards = await _indexCardRepo.Query()
            .Where(ic => ic.BoardId == boardId)
            .ToListAsync(cancellationToken);
        foreach (var card in cards)
            _indexCardRepo.Delete(card);

        var connections = await _connectionRepo.Query()
            .Where(c => c.BoardId == boardId)
            .ToListAsync(cancellationToken);
        foreach (var conn in connections)
            _connectionRepo.Delete(conn);

        _boardRepo.Delete(board);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
