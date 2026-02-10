using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.Folders;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class FolderService : IFolderService
{
    private readonly IRepository<Folder> _folderRepo;
    private readonly IUnitOfWork _unitOfWork;

    public FolderService(IRepository<Folder> folderRepo, IUnitOfWork unitOfWork)
    {
        _folderRepo = folderRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<FolderDto>> GetFoldersAsync(Guid userId, Guid? parentId, CancellationToken cancellationToken = default)
    {
        var folders = await _folderRepo.Query()
            .Include(f => f.Notes)
            .Where(f => f.UserId == userId && f.ParentFolderId == parentId)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return folders.Select(f => new FolderDto
        {
            Id = f.Id,
            Name = f.Name,
            ParentFolderId = f.ParentFolderId,
            NoteCount = f.Notes.Count,
            CreatedAt = f.CreatedAt
        }).ToList();
    }

    public async Task<FolderDto> CreateFolderAsync(Guid userId, CreateFolderRequest request, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var folder = new Folder
        {
            UserId = userId,
            Name = request.Name,
            ParentFolderId = request.ParentFolderId,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _folderRepo.AddAsync(folder, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new FolderDto
        {
            Id = folder.Id,
            Name = folder.Name,
            ParentFolderId = folder.ParentFolderId,
            NoteCount = 0,
            CreatedAt = folder.CreatedAt
        };
    }

    public async Task UpdateFolderAsync(Guid userId, Guid folderId, UpdateFolderRequest request, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepo.Query()
            .FirstOrDefaultAsync(f => f.Id == folderId && f.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Folder not found.");

        folder.Name = request.Name;
        folder.ParentFolderId = request.ParentFolderId;
        folder.UpdatedAt = DateTime.UtcNow;

        _folderRepo.Update(folder);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteFolderAsync(Guid userId, Guid folderId, CancellationToken cancellationToken = default)
    {
        var folder = await _folderRepo.Query()
            .FirstOrDefaultAsync(f => f.Id == folderId && f.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Folder not found.");

        _folderRepo.Delete(folder);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
