# Domain and DNS Setup

## Overview

Connect your purchased domain to production Render services with HTTPS.

## DNS Records

### Frontend (Static Site)

Add these records at your domain registrar:

```
Type: CNAME
Host: www
Value: <your-render-static-site>.onrender.com

Type: A (or ALIAS/ANAME if supported)
Host: @ (apex)
Value: (Render provides IP for apex domains)
```

### API (Web Service)

If using a subdomain for the API:

```
Type: CNAME
Host: api
Value: <your-render-web-service>.onrender.com
```

### Email Authentication (for Resend)

```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all

Type: CNAME
Host: resend._domainkey
Value: (provided by Resend dashboard)

Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## Render Custom Domain Setup

1. Go to Render dashboard → select production frontend static site
2. Settings → Custom Domains → Add Custom Domain
3. Enter `yourdomain.com` and `www.yourdomain.com`
4. Render provides the required DNS values
5. Add DNS records at your registrar
6. Wait for DNS propagation (can take up to 48 hours, usually minutes)
7. Render automatically provisions Let's Encrypt TLS certificates
8. Repeat for the API service with `api.yourdomain.com`

## HTTPS and Redirects

Render handles:
- Automatic TLS certificate provisioning and renewal (Let's Encrypt)
- HTTP → HTTPS redirect (enabled by default)
- The backend also enforces `UseHttpsRedirection()` in the middleware

## Verification Checklist

- [ ] `https://yourdomain.com` loads the frontend
- [ ] `https://www.yourdomain.com` loads the frontend (or redirects to apex)
- [ ] `https://api.yourdomain.com/health/live` returns 200
- [ ] `https://api.yourdomain.com/health/ready` returns 200
- [ ] No mixed content warnings in browser console
- [ ] CORS allows requests from production frontend to API
- [ ] TLS certificate is valid (check with `curl -vI https://yourdomain.com`)
