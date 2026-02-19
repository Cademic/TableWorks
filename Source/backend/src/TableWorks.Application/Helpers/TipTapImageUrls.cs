using System.Collections.Generic;
using System.Text.Json;

namespace ASideNote.Application.Helpers;

/// <summary>Extracts image URLs from TipTap/ProseMirror JSON.</summary>
public static class TipTapImageUrls
{
    /// <summary>Returns all image src URLs found in the document (excluding data: URLs which are inline).</summary>
    public static IReadOnlyList<string> GetImageUrls(string contentJson)
    {
        if (string.IsNullOrWhiteSpace(contentJson))
            return Array.Empty<string>();
        try
        {
            using var doc = JsonDocument.Parse(contentJson);
            var list = new List<string>();
            CollectImageUrls(doc.RootElement, list);
            return list;
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static void CollectImageUrls(JsonElement node, List<string> urls)
    {
        if (node.TryGetProperty("type", out var typeProp))
        {
            var type = typeProp.GetString();
            if (type == "image" && node.TryGetProperty("attrs", out var attrs) && attrs.TryGetProperty("src", out var src))
            {
                var url = src.GetString();
                if (!string.IsNullOrWhiteSpace(url) && !url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    urls.Add(url);
                return;
            }
        }

        if (node.TryGetProperty("content", out var content))
        {
            foreach (var child in content.EnumerateArray())
                CollectImageUrls(child, urls);
        }
    }
}
