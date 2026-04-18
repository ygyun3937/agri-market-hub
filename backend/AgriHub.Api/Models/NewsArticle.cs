namespace AgriHub.Api.Models;
public class NewsArticle
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Summary { get; set; }
    public string Url { get; set; } = "";
    public string? Tag { get; set; }
    public string? Source { get; set; }
    public DateTime? PublishedAt { get; set; }
}
