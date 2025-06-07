# Rate Limiting and IP Blocking Documentation

## Overview

The PsyRehab application implements comprehensive rate limiting and IP blocking to protect against abuse, DDoS attacks, and ensure fair resource usage. The system uses `express-rate-limit` with custom enhancements for IP tracking and automatic blocking.

## Rate Limiting Tiers

### 1. General Rate Limiter
- **Limit**: 100 requests per 15 minutes
- **Scope**: All requests to the server
- **Reset Window**: 15 minutes (900 seconds)
- **Purpose**: General protection against excessive usage

### 2. API Rate Limiter
- **Limit**: 50 requests per 10 minutes
- **Scope**: API endpoints (`/api/*`)
- **Reset Window**: 10 minutes (600 seconds)
- **Special**: Doesn't count successful requests
- **Purpose**: Protect API resources while allowing legitimate usage

### 3. Webhook Rate Limiter
- **Limit**: 20 requests per 5 minutes
- **Scope**: N8N webhook endpoint (`/api/webhook/n8n`)
- **Reset Window**: 5 minutes (300 seconds)
- **Purpose**: Prevent webhook abuse while allowing legitimate AI processing

### 4. Strict Rate Limiter
- **Limit**: 10 requests per 15 minutes
- **Scope**: Sensitive endpoints (admin functions)
- **Reset Window**: 15 minutes (900 seconds)
- **Purpose**: Maximum protection for administrative functions

## Rate Limit Headers

All responses include standard rate limit headers:

```http
RateLimit-Policy: 100;w=900
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 900
```

- `RateLimit-Policy`: Limit and window in seconds
- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining in current window
- `RateLimit-Reset`: Seconds until the rate limit resets

## IP Blocking System

### Automatic Blocking
- **Trigger**: 5 rate limit violations from the same IP
- **Duration**: 24 hours (automatic unblock)
- **Tracking**: In-memory storage of suspicious IPs
- **Response**: HTTP 403 with clear error message

### Manual IP Management

#### View Blocked IPs
```bash
GET /api/admin/blocked-ips
```

Response:
```json
{
  "blockedIPs": ["192.168.1.100"],
  "suspiciousIPs": {
    "192.168.1.101": {
      "attempts": 3,
      "lastAttempt": 1649123456789
    }
  },
  "timestamp": "2025-06-06T22:46:18.827Z"
}
```

#### Block IP Manually
```bash
POST /api/admin/block-ip/:ip
```

Example:
```bash
curl -X POST https://localhost:3443/api/admin/block-ip/192.168.1.100
```

#### Unblock IP Manually
```bash
POST /api/admin/unblock-ip/:ip
```

Example:
```bash
curl -X POST https://localhost:3443/api/admin/unblock-ip/192.168.1.100
```

## Rate Limit Responses

### Normal Rate Limit Exceeded (HTTP 429)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Repeated violations may result in IP blocking.",
  "retryAfter": 900,
  "timestamp": "2025-06-06T22:46:18.827Z",
  "violations": 2
}
```

### IP Blocked (HTTP 403)
```json
{
  "error": "Access forbidden",
  "message": "Your IP address has been blocked due to suspicious activity",
  "timestamp": "2025-06-06T22:46:18.827Z"
}
```

## Endpoint-Specific Limits

| Endpoint | Rate Limiter | Limit | Window |
|----------|--------------|-------|--------|
| `/health` | General | 100 req | 15 min |
| `/api/webhook/n8n` | Webhook | 20 req | 5 min |
| `/api/ai/recommendation/status/*` | API | 50 req | 10 min |
| `/api/admin/*` | Strict | 10 req | 15 min |

## Security Features

### 1. IP Tracking
- Monitors all rate limit violations
- Tracks violation count and timestamps
- Automatic escalation to blocking

### 2. Enhanced Logging
- All rate limit violations are logged with IP and endpoint
- Blocked access attempts are logged
- Manual admin actions are logged

### 3. Automatic Recovery
- Blocked IPs are automatically unblocked after 24 hours
- Suspicious IP tracking is cleared on unblock
- System memory is cleaned up automatically

## Configuration

### Environment Variables
Rate limiting is configured in code but can be customized by modifying these values in `server.js`:

```javascript
// General rate limiter - 100 requests per 15 minutes
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // max 100 requests per windowMs
  'Too many requests from this IP, please try again in 15 minutes.'
);
```

### Production Considerations
- Consider using Redis or database for IP tracking in production
- Implement proper authentication for admin endpoints
- Set up monitoring and alerting for blocked IPs
- Consider implementing whitelist for trusted IPs

## Monitoring

### Log Messages
- `🚫 Rate limit exceeded for IP {ip} on {path}` - Rate limit violation
- `🔒 IP {ip} has been blocked after {attempts} rate limit violations` - IP blocked
- `🔓 IP {ip} has been automatically unblocked after 24 hours` - Auto unblock
- `🔓 IP {ip} manually unblocked by admin` - Manual unblock
- `🔒 IP {ip} manually blocked by admin` - Manual block

### Health Monitoring
Use the `/health` endpoint to verify the rate limiting system is working:

```bash
curl -I https://localhost:3443/health
```

Check for `RateLimit-*` headers in the response.

## Testing Rate Limits

### Test General Rate Limiting
```bash
for i in {1..5}; do 
  echo "Request $i:"; 
  curl -s -w "%{http_code}\n" https://localhost:3443/health | tail -1; 
done
```

### Test API Rate Limiting
```bash
for i in {1..10}; do 
  echo "API Request $i:"; 
  curl -s -w "%{http_code}\n" https://localhost:3443/api/ai/recommendation/status/test | tail -1; 
done
```

### Monitor Blocked IPs
```bash
curl -s https://localhost:3443/api/admin/blocked-ips | jq .
```

## Troubleshooting

### Common Issues

1. **Rate limits too restrictive**
   - Increase the `max` value in the rate limiter configuration
   - Extend the `windowMs` for longer time windows

2. **Legitimate users getting blocked**
   - Use the manual unblock endpoint
   - Consider implementing IP whitelisting
   - Increase the violation threshold before blocking

3. **Memory usage concerns**
   - Implement cleanup for old suspicious IP entries
   - Consider using external storage (Redis) for persistence
   - Monitor the size of `blockedIPs` and `suspiciousIPs` collections

### Recovery Procedures

1. **Emergency IP Unblock**: Use the admin endpoint to immediately unblock IPs
2. **Clear All Blocks**: Restart the server (all in-memory blocks will be cleared)
3. **Disable Rate Limiting**: Comment out the middleware in development 