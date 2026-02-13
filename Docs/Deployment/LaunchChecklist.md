# Production Launch Checklist

## Pre-Launch (Staging Validation)

### Identity and Auth
- [ ] Email/password registration creates unverified account
- [ ] Verification email is received (check spam folder)
- [ ] Verification link works and marks account as verified
- [ ] Verification link expires after 24 hours
- [ ] Verification link can only be used once
- [ ] Resend verification works with 2-minute throttle
- [ ] Unverified users see verification gate (cannot access app)
- [ ] Google sign-up creates verified account
- [ ] Google sign-in works for existing Google-linked users
- [ ] Google sign-in safely links to existing email/password account
- [ ] Login rate limiting triggers after 10 attempts/minute
- [ ] Logout revokes all refresh tokens

### API Health
- [ ] `/health/live` returns 200
- [ ] `/health/ready` returns 200 (DB connected)
- [ ] Swagger UI accessible in staging (not in production)

### Security
- [ ] CORS rejects requests from unknown origins
- [ ] Security headers present (check with securityheaders.com)
- [ ] JWT tokens expire correctly
- [ ] Refresh token rotation works
- [ ] Rate limiting returns 429 on excess requests

### Frontend
- [ ] SPA routing works (direct URL access to /dashboard, /projects, etc.)
- [ ] API calls use correct base URL
- [ ] Dark/light mode works
- [ ] Core features functional (notes, boards, projects, calendar)

## Launch Day

### DNS and Domain
- [ ] DNS records configured and propagated
- [ ] TLS certificates provisioned by Render
- [ ] HTTP → HTTPS redirect working
- [ ] No mixed content warnings

### Environment
- [ ] Production environment variables set (all required vars from EnvironmentVariables.md)
- [ ] JWT_SECRET is unique and strong (min 32 chars)
- [ ] Google OAuth credentials are for production project
- [ ] Resend API key is for production
- [ ] Database migrations applied to production

### Deployment
- [ ] Production deploy from `main` branch succeeds
- [ ] Health checks pass
- [ ] Smoke tests pass (see DeploymentRunbook.md)

## Post-Launch (First Week)

### Monitoring
- [ ] Monitor 5xx error rate (target: < 0.1%)
- [ ] Monitor API latency (target: p95 < 500ms)
- [ ] Monitor health check status
- [ ] Check Resend dashboard for email delivery rates
- [ ] Review Render logs for unexpected errors

### Operations
- [ ] Verify database backups are running (Render managed)
- [ ] Test rollback procedure on staging
- [ ] Document any issues encountered during launch
