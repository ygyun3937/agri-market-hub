namespace AgriHub.Api.Models;
public class UserSetting
{
    public int UserId { get; set; }
    public string[] WatchRegions { get; set; } = [];
    public string AlertThresholds { get; set; } = "{\"priceDropPercent\":5}";
    public DateTime UpdatedAt { get; set; }
    public User User { get; set; } = null!;
}
