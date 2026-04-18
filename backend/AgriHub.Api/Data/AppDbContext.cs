using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Models;

namespace AgriHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserSetting> UserSettings => Set<UserSetting>();
    public DbSet<WatchItem> WatchItems => Set<WatchItem>();
    public DbSet<WeatherData> WeatherData => Set<WeatherData>();
    public DbSet<WeatherForecast> WeatherForecasts => Set<WeatherForecast>();
    public DbSet<AuctionPrice> AuctionPrices => Set<AuctionPrice>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<PestAlert> PestAlerts => Set<PestAlert>();
    public DbSet<DisasterAlert> DisasterAlerts => Set<DisasterAlert>();
    public DbSet<FuelPrice> FuelPrices => Set<FuelPrice>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<UserSetting>().HasKey(s => s.UserId);
        mb.Entity<UserSetting>().Property(s => s.WatchRegions).HasColumnType("text[]");
        mb.Entity<WeatherForecast>()
            .HasIndex(f => new { f.RegionCode, f.ForecastDate }).IsUnique();
        mb.Entity<AuctionPrice>()
            .HasIndex(p => new { p.ItemCode, p.MarketCode, p.Date }).IsUnique();
        mb.Entity<PushSubscription>()
            .HasIndex(s => new { s.UserId, s.Endpoint }).IsUnique();
    }
}
