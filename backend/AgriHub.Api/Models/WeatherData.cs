namespace AgriHub.Api.Models;
public class WeatherData
{
    public int Id { get; set; }
    public string RegionCode { get; set; } = "";
    public decimal? Temp { get; set; }
    public decimal? Rain { get; set; }
    public int? Humidity { get; set; }
    public decimal? Wind { get; set; }
    public decimal? Snow { get; set; }
    public DateTime CollectedAt { get; set; }
}
