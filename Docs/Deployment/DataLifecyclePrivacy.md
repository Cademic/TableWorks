# Data Lifecycle, Privacy, and Compliance Baseline (P1)

Target: complete within 30 days of launch.

## PII Inventory

| Data Element | Stored In | Purpose | Retention |
|-------------|-----------|---------|-----------|
| Email address | `Users.Email` | Authentication, verification, notifications | Account lifetime |
| Username | `Users.Username` | Display name, identification | Account lifetime |
| Password hash | `Users.PasswordHash` | Authentication | Account lifetime (Argon2id) |
| IP address | `AuditLogs.IpAddress` | Security auditing | 90 days |
| Google user ID | `ExternalLogins.ProviderUserId` | OAuth linking | Account lifetime |
| Last login timestamp | `Users.LastLoginAt` | Activity tracking | Account lifetime |

## Data Retention Policy

| Data Type | Retention | Deletion Method |
|-----------|-----------|----------------|
| User accounts | Until deletion requested | Soft delete (IsActive=false), then hard delete after 30 days |
| Notes / Index Cards | Until user deletes | Soft delete, permanent after 30 days |
| Refresh tokens | 7 days (auto-expire) | Automatic cleanup |
| Verification tokens | 24 hours (auto-expire) | Automatic cleanup |
| Audit logs | 90 days | Batch purge job |

## User Data Export

Endpoint to implement: `GET /api/v1/users/me/export`

Returns a JSON file containing:
- User profile data
- All notes and index cards
- Project memberships
- Tags and folders
- Preferences

## Account Deletion

Endpoint to implement: `DELETE /api/v1/users/me`

Workflow:
1. User requests account deletion
2. System confirms via password or re-authentication
3. Account soft-deleted (IsActive = false, email anonymized)
4. All user data scheduled for permanent deletion after 30-day grace period
5. User receives confirmation email
6. Background job permanently deletes after grace period

## Privacy Policy Page

Create a `/privacy` route with:
- What data is collected and why
- How data is stored and protected
- Third-party services used (Resend for email, Google for OAuth)
- User rights (access, export, deletion)
- Contact information for privacy requests

## Terms of Service Page

Create a `/terms` route with:
- Acceptable use policy
- Account responsibilities
- Service availability expectations
- Limitation of liability
- Governing law

## Implementation Notes

- Privacy and terms pages can be simple static React pages initially
- Add links to footer/registration page
- Consider using a markdown-to-JSX renderer for easy content updates
