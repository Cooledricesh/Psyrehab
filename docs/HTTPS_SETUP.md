# HTTPS Setup Guide

This guide explains how to set up HTTPS for both development and production environments.

## 🔧 Development Environment

### Quick Setup

1. **Generate SSL certificates automatically:**
   ```bash
   npm run setup-ssl
   ```

2. **Start development server with HTTPS:**
   ```bash
   # Start Vite dev server with HTTPS
   npm run dev:https
   ```

3. **Access your application:**
   - Frontend: https://localhost:5173

### Manual SSL Certificate Setup

If the automatic setup fails, you can manually generate certificates:

1. **Install mkcert globally:**
   ```bash
   npm install -g mkcert
   # or using brew on macOS
   brew install mkcert
   ```

2. **Install the local CA:**
   ```bash
   mkcert -install
   ```

3. **Generate certificates:**
   ```bash
   mkdir certs
   mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost 127.0.0.1 ::1
   ```

4. **Update .env.local:**
   ```bash
   # Add these lines to .env.local
   VITE_SSL_CERT=./certs/localhost.pem
   VITE_SSL_KEY=./certs/localhost-key.pem
   ```

## 🚀 Production Environment

### Vercel Deployment

Vercel automatically provides HTTPS for all deployments. No additional configuration needed.

1. **Deploy to Vercel:**
   ```bash
   npm run build
   vercel --prod
   ```

2. **Configure environment variables in Vercel dashboard:**
   - Add all necessary environment variables
   - Ensure `NODE_ENV=production` is set

### Custom Server Deployment

For custom server deployments (AWS, DigitalOcean, etc.):

1. **Obtain SSL certificates:**
   - **Let's Encrypt (free):** Use certbot
   - **Commercial certificates:** From providers like DigiCert, Comodo

2. **Using Let's Encrypt with certbot:**
   ```bash
   # Install certbot
   sudo apt-get update
   sudo apt-get install certbot

   # Generate certificates
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

   # Certificates will be stored in:
   # /etc/letsencrypt/live/yourdomain.com/
   ```

3. **Configure your web server (Nginx, Apache, etc.) to handle SSL**

4. **Set up automatic certificate renewal:**
   ```bash
   # Add to crontab (crontab -e)
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Docker Deployment

For Docker deployments:

1. **Mount SSL certificates as volumes:**
   ```dockerfile
   # In your Dockerfile or docker-compose.yml
   volumes:
     - /etc/letsencrypt:/etc/letsencrypt:ro
   ```

2. **Use reverse proxy (recommended):**
   - Nginx or Traefik for SSL termination
   - Let the proxy handle HTTPS and forward HTTP to your app

## 🔒 Security Headers

The application automatically sets the following security headers:

- **HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- **X-Frame-Options:** `DENY`
- **X-Content-Type-Options:** `nosniff`
- **X-XSS-Protection:** `1; mode=block`
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Content-Security-Policy:** Basic policy (will be expanded in CSP implementation)

## 📋 Troubleshooting

### Common Issues

1. **"NET::ERR_CERT_AUTHORITY_INVALID" in browser:**
   - In development: Browser doesn't trust the self-signed certificate
   - Solution: Click "Advanced" → "Proceed to localhost (unsafe)"
   - Or: Install mkcert CA properly (`mkcert -install`)

2. **"Certificate not found" error:**
   - Check file paths in .env.local
   - Ensure certificates were generated correctly
   - Check file permissions

3. **HTTPS redirect loop:**
   - Check reverse proxy configuration
   - Ensure `x-forwarded-proto` header is set correctly

4. **Mixed content warnings:**
   - Ensure all resources (APIs, images, etc.) use HTTPS
   - Update hardcoded HTTP URLs to HTTPS

### Verification

1. **Check SSL certificate:**
   ```bash
   # Test SSL certificate
   openssl s_client -connect localhost:3443 -servername localhost
   ```

2. **Verify security headers:**
   ```bash
   # Check headers
   curl -I https://localhost:3443/health
   ```

3. **Test HTTPS enforcement:**
   ```bash
   # Should redirect to HTTPS in production
   curl -I http://yourdomain.com
   ```

## 🌐 Browser Support

The HTTPS configuration supports:
- Chrome 49+
- Firefox 44+
- Safari 10+
- Edge 12+

## 📚 Additional Resources

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [mkcert Documentation](https://github.com/FiloSottile/mkcert) 