using System.Text;
using ASideNote.Application.Interfaces;
using ASideNote.Core.Entities;
using ASideNote.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ASideNote.Infrastructure.Services;

public sealed class NotebookExportService : INotebookExportService
{
    private readonly IRepository<Notebook> _notebookRepo;
    private readonly IImageResolver _imageResolver;

    public NotebookExportService(IRepository<Notebook> notebookRepo, IImageResolver imageResolver)
    {
        _notebookRepo = notebookRepo;
        _imageResolver = imageResolver;
    }

    public async Task<NotebookExportResult?> ExportAsync(Guid userId, Guid notebookId, string format, CancellationToken cancellationToken = default)
    {
        var notebook = await _notebookRepo.Query()
            .Where(n => n.Id == notebookId && n.UserId == userId)
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);
        if (notebook is null)
            return null;

        var contentJson = notebook.ContentJson ?? "{\"type\":\"doc\",\"content\":[]}";
        var safeName = SanitizeFileName(notebook.Name);
        var formatLower = format.Trim().ToLowerInvariant();

        return formatLower switch
        {
            "txt" => ExportTxt(contentJson, safeName),
            "md" or "markdown" => await ExportMdAsync(contentJson, safeName, cancellationToken),
            "html" => await ExportHtmlAsync(contentJson, safeName, cancellationToken),
            "pdf" => await ExportPdfAsync(contentJson, safeName, cancellationToken),
            "docx" => await ExportDocxAsync(contentJson, safeName, cancellationToken),
            _ => null
        };
    }

    private static NotebookExportResult ExportTxt(string contentJson, string baseName)
    {
        var text = TipTapJsonConverter.ToPlainText(contentJson);
        return new NotebookExportResult
        {
            Content = Encoding.UTF8.GetBytes(text),
            ContentType = "text/plain; charset=utf-8",
            FileName = $"{baseName}.txt"
        };
    }

    private async Task<NotebookExportResult> ExportMdAsync(string contentJson, string baseName, CancellationToken cancellationToken)
    {
        var md = await TipTapJsonConverter.ToMarkdownAsync(contentJson, _imageResolver, embedImages: true, cancellationToken);
        return new NotebookExportResult
        {
            Content = Encoding.UTF8.GetBytes(md),
            ContentType = "text/markdown; charset=utf-8",
            FileName = $"{baseName}.md"
        };
    }

    private async Task<NotebookExportResult> ExportDocxAsync(string contentJson, string baseName, CancellationToken cancellationToken)
    {
        var bytes = await TipTapJsonToDocx.ToDocxAsync(contentJson, _imageResolver, cancellationToken);
        return new NotebookExportResult
        {
            Content = bytes,
            ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            FileName = $"{baseName}.docx"
        };
    }

    private async Task<NotebookExportResult> ExportHtmlAsync(string contentJson, string baseName, CancellationToken cancellationToken)
    {
        var body = await TipTapJsonConverter.ToHtmlAsync(contentJson, _imageResolver, embedImages: true, cancellationToken);
        var html = WrapHtmlDocument(notebookName: baseName, bodyContent: body);
        return new NotebookExportResult
        {
            Content = Encoding.UTF8.GetBytes(html),
            ContentType = "text/html; charset=utf-8",
            FileName = $"{baseName}.html"
        };
    }

    private async Task<NotebookExportResult?> ExportPdfAsync(string contentJson, string baseName, CancellationToken cancellationToken)
    {
        var body = await TipTapJsonConverter.ToHtmlAsync(contentJson, _imageResolver, embedImages: true, cancellationToken);
        var html = WrapHtmlDocument(notebookName: baseName, bodyContent: body);
        try
        {
            var playwright = await Microsoft.Playwright.Playwright.CreateAsync();
            await using var browser = await playwright.Chromium.LaunchAsync(new Microsoft.Playwright.BrowserTypeLaunchOptions { Headless = true });
            var page = await browser.NewPageAsync();
            await page.SetContentAsync(html, new Microsoft.Playwright.PageSetContentOptions { WaitUntil = Microsoft.Playwright.WaitUntilState.Load });
            var pdfBytes = await page.PdfAsync(new Microsoft.Playwright.PagePdfOptions
            {
                Format = "A4",
                Margin = new Microsoft.Playwright.Margin { Top = "1in", Right = "1in", Bottom = "1in", Left = "1in" },
                PrintBackground = true
            });
            return new NotebookExportResult
            {
                Content = pdfBytes,
                ContentType = "application/pdf",
                FileName = $"{baseName}.pdf"
            };
        }
        catch
        {
            return null;
        }
    }

    private static string WrapHtmlDocument(string notebookName, string bodyContent)
    {
        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
  <title>{System.Net.WebUtility.HtmlEncode(notebookName)}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; line-height: 1.6; max-width: 816px; margin: 0 auto; padding: 96px; color: #18181b; background: #fff; }}
    .prose {{ max-width: none; }}
    .prose p {{ margin: 0 0 0.75em; }}
    .prose ul, .prose ol {{ margin: 0.5em 0; padding-left: 1.5em; }}
    .prose h1, .prose h2, .prose h3 {{ margin: 1em 0 0.5em; font-weight: 600; }}
    .prose blockquote {{ margin: 0.5em 0; padding-left: 1em; border-left: 4px solid #d4d4d8; color: #52525b; }}
    .prose code {{ background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }}
    .prose pre {{ background: #f4f4f5; padding: 1em; overflow-x: auto; border-radius: 6px; }}
    .prose a {{ color: #2563eb; text-decoration: underline; }}
  </style>
</head>
<body class=""prose"">
{bodyContent}
</body>
</html>";
    }

    private static string SanitizeFileName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "notebook";
        var invalid = Path.GetInvalidFileNameChars();
        var sb = new StringBuilder(name.Length);
        foreach (var c in name)
        {
            if (!invalid.Contains(c))
                sb.Append(c);
        }
        var result = sb.ToString().Trim();
        return result.Length > 0 ? result : "notebook";
    }
}
