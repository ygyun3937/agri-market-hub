namespace AgriHub.Api.Models;
public class WatchItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ItemCode { get; set; } = "";
    public string ItemName { get; set; } = "";
    public string? Unit { get; set; }
    public string? MarketCode { get; set; }
    public User User { get; set; } = null!;
}
