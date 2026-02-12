namespace ASideNote.Core.Entities;

public sealed class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<NoteTag> NoteTags { get; set; } = new List<NoteTag>();
    public ICollection<IndexCardTag> IndexCardTags { get; set; } = new List<IndexCardTag>();
}
