using TableWorks.Application.Interfaces;
using TableWorks.Core.Entities;
using TableWorks.Core.Interfaces;

namespace TableWorks.Application.Services;

public sealed class AuditLogService : IAuditLogService
{
    private readonly IRepository<AuditLog> _auditLogRepo;
    private readonly IUnitOfWork _unitOfWork;

    public AuditLogService(IRepository<AuditLog> auditLogRepo, IUnitOfWork unitOfWork)
    {
        _auditLogRepo = auditLogRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(
        Guid? userId,
        string actionType,
        string entityType,
        Guid? entityId,
        string? details = null,
        string? ipAddress = null,
        CancellationToken cancellationToken = default)
    {
        var log = new AuditLog
        {
            UserId = userId,
            ActionType = actionType,
            EntityType = entityType,
            EntityId = entityId,
            DetailsJson = details,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };

        await _auditLogRepo.AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
