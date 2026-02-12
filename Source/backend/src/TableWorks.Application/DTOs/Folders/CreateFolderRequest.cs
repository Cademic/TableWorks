namespace ASideNote.Application.DTOs.Folders;

public sealed class CreateFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
}
