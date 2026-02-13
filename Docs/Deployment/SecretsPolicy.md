# Secrets and Key Management Policy

## Secret Inventory

| Secret | Where Stored | Rotation Cadence | Owner |
|--------|-------------|-----------------|-------|
| `JWT_SECRET` | Render env var | Every 90 days | Backend lead |
| `GOOGLE_CLIENT_SECRET` | Render env var | Annually (or on compromise) | Backend lead |
| `RESEND_API_KEY` | Render env var | Every 90 days | Backend lead |
| `DB_PASSWORD` | Render managed | Managed by Render | Infrastructure |
| `GOOGLE_CLIENT_ID` | Render env var + frontend build | Same as client secret | Backend lead |

## Storage Rules

1. **Never** commit secrets to Git, even in `.env` files.
2. `.env` files are `.gitignore`d. Only `.env.example` templates are committed.
3. Production secrets exist only in Render environment variable configuration.
4. Use Render environment variable groups to share common secrets across services.

## Rotation Procedure

### JWT Secret Rotation
1. Generate a new 64-character random secret: `openssl rand -base64 48`
2. Update `JWT_SECRET` in Render for the target environment
3. Redeploy the API service (existing tokens signed with old key will expire naturally)
4. Monitor for elevated 401 rates in the first hour

### Google OAuth Secret Rotation
1. Generate new credentials in Google Cloud Console
2. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render
3. Rebuild and redeploy both frontend (client ID) and backend (client secret)
4. Verify Google login works in staging before promoting to production

### Resend API Key Rotation
1. Generate a new key in Resend dashboard
2. Update `RESEND_API_KEY` in Render
3. Redeploy API service
4. Send a test verification email

## Break-Glass Procedure (Secret Leak Response)

If a secret is suspected or confirmed compromised:

1. **Immediately** rotate the affected secret using the procedures above
2. If JWT secret leaked: revoke all refresh tokens by truncating the `RefreshTokens` table
3. If Google secret leaked: disable the OAuth app in Google Cloud Console, regenerate
4. If DB password leaked: use Render's credential rotation or contact support
5. Review audit logs for unauthorized access during the exposure window
6. Document the incident and root cause
7. Update procedures to prevent recurrence

## Future Considerations

- Migrate JWT signing from symmetric (HMAC) to asymmetric keys (RSA/ECDSA) for better security separation
- Consider a dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager) at scale
