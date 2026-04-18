namespace AgriHub.Api.Models;
public class Schedule
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "";
    public string? Type { get; set; }
    public DateOnly Date { get; set; }
    public string? Memo { get; set; }
    public string? GcalEventId { get; set; }
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
}
