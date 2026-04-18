namespace AgriHub.Api.Models;
public class WeatherForecast
{
    public int Id { get; set; }
    public string RegionCode { get; set; } = "";
    public DateOnly ForecastDate { get; set; }
    public string? Icon { get; set; }
    public decimal? High { get; set; }
    public decimal? Low { get; set; }
    public int? RainProb { get; set; }
    public DateTime CollectedAt { get; set; }
}
