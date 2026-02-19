using System.Net;
using System.Text;
using System.Text.Json;

namespace ASideNote.Infrastructure.Services;

/// <summary>Converts TipTap/ProseMirror JSON document to HTML, plain text, or Markdown.</summary>
public static class TipTapJsonConverter
{
    public static string ToHtml(string contentJson)
    {
        using var doc = JsonDocument.Parse(contentJson);
        var root = doc.RootElement;
        var sb = new StringBuilder();
        AppendHtml(root, sb);
        return sb.ToString();
    }

    public static string ToPlainText(string contentJson)
    {
        using var doc = JsonDocument.Parse(contentJson);
        var root = doc.RootElement;
        var sb = new StringBuilder();
        AppendText(root, sb);
        return sb.ToString();
    }

    public static string ToMarkdown(string contentJson)
    {
        using var doc = JsonDocument.Parse(contentJson);
        var root = doc.RootElement;
        var sb = new StringBuilder();
        AppendMarkdown(root, sb, 0);
        return sb.ToString();
    }

    private static void AppendHtml(JsonElement node, StringBuilder sb)
    {
        var type = node.TryGetProperty("type", out var t) ? t.GetString() : null;
        var content = node.TryGetProperty("content", out var c) ? c : (JsonElement?)null;

        switch (type)
        {
            case "doc":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                break;
            case "paragraph":
                sb.Append("<p>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append("</p>");
                break;
            case "heading":
                var level = node.TryGetProperty("attrs", out var attrs) && attrs.TryGetProperty("level", out var l) ? l.GetInt32() : 1;
                sb.Append($"<h{level}>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append($"</h{level}>");
                break;
            case "text":
                var text = node.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                var marks = node.TryGetProperty("marks", out var m) ? m : (JsonElement?)null;
                var open = "";
                var close = "";
                if (marks.HasValue)
                    foreach (var mark in marks.Value.EnumerateArray())
                    {
                        var markType = mark.TryGetProperty("type", out var mt) ? mt.GetString() : null;
                        switch (markType)
                        {
                            case "bold": open += "<strong>"; close = "</strong>" + close; break;
                            case "italic": open += "<em>"; close = "</em>" + close; break;
                            case "underline": open += "<u>"; close = "</u>" + close; break;
                            case "link":
                                var href = mark.TryGetProperty("attrs", out var ma) && ma.TryGetProperty("href", out var h) ? h.GetString() ?? "" : "";
                                open += $"<a href=\"{WebUtility.HtmlEncode(href)}\">"; close = "</a>" + close;
                                break;
                            case "code": open += "<code>"; close = "</code>" + close; break;
                        }
                    }
                sb.Append(open);
                sb.Append(WebUtility.HtmlEncode(text));
                sb.Append(close);
                break;
            case "bulletList":
                sb.Append("<ul>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append("</ul>");
                break;
            case "orderedList":
                sb.Append("<ol>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append("</ol>");
                break;
            case "listItem":
                sb.Append("<li>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append("</li>");
                break;
            case "blockquote":
                sb.Append("<blockquote>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append("</blockquote>");
                break;
            case "codeBlock":
                sb.Append("<pre><code>");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                sb.Append("</code></pre>");
                break;
            case "hardBreak":
                sb.Append("<br/>");
                break;
            case "image":
                var imgSrc = node.TryGetProperty("attrs", out var imgAttrs) && imgAttrs.TryGetProperty("src", out var srcEl)
                    ? srcEl.GetString() ?? ""
                    : "";
                if (!string.IsNullOrEmpty(imgSrc))
                    sb.Append($"<img src=\"{WebUtility.HtmlEncode(imgSrc)}\" alt=\"\" />");
                break;
            default:
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendHtml(child, sb);
                break;
        }
    }

    private static void AppendText(JsonElement node, StringBuilder sb)
    {
        var type = node.TryGetProperty("type", out var t) ? t.GetString() : null;
        var content = node.TryGetProperty("content", out var c) ? c : (JsonElement?)null;

        switch (type)
        {
            case "doc":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendText(child, sb);
                break;
            case "paragraph":
            case "heading":
            case "listItem":
            case "blockquote":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendText(child, sb);
                sb.AppendLine();
                break;
            case "bulletList":
            case "orderedList":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendText(child, sb);
                break;
            case "text":
                sb.Append(node.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "");
                break;
            case "hardBreak":
                sb.AppendLine();
                break;
            case "image":
                sb.Append("[Image]");
                break;
            case "codeBlock":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendText(child, sb);
                sb.AppendLine();
                break;
            default:
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendText(child, sb);
                break;
        }
    }

    private static void AppendMarkdown(JsonElement node, StringBuilder sb, int listLevel, string? listItemPrefix = null)
    {
        var type = node.TryGetProperty("type", out var t) ? t.GetString() : null;
        var content = node.TryGetProperty("content", out var c) ? c : (JsonElement?)null;

        switch (type)
        {
            case "doc":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, 0);
                break;
            case "paragraph":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, 0);
                sb.Append("\n\n");
                break;
            case "heading":
                var level = node.TryGetProperty("attrs", out var attrs) && attrs.TryGetProperty("level", out var l) ? l.GetInt32() : 1;
                sb.Append(new string('#', level)).Append(' ');
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, 0);
                sb.Append("\n\n");
                break;
            case "text":
                var text = node.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                var marks = node.TryGetProperty("marks", out var m) ? m : (JsonElement?)null;
                if (marks.HasValue)
                    foreach (var mark in marks.Value.EnumerateArray())
                    {
                        var markType = mark.TryGetProperty("type", out var mt) ? mt.GetString() : null;
                        switch (markType)
                        {
                            case "bold": text = "**" + text + "**"; break;
                            case "italic": text = "_" + text + "_"; break;
                            case "code": text = "`" + text + "`"; break;
                            case "link":
                                var href = mark.TryGetProperty("attrs", out var ma) && ma.TryGetProperty("href", out var h) ? h.GetString() ?? "" : "";
                                text = $"[{text}]({href})";
                                break;
                        }
                    }
                sb.Append(EscapeMarkdown(text));
                break;
            case "bulletList":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, listLevel + 1, "- ");
                break;
            case "orderedList":
                if (content.HasValue)
                {
                    int i = 1;
                    foreach (var child in content.Value.EnumerateArray())
                    {
                        sb.Append(new string(' ', listLevel * 2)).Append(i++).Append(". ");
                        AppendMarkdown(child, sb, listLevel, "");
                    }
                }
                break;
            case "listItem":
                if (listItemPrefix != "")
                    sb.Append(new string(' ', listLevel * 2)).Append(listItemPrefix ?? "- ");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, listLevel);
                sb.Append('\n');
                break;
            case "blockquote":
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                    {
                        sb.Append("> ");
                        AppendMarkdown(child, sb, listLevel, null);
                    }
                break;
            case "codeBlock":
                sb.Append("\n```\n");
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, 0, null);
                sb.Append("```\n\n");
                break;
            case "hardBreak":
                sb.Append("\n");
                break;
            case "image":
                var mdSrc = node.TryGetProperty("attrs", out var mdImgAttrs) && mdImgAttrs.TryGetProperty("src", out var mdSrcEl)
                    ? mdSrcEl.GetString() ?? ""
                    : "";
                sb.Append(!string.IsNullOrEmpty(mdSrc) ? $"![image]({mdSrc})\n\n" : "");
                break;
            default:
                if (content.HasValue)
                    foreach (var child in content.Value.EnumerateArray())
                        AppendMarkdown(child, sb, listLevel, null);
                break;
        }
    }

    private static string EscapeMarkdown(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return s.Replace("\\", "\\\\").Replace("*", "\\*").Replace("_", "\\_").Replace("[", "\\[").Replace("]", "\\]");
    }
}
