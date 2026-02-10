namespace TableWorks.Application.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(
        Guid? userId,
        string actionType,
        string entityType,
        Guid? entityId,
        string? details = null,
        string? ipAddress = null,
        CancellationToken cancellationToken = default);
}
