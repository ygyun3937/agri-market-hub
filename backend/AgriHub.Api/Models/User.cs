namespace AgriHub.Api.Models;
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Name { get; set; } = "";
    public string? GoogleId { get; set; }
    public string? GoogleRefreshToken { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserSetting? Settings { get; set; }
    public ICollection<WatchItem> WatchItems { get; set; } = [];
    public ICollection<Schedule> Schedules { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<PushSubscription> PushSubscriptions { get; set; } = [];
}
