namespace AgriHub.Api.Models;
public class PushSubscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Endpoint { get; set; } = "";
    public string P256Dh { get; set; } = "";
    public string Auth { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
}
