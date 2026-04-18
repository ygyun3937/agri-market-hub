namespace AgriHub.Api.Models;
public class DisasterAlert
{
    public int Id { get; set; }
    public string? Type { get; set; }
    public string? Region { get; set; }
    public string? Level { get; set; }
    public string? Message { get; set; }
    public DateTime? IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
