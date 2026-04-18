namespace AgriHub.Api.Dto;
public record WeatherDto(string RegionCode, decimal? Temp, decimal? Rain,
    int? Humidity, decimal? Wind, decimal? Snow, DateTime CollectedAt);
public record ForecastDto(DateOnly Date, string? Icon, decimal? High,
    decimal? Low, int? RainProb);
