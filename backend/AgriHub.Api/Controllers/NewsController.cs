using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Models;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/news")]
[Authorize]
public class NewsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NewsArticle>>> GetNews([FromQuery] string? tab)
    {
        var query = db.NewsArticles.AsQueryable();
        if (!string.IsNullOrEmpty(tab) && tab != "all")
            query = query.Where(n => n.Tag == tab);
        var news = await query
            .OrderByDescending(n => n.PublishedAt)
            .Take(20)
            .ToListAsync();
        return Ok(news);
    }
}
