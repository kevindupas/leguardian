# LeGuardian - Frontend

Application React TypeScript pour le système de surveillance d'enfants avec bracelets connectés.

## 🚀 Setup

### Installation

```bash
npm install
```

### Variables d'environnement

Crée un fichier `.env.local` :

```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=LeGuardian
```

### Développement

```bash
npm run dev
```

L'app sera disponible sur `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## 📁 Structure du projet

```
src/
├── components/        # Composants React réutilisables
├── pages/            # Pages principales
├── hooks/            # Hooks React personnalisés
├── services/         # Services API (Axios)
├── stores/           # State management (Zustand)
├── types/            # Types TypeScript
├── utils/            # Fonctions utilitaires
├── context/          # React Context (si needed)
├── assets/           # Images et ressources statiques
├── App.tsx           # Composant principal
├── main.tsx          # Point d'entrée
└── index.css         # Styles globaux
```

## 🔑 Fonctionnalités principales

### Authentication
- Login / Register
- Token JWT via Laravel Sanctum
- Persistance du token en localStorage
- Auto-logout si token expiré

### Gestion des bracelets
- Lister les bracelets enregistrés
- Scanner QR pour enregistrer un bracelet
- Afficher la position GPS en temps réel
- Historique des événements
- Envoyer vibrations (short/medium/SOS)
- Résoudre alertes urgence

### Dashboard
- Vue d'ensemble des bracelets
- Statut batterie et connexion
- Accès rapide aux détails

## 🛠 Technologies

- **React 19** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **TailwindCSS 4** - Styling
- **React Leaflet** - Cartes
- **TanStack Query** - Data fetching (optionnel)

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/login` | Page de connexion |
| `/register` | Création de compte |
| `/dashboard` | Tableau de bord principal |
| `/register-bracelet` | Enregistrement bracelet via QR |
| `/bracelet/:id` | Détails bracelet |
| `/bracelet/:id/map` | Carte GPS |
| `/bracelet/:id/events` | Historique événements |

## 🔌 Services API

### authService
- `login(email, password)`
- `register(data)`
- `logout()`
- `getCurrentUser()`

### braceletService
- `getBracelets()`
- `getBracelet(id)`
- `registerBracelet(code)`
- `updateBracelet(id, data)`
- `getBraceletEvents(id, page, type)`
- `vibrateBracelet(id, pattern)`
- `resolveEmergency(id)`

## 🎯 State Management (Zustand)

### authStore
- `user` - Utilisateur courant
- `token` - Token JWT
- `login()` - Connexion
- `register()` - Inscription
- `logout()` - Déconnexion

### braceletStore
- `bracelets[]` - Liste des bracelets
- `selectedBracelet` - Bracelet sélectionné
- `events[]` - Historique événements
- `fetchBracelets()` - Récupérer les bracelets
- `registerBracelet()` - Enregistrer un bracelet
- `vibrateBracelet()` - Envoyer vibration

## 🔒 Protection des routes

Les routes protégées utilisent le composant `<ProtectedRoute>` qui redirige vers `/login` si l'utilisateur n'est pas authentifié.

## 🎨 Styling

- **TailwindCSS 4** pour tous les styles
- Pas de fichiers CSS séparés (utility-first)
- Variables Tailwind configurables

## 📦 Dépendances clés

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.9.5",
  "axios": "^1.13.1",
  "zustand": "^5.0.8",
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0",
  "tailwindcss": "^4.1.16"
}
```

## 🚧 À faire

- [ ] Page détails bracelet avec carte
- [ ] Scanner QR avec expo-camera
- [ ] Notifications push FCM
- [ ] Historique événements avec filtres
- [ ] Export données
- [ ] Paramètres utilisateur
- [ ] Internationalization (i18n)

## 🐛 Debugging

### Logs API
```typescript
import apiClient from '@services/api'
// apiClient log toutes les requêtes via interceptors
```

## 📝 Conventions

- Fichiers composants : `PascalCase.tsx`
- Fichiers services/hooks : `camelCase.ts`
- Imports alias : `@components`, `@services`, etc.
- Types : dans `src/types/index.ts`

---

**Version** : 1.0.0
**Dernière mise à jour** : Novembre 2025
