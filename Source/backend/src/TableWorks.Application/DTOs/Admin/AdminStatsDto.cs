namespace ASideNote.Application.DTOs.Admin;

public sealed class AdminStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsersCount { get; set; }
    public int UsersActiveLast24h { get; set; }
    public int UsersActiveLast7d { get; set; }
}
