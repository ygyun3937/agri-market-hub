namespace AgriHub.Api.Middleware;

public class JwtAuthMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context) => next(context);
}
