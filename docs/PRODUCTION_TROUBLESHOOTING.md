# 🆘 LeGuardian Production Troubleshooting

## Quick Fixes

### 1. npm install Fails with EACCES Permission Denied

```bash
# Quick fix
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# If still failing, try:
sudo chown -R $(whoami) ~/.npm

# Or use sudo (NOT RECOMMENDED but works as last resort):
sudo npm install --legacy-peer-deps
```

### 2. Node Version Incompatible (v18 Required v20)

```bash
# Check your Node version
node --version

# Install correct version with NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x

# Then retry npm install
npm install --legacy-peer-deps
```

### 3. Deprecated Package Warnings

These are **normal and safe**. The app still builds and runs fine:

```
npm WARN deprecated inflight@1.0.6
npm WARN deprecated glob@7.2.3
npm WARN deprecated sourcemap-codec@1.4.8
```

These come from transitive dependencies (indirect imports). They don't affect functionality.

**If you want to eliminate them:**
```bash
npm audit fix --legacy-peer-deps
# Then rebuild
npm run build
```

### 4. Build Succeeds But App Doesn't Load

**Check these things:**

```bash
# 1. Verify dist folder exists and has index.html
ls -la dist/index.html

# 2. Check if service worker was generated
ls -la dist/sw.js

# 3. Verify manifest
ls -la dist/manifest.webmanifest

# 4. If using Nginx/Apache, check routing to index.html
curl http://localhost:8080/dashboard
# Should return index.html content, not 404
```

### 5. Service Worker Not Caching

**Solution:**

The service worker requires **HTTPS** in production. If you're using HTTP locally:

```bash
# Local development (HTTP is OK)
npm run preview

# In production, MUST be HTTPS
# Configure SSL certificate on server
# See DEPLOYMENT_GUIDE.md
```

### 6. PWA Install Button Not Showing

**Reasons:**

1. **Not using HTTPS** - PWA requires HTTPS in production
2. **Not on Chrome/Android** - Feature limited to certain browsers
3. **Already installed** - Button won't show if app is already installed

**Debug:**

```javascript
// Open browser console and run:
if (window.addEventListener) {
  console.log('beforeinstallprompt ready')
}

// Check if PWA is installable
if ('serviceWorker' in navigator) {
  console.log('Service workers supported')
}
```

### 7. API Requests Failing (CORS Errors)

**Check:**

1. Backend is running on correct port
2. `VITE_API_URL` matches your backend URL
3. Backend allows CORS from your frontend domain

**Solution:**

```bash
# Create .env file
cp .env.example .env

# Edit with correct API URL
VITE_API_URL=https://api.yourdomain.com

# Rebuild
npm run build
```

### 8. Dark Mode Not Working

```bash
# Check if localStorage is being used
# Open browser DevTools Console:
localStorage.getItem('theme')  # Should return 'light' or 'dark'

# If empty, app will auto-detect system preference
# Toggle dark mode in settings to store preference
```

### 9. Translations Not Showing

```bash
# Check language in localStorage
localStorage.getItem('i18nextLng')

# Should return 'en' or 'fr'
# If not, language will auto-detect from browser

# Click language selector in header to change
```

### 10. Bundle Size Too Large

```bash
# Check actual bundle size
du -sh dist/
du -sh dist/assets/

# Normal size should be:
# - Total: 1-2 MB
# - Main JS: ~276 KB
# - CSS: ~81 KB

# If larger, check:
ls -lh dist/assets/ | sort -k5 -h | tail -20
```

## Performance Diagnostics

### Check Build Time

```bash
# Time the build
time npm run build

# Should complete in 2-3 seconds
```

### Check JavaScript Execution

```bash
# Open DevTools > Performance tab
# Record page load
# Look for slow tasks or long JavaScript execution
```

### Check Network Waterfall

```bash
# Open DevTools > Network tab
# Reload page
# Service worker should cache assets
# Second reload should be much faster
```

## Monitoring Commands

### Watch Nginx Logs (Real-time)

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Watch Apache Logs (Real-time)

```bash
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

### Check Disk Space

```bash
df -h

# Should show:
# /home: At least 1 GB free
# /var: At least 2 GB free
```

### Check Memory Usage

```bash
free -h

# Build uses ~500 MB RAM
# App uses minimal memory
```

## Testing Checklist

- [ ] Frontend loads without errors
- [ ] Dark mode toggle works
- [ ] Language switcher works
- [ ] QR scanner (on mobile) works
- [ ] Toast notifications appear
- [ ] All pages load
- [ ] Offline mode works (after first load)
- [ ] PWA installs on Android
- [ ] API calls succeed
- [ ] Dashboard displays data

## Emergency Rollback

If something breaks in production:

```bash
# 1. Go to deployment directory
cd /var/www/leguardian/leguardian-frontend

# 2. Check available backups
ls -la dist.backup.* | head -10

# 3. Restore previous version
rm -rf dist
cp -r dist.backup.20241104_123456 dist

# 4. Verify web server is serving it
curl https://leguardian.yourdomain.com

# 5. Check logs for errors
tail -f /var/log/nginx/error.log
```

## Getting Help

**If you're stuck:**

1. Check the error message carefully
2. See if it matches one of the sections above
3. Try the suggested fix
4. If still failing, provide:
   - Node version: `node --version`
   - npm version: `npm --version`
   - Full error message
   - Your server OS (Ubuntu, CentOS, etc.)
   - Your web server (Nginx, Apache, etc.)

## Resources

- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Frontend Docs**: See `ÉTAPE_2.md`
- **PWA Info**: https://web.dev/progressive-web-apps/
- **Troubleshooting Vite**: https://vitejs.dev/guide/troubleshooting.html
- **Node Installation**: https://nodejs.org/en/download/

---

**Last Updated**: November 2024
**Status**: Active
