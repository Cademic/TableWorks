namespace ASideNote.Application.DTOs.Admin;

public sealed class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
    public string? Reason { get; set; }
}
