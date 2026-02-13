# Email Deliverability Setup (Resend)

## Provider: Resend

ASideNote uses [Resend](https://resend.com) for transactional email (verification, password reset, notifications).

## Setup Steps

### 1. Create Resend Account
1. Sign up at https://resend.com
2. Create an API key for each environment (staging, production)
3. Store keys as `RESEND_API_KEY` in Render environment variables

### 2. Domain Authentication (SPF/DKIM/DMARC)

Add these DNS records at your domain registrar:

#### SPF Record
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### DKIM Record
Resend provides this when you verify your domain in their dashboard:
```
Type: CNAME
Host: resend._domainkey
Value: (provided by Resend)
```

#### DMARC Record
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 3. From-Domain Strategy

| Environment | From Address | Domain |
|-------------|-------------|--------|
| Development | Console logging (no emails sent) | N/A |
| Staging | `noreply@staging.yourdomain.com` | staging subdomain |
| Production | `noreply@yourdomain.com` | primary domain |

### 4. Resend Throttling

Built into the application:
- Resend verification: 1 email per 2 minutes per user (enforced in `AuthService`)
- New registration: 1 verification email per registration

### 5. Bounce Handling

Resend handles bounces automatically. Monitor via:
- Resend dashboard → Emails → filter by status
- Set up Resend webhook for `email.bounced` events (future enhancement)

### 6. Environment Variables

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key (per environment) |
| `EMAIL_FROM_ADDRESS` | Sender email address |
| `EMAIL_FROM_NAME` | Sender display name (default: "ASideNote") |
| `FRONTEND_URL` | Base URL for verification links |

### 7. Testing

- **Development**: Emails are logged to console (no external calls)
- **Staging**: Use Resend test mode or a real test domain
- **Production**: Verify DNS records are propagated before launch
