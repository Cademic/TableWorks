namespace TableWorks.Application.DTOs.Folders;

public sealed class UpdateFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
}
