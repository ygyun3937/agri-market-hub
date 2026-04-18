namespace AgriHub.Api.Models;
public class PestAlert
{
    public int Id { get; set; }
    public string? Region { get; set; }
    public string? ItemName { get; set; }
    public string? Severity { get; set; }
    public string? Description { get; set; }
    public DateTime ReportedAt { get; set; }
}
