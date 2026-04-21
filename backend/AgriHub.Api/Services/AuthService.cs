using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AgriHub.Api.Data;
using AgriHub.Api.Models;
namespace AgriHub.Api.Services;

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<User?> RegisterAsync(string email, string password, string name)
    {
        if (await db.Users.AnyAsync(u => u.Email == email))
            return null;
        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Name = name,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException) { return null; }
        db.UserSettings.Add(new UserSetting { UserId = user.Id, UpdatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<User?> ValidateAsync(string email, string password)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            return null;
        return user;
    }

    public async Task<User> GoogleLoginAsync(string googleId, string email, string name, string? refreshToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == email);
        if (user == null)
        {
            user = new User { Email = email, PasswordHash = "", Name = name, GoogleId = googleId, GoogleRefreshToken = refreshToken, CreatedAt = DateTime.UtcNow };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            db.UserSettings.Add(new UserSetting { UserId = user.Id, UpdatedAt = DateTime.UtcNow });
        }
        else
        {
            user.GoogleId = googleId;
            if (refreshToken != null) user.GoogleRefreshToken = refreshToken;
        }
        await db.SaveChangesAsync();
        return user;
    }

    public int? GetUserIdFromToken(string? token)
    {
        if (string.IsNullOrEmpty(token)) return null;
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
            var handler = new JwtSecurityTokenHandler();
            handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true, ValidIssuer = config["Jwt:Issuer"],
                ValidateAudience = true, ValidAudience = config["Jwt:Audience"],
                ValidateLifetime = true,
            }, out var validated);
            var jwt = (JwtSecurityToken)validated;
            var idClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
            return idClaim != null && int.TryParse(idClaim.Value, out var id) ? id : null;
        }
        catch { return null; }
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            ],
            expires: DateTime.UtcNow.AddHours(double.Parse(config["Jwt:ExpiryHours"]!)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
