using TableWorks.Application.DTOs.Tags;

namespace TableWorks.Application.Interfaces;

public interface ITagService
{
    Task<IReadOnlyList<TagDto>> GetTagsAsync(CancellationToken cancellationToken = default);
    Task<TagDto> CreateTagAsync(CreateTagRequest request, CancellationToken cancellationToken = default);
    Task DeleteTagAsync(Guid tagId, CancellationToken cancellationToken = default);
}
