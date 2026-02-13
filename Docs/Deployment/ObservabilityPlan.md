# Observability Upgrades (P1)

Target: complete within 30 days of launch.

## Structured Logging

### Current State
- Serilog with console sink
- Request logging via `UseSerilogRequestLogging()`

### Target State
- JSON-formatted structured logs
- Correlation IDs (request ID, user ID) on every log entry
- Log levels by environment:
  - Development: Debug
  - Staging: Information
  - Production: Warning

### Implementation
Add to `Program.cs` Serilog configuration:
```csharp
loggerConfiguration
    .Enrich.WithProperty("Application", "ASideNote")
    .Enrich.WithCorrelationId()
    .WriteTo.Console(new JsonFormatter());
```

Add `Serilog.Enrichers.CorrelationId` NuGet package.

## Centralized Logs

### Render Logs
- Render captures stdout/stderr automatically
- Access via Render dashboard → service → Logs
- Filter by timestamp and search

### Future: Log Drain
- Render supports log drains to external services
- Options: Datadog, Papertrail, Logtail, Better Stack
- Configure when log volume justifies the cost

## SLO-Lite Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Uptime | 99.5% | < 99% over 24h |
| API p95 latency | < 500ms | > 1000ms sustained |
| Error rate (5xx) | < 0.1% | > 1% over 5 min |
| Health check | Always passing | Any failure |
| Email delivery rate | > 95% | < 90% over 24h |

## Alert Configuration

### Render Built-in
- Health check failure alerts (configure in Render dashboard)
- Deploy failure notifications

### Future: External Monitoring
- Uptime monitoring: UptimeRobot or Better Uptime (free tier)
  - Monitor `/health/live` every 5 minutes
  - Alert on 2 consecutive failures
- Error tracking: Sentry (optional, free tier available)

## Key Metrics to Track

1. **Auth metrics**: login success/failure rate, registration rate, verification completion rate
2. **API metrics**: request count, latency distribution, error rate by endpoint
3. **Database metrics**: connection count, query latency, storage usage
4. **Email metrics**: send rate, delivery rate, bounce rate (via Resend dashboard)
