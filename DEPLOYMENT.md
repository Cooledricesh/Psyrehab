# Deployment Guide

This document outlines the deployment process for the PsyRehab application.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Environment Variables](#environment-variables)
- [Testing Deployment](#testing-deployment)
- [Production Checklist](#production-checklist)

## Environment Setup

### Development Environment
```bash
npm run dev
```
Runs the development server on http://localhost:5173

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
# or
npm run serve
```
Serves the production build locally for testing.

## Build Process

### Available Build Scripts

- `npm run build` - Standard production build
- `npm run build:staging` - Build for staging environment
- `npm run build:production` - Build for production environment
- `npm run build:analyze` - Build with bundle analysis
- `npm run clean` - Clean the dist directory

### Build Optimization

The Vite configuration includes several optimizations:

- **Code Splitting**: Vendor libraries are separated into chunks
- **Tree Shaking**: Unused code is removed
- **Minification**: Code is compressed using Terser
- **Source Maps**: Generated for production debugging
- **Asset Optimization**: Images and other assets are optimized

### Bundle Analysis

To analyze your bundle size:
```bash
npm run build:analyze
```

This will generate a build and open a bundle analyzer to visualize chunk sizes.

## Deployment Options

### 1. Vercel (Recommended)

1. **Connect Repository**:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure build settings:
     - Build Command: `npm run ci`
     - Output Directory: `dist`

2. **Environment Variables**:
   Add the following environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url
   VITE_APP_ENV=production
   ```

3. **Custom Domain** (Optional):
   - Add your custom domain in Vercel dashboard
   - Configure DNS settings

### 2. Netlify

1. **Deploy from Git**:
   - Connect your repository
   - Build command: `npm run ci`
   - Publish directory: `dist`

2. **Environment Variables**:
   Configure the same environment variables as above in Netlify dashboard.

### 3. Traditional Server (VPS/Dedicated)

1. **Build the application**:
   ```bash
   npm run build:production
   ```

2. **Serve with Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/your/app/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Serve with Apache**:
   ```apache
   <VirtualHost *:80>
       DocumentRoot /path/to/your/app/dist
       ServerName your-domain.com
       
       <Directory /path/to/your/app/dist>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

## Environment Variables

### Required Variables

Create a `.env` file based on the template and configure:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jsilzrsiieswiskzcriy.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-supabase-anon-key

# n8n Webhook (Optional)
VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url

# Application Settings
VITE_APP_ENV=production
VITE_APP_NAME=PsyRehab
VITE_APP_VERSION=1.0.0
```

### Environment-Specific Settings

- **Development**: Enable debug tools, verbose logging
- **Staging**: Mirror production but with debug capabilities
- **Production**: Optimized, minimal logging, analytics enabled

## Testing Deployment

### Pre-deployment Checklist

1. **Run CI Pipeline**:
   ```bash
   npm run ci
   ```
   This runs type checking, linting, testing, and building.

2. **Test Production Build Locally**:
   ```bash
   npm run deploy:preview
   ```

3. **Verify Supabase Connection**:
   - Check that environment variables are correctly set
   - Test database connectivity
   - Verify authentication flows

4. **Test Core Functionality**:
   - User authentication
   - Patient management
   - Goal creation and tracking
   - Assessment features

### Performance Testing

1. **Lighthouse Audit**:
   - Run Lighthouse on the deployed application
   - Aim for scores > 90 in all categories

2. **Load Testing**:
   - Test with multiple concurrent users
   - Monitor Supabase performance metrics

## Production Checklist

### Security
- [ ] Environment variables are secure and not exposed
- [ ] HTTPS is enabled
- [ ] CSP headers are configured
- [ ] Supabase RLS policies are enabled

### Performance
- [ ] Bundle size is optimized (< 500KB initial load)
- [ ] Images are optimized
- [ ] Caching headers are configured
- [ ] CDN is configured (if applicable)

### Monitoring
- [ ] Error tracking is configured (Sentry recommended)
- [ ] Analytics are configured
- [ ] Performance monitoring is enabled
- [ ] Supabase monitoring is set up

### Backup & Recovery
- [ ] Database backup strategy is in place
- [ ] Application deployment rollback plan
- [ ] User data export/import procedures

## Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run CI pipeline
        run: npm run ci
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check TypeScript errors: `npm run type-check`
   - Check linting errors: `npm run lint`
   - Verify all dependencies are installed

2. **Runtime Errors**:
   - Check browser console for errors
   - Verify environment variables are loaded
   - Check Supabase connection status

3. **Performance Issues**:
   - Run bundle analyzer to identify large chunks
   - Check for unnecessary dependencies
   - Optimize images and assets

### Support

- Check the main README.md for development setup
- Review Supabase documentation for database issues
- Contact the development team for deployment-specific issues 