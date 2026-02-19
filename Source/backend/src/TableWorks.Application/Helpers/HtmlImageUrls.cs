using System.Text.RegularExpressions;

namespace ASideNote.Application.Helpers;

/// <summary>Extracts image URLs from HTML content (img src attributes).</summary>
public static class HtmlImageUrls
{
    private static readonly Regex ImgSrcRegex = new(
        @"<img[^>]+src\s*=\s*[""']([^""']+)[""']",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>Returns all img src URLs found in the HTML, excluding data: URLs.</summary>
    public static IReadOnlyList<string> GetImageUrls(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return Array.Empty<string>();
        var urls = new List<string>();
        foreach (Match m in ImgSrcRegex.Matches(html))
        {
            var url = m.Groups[1].Value.Trim();
            if (!string.IsNullOrWhiteSpace(url) && !url.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                urls.Add(url);
        }
        return urls;
    }
}
