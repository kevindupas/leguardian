# Projet Bracelet Connecté Enfant - Documentation Complète

## 📋 Vue d'ensemble

### Concept
Bracelet de sécurité pour enfants avec 3 boutons permettant d'envoyer des alertes aux parents via une application mobile. Le bracelet dispose de géolocalisation GPS et envoie des notifications push en temps réel.

### Objectif POC
Créer un Proof of Concept fonctionnel en 1 mois pour valider le concept technique et l'intérêt utilisateur.

### Acteurs
- **Enfant** : Porte le bracelet, appuie sur les boutons
- **Parent** : Reçoit les notifications sur son smartphone, peut interagir avec le bracelet
- **Administrateur** : Gère la plateforme via dashboard

---

## 🎯 Fonctionnalités principales

### Actions disponibles sur le bracelet

#### Bouton 1 : "Je suis bien arrivé" 🟢
- **Action** : Confirmation de l'arrivée à destination
- **Feedback bracelet** : LED verte + vibration courte (200ms)
- **Notification parent** : "Mathéo est bien arrivé"
- **Géolocalisation** : Position envoyée si disponible (optionnelle)
- **Priorité** : Normale

#### Bouton 2 : "Je suis perdu" 🟠
- **Action** : Demande d'aide - l'enfant ne sait pas où il est
- **Feedback bracelet** : LED orange clignote + vibration moyenne (500ms)
- **Notification parent** : "ALERTE : Mathéo est perdu !"
- **Géolocalisation** : Position GPS requise (attend jusqu'à 30 sec si nécessaire)
- **Priorité** : Haute
- **Comportement** : LED reste allumée jusqu'à résolution

#### Bouton 3 : "Je me sens en danger" 🔴
- **Action** : Alerte urgence - l'enfant se sent menacé
- **Feedback bracelet** : LED rouge clignote rapidement + vibration longue (1000ms)
- **Notification parent** : "🔴 URGENCE : Mathéo se sent en danger !"
- **Géolocalisation** : Position GPS immédiate + tracking continu (position toutes les 10 sec)
- **Priorité** : Critique
- **Comportement** : Mode urgence actif jusqu'à désactivation par le parent

### Action parent vers bracelet

#### Envoi de vibration
- **Déclencheur** : Bouton dans l'app parent
- **Patterns disponibles** :
  - Courte : 200ms (confirmation)
  - Moyenne : 500ms (attention)
  - SOS : 3x 500ms avec pauses (urgence)
- **Utilité** : Faire comprendre à l'enfant que le parent a vu l'alerte

---

## 🏗️ Architecture technique

### Vue d'ensemble

```
┌─────────────────┐
│   BRACELET      │  ESP32-S3 + GPS + Écran + Batterie
│   (WiFi POC)    │  → HTTP POST vers API
│   (eSIM final)  │
└────────┬────────┘
         │
    INTERNET
         │
┌────────┴────────┐
│  SERVEUR        │  Laravel 11 + PostgreSQL
│  API REST       │  Queue Jobs (Redis)
│  + Dashboard    │  Firebase Admin SDK
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
┌───┴──┐   ┌──┴────┐
│ WEB  │   │ MOBILE│
│Admin │   │  App  │
│Fila- │   │ Expo  │
│ment4 │   │React  │
│      │   │Native │
└──────┘   └───────┘
```

### Communication

**Bracelet → Serveur**
- Protocole : HTTPS REST
- Format : JSON
- Authentification : API Token unique par bracelet
- Fréquence : 
  - Event-driven (bouton pressé)
  - Heartbeat toutes les 5 minutes
  - Polling commandes toutes les 30 secondes

**Serveur → App Mobile**
- Push notifications : Firebase Cloud Messaging (FCM)
- API REST : Sanctum authentication
- WebSocket (optionnel futur) : Laravel Reverb pour temps réel

---

## 💻 Stack technique

### Backend

**Framework principal**
- Laravel 11 (PHP 8.3)
- PostgreSQL (ou MySQL)
- Redis pour queues et cache

**Packages clés**
- Filament 4 : Dashboard administrateur
- Laravel Sanctum : Authentication API mobile
- Laravel Notifications : Système de notifications
- Firebase Admin SDK : Push notifications FCM
- Spatie Laravel Permission (optionnel) : Gestion des rôles

**Inertia.js (optionnel POC)**
- Interface web pour les parents
- React + TypeScript
- TailwindCSS

### Application Mobile

**Framework**
- Expo (React Native)
- Compatible iOS et Android

**Packages Expo essentiels**
- expo-camera : Scanner QR code
- expo-notifications : Recevoir push notifications
- expo-location : Géolocalisation (backup)
- react-native-maps : Afficher carte avec position
- @react-navigation : Navigation

**Stack app**
- React Native
- TypeScript
- TailwindCSS (NativeWind)
- Zustand ou Context API pour state management
- Axios pour API calls

### Hardware (POC)

**Composant principal**
- Board : ESP32-S3R8 avec écran tactile rond 1,28 pouces
- Prix : ~30€
- Inclus : batterie LiPo, chargeur USB-C, gyroscope, accéléromètre, haut-parleur

**Module GPS**
- Module : NEO-6M avec antenne céramique externe
- Prix : ~2,50€
- Interface : UART (4 fils : VCC, GND, TX, RX)
- Temps d'acquisition : 30-120 sec (cold start), 5-15 sec (warm start)

**Connectivité POC**
- WiFi uniquement pour le POC
- eSIM + module 4G pour le produit final

**Alimentation**
- Batterie LiPo 3.7V 2000mAh minimum
- Autonomie estimée POC : 8-10h (GPS + WiFi actifs)
- Charge : USB Type-C

**Autres composants**
- 3 boutons physiques (ou zones tactiles écran)
- LEDs RGB pour feedback visuel
- Moteur vibrant 3V
- Câbles Dupont pour prototypage

### Programmation Hardware

**Environnement**
- Arduino IDE
- Langage : C/C++ (Arduino)
- Librairies principales :
  - TinyGPS++ : Parser données GPS
  - HTTPClient : Requêtes API
  - WiFi : Connexion réseau
  - ArduinoJson : Parse/serialize JSON

---

## 🗄️ Modèles de données

### Users (Parents)
- id
- name
- email
- email_verified_at
- password
- phone (optionnel)
- fcm_token (pour notifications push)
- created_at, updated_at

### Bracelets
- id
- unique_code (VARCHAR 50, unique, indexé)
- user_id (nullable - null tant que non enregistré)
- name (ex: "Bracelet de Mathéo")
- status (enum: active, inactive, lost, emergency)
- battery_level (integer 0-100)
- last_ping_at (timestamp)
- firmware_version (VARCHAR)
- created_at, updated_at

**Relations** : belongsTo User

### BraceletEvents
- id
- bracelet_id
- event_type (enum: arrived, lost, danger)
- latitude (decimal 10,8, nullable)
- longitude (decimal 11,8, nullable)
- accuracy (integer, nullable - précision GPS en mètres)
- battery_level (integer)
- resolved (boolean, default false)
- resolved_at (timestamp, nullable)
- created_at

**Index** : bracelet_id, event_type, created_at

**Relations** : belongsTo Bracelet

### BraceletCommands
- id
- bracelet_id
- command_type (enum: vibrate_short, vibrate_medium, vibrate_sos)
- status (enum: pending, executed, failed)
- executed_at (timestamp, nullable)
- created_at, updated_at

**Relations** : belongsTo Bracelet

### DeviceTokens (optionnel - pour stats/debug)
- id
- bracelet_id
- api_token (hash)
- last_used_at
- created_at

---

## 🔌 API Endpoints

### Authentification

**Mobile App**
```
POST /api/mobile/auth/register
Body: { name, email, password, password_confirmation }
Response: { user, token }

POST /api/mobile/auth/login
Body: { email, password }
Response: { user, token }

POST /api/mobile/auth/logout
Headers: Authorization: Bearer {token}
Response: { message }
```

**Device (Bracelet)**
```
POST /api/devices/auth
Body: { device_code }
Response: { api_token, commands_endpoint }
```

### Endpoints Bracelet (Device)

```
POST /api/devices/button/arrived
Headers: X-Device-Token: {api_token}
Body: { 
  battery_level: 85,
  latitude: 48.8566 (optionnel),
  longitude: 2.3522 (optionnel)
}
Response: { success: true }

POST /api/devices/button/lost
Headers: X-Device-Token: {api_token}
Body: { 
  battery_level: 82,
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 10
}
Response: { success: true, tracking_enabled: true }

POST /api/devices/button/danger
Headers: X-Device-Token: {api_token}
Body: { 
  battery_level: 80,
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 8
}
Response: { success: true, emergency_mode: true }

POST /api/devices/danger/update
Headers: X-Device-Token: {api_token}
Body: { latitude, longitude, accuracy }
Response: { success: true, continue_tracking: true }
Note: Appelé toutes les 10 sec en mode danger

GET /api/devices/commands
Headers: X-Device-Token: {api_token}
Response: { 
  command: "vibrate_medium",
  command_id: 123
}
Note: Polling toutes les 30 sec

POST /api/devices/commands/{id}/ack
Headers: X-Device-Token: {api_token}
Response: { success: true }

POST /api/devices/heartbeat
Headers: X-Device-Token: {api_token}
Body: { battery_level, latitude, longitude }
Response: { success: true, next_ping: 300 }
Note: Appelé toutes les 5 minutes
```

### Endpoints Mobile App

```
GET /api/mobile/bracelets
Headers: Authorization: Bearer {token}
Response: { 
  bracelets: [
    {
      id, unique_code, name, status, 
      battery_level, last_ping_at
    }
  ]
}

POST /api/mobile/bracelets/register
Headers: Authorization: Bearer {token}
Body: { bracelet_code: "XYZ789" }
Response: { bracelet: {...}, message }
Note: Lie le bracelet au compte parent

GET /api/mobile/bracelets/{id}
Response: { 
  bracelet: {...},
  last_location: { lat, lng, timestamp },
  active_emergency: boolean
}

GET /api/mobile/bracelets/{id}/events
Query: ?page=1&per_page=20&type=danger
Response: { 
  events: [...],
  pagination: {...}
}

POST /api/mobile/bracelets/{id}/vibrate
Body: { pattern: "short" | "medium" | "sos" }
Response: { success: true, command_id }

POST /api/mobile/bracelets/{id}/resolve-emergency
Response: { success: true }
Note: Désactive le mode urgence

PUT /api/mobile/bracelets/{id}
Body: { name: "Nouveau nom" }
Response: { bracelet: {...} }
```

### Webhooks (optionnel)

```
POST /api/webhooks/fcm-status
Body: { message_id, status, error }
Note: Callback Firebase pour tracking delivery
```

---

## 📱 Fonctionnalités App Mobile

### Écrans principaux

**1. Authentification**
- Login
- Register
- Mot de passe oublié

**2. Scanner QR Code**
- Ouvrir caméra
- Scanner le QR code unique du bracelet
- Confirmer l'enregistrement
- Donner un nom au bracelet

**3. Dashboard (Home)**
- Liste des bracelets enregistrés
- Statut de chaque bracelet (batterie, dernière connexion)
- Carte avec dernière position connue
- Bouton "Faire vibrer"
- Bouton accès historique

**4. Carte plein écran**
- Position actuelle de l'enfant
- Trajet si mode urgence actif
- Temps réel (mise à jour auto toutes les 10 sec en mode danger)
- Bouton "J'arrive" / "Tout va bien"

**5. Historique des événements**
- Liste chronologique
- Filtres par type (arrivé/perdu/danger)
- Filtres par date
- Clic sur événement → voir position sur carte

**6. Paramètres**
- Gérer les bracelets
- Notifications (activer/désactiver par type)
- Compte utilisateur
- Déconnexion

### Notifications Push

**Format notification**
```
Titre : "🟢 Mathéo est bien arrivé"
Message : "Il y a 2 minutes"
Data : {
  type: "arrived",
  bracelet_id: 123,
  event_id: 456,
  latitude: 48.8566,
  longitude: 2.3522
}
Actions : ["Voir sur la carte", "OK"]
```

**Comportement**
- Foreground : Toast + son + badge
- Background : Notification système
- Killed app : Notification système
- Clic notification : Ouvre app sur l'événement

---

## 🎨 Dashboard Admin (Filament)

### Resources Filament

**UserResource**
- Liste tous les parents
- CRUD complet
- Relations vers bracelets
- Statistiques par user

**BraceletResource**
- Liste tous les bracelets
- Statut (actif/inactif/urgence)
- User assigné (ou non assigné)
- Batterie, dernière connexion
- Actions : désactiver, réinitialiser

**BraceletEventResource**
- Liste tous les événements
- Filtres : type, date, bracelet, résolu/non résolu
- Colonnes : bracelet, type, position, date
- Carte interactive (optionnel)
- Export CSV

**BraceletCommandResource** (optionnel)
- Liste commandes envoyées
- Statut (pending/executed/failed)
- Debugging

### Widgets Dashboard

**Stats Cards**
- Nombre total de bracelets actifs
- Nombre d'alertes aujourd'hui
- Alertes non résolues
- Temps moyen de résolution

**Graphiques**
- Events par jour (7 derniers jours)
- Distribution types d'alertes
- Bracelets par statut (pie chart)

**Tableau temps réel**
- Derniers événements (live updates)
- Bracelets en urgence

### Pages custom

**Map View**
- Carte avec tous les bracelets actifs
- Filtres par statut
- Clic sur pin : détails bracelet

**Monitoring**
- Santé système (queue jobs, database, Redis)
- Logs API errors
- Performance metrics

---

## 🔐 Sécurité

### Authentification

**Mobile App**
- Laravel Sanctum tokens
- Expiration : 30 jours
- Refresh automatique
- Revoke possible

**Bracelets**
- API Token unique généré à la fabrication
- Hash stocké en base
- Rate limiting : 60 requêtes/minute
- IP whitelisting (optionnel prod)

### Données sensibles

**Géolocalisation**
- Encryptée en base (optionnel)
- Retention : 90 jours puis suppression auto
- Accès limité au propriétaire + admin

**Notifications**
- Pas de données sensibles dans le payload
- Data chargée depuis API après clic

### Rate Limiting

**API Mobile** : 60 requêtes/minute
**API Device** : 120 requêtes/minute (car heartbeat fréquent)
**Webhook** : 1000 requêtes/minute

### Validation

**Toutes les entrées validées**
- GPS coordinates : format décimal valide
- Battery level : 0-100
- Event types : enum strict
- Tokens : format UUID ou hash

---

## 📊 Système de notifications

### Types de notifications

**1. Event Notifications**
- Trigger : Bouton bracelet pressé
- Délai : Immédiat (< 2 secondes)
- Destinataire : Parent du bracelet
- Retry : 3 tentatives si échec

**2. Battery Alerts**
- Trigger : Batterie < 20%
- Délai : Max 1 par heure
- Destinataire : Parent

**3. Offline Alerts**
- Trigger : Pas de heartbeat depuis 30 min
- Délai : Max 1 par jour
- Destinataire : Parent

**4. Emergency Resolved**
- Trigger : Parent désactive mode urgence
- Délai : Immédiat
- Destinataire : Tous les admins (optionnel)

### Queue System

**Jobs**
```
SendEventNotification
- Priority: high
- Retry: 3
- Timeout: 10s

SendBatteryAlert
- Priority: normal
- Retry: 2
- Timeout: 10s

CleanOldLocations
- Priority: low
- Schedule: daily
- Timeout: 300s
```

**Workers**
- 2 workers pour queue notifications
- 1 worker pour queue générale
- Supervisor pour monitoring

---

## 🧪 Tests à prévoir

### Tests Backend

**Unit Tests**
- Models : relations, scopes, mutators
- Services : notification logic, GPS calculations
- Jobs : retry logic, error handling

**Feature Tests**
- API endpoints (tous)
- Authentication flows
- Rate limiting
- Validation rules

**Integration Tests**
- FCM delivery
- Queue processing
- Database transactions

### Tests Mobile

**Unit Tests**
- State management
- API client
- Helpers/utils

**Integration Tests**
- Navigation flows
- Notification handling
- QR scanner

**E2E Tests** (optionnel)
- Full user journey
- Detox ou Maestro

### Tests Hardware

**Fonctionnels**
- Chaque bouton envoie correct event
- GPS acquisition time
- WiFi reconnection
- Battery drain

**Stress Tests**
- 1000 événements en 1h
- Perte WiFi répétée
- Batterie faible

---

## 📅 Planning POC (1 mois)

### Semaine 1 : Backend Foundation
**Jours 1-2**
- Setup Laravel 11 fresh
- Migrations : users, bracelets, events, commands
- Seeders avec fake data (10 users, 20 bracelets, 100 events)

**Jours 3-4**
- Installation Filament 4
- Resources : User, Bracelet, Event
- Dashboard widgets basiques

**Jour 5**
- API Device endpoints (/button/*)
- Authentication via API tokens
- Tests Postman

### Semaine 2 : API Mobile + Notifications
**Jours 6-7**
- API Mobile endpoints (auth, bracelets, events)
- Sanctum authentication
- Tests Postman

**Jours 8-9**
- Setup Firebase project
- Laravel Notifications pour FCM
- Queue jobs pour notifications
- Tests avec FCM test tool

**Jour 10**
- QR code generation system
- Command system (vibration)
- Polling endpoint

### Semaine 3 : App Mobile
**Commande hardware cette semaine → livraison semaine 4**

**Jours 11-12**
- Setup Expo project
- Navigation structure
- Login/Register screens
- API client (Axios)

**Jours 13-14**
- QR Scanner screen
- Dashboard avec liste bracelets
- Integration API

**Jours 15-16**
- React Native Maps integration
- Carte avec position
- Historique événements

**Jour 17**
- Notifications push setup
- Foreground/background handling
- Deep linking

### Semaine 4 : Hardware + Intégration
**Réception matériel début de semaine**

**Jours 18-19**
- Setup Arduino IDE
- Premier programme : blink LED
- Connexion WiFi
- Tests HTTP POST vers API

**Jours 20-21**
- Intégration module GPS
- Parsing données GPS
- Tests acquisition position

**Jours 22-23**
- 3 boutons fonctionnels
- LEDs feedback
- Vibration sur commande
- Polling des commandes

**Jours 24-25**
- Tests intégration complète
- Bouton → API → Notification → App
- App → Vibration → Bracelet
- Debugging

**Jours 26-28**
- Polish UX app
- Amélioration dashboard Filament
- Documentation
- Préparation démo

---

## 🚀 Déploiement POC

### Backend
**Hébergement** : 
- Option 1 : DigitalOcean droplet (25€/mois)
- Option 2 : Hetzner VPS (10€/mois)
- Option 3 : Laravel Forge + serveur

**Services**
- Laravel application
- PostgreSQL database
- Redis (cache + queues)
- Nginx web server
- Supervisor (queue workers)

**CI/CD** : 
- GitHub Actions (optionnel POC)
- Deploy manuel via SSH acceptable

### Mobile App
**Distribution POC** :
- iOS : TestFlight (Apple Developer 99€/an)
- Android : Internal testing Google Play (gratuit)
- Ou APK directe pour Android (gratuit)

**Variables d'environnement**
- API_URL
- FCM_SENDER_ID
- autres configs

### Monitoring
- Laravel Telescope (dev/staging)
- Logs : Laravel Log viewer
- Uptime monitoring : UptimeRobot (gratuit)
- Error tracking : Sentry (optionnel)

---

## 💰 Coûts POC

### Développement
**Hardware** : ~75€
- 2x Board ESP32-S3 : 60€
- 3x Module GPS : 7€
- Câbles/accessoires : 8€

**Services mensuels** : ~35€/mois
- Serveur : 10-25€
- Base de données : inclus
- Firebase FCM : gratuit (< 10k/jour)
- Redis : inclus ou gratuit tier

**One-time** : ~100€
- Apple Developer (si iOS) : 99€/an
- Domaine : 10€/an

**Total POC** : ~200€ initial + 35€/mois

### Projection produit final (hors scope POC)
**Par bracelet** : ~80-100€ composants
- ESP32 : 5€
- GPS : 8€
- Module 4G/eSIM : 20-30€
- Batterie : 10€
- PCB custom : 10€
- Boîtier : 15€
- Assemblage : 15€

**Coûts récurrents par bracelet/mois** : ~3-5€
- eSIM data : 2-3€
- Serveur/API : 0.5€
- FCM : gratuit
- Support : variable

---

## ⚠️ Limitations POC

### Techniques
- WiFi uniquement (pas de 4G/eSIM)
- GPS fonctionne mal en intérieur
- Autonomie batterie limitée (8-10h)
- Format breadboard (pas de boîtier)
- Pas de waterproof

### Fonctionnelles
- Pas de multi-langue
- Pas de système de paiement
- Pas de SAV/support
- Pas de chiffrement avancé
- Pas de backup/restore

### Scalabilité
- Non testé à grande échelle
- Pas d'auto-scaling
- Pas de CDN
- Pas de multi-région

---

## 🔮 Évolutions post-POC

### Phase 2 : Produit MVP (2-3 mois)
- Module 4G/eSIM integration
- PCB custom design
- Boîtier 3D imprimé
- Optimisation batterie (48h autonomie)
- App iOS production
- Mode hors ligne (store & forward)

### Phase 3 : Production (3-6 mois)
- Fabrication PCB en Chine
- Boîtier moulé professionnel
- Waterproof IP67
- Multi-langue (EN/FR/ES/DE)
- System de paiement (Stripe)
- Dashboard analytics avancé

### Fonctionnalités futures
- Détection de chute (accéléromètre)
- Zones géographiques sécurisées (geofencing)
- Appel vocal (speaker/micro)
- Mode école (silencieux certaines heures)
- Partage position avec contacts approuvés
- Historique trajets
- Reconnaissance vocale SOS

---

## 🤝 Rôles et responsabilités

### Développeur (toi)
- Backend Laravel complet
- API REST
- Dashboard Filament
- App mobile Expo
- (Pas le hardware final)

### Client
- Cahier des charges
- Spécifications fonctionnelles
- Tests utilisateurs
- Business model
- Hardware produit final (après POC)

### Hors scope POC
- Design UI/UX professionnel
- Miniaturisation hardware
- Certification CE/FCC
- Production masse
- Marketing/commercial

---

## 📚 Documentation à maintenir

### Technique
- README.md : Installation, configuration
- API.md : Documentation endpoints complète
- DEPLOYMENT.md : Process de déploiement
- TESTING.md : Guide des tests

### Utilisateur
- Guide parent : Comment utiliser l'app
- Guide enfant : Comment utiliser le bracelet
- FAQ
- Troubleshooting

### Business
- Product specs
- User stories
- Roadmap
- KPIs to track

---

## 🎯 Critères de succès POC

### Techniques
✅ Bracelet envoie événement → API → Notification < 3 secondes
✅ GPS fonctionne en extérieur (fix en < 60 sec)
✅ App iOS et Android fonctionnelles
✅ Dashboard admin opérationnel
✅ QR code registration working
✅ Vibration bidirectionnelle working

### Fonctionnels
✅ Parent peut scanner et enregistrer bracelet
✅ 3 types d'alertes fonctionnelles
✅ Historique visible dans app
✅ Carte affiche position
✅ Batterie tient minimum 8h

### Business
✅ Démo convaincante pour investisseurs
✅ Parents testeurs intéressés
✅ Architecture scalable validée
✅ Coûts estimés réalistes

---

## 🐛 Risques identifiés

### Techniques
**GPS indoor** : Ne fonctionne pas en intérieur
- Mitigation : Dernière position connue + message clair utilisateur

**Battery life** : 8-10h insuffisant
- Mitigation : Recharge quotidienne assumée pour POC

**WiFi coverage** : Limité à portée WiFi
- Mitigation : Clear communication c'est un POC WiFi

**Latency** : Délai GPS + network
- Mitigation : Feedback visuel immédiat (LED) avant envoi

### Business
**Prix cible 20€** : Impossible
- Reality check avec client nécessaire

**Concurrence** : Marché existant
- Différenciation à définir

### Legal
**RGPD** : Données enfants sensibles
- Consentement parental obligatoire
- Privacy policy nécessaire

**Responsabilité** : Si défaillance système
- Disclaimer légal nécessaire
- Assurance à prévoir

---

## 📞 Contacts et ressources

### Documentation technique
- Laravel : https://laravel.com/docs
- Filament : https://filamentphp.com/docs
- Expo : https://docs.expo.dev
- ESP32 : https://docs.espressif.com
- Firebase : https://firebase.google.com/docs

### Communautés
- Laravel Discord
- Filament Discord  
- Expo Forums
- Arduino Forums
- Reddit : r/esp32, r/reactnative

### Support hardware
- ESP32-S3 : Waveshare wiki
- GPS NEO-6M : u-blox datasheet
- AliExpress vendeur : pour questions hardware

---

## ✅ Checklist avant démarrage

### Backend
- [ ] Laravel 11 installé
- [ ] PostgreSQL ou MySQL configuré
- [ ] Redis installé
- [ ] Filament 4 installé
- [ ] Firebase project créé
- [ ] Repository Git initialisé

### Mobile
- [ ] Expo CLI installé
- [ ] Compte Expo créé
- [ ] iOS simulator / Android emulator configuré
- [ ] Firebase config ajouté

### Hardware
- [ ] Board ESP32-S3 commandé
- [ ] Module GPS commandé
- [ ] Arduino IDE installé
- [ ] Drivers USB-Serial installés

### Outils
- [ ] Postman ou Insomnia pour API testing
- [ ] IDE configuré (VSCode, PHPStorm)
- [ ] Git configuré
- [ ] Serveur staging dispo (optionnel)

---

## 📝 Notes importantes

### Décisions architecturales

**Pourquoi Laravel + Expo ?**
- Expertise développeur en Laravel/React
- Stack moderne et maintenue
- Large communauté
- Déploiement facile

**Pourquoi Filament 4 ?**
- Dashboard admin rapide
- Livewire mature
- Gratuit et open source
- Bonne DX

**Pourquoi ESP32-S3 ?**
- WiFi + Bluetooth intégré
- Puissant (dual-core 240MHz)
- Écran tactile round disponible
- Large communauté Arduino
- Prix abordable

**Pourquoi WiFi POC puis eSIM ?**
- eSIM complexe et cher
- Validation concept possible en WiFi
- Migration 4G faisable après

### Hypothèses validées
- Parents intéressés par sécurité enfants
- Marché montres GPS enfant existe (100-200€)
- Technologie mature et disponible
- ROI possible avec bon business model

### Hypothèses à valider
- Prix cible réaliste (pas 20€)
- Parents acceptent recharge quotidienne
- Enfants utilisent correctement 3 boutons
- Notifications suffisantes (vs appel vocal)

---

**Date création** : Novembre 2025
**Version** : 1.0 - POC Specifications
**Statut** : Draft - À valider avec client
