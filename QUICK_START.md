# LeGuardian - Quick Start Guide

Bienvenue dans le projet LeGuardian ! Voici comment démarrer rapidement.

## 📋 Prerequisites

- Node.js 18+ et npm
- PHP 8.3+ et Composer (pour Laravel)
- Un IDE (VSCode recommandé)

## 🚀 Démarrage en 5 minutes

### 1. Frontend

```bash
cd leguardian-frontend

# Installation des dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Ouvrir http://localhost:5173
```

### 2. Backend

```bash
cd leguardian-backend

# Installation des dépendances
composer install

# Configuration
cp .env.example .env
php artisan key:generate

# Database (optionnel pour dev local)
php artisan migrate

# Lancer le serveur
php artisan serve

# Ouvrir http://localhost:8000
```

### 3. Variables d'environnement

Frontend : `leguardian-frontend/.env.local`
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=LeGuardian
```

## 🔐 Test de connexion

### Frontend → Backend

1. Ouvrir http://localhost:5173
2. Cliquer sur "Register here"
3. Créer un compte
4. Vous devriez être redirigé vers `/dashboard`

Si une erreur : vérifier que le backend API répond sur `http://localhost:8000/api`

## 📁 Structure des fichiers importants

### Frontend
```
leguardian-frontend/
├── src/
│   ├── App.tsx           ← Routing principal
│   ├── pages/            ← Pages (Login, Register, Dashboard)
│   ├── components/       ← Composants réutilisables
│   ├── hooks/            ← Hooks personnalisés (useAuth)
│   ├── services/         ← API calls (authService, braceletService)
│   ├── stores/           ← State management Zustand
│   ├── types/            ← Types TypeScript
│   └── index.css         ← Styles TailwindCSS
├── vite.config.ts        ← Config Vite
├── tsconfig.json         ← Config TypeScript
└── package.json          ← Dépendances npm
```

### Backend
```
leguardian-backend/
├── app/
│   ├── Models/           ← Models Laravel
│   ├── Http/
│   │   └── Controllers/  ← Controllers API
│   └── ...
├── routes/
│   ├── api.php           ← Routes API
│   └── web.php           ← Routes web
├── database/
│   └── migrations/       ← Migrations
├── config/               ← Configuration
└── .env                  ← Variables d'environnement
```

## 📝 Commandes utiles

### Frontend

```bash
npm run dev      # Dev server
npm run build    # Build production
npm run lint     # ESLint check
npm run preview  # Preview build
```

### Backend

```bash
php artisan serve           # Dev server
php artisan migrate         # Run migrations
php artisan migrate:fresh   # Reset database
php artisan tinker          # Interactive shell
php artisan make:model ModelName  # Create model
```

## 🔍 Débugging

### Frontend
- Ouvrir DevTools (F12)
- Onglet Console : logs
- Onglet Network : API calls
- Onglet Application → LocalStorage : token auth

### Backend
- Voir `leguardian-backend/storage/logs/laravel.log`
- Utiliser `Log::info()` dans le code
- Utiliser `dd()` pour dumper variables

## 🐛 Erreurs communes

### "Cannot find module '@services/api'"
- Vérifier que les imports utilisent des chemins relatifs
- Actualiser le serveur dev (Ctrl+C, `npm run dev`)

### "API call failing with 401"
- Vérifier que le token est en localStorage
- Vérifier que VITE_API_URL est correct
- Vérifier que le backend API est lancé

### "CORS error"
- Backend : Vérifier `config/cors.php`
- Ajouter `http://localhost:5173` à la whitelist

### "Port already in use"
- Utiliser un autre port : `npm run dev -- --port 3000`
- Ou tuer le process : `lsof -i :5173`

## 📚 Documentation complète

- **Spec du projet** : voir `PROJET_BRACELET_CONNECTE.md`
- **Status du projet** : voir `PROJECT_STATUS.md`
- **Todo développement** : voir `TODO_DEVELOPMENT.md`
- **Setup frontend** : voir `SETUP_FRONTEND.md`
- **README frontend** : voir `leguardian-frontend/README.md`
- **README backend** : voir `leguardian-backend/README.md`

## 🎯 Premiers objectifs

1. ✅ Installer le frontend (FAIT)
2. ✅ Vérifier le build (FAIT)
3. ⏳ Tester la connexion frontend → backend
4. ⏳ Créer les pages manquantes
5. ⏳ Intégrer la carte GPS
6. ⏳ Intégrer le scanner QR

## 💡 Tips & Tricks

### Dev plus rapide
```bash
# Garder plusieurs terminaux ouvert
# Terminal 1 : npm run dev (frontend)
# Terminal 2 : php artisan serve (backend)
# Terminal 3 : pour git/commands
```

### Reload et cache
```bash
# Si changes ne s'appliquent pas :
# Frontend : Ctrl+C puis npm run dev
# Backend : pas besoin (auto-reload)
# Browser : Ctrl+Shift+Del (vider cache)
```

### Database reset rapide
```bash
# Backend
cd leguardian-backend
php artisan migrate:fresh --seed
# ✅ Database vierge et seedée
```

### Git workflow
```bash
git status                    # Voir changes
git add .                     # Stage changes
git commit -m "description"   # Commit
git push                      # Push
```

## 🆘 Besoin d'aide ?

1. Vérifier les READMEs spécifiques
2. Vérifier les logs (DevTools, laravel.log)
3. Vérifier que tous les services tournent
4. Vérifier les variables d'environnement
5. Relancer les serveurs

## ✨ Next Steps

Une fois que tu as compris la structure :

- [ ] Créer une branche git pour tes changes
- [ ] Implémenter les pages manquantes
- [ ] Tester la connexion API
- [ ] Faire des commits réguliers

---

**Bon développement ! 🚀**

Créé : Novembre 2025
