#!/bin/bash

# LeGuardian Frontend Deployment Script
# This script safely deploys the frontend with proper Node version checking

set -e  # Exit on any error

echo "🚀 LeGuardian Frontend Deployment Script"
echo "========================================"
echo ""

# 1. Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "❌ ERROR: Node.js v20+ is required, but you have v$NODE_VERSION"
    echo ""
    echo "Please upgrade Node.js:"
    echo "  Using NVM: nvm install 20 && nvm use 20"
    echo "  Using apt:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js v$NODE_VERSION is compatible"
echo ""

# 2. Check npm version
echo "📦 Checking npm version..."
NPM_VERSION=$(npm --version)
echo "✅ npm v$NPM_VERSION"
echo ""

# 3. Clean npm cache if needed
echo "🧹 Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true
rm -rf node_modules package-lock.json 2>/dev/null || true
echo "✅ Cache cleaned"
echo ""

# 4. Install dependencies
echo "📥 Installing dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps 2>&1 | grep -E "(added|removed|up to date|ERR!)" || true
echo "✅ Dependencies installed"
echo ""

# 5. Build
echo "🔨 Building frontend..."
npm run build
echo "✅ Build successful"
echo ""

# 6. Report build size
echo "📊 Build Output Summary:"
if [ -d "dist" ]; then
    du -sh dist/
    echo ""
    echo "Files in dist/:"
    ls -lh dist/ | tail -n +2 | awk '{print "  " $9 " (" $5 ")"}'
fi
echo ""

echo "✅ Deployment ready!"
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run preview"
echo "  2. Deploy dist/ folder to your web server"
echo "  3. Ensure server supports:"
echo "     - HTTPS (PWA requirement)"
echo "     - Service worker caching"
echo "     - SPA routing (all routes to index.html)"
echo ""
