namespace TableWorks.Core.Entities;

public sealed class IndexCardTag
{
    public Guid IndexCardId { get; set; }
    public Guid TagId { get; set; }

    public IndexCard? IndexCard { get; set; }
    public Tag? Tag { get; set; }
}
