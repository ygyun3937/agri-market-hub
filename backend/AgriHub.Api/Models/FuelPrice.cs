namespace AgriHub.Api.Models;
public class FuelPrice
{
    public int Id { get; set; }
    public string Type { get; set; } = "";
    public decimal Price { get; set; }
    public DateTime CollectedAt { get; set; }
}
