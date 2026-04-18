using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using System.Text;
using AgriHub.Api.Data;
using AgriHub.Api.Hubs;
using AgriHub.Api.Services;
using AgriHub.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "";
if (jwtSecret.Length < 32 || jwtSecret.StartsWith("CHANGE_ME"))
    throw new InvalidOperationException("Jwt:Secret must be set to a 32+ character random value via environment variable.");

if (builder.Environment.IsEnvironment("Testing"))
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseInMemoryDatabase("TestDb"));
else
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

var redisConn = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConn) && !builder.Environment.IsEnvironment("Testing"))
    builder.Services.AddSingleton<IConnectionMultiplexer>(
        ConnectionMultiplexer.Connect(redisConn));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true,
            ValidateLifetime = true, ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.Request.Path.StartsWithSegments("/hub"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CacheService>();
builder.Services.AddScoped<GoogleCalendarService>();
builder.Services.AddSingleton<PushService>();
builder.Services.AddHostedService<SmartAlertService>();
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
{
    var allowed = builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost";
    p.WithOrigins(allowed.Split(',', StringSplitOptions.RemoveEmptyEntries))
     .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
}));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(err => err.Run(async ctx =>
    {
        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync("{\"error\":\"Internal server error\"}");
    }));
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<JwtAuthMiddleware>();
app.MapControllers();
app.MapHub<DashboardHub>("/hub/dashboard");
app.Run();

public partial class Program { }
