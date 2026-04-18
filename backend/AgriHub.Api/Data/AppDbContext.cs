using System.Text.RegularExpressions;
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
        // Map to lowercase table names matching init.sql
        mb.Entity<User>().ToTable("users");
        mb.Entity<UserSetting>().ToTable("user_settings");
        mb.Entity<WatchItem>().ToTable("watch_items");
        mb.Entity<WeatherData>().ToTable("weather_data");
        mb.Entity<WeatherForecast>().ToTable("weather_forecast");
        mb.Entity<AuctionPrice>().ToTable("auction_prices");
        mb.Entity<NewsArticle>().ToTable("news_articles");
        mb.Entity<PestAlert>().ToTable("pest_alerts");
        mb.Entity<DisasterAlert>().ToTable("disaster_alerts");
        mb.Entity<FuelPrice>().ToTable("fuel_prices");
        mb.Entity<Schedule>().ToTable("schedules");
        mb.Entity<Notification>().ToTable("notifications");
        mb.Entity<PushSubscription>().ToTable("push_subscriptions");

        mb.Entity<UserSetting>().HasKey(s => s.UserId);
        mb.Entity<UserSetting>().Property(s => s.WatchRegions).HasColumnType("text[]");
        mb.Entity<UserSetting>().Property(s => s.AlertThresholds).HasColumnType("jsonb");
        mb.Entity<WeatherForecast>()
            .HasIndex(f => new { f.RegionCode, f.ForecastDate }).IsUnique();
        mb.Entity<AuctionPrice>()
            .HasIndex(p => new { p.ItemCode, p.MarketCode, p.Date }).IsUnique();
        mb.Entity<PushSubscription>()
            .HasIndex(s => new { s.UserId, s.Endpoint }).IsUnique();

        // Explicit column mapping for P256Dh: generic snake_case would produce "p256_dh"
        // but the PostgreSQL column in init.sql is "p256dh" (no underscore).
        mb.Entity<PushSubscription>()
            .Property(s => s.P256Dh).HasColumnName("p256dh");

        // Apply snake_case column names to match PostgreSQL init.sql
        foreach (var entity in mb.Model.GetEntityTypes())
        {
            foreach (var prop in entity.GetProperties())
            {
                prop.SetColumnName(ToSnakeCase(prop.Name));
            }
        }
    }

    private static string ToSnakeCase(string name) =>
        Regex.Replace(name, "([a-z0-9])([A-Z])", "$1_$2").ToLower();
}
