using System.IO;
using System.Net;
using System.Text.Json;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ASideNote.Infrastructure.Services;

/// <summary>Converts TipTap/ProseMirror JSON document to DOCX (Word) bytes.</summary>
public static class TipTapJsonToDocx
{
    public static byte[] ToDocx(string contentJson)
    {
        using var stream = new MemoryStream();
        using (var doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
        {
            var mainPart = doc.AddMainDocumentPart();
            mainPart.Document = new Document();
            var body = mainPart.Document.AppendChild(new Body());

            using (var jsonDoc = JsonDocument.Parse(contentJson))
            {
                var root = jsonDoc.RootElement;
                var type = root.TryGetProperty("type", out var t) ? t.GetString() : null;
                if (type == "doc" && root.TryGetProperty("content", out var content))
                {
                    foreach (var child in content.EnumerateArray())
                        AppendToBody(child, body);
                }
            }

            mainPart.Document.Save();
        }

        return stream.ToArray();
    }

    private static void AppendToBody(JsonElement node, OpenXmlElement body)
    {
        var type = node.TryGetProperty("type", out var t) ? t.GetString() : null;
        var content = node.TryGetProperty("content", out var c) ? c : (JsonElement?)null;

        switch (type)
        {
            case "paragraph":
                var para = body.AppendChild(new Paragraph());
                if (content.HasValue)
                    AppendInlineContent(content.Value, para);
                break;
            case "heading":
                var level = node.TryGetProperty("attrs", out var hAttrs) && hAttrs.TryGetProperty("level", out var l) ? l.GetInt32() : 1;
                var headingPara = body.AppendChild(new Paragraph());
                if (content.HasValue)
                    AppendInlineContent(content.Value, headingPara, headingLevel: level);
                break;
            case "bulletList":
                if (content.HasValue)
                    foreach (var item in content.Value.EnumerateArray())
                        AppendToBody(item, body);
                break;
            case "orderedList":
                if (content.HasValue)
                    foreach (var item in content.Value.EnumerateArray())
                        AppendToBody(item, body);
                break;
            case "listItem":
                var liPara = body.AppendChild(new Paragraph());
                if (content.HasValue)
                {
                    foreach (var child in content.Value.EnumerateArray())
                    {
                        var childType = child.TryGetProperty("type", out var ct) ? ct.GetString() : null;
                        if (childType == "paragraph")
                        {
                            if (child.TryGetProperty("content", out var pc))
                                AppendInlineContent(pc, liPara);
                        }
                        else
                            AppendToBody(child, body);
                    }
                }
                break;
            case "blockquote":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendToBody(child, body);
                break;
            case "codeBlock":
                var codePara = body.AppendChild(new Paragraph());
                var codeRun = codePara.AppendChild(new Run());
                codeRun.AppendChild(new RunProperties(new RunFonts { Ascii = "Consolas", HighAnsi = "Consolas" }));
                if (content.HasValue)
                {
                    foreach (var child in content.Value.EnumerateArray())
                    {
                        if (child.TryGetProperty("text", out var codeText))
                            codeRun.AppendChild(new Text(WebUtility.HtmlDecode(codeText.GetString() ?? "")));
                    }
                }
                break;
            case "hardBreak":
                body.AppendChild(new Paragraph()).AppendChild(new Run()).AppendChild(new Break());
                break;
            default:
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendToBody(child, body);
                break;
        }
    }

    private static void AppendInlineContent(JsonElement content, OpenXmlElement parent, int? headingLevel = null)
    {
        foreach (var child in content.EnumerateArray())
        {
            var type = child.TryGetProperty("type", out var t) ? t.GetString() : null;
            if (type == "text")
            {
                var text = child.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                var run = parent.AppendChild(new Run());
                var runProps = run.AppendChild(new RunProperties());
                if (headingLevel.HasValue)
                {
                    runProps.AppendChild(new Bold());
                    runProps.AppendChild(new FontSize { Val = (headingLevel.Value switch { 1 => 48, 2 => 36, _ => 28 }).ToString() });
                }
                var marks = child.TryGetProperty("marks", out var m) ? m : (JsonElement?)null;
                if (marks.HasValue)
                {
                    foreach (var mark in marks.Value.EnumerateArray())
                    {
                        var markType = mark.TryGetProperty("type", out var mt) ? mt.GetString() : null;
                        switch (markType)
                        {
                            case "bold": runProps.AppendChild(new Bold()); break;
                            case "italic": runProps.AppendChild(new Italic()); break;
                            case "underline": runProps.AppendChild(new Underline { Val = UnderlineValues.Single }); break;
                            case "code":
                                runProps.AppendChild(new RunFonts { Ascii = "Consolas", HighAnsi = "Consolas" });
                                runProps.AppendChild(new VerticalTextAlignment { Val = VerticalPositionValues.Baseline });
                                break;
                            case "link":
                                var href = mark.TryGetProperty("attrs", out var ma) && ma.TryGetProperty("href", out var h) ? h.GetString() ?? "" : "";
                                if (!string.IsNullOrEmpty(href))
                                    runProps.AppendChild(new RunStyle { Val = "Hyperlink" });
                                break;
                        }
                    }
                }
                run.AppendChild(new Text(WebUtility.HtmlDecode(text)) { Space = SpaceProcessingModeValues.Preserve });
            }
            else if (type == "hardBreak")
            {
                parent.AppendChild(new Run()).AppendChild(new Break());
            }
        }
    }
}
