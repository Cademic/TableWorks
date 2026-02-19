namespace ASideNote.Application.Interfaces;

/// <summary>Result of exporting a notebook to a file format.</summary>
public sealed class NotebookExportResult
{
    public required byte[] Content { get; init; }
    public required string ContentType { get; init; }
    public required string FileName { get; init; }
}

/// <summary>Exports a notebook to various file formats (PDF, TXT, MD, HTML).</summary>
public interface INotebookExportService
{
    /// <summary>Export the notebook for the given user to the requested format. Returns null if notebook not found or user is not owner.</summary>
    Task<NotebookExportResult?> ExportAsync(Guid userId, Guid notebookId, string format, CancellationToken cancellationToken = default);
}
