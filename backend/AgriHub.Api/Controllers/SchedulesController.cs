using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriHub.Api.Data;
using AgriHub.Api.Dto;
using AgriHub.Api.Models;
using AgriHub.Api.Services;

namespace AgriHub.Api.Controllers;

[ApiController]
[Route("api/schedules")]
[Authorize]
public class SchedulesController(AppDbContext db, GoogleCalendarService gcal) : ControllerBase
{
    private int UserId => (int)HttpContext.Items["UserId"]!;

    [HttpGet]
    public async Task<ActionResult<List<Schedule>>> GetSchedules()
    {
        var schedules = await db.Schedules
            .Where(s => s.UserId == UserId)
            .OrderBy(s => s.Date)
            .ToListAsync();
        return Ok(schedules);
    }

    [HttpPost]
    public async Task<ActionResult<Schedule>> CreateSchedule(CreateScheduleRequest req)
    {
        var schedule = new Schedule
        {
            UserId = UserId,
            Title = req.Title,
            Type = req.Type,
            Date = req.Date,
            Memo = req.Memo,
            CreatedAt = DateTime.UtcNow
        };
        db.Schedules.Add(schedule);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSchedules), new { }, schedule);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSchedule(int id, UpdateScheduleRequest req)
    {
        var schedule = await db.Schedules.FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (schedule == null) return NotFound();
        schedule.Title = req.Title;
        schedule.Type = req.Type;
        schedule.Date = req.Date;
        schedule.Memo = req.Memo;
        await db.SaveChangesAsync();
        return Ok(schedule);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSchedule(int id)
    {
        var schedule = await db.Schedules.FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (schedule == null) return NotFound();
        db.Schedules.Remove(schedule);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("sync-gcal")]
    public async Task<IActionResult> SyncGoogleCalendar()
    {
        var schedules = await db.Schedules
            .Where(s => s.UserId == UserId && s.GcalEventId == null)
            .ToListAsync();
        await gcal.SyncSchedulesAsync(UserId, schedules);
        return Ok(new { synced = schedules.Count });
    }
}
