# LeGuardian - Todo Développement

## Phase 1 : Frontend Web - Pages manquantes

### Pages à créer
- [ ] **BraceletDetailPage** - Détails d'un bracelet
  - Afficher nom, code, statut, batterie
  - Boutons d'action (vibrer, renommer, supprimer)
  - Dernière position GPS
  - Indicateurs temps réel

- [ ] **RegisterBraceletPage** - Enregistrement via QR
  - Scanner QR
  - Confirmer l'enregistrement
  - Nommer le bracelet
  - Afficher le code du bracelet

- [ ] **EventsPage** - Historique événements
  - Liste paginée des événements
  - Filtres : type (arrivé/perdu/danger), date
  - Clic sur événement → voir sur carte
  - Statut résolu/non résolu

- [ ] **MapPage** - Carte plein écran
  - Afficher position dernière/actuelle
  - Trajet en mode urgence
  - Timeline des événements
  - Zoom/pan controls

- [ ] **SettingsPage** - Paramètres utilisateur
  - Profil utilisateur
  - Gérer les bracelets
  - Notifications (activer/désactiver)
  - Déconnexion

### Composants à créer
- [ ] BraceletCard - Carte bracelet (card réutilisable)
- [ ] EventCard - Carte événement
- [ ] MapViewer - Viewer Leaflet
- [ ] QRScanner - Scanner QR
- [ ] ConfirmDialog - Dialog de confirmation
- [ ] LoadingOverlay - Overlay loading
- [ ] EmptyState - État vide

### Services à enrichir
- [ ] Ajouter méthodes manquantes dans braceletService
- [ ] Caching avec localStorage
- [ ] Retry logic pour erreurs réseau
- [ ] Logging/debugging

### State management (Zustand)
- [ ] Store pour les événements
- [ ] Store pour les locations
- [ ] Store pour les paramètres utilisateur

## Phase 2 : Intégrations

### Maps (Leaflet)
- [ ] Setup OpenStreetMap
- [ ] Markers pour bracelets
- [ ] Popups avec infos
- [ ] Géolocalisation utilisateur
- [ ] Trajet en temps réel (mode urgence)

### Scanner QR
- [ ] Intégration qrcode.react
- [ ] Génération QR code backend
- [ ] Validation code dans frontend

### Formulaires
- [ ] Validations avancées
- [ ] Error messages
- [ ] Loading states
- [ ] Toasts/notifications

### Notifications
- [ ] Setup Firebase Web SDK
- [ ] Demander permission utilisateur
- [ ] Recevoir notifications push

## Phase 3 : Mobile App (Expo)

### Nouveau projet
```bash
npx create-expo-app leguardian-mobile
cd leguardian-mobile
npm install
```

### Dépendances Expo
- [ ] `expo-router` - Routing
- [ ] `expo-camera` - QR scanner
- [ ] `expo-location` - Géolocalisation
- [ ] `expo-notifications` - Push notifications
- [ ] `react-native-maps` - Cartes natives
- [ ] `expo-device` - Info appareil
- [ ] `nativewind` - TailwindCSS pour React Native

### Architecture
- [ ] Réutiliser types et services du frontend web
- [ ] Même auth store (Zustand)
- [ ] Même API client (Axios)
- [ ] Stack navigation (bottom tabs)
- [ ] Screens : Login, Dashboard, Map, Events, Settings

### Screens
- [ ] **AuthStack**
  - LoginScreen
  - RegisterScreen
  - ForgotPasswordScreen

- [ ] **AppStack**
  - HomeScreen (dashboard)
  - BraceletDetailScreen
  - MapScreen
  - EventsScreen
  - SettingsScreen

### Fonctionnalités mobiles
- [ ] QR scanner natif
- [ ] Notifications push avec expo-notifications
- [ ] Géolocalisation backup
- [ ] Mode sombre
- [ ] Offline support (AsyncStorage)

## Phase 4 : Backend - Endpoints manquants

### À implémenter dans Laravel
- [ ] GET `/api/mobile/bracelets/:id/location` - Dernière position
- [ ] POST `/api/mobile/bracelets/:id/events` - Créer événement (dev)
- [ ] GET `/api/mobile/user/preferences` - Paramètres utilisateur
- [ ] PUT `/api/mobile/user/preferences` - Update préférences
- [ ] POST `/api/mobile/user/notification-token` - Register token FCM

### Notifications
- [ ] Queue job pour SendEventNotification
- [ ] Setup Firebase Admin SDK
- [ ] Templating notifications
- [ ] Retry logic

### Validation & Security
- [ ] Rate limiting par endpoint
- [ ] Request validation
- [ ] CORS configuration
- [ ] Input sanitization

## Phase 5 : Testing

### Frontend Web
- [ ] Tests unitaires (Vitest)
- [ ] Tests intégration (Testing Library)
- [ ] Tests E2E (Cypress ou Playwright)
- [ ] Tests performance (Lighthouse)

### Mobile
- [ ] Tests unitaires (Jest)
- [ ] Tests intégration (Detox)
- [ ] Tests E2E (Maestro)

### Backend
- [ ] Tests unitaires (PHPUnit)
- [ ] Tests API (Feature tests)
- [ ] Tests database

## Phase 6 : Deployment

### Frontend Web
- [ ] Build optimisé
- [ ] Deploy sur Vercel/Netlify/GitHub Pages
- [ ] Setup CD avec GitHub Actions
- [ ] Custom domain

### Mobile
- [ ] iOS build & TestFlight
- [ ] Android build & Google Play internal testing
- [ ] Firebase Crashlytics
- [ ] App Center (optionnel)

### Backend
- [ ] Deploy sur DigitalOcean/Hetzner
- [ ] Database migration
- [ ] Queue workers setup
- [ ] Monitoring et logs

## Checklist - Priorités

### Urgent (Cette semaine)
- [ ] Tester connexion frontend ↔ backend
- [ ] Créer BraceletDetailPage
- [ ] Créer RegisterBraceletPage (avec fake QR)
- [ ] Setup Leaflet avec map basique

### Important (Semaine prochaine)
- [ ] EventsPage avec filtres
- [ ] MapPage complète
- [ ] Notifications toast
- [ ] Better error handling

### Moyen terme (2-3 semaines)
- [ ] Créer app Expo
- [ ] Setup FCM
- [ ] Tests unitaires

### Long terme (Après POC)
- [ ] Dashboard analytics
- [ ] Export données
- [ ] Optimisations
- [ ] Scaling

## Notes de développement

### Best Practices
- TypeScript strict mode
- Components + Pages séparation nette
- Services pour API uniquement
- Stores pour state global
- Hooks pour logic réutilisable
- Proper error handling
- Loading states évidents
- Accessible (a11y)

### Patterns à utiliser
```typescript
// Services
const data = await braceletService.getBracelets()

// Stores
const { bracelets, fetchBracelets } = useBraceletStore()

// Hooks
const { user, logout } = useAuth()

// Components
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Éviter
- ❌ Magic strings
- ❌ Nested callbacks
- ❌ Global window variables
- ❌ Console logs en prod
- ❌ Hardcoded URLs
- ❌ Props drilling > 3 niveaux

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Axios Docs](https://axios-http.com)
- [TailwindCSS](https://tailwindcss.com)
- [Leaflet Docs](https://leafletjs.com)
- [Expo Docs](https://docs.expo.dev)

## Questions récurrentes

**Q: Où mettre la logique ?**
A: Services = API calls, Hooks = logic réutilisable, Stores = state global, Components = UI uniquement

**Q: Comment faire du caching ?**
A: localStorage pour simple, Redis (backend) pour complexe, Zustand pour frontend state

**Q: Comment gérer les erreurs ?**
A: Try/catch + store.setError() + Toast UI + Console.error()

**Q: Comment tester ?**
A: Vitest pour unitaires, Testing Library pour composants, Cypress pour E2E

---

**Créé**: Novembre 2025
**Statut**: Todo list de développement
**Version**: 1.0
