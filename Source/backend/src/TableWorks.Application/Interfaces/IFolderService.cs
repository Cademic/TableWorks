using TableWorks.Application.DTOs.Folders;

namespace TableWorks.Application.Interfaces;

public interface IFolderService
{
    Task<IReadOnlyList<FolderDto>> GetFoldersAsync(Guid userId, Guid? parentId, CancellationToken cancellationToken = default);
    Task<FolderDto> CreateFolderAsync(Guid userId, CreateFolderRequest request, CancellationToken cancellationToken = default);
    Task UpdateFolderAsync(Guid userId, Guid folderId, UpdateFolderRequest request, CancellationToken cancellationToken = default);
    Task DeleteFolderAsync(Guid userId, Guid folderId, CancellationToken cancellationToken = default);
}
