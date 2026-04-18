namespace AgriHub.Api.Dto;
public record RegisterRequest(string Email, string Password, string Name);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string Name, int UserId);
