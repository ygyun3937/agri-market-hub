namespace AgriHub.Api.Models;
public class AuctionPrice
{
    public int Id { get; set; }
    public string ItemCode { get; set; } = "";
    public string MarketCode { get; set; } = "";
    public decimal Price { get; set; }
    public decimal? Volume { get; set; }
    public string? Grade { get; set; }
    public DateOnly Date { get; set; }
}
