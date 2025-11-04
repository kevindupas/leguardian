# 🚀 LeGuardian Frontend - Deployment Guide

## Overview

LeGuardian is a **Progressive Web App (PWA)** that requires specific setup for production deployment.

## Pre-Deployment Checklist

### ✅ Local Development Environment
- [ ] Node.js v20+ installed (check with `node --version`)
- [ ] npm v9+ installed (check with `npm --version`)
- [ ] All dependencies installed (`npm install`)
- [ ] Build successful (`npm run build`)
- [ ] Zero TypeScript errors
- [ ] Tests passing (if applicable)

### ✅ Production Server Requirements
- [ ] Node.js v20+ available (use NVM or system package manager)
- [ ] npm v9+ available
- [ ] Sufficient disk space (at least 500MB for node_modules)
- [ ] HTTPS enabled (PWA requirement)
- [ ] Git installed (for version control)

## Installation Instructions

### Step 1: Prepare Your Server

```bash
# SSH into your production server
ssh user@your-server.com

# Create application directory
mkdir -p /var/www/leguardian
cd /var/www/leguardian

# Install NVM (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js v20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 2: Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url> .

# Navigate to frontend
cd leguardian-frontend

# Use correct Node version
nvm use 20

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps
```

### Step 3: Build for Production

```bash
# Build the frontend
npm run build

# Output will be in dist/ folder
ls -la dist/
```

### Step 4: Configure Web Server

#### For Nginx:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name leguardian.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript;

    root /var/www/leguardian/leguardian-frontend/dist;
    index index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Manifest - no cache
    location = /manifest.webmanifest {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Type "application/manifest+json";
    }

    # PWA registration script
    location = /registerSW.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CORS headers (if API on different domain)
    add_header Access-Control-Allow-Origin "*" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name leguardian.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### For Apache:

```apache
<VirtualHost *:443>
    ServerName leguardian.yourdomain.com
    DocumentRoot /var/www/leguardian/leguardian-frontend/dist

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # Enable mod_rewrite
    <IfModule mod_rewrite.c>
        RewriteEngine On

        # SPA routing - all routes to index.html
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    # Cache control
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>

    # No cache for service worker
    <FilesMatch "^(sw\.js|registerSW\.js|manifest\.webmanifest)$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # GZIP compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName leguardian.yourdomain.com
    Redirect / https://leguardian.yourdomain.com/
</VirtualHost>
```

### Step 5: SSL Certificate

Install a free SSL certificate using Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx  # For Nginx
# or
sudo apt-get install certbot python3-certbot-apache  # For Apache

# Generate certificate
sudo certbot certonly --standalone -d leguardian.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 6: Configure Environment Variables

Create `.env` file in frontend root:

```bash
VITE_API_URL=https://api.leguardian.yourdomain.com
VITE_APP_NAME=LeGuardian
VITE_ENVIRONMENT=production
```

## Deployment Script

Use the included deployment script for automated setup:

```bash
cd leguardian-frontend
chmod +x deploy.sh
./deploy.sh
```

## Post-Deployment Verification

### 1. Check Frontend Loading
```bash
curl -I https://leguardian.yourdomain.com
# Should return 200 OK with proper headers
```

### 2. Verify Service Worker
```bash
curl https://leguardian.yourdomain.com/sw.js
# Should return JavaScript code
```

### 3. Check Manifest
```bash
curl https://leguardian.yourdomain.com/manifest.webmanifest
# Should return valid JSON manifest
```

### 4. Test PWA Installation
- Open app in Chrome on Android
- Look for "Install" button in header
- Install to home screen
- Verify app launches in standalone mode

### 5. Monitor Build Size
```bash
du -sh dist/
# Should be around 1-2 MB total
# Main bundle: ~276 KB (gzip: 88 KB)
```

## Troubleshooting

### Problem: "npm ERR! code EACCES"

**Solution: Clear npm cache**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Problem: "Node version not compatible"

**Solution: Install correct Node version**
```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Problem: Service worker not updating

**Solution: Clear browser cache**
- On user device: Clear browser cache
- Wait 24 hours for cache expiration
- Or manually trigger service worker unregister

### Problem: "CORS error with API"

**Solution: Configure CORS on backend**
```
Access-Control-Allow-Origin: https://leguardian.yourdomain.com
Access-Control-Allow-Credentials: true
```

### Problem: Large bundle size

**Solution: Check build output**
```bash
npm run build
# Analyze with webpack-bundle-analyzer (if installed)
```

## Performance Optimization

### Enable GZIP on Server
```bash
# Nginx
gzip on;
gzip_types text/plain text/css text/javascript application/javascript;
gzip_min_length 1000;
```

### Enable Browser Caching
- Static assets: 1 year
- HTML/Service Worker: No cache
- API responses: 24 hours (via service worker)

### Monitor Performance
```bash
# Check real user monitoring
# - First Contentful Paint (FCP)
# - Largest Contentful Paint (LCP)
# - Cumulative Layout Shift (CLS)
# - Time to Interactive (TTI)
```

## Maintenance

### Regular Updates
```bash
# Check for updates
npm outdated

# Update all packages (carefully)
npm update --legacy-peer-deps

# Rebuild
npm run build
```

### Logs Monitoring
```bash
# Nginx
tail -f /var/log/nginx/error.log

# Apache
tail -f /var/log/apache2/error.log
```

### Backup Strategy
```bash
# Backup current version before deployment
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)
```

## Rollback Procedure

If deployment fails:

```bash
# Check available backups
ls -la dist.backup.*

# Restore previous version
rm -rf dist
cp -r dist.backup.20241104_143022 dist

# Verify
curl https://leguardian.yourdomain.com
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Service worker origin correct
- [ ] API endpoint HTTPS
- [ ] Environment variables secured
- [ ] Source maps removed from production
- [ ] Console logs removed
- [ ] Error tracking configured (optional)

## Support & Documentation

- **Frontend Docs**: See ÉTAPE_2.md
- **Architecture**: See documentation in repo
- **Issues**: Create issue on GitHub
- **PWA Info**: https://web.dev/progressive-web-apps/

---

**Last Updated**: November 2024
**Frontend Version**: 2.1
**Node Required**: v20+
**Status**: Production Ready ✅
