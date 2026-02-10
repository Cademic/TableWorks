using TableWorks.Application.DTOs.Common;
using TableWorks.Application.DTOs.Notes;

namespace TableWorks.Application.Interfaces;

public interface INoteService
{
    Task<PaginatedResponse<NoteSummaryDto>> GetNotesAsync(Guid userId, NoteListQuery query, CancellationToken cancellationToken = default);
    Task<NoteDetailDto> CreateNoteAsync(Guid userId, CreateNoteRequest request, CancellationToken cancellationToken = default);
    Task<NoteDetailDto> GetNoteByIdAsync(Guid userId, Guid noteId, CancellationToken cancellationToken = default);
    Task UpdateNoteAsync(Guid userId, Guid noteId, UpdateNoteRequest request, CancellationToken cancellationToken = default);
    Task PatchNoteContentAsync(Guid userId, Guid noteId, PatchNoteRequest request, CancellationToken cancellationToken = default);
    Task DeleteNoteAsync(Guid userId, Guid noteId, CancellationToken cancellationToken = default);
    Task BulkActionAsync(Guid userId, BulkNoteRequest request, CancellationToken cancellationToken = default);
}
