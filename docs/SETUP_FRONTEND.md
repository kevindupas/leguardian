# LeGuardian - Setup Frontend

## ✅ Étape 1 : Installation complète

Le frontend React TypeScript a été installé et configuré avec succès !

```bash
cd leguardian-frontend
npm install
```

### Dépendances installées :
- ✅ React 19.2.0 + ReactDOM
- ✅ React Router 7.9.5 (routing)
- ✅ Zustand 5.0.8 (state management)
- ✅ Axios 1.13.1 (HTTP client)
- ✅ TailwindCSS 4.1.16 (styling)
- ✅ React Leaflet 5.0.0 (maps)
- ✅ TanStack Query 5.90.6 (optionnel)
- ✅ TypeScript 5.9.3 (type safety)

## 🚀 Commandes disponibles

```bash
# Développement
npm run dev          # Lance le serveur Vite sur http://localhost:5173

# Build
npm run build        # Build production
npm run preview      # Preview la build production

# Qualité
npm run lint         # Check ESLint
```

## 📁 Structure du projet

```
leguardian-frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── index.ts
│   ├── pages/              # Pages de l'app
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── index.ts
│   ├── hooks/              # Hooks React
│   │   ├── useAuth.ts
│   │   └── index.ts
│   ├── services/           # API services
│   │   ├── api.ts         # Axios config
│   │   ├── authService.ts
│   │   └── braceletService.ts
│   ├── stores/            # Zustand stores
│   │   ├── authStore.ts
│   │   └── braceletStore.ts
│   ├── types/             # Types TypeScript
│   │   └── index.ts
│   ├── utils/             # Fonctions utilitaires
│   │   ├── helpers.ts
│   │   └── index.ts
│   ├── App.tsx            # Routing principal
│   ├── main.tsx           # Point d'entrée
│   ├── index.css          # Styles globaux TailwindCSS
│   └── assets/            # Images/ressources
├── public/
├── .env.local             # Variables d'environnement locale
├── .env.example           # Template variables
├── vite.config.ts         # Config Vite + alias paths
├── tsconfig.json          # Config TypeScript
├── package.json
└── README.md
```

## 🔑 Fonctionnalités de base

### ✅ Pages existantes

1. **LoginPage** (`/login`)
   - Formulaire de connexion
   - Intégration avec authService
   - Redirect vers dashboard après succès

2. **RegisterPage** (`/register`)
   - Création de compte
   - Validation passwords
   - Intégration API

3. **DashboardPage** (`/dashboard`)
   - Liste des bracelets
   - Statut batterie/connexion
   - Accès rapide aux détails
   - Bouton enregistrement bracelet

### ✅ Architecture

- **Client API** : Axios avec interceptors pour auth
- **State Management** : Zustand avec persistance localStorage
- **Routing** : React Router avec ProtectedRoute
- **Styling** : TailwindCSS 4 (utility-first)

## 🔌 Variables d'environnement

Fichier `.env.local` :
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=LeGuardian
```

⚠️ Change `VITE_API_URL` selon ton serveur Laravel !

## 🎯 Prochaines étapes

### Phase 1 : Pages manquantes
- [ ] Page détails bracelet (`/bracelet/:id`)
- [ ] Page scanner QR (`/register-bracelet`)
- [ ] Page historique événements
- [ ] Page paramètres utilisateur

### Phase 2 : Intégration complète
- [ ] Scanner QR (expo-camera compatible)
- [ ] Carte GPS avec Leaflet
- [ ] Notifications push FCM
- [ ] Historique avec filtres

### Phase 3 : Polish
- [ ] Form validations avancées
- [ ] Error handling amélioré
- [ ] Loading states
- [ ] Toasts/modals

### Phase 4 : Mobile (Expo)
- [ ] Créer l'app Expo (React Native)
- [ ] Partager types et services
- [ ] Notifications push
- [ ] QR scanner natif

## 🧪 Tests

Build TypeScript :
```bash
npm run build
```

Linting :
```bash
npm run lint
```

Dev server :
```bash
npm run dev
```

## 🔗 Lien vers Backend

Le backend Laravel est dans `../leguardian-backend/`

Endpoints API à implémenter dans les services :
- ✅ `/api/mobile/auth/login`
- ✅ `/api/mobile/auth/register`
- ✅ `/api/mobile/auth/logout`
- ✅ `/api/mobile/bracelets` (GET)
- ✅ `/api/mobile/bracelets/:id` (GET)
- ✅ `/api/mobile/bracelets/register` (POST)
- ✅ `/api/mobile/bracelets/:id/events` (GET)
- ✅ `/api/mobile/bracelets/:id/vibrate` (POST)
- ✅ `/api/mobile/bracelets/:id/resolve-emergency` (POST)

## 📱 Import Alias

Utilise les alias pour les imports :

```typescript
// ❌ Évite
import { useAuth } from '../../../../hooks'

// ✅ Préfère
import { useAuth } from '../hooks'
```

Les aliases dans vite.config.ts :
- `@` → `src/`
- `@components` → `src/components/`
- `@pages` → `src/pages/`
- etc.

## 🎨 Styling avec TailwindCSS 4

```tsx
<div className="flex items-center justify-center min-h-screen">
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
    Click me
  </button>
</div>
```

Pas de fichiers CSS séparés - tout via utility classes Tailwind !

## 🐛 Debugging

### Console logs
```typescript
import apiClient from '@services/api'
// Les requêtes sont loggées via interceptors
```

### React DevTools
```bash
# Chrome/Firefox extensions
React DevTools
Zustand DevTools (optionnel)
```

## 📞 Support

Besoin d'aide ?
- Documentation : voir `/leguardian-frontend/README.md`
- Backend : voir `/leguardian-backend/README.md`
- Spec complète : voir `/PROJET_BRACELET_CONNECTE.md`

---

**Statut** : ✅ Setup complet - Prêt à développer !
**Date** : Novembre 2025
**Next Step** : Créer les pages manquantes ou intégrer le backend
