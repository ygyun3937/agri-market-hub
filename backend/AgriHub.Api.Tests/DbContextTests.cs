using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Models;
using FluentAssertions;

public class DbContextTests
{
    [Fact]
    public void CanCreateInMemoryContext()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("test_db_" + Guid.NewGuid())
            .Options;
        using var ctx = new AppDbContext(opts);
        ctx.Database.EnsureCreated();
        ctx.Users.Should().NotBeNull();
        ctx.AuctionPrices.Should().NotBeNull();
        ctx.WeatherData.Should().NotBeNull();
    }

    [Fact]
    public void CanInsertAndQueryUser()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("test_db_" + Guid.NewGuid())
            .Options;
        using var ctx = new AppDbContext(opts);
        ctx.Users.Add(new User { Email = "test@example.com", Name = "테스트", CreatedAt = DateTime.UtcNow });
        ctx.SaveChanges();
        ctx.Users.Count().Should().Be(1);
        ctx.Users.First().Email.Should().Be("test@example.com");
    }
}
