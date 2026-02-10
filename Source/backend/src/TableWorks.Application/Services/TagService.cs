using Microsoft.EntityFrameworkCore;
using TableWorks.Application.DTOs.Tags;
using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class TagService : ITagService
{
    private readonly IRepository<Tag> _tagRepo;
    private readonly IUnitOfWork _unitOfWork;

    public TagService(IRepository<Tag> tagRepo, IUnitOfWork unitOfWork)
    {
        _tagRepo = tagRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<TagDto>> GetTagsAsync(CancellationToken cancellationToken = default)
    {
        var tags = await _tagRepo.Query()
            .Include(t => t.NoteTags)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return tags.Select(t => new TagDto
        {
            Id = t.Id,
            Name = t.Name,
            Color = t.Color,
            NoteCount = t.NoteTags.Count
        }).ToList();
    }

    public async Task<TagDto> CreateTagAsync(CreateTagRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _tagRepo.Query()
            .AnyAsync(t => t.Name == request.Name, cancellationToken);
        if (exists)
            throw new InvalidOperationException("A tag with this name already exists.");

        var tag = new Tag
        {
            Name = request.Name,
            Color = request.Color,
            CreatedAt = DateTime.UtcNow
        };

        await _tagRepo.AddAsync(tag, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new TagDto
        {
            Id = tag.Id,
            Name = tag.Name,
            Color = tag.Color,
            NoteCount = 0
        };
    }

    public async Task DeleteTagAsync(Guid tagId, CancellationToken cancellationToken = default)
    {
        var tag = await _tagRepo.GetByIdAsync(tagId, cancellationToken)
            ?? throw new KeyNotFoundException("Tag not found.");

        _tagRepo.Delete(tag);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
