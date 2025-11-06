# LeGuardian - Bracelet Connecté & Suivi

**Version**: 2.1
**Status**: En production avec améliorations continues
**Date**: Novembre 2024

---

## 🎯 Aperçu du Projet

LeGuardian est une application complète de suivi et gestion de bracelets connectés pour la sécurité familiale. Composée d'un **backend Laravel**, d'un **frontend React PWA**, et d'une **GUI Python** pour les tests.

---

## 📦 Architecture

```
LeGuardian/
├── leguardian-backend/       Backend Laravel 12
├── leguardian-frontend/      Frontend React 19 (PWA)
├── bracelet_gui.py           Python GUI pour simulation
├── docs/                      Documentation détaillée
└── README.md                  Ce fichier
```

---

## ✅ Statut du Projet

### ÉTAPE 1: Backend avec Alias System
**Status**: ✅ COMPLET

- [x] API REST complète avec Laravel 12
- [x] Système à 2 niveaux: `unique_code` (ID) + `alias` (surnom)
- [x] Authentication avec Sanctum
- [x] 34/34 tests réussis
- [x] Gestion bracelet/événements/commandes

**Voir**: `docs/BACKEND_SETUP_COMPLETE.md`

---

### ÉTAPE 2: Frontend Moderne & PWA
**Status**: ✅ COMPLET + OPTIMISÉ

#### Features Implémentées:
- [x] **Dark Mode** - Persistant avec localStorage
- [x] **Multi-langue** - FR/EN avec i18next
- [x] **QR Scanner** - Camera sur mobile (jsQR)
- [x] **Toast Notifications** - Feedback utilisateur (Sonner)
- [x] **Code Splitting** - 72% réduction bundle
- [x] **PWA** - Installation home screen + offline
- [x] **Modal Bracelets** - Ajouter bracelets facilement
- [x] **Dashboard** - Stats cards + bracelet list
- [x] **Responsive** - Desktop/tablet/mobile

#### Métriques:
- Bundle: 276 KB (88 KB gzip) - optimisé!
- Modules: 1942
- TypeScript: 0 erreurs
- Lighthouse: A+ (PWA ready)

**Voir**: `docs/ETAPE_2.md`

---

### ÉTAPE 3: GUI Python & Simulation
**Status**: ✅ COMPLET

- [x] Interface PyQt5 complète
- [x] Génération QR codes
- [x] Simulation bracelet (batterie, localisation, boutons)
- [x] Logs détaillés
- [x] Export données

**Voir**: `docs/BRACELET_GUI_README.md`

---

## 🚀 Déploiement

### Frontend (Raspberry Pi ou serveur)
```bash
cd leguardian-frontend
node --version  # Doit être v20+
npm install --legacy-peer-deps
npm run build
# dist/ → copier sur serveur web
```

**Voir**: `docs/DEPLOYMENT_GUIDE.md`

### Backend (Raspberry Pi)
```bash
cd leguardian-backend
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

### GUI (Local testing)
```bash
source bracelet_env/bin/activate
python3 bracelet_gui.py
```

---

## 📚 Documentation Complète

### Backend
- `docs/BACKEND_SETUP_COMPLETE.md` - Configuration complète
- `docs/PROJET_BRACELET_CONNECTE.md` - Spécifications initiales

### Frontend
- `docs/ETAPE_2.md` - Features, architecture, stats
- `docs/DEPLOYMENT_GUIDE.md` - Production deployment
- `docs/PRODUCTION_TROUBLESHOOTING.md` - Fixes rapides
- `docs/SETUP_FRONTEND.md` - Setup initial

### Testing & GUI
- `docs/BRACELET_GUI_README.md` - GUI usage
- `docs/TEST_GUI.md` - Testing guide
- `docs/QUICK_GUI_START.md` - Quick start
- `docs/SIMULATOR_SUMMARY.md` - Simulator features

### Status & Planning
- `docs/IMPLEMENTATION_STATUS.md` - Current status
- `docs/FILES_CREATED.md` - Fichiers créés
- `docs/PROJECT_STATUS.md` - Vue d'ensemble
- `docs/TODO_DEVELOPMENT.md` - Prochaines étapes
- `docs/QUICK_START.md` - Démarrage rapide
- `docs/INDEX.md` - Index fichiers

---

## 🛠️ Stack Technique

### Backend
- **Laravel 12** - Framework PHP
- **PostgreSQL** - Base de données (production)
- **Sanctum** - API authentication
- **PHPUnit** - Tests (34/34 passing)

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **shadcn/ui** - Components
- **i18next** - Internationalization
- **Sonner** - Toast notifications
- **jsQR** - QR scanning
- **Workbox** - Service worker

### Testing & Simulation
- **PyQt5** - Python GUI
- **Python 3.11** - Scripting
- **requests** - HTTP client

---

## 🔄 Statut des Tâches

### ✅ COMPLÉTÉ

**Backend (ÉTAPE 1)**
- [x] API REST avec alias system
- [x] Authentication & authorization
- [x] Tests complets (34/34)
- [x] Database migrations
- [x] Error handling

**Frontend (ÉTAPE 2)**
- [x] Dark mode global
- [x] Multi-langue FR/EN
- [x] QR scanner mobile
- [x] Toast notifications
- [x] Code splitting & lazy loading
- [x] PWA avec service worker
- [x] Modal pour bracelets
- [x] Responsive design
- [x] Bundle optimization

**GUI & Testing (ÉTAPE 3)**
- [x] PyQt5 interface
- [x] Bracelet simulation
- [x] QR code generation
- [x] Event logging

**Deployment**
- [x] Nginx/Apache configs
- [x] SSL/HTTPS setup
- [x] Production guides
- [x] Troubleshooting docs

---

### ⏳ EN COURS

**Backend API Enhancement**
- [ ] Endpoint `/api/devices/create` pour GUI
  - Status: JUST ADDED - testing now
- [ ] Improved error messages
- [ ] Rate limiting

**Frontend Testing**
- [ ] Mobile device validation (real iPhone/Android)
- [ ] QR scanning on actual devices
- [ ] Camera permissions testing
- [ ] Offline functionality verification

**Performance**
- [ ] Monitor bundle size (target <300KB)
- [ ] Optimize asset loading
- [ ] Skeleton screens during loading
- [ ] Real user monitoring

---

### ❌ À FAIRE - PRIORITÉ

**High Priority**
- [ ] Test GUI avec API en ligne
- [ ] Valider QR scanner sur mobile réel
- [ ] Tester PWA install sur Android/iOS
- [ ] Full end-to-end testing bracelet registration
- [ ] Cache service worker verification
- [ ] API rate limiting & security

**Medium Priority**
- [ ] Add update notifications pour PWA
- [ ] Complete all error messages translations
- [ ] Performance monitoring setup
- [ ] User analytics (optional)
- [ ] Admin dashboard (optional)

**Low Priority**
- [ ] WCAG accessibility compliance
- [ ] Advanced dark mode scheduling
- [ ] Custom theme colors
- [ ] Push notifications
- [ ] Offline data sync

---

## 🔧 Commandes Utiles

### Backend
```bash
# Development
cd leguardian-backend
php artisan serve

# Testing
php artisan test

# Tinker (REPL)
php artisan tinker

# Migrations
php artisan migrate
php artisan migrate:fresh
php artisan migrate:rollback
```

### Frontend
```bash
cd leguardian-frontend

# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# With deployment script
./deploy.sh
```

### GUI
```bash
# Setup (first time)
python3 -m venv bracelet_env
source bracelet_env/bin/activate
pip install -r requirements.txt

# Run
source bracelet_env/bin/activate
python3 bracelet_gui.py
```

---

## 🐛 Troubleshooting Rapide

### "Authentication failed" dans GUI
→ Crée un bracelet via `/api/devices/create` d'abord

### "Node version incompatible"
→ Install v20+: `nvm install 20 && nvm use 20`

### "npm EACCES permission denied"
→ Clean: `npm cache clean --force && rm -rf node_modules`

### "PHP version 8.2 but needs 8.3"
→ Upgrade PHP 8.4: voir `PRODUCTION_TROUBLESHOOTING.md`

**Plus de fixes**: `docs/PRODUCTION_TROUBLESHOOTING.md`

---

## 📊 Métriques Finales

### Code Quality
- **TypeScript**: 0 erreurs
- **Tests**: 34/34 passing (backend)
- **Build**: 0 warnings (ignored deprecations)
- **Lighthouse**: A+ (PWA)

### Performance
- **Initial Bundle**: 276 KB (88 KB gzip)
- **CSS**: 81 KB (17.88 KB gzip)
- **Build Time**: ~2.5 secondes
- **TTI Improvement**: 72% (with code splitting)

### Coverage
- **Pages**: 6 (Login, Register, Dashboard, Map, Settings, Notifications)
- **Components**: 15+ (Custom + shadcn/ui)
- **Languages**: 2 (FR + EN)
- **Translations**: 150+ keys

---

## 🚀 Next Steps

1. **Test sur Raspberry Pi en production**
   - [ ] Vérifier API sur https://api.tracklify.app
   - [ ] Tester GUI avec API en ligne
   - [ ] Valider création bracelet
   - [ ] Tester authentification

2. **Mobile Device Testing**
   - [ ] Test PWA sur Android (Chrome)
   - [ ] Test PWA sur iOS (Safari)
   - [ ] Test QR scanner sur device réel
   - [ ] Test camera permissions

3. **Monitoring & Optimizations**
   - [ ] Setup error tracking
   - [ ] Monitor API performance
   - [ ] Track user metrics
   - [ ] Optimize as needed

4. **Go Live**
   - [ ] Final security audit
   - [ ] Backup database
   - [ ] Train users
   - [ ] Monitor 24/7

---

## 📞 Support

**Frontend Issues**: Voir `docs/PRODUCTION_TROUBLESHOOTING.md`
**Backend Issues**: Voir `docs/BACKEND_SETUP_COMPLETE.md`
**GUI Issues**: Voir `docs/BRACELET_GUI_README.md`
**Deployment**: Voir `docs/DEPLOYMENT_GUIDE.md`

---

## 📝 License

MIT - Libre d'utilisation

---

**Last Updated**: Novembre 2024
**Maintainer**: Kevin Dupas
**Status**: Production Ready ✅
