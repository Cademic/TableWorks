namespace ASideNote.Application.DTOs.Admin;

public sealed class AdminAnalyticsDto
{
    public AdminCreationCountsDto CreationCounts { get; set; } = new();
    public IReadOnlyList<AdminPeriodCountDto> UserCreationByMonth { get; set; } = Array.Empty<AdminPeriodCountDto>();
    public IReadOnlyList<AdminPeriodCountDto> UserLoginsByMonth { get; set; } = Array.Empty<AdminPeriodCountDto>();
}
