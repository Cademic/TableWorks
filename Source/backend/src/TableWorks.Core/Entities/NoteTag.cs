namespace TableWorks.Core.Entities;

public sealed class NoteTag
{
    public Guid NoteId { get; set; }
    public Guid TagId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Note? Note { get; set; }
    public Tag? Tag { get; set; }
}
