# 🎯 LeGuardian Simulator - Guide Complet

## Table des matières
1. [Introduction](#introduction)
2. [Installation & Lancement](#installation--lancement)
3. [Interface Utilisateur](#interface-utilisateur)
4. [Fonctionnalités](#fonctionnalités)
5. [Guide d'Utilisation](#guide-dutilisation)
6. [Dépannage](#dépannage)
7. [Spécifications Techniques](#spécifications-techniques)

---

## Introduction

Le **LeGuardian Simulator** est une application de test complète pour simuler le bracelet connecté LeGuardian sur macOS. Il se connecte directement à votre backend Laravel en temps réel et permet de tester toutes les fonctionnalités du système.

### ✨ Objectif Principal
Reproduire le comportement d'un vrai bracelet ESP32 pour tester :
- ✅ L'authentification et la génération de codes QR
- ✅ Le suivi géolocalisation en temps réel
- ✅ Les événements (arrivée sécurisée, perdu, urgence)
- ✅ Les réponses des parents via l'application mobile
- ✅ Les commandes de vibration et LED
- ✅ La gestion de la batterie

---

## Installation & Lancement

### Prérequis
- **macOS** 10.12 ou plus récent
- **Backend Laravel** en cours d'exécution (par défaut: `http://localhost:8000`)
- **Base de données** avec les migrations appliquées

### Étapes d'Installation

#### 1. Installer le DMG
```bash
1. Double-cliquez sur "LeGuardian Simulator-1.0.0-arm64.dmg"
2. Glissez l'application dans le dossier "Applications"
3. Éjectez le DMG
```

#### 2. Lancer l'Application
```bash
1. Ouvrez le dossier "Applications"
2. Double-cliquez sur "LeGuardian Simulator"
3. La fenêtre s'ouvre automatiquement
```

#### 3. Configurer l'URL du Backend
- **Par défaut**: `http://localhost:8000`
- Pour changer : Modifiez le champ "API URL" dans le panneau latéral
- ⚠️ **Important** : Configurez AVANT de créer un bracelet

---

## Interface Utilisateur

### Disposition

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 LeGuardian Simulator                    🌐 Français         │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│  📱 QR CODE          │                                          │
│  ┌─────────────┐     │   📋 LIVE ACTIVITY LOG                 │
│  │   [QR_IMG]  │     │  ┌────────────────────────────────────┐│
│  │             │     │  │ ✓ Bracelet created: TEST_XYZ123   ││
│  └─────────────┘     │  │ 💓 Heartbeat sent                  ││
│                      │  │ 📍 Location: 48.8566°N, 2.3522°E   ││
│  Code: TEST_XYZ123   │  │ 🟢 BUTTON_ARRIVED_PRESSED          ││
│                      │  │ 📳 VIBRATE_SHORT: ⚡ 100ms          ││
│  ⚙️ SETUP            │  │ 🔵 LED_BLINK: blue, fast           ││
│  [URL Input]         │  │                                     ││
│  [Name Input]        │  └────────────────────────────────────┘│
│  [Create Button]     │  [Clear Logs] [Download Logs]         │
│                      │                                          │
│  🎮 CONTROLS         │                                          │
│  [▶️ Start/Stop]      │                                          │
│                      │                                          │
│  📢 EVENTS           │                                          │
│  [🟢 Arrived]        │                                          │
│  [🟠 Lost]           │                                          │
│  [🔴 Emergency]      │                                          │
│                      │                                          │
│  🔋 Battery: 85%     │                                          │
│  Status: Running     │                                          │
│                      │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Sections

#### 📱 Panneau Latéral Gauche
- **QR Code**: Affiche un code QR scannable (pour l'appairage avec l'app mobile)
- **Code du Bracelet**: Identifiant unique (généré automatiquement)
- **Configuration**: URL de l'API et nom du bracelet
- **Boutons de Contrôle**: Démarrage/arrêt de la simulation
- **Boutons d'Événements**: Trois actions pour simuler les événements
- **Indicateurs**: Batterie et statut en temps réel

#### 📋 Panneau Principal Droit
- **Journal d'Activité en Direct**: Tous les événements et requêtes API en couleur
- **Notifications**: Toast notifications pour les réponses parent
- **Boutons d'Action**: Effacer les logs ou télécharger un fichier

---

## Fonctionnalités

### 🎯 1. Authentification & QR Code

**Qu'est-ce que c'est ?**
Quand vous créez un bracelet, le simulateur génère un code unique qui s'affiche en QR Code. Les parents peuvent scanner ce code pour appairer le bracelet à l'application mobile.

**Comment ça marche ?**
1. Entrez un nom pour le bracelet
2. Cliquez "✨ Créer le Bracelet"
3. Le simulateur appelle l'API `/devices/auth`
4. Un QR Code s'affiche automatiquement
5. Le code s'affiche aussi en texte si QR ne fonctionne pas

**Exemple de logs:**
```
Creating bracelet: "Mon Bracelet d'Enfant"
REQUEST: POST /devices/auth
  ✓ Authentication successful
  ✓ QR Code generated successfully
  ✓ Bracelet created: TEST_ABC123XYZ
  ✓ Connected to backend
```

---

### 💓 2. Suivi Géolocalisation (Heartbeat)

**Qu'est-ce que c'est ?**
Toutes les 5 secondes, le bracelet envoie sa position GPS et l'état de sa batterie au backend.

**Comment ça marche ?**
1. Démarrez la simulation (▶️ bouton)
2. Chaque 5 secondes : une requête `POST /devices/heartbeat`
3. Les parents reçoivent la position en temps réel dans l'app mobile
4. La batterie décrémente progressivement (-0.5 à -2% par heartbeat)

**Données envoyées:**
```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "battery_level": 87,
  "accuracy": 15
}
```

**Exemple de logs:**
```
▶️ Simulation started
💓 Heartbeat sent
REQUEST: POST /devices/heartbeat
RESPONSE: 200 OK
📍 Location: 48.8566°N, 2.3522°E
Battery: 86%
Status: Running
```

---

### 🟢 3. Événement: Arrivée Sécurisée

**Qu'est-ce que c'est ?**
L'enfant appuie sur le bouton vert pour signaler qu'il est arrivé à destination en sécurité.

**Comment ça marche ?**
1. Cliquez sur le bouton "🟢 Arrivée en Sécurité"
2. Le simulateur envoie `POST /devices/button/arrived` avec la localisation
3. Le backend notifie le parent : "Votre enfant est arrivé en sécurité"
4. La batterie baisse de 1%

**Données envoyées:**
```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "accuracy": 15
}
```

**Exemple de logs:**
```
🟢 BUTTON_ARRIVED_PRESSED
REQUEST: POST /devices/button/arrived
  {latitude: 48.8566, longitude: 2.3522, accuracy: 15}
RESPONSE: 200 OK
📍 Location: 48.8566°N, 2.3522°E
Battery: 84%
Status: Safe
```

---

### 🟠 4. Événement: Enfant Perdu

**Qu'est-ce que c'est ?**
L'enfant appuie sur le bouton orange pour signaler qu'il est perdu.

**Comment ça marche ?**
1. Cliquez sur le bouton "🟠 Perdu"
2. Le simulateur envoie `POST /devices/button/lost`
3. Le backend notifie le parent avec urgence
4. Les notifications deviennent plus fréquentes
5. La batterie baisse de 1%

**Exemple de logs:**
```
🟠 BUTTON_LOST_PRESSED
REQUEST: POST /devices/button/lost
  {latitude: 48.8570, longitude: 2.3525, accuracy: 15}
RESPONSE: 200 OK
📍 Location: 48.8570°N, 2.3525°E
Battery: 83%
Status: Lost
```

---

### 🔴 5. Événement: Urgence/Danger

**Qu'est-ce que c'est ?**
L'enfant appuie sur le bouton rouge en cas d'urgence absolue. Les autorités sont alertées + le parent.

**Comment ça marche ?**
1. Cliquez sur le bouton "🔴 Urgence"
2. Le simulateur envoie `POST /devices/button/danger`
3. Le backend crée une alerte d'urgence
4. Le parent ET les autorités sont notifiés
5. Le heartbeat devient plus fréquent (30 secondes au lieu de 2 minutes)
6. La batterie baisse de 2%

**Exemple de logs:**
```
🔴 BUTTON_DANGER_PRESSED
REQUEST: POST /devices/button/danger
  {latitude: 48.8575, longitude: 2.3530, accuracy: 15}
RESPONSE: 200 OK
📍 Location: 48.8575°N, 2.3530°E
Battery: 81%
Status: Emergency
```

---

### 📲 6. Réponses Parent (Vibration & LED)

**Qu'est-ce que c'est ?**
Quand le parent répond via l'app mobile, le simulateur reçoit des commandes pour vibrer et allumer les LEDs.

**Comment ça marche ?**
1. L'enfant appuie sur un bouton dans le simulateur
2. Le parent reçoit une notification sur son téléphone
3. Le parent répond "Tout va bien?" dans l'app mobile
4. Le backend crée une commande de vibration/LED
5. **Chaque 5 secondes, le simulateur vérifie s'il y a des commandes en attente**
6. Quand le simulateur reçoit la commande, il affiche :
   - Une notification toast "Réponse du Parent"
   - Les logs montrent la vibration et la LED

**Exemple de scénario complet:**

```
14:30:00 - VOUS cliquez sur "🔴 Urgence"
  → Simulateur envoie: POST /devices/button/danger

14:30:01 - PARENT reçoit push notification sur téléphone
  → "Votre enfant a appuyé sur le bouton d'urgence!"

14:30:05 - PARENT clique sur la notification
  → Ouvre l'app LeGuardian

14:30:10 - PARENT appuie sur "✓ C'est bon, reviens"
  → App envoie: POST /bracelets/{id}/respond

14:30:10 - BACKEND crée la commande:
  → command_type: "vibrate_short"
  → led_color: "blue"
  → led_pattern: "fast"

14:30:15 - SIMULATEUR poll #3 (GET /devices/commands)
  → Reçoit la commande!
  → Affiche: 📳 VIBRATE_SHORT: ⚡ 100ms
  → Affiche: 🔵 LED_BLINK: blue, fast
  → Toast: "Parent a répondu - Vibration en cours"

14:30:16 - SIMULATEUR marque comme exécutée
  → POST /devices/commands/{id}/ack
```

**Types de réponses parent:**

| Réponse | Vibration | LED | Indication |
|---------|-----------|-----|-----------|
| "Tout va bien" | COURTE (100ms) | Bleu rapide | Tout va bien ✓ |
| "Perdu?" | MOYENNE (200ms) | Orange moyen | Attention |
| "Urgence confirme!" | SOS (500ms) | Rouge SOS | Urgent 🚨 |

---

### 🔋 7. Gestion de la Batterie

**Qu'est-ce que c'est ?**
Le simulateur reproduit le comportement réaliste d'une batterie qui se décharge.

**Comment ça marche ?**

- **Au démarrage**: 100%
- **Chaque heartbeat** (5 sec): -0.5 à -2% (aléatoire)
- **Chaque événement**:
  - Arrivée: -1%
  - Perdu: -1%
  - Urgence: -2%

**Indicateur visuel:**
- Barre de progression verte → orange → rouge
- Pourcentage affiché en temps réel
- Simulation s'arrête à 0%

```
🔋 100% ████████████████████ (Vert)
🔋  75% ███████████████░░░░░ (Vert)
🔋  50% ██████████░░░░░░░░░░ (Orange)
🔋  25% █████░░░░░░░░░░░░░░░ (Orange)
🔋   0% ░░░░░░░░░░░░░░░░░░░░ (Rouge)
```

---

### 📋 8. Journal d'Activité

**Qu'est-ce que c'est ?**
Un log détaillé de tout ce qui se passe : requêtes API, réponses, événements, erreurs.

**Couleur des logs:**

| Couleur | Signification | Exemples |
|---------|---------------|----------|
| 🔵 Bleu | Requête API | REQUEST: POST /devices/heartbeat |
| 🟢 Vert | Succès/Réponse | RESPONSE: 200 OK, ✓ Bracelet created |
| 🔴 Rouge | Erreur | ✗ ERROR: Network connection failed |
| 🟠 Orange | Avertissement | ⚠️ QR Code library unavailable |

**Exemple de journal complet:**
```
Creating bracelet: "Test Bracelet"
REQUEST: POST /devices/auth
  {unique_code: "TEST_ABC123"}
RESPONSE: 200 OK
  {id: 1, unique_code: "TEST_ABC123", created_at: "2025-11-06"}
✓ Authentication successful
✓ QR Code generated successfully
✓ Bracelet created: TEST_ABC123
✓ Connected to backend
▶️ Simulation started
💓 Heartbeat sent
REQUEST: POST /devices/heartbeat
  {battery_level: 99, latitude: 48.8566, longitude: 2.3522}
RESPONSE: 200 OK
📍 Location: 48.8566°N, 2.3522°E
Status: Running
Battery: 99%
```

---

### 🎯 9. Multi-Langue (FR/EN)

**Qu'est-ce que c'est ?**
L'interface peut être basculée entre français et anglais d'un clic.

**Comment ça marche ?**
1. Cliquez sur le bouton "🌐" en haut à droite
2. L'interface bascule entièrement
3. Le choix est sauvegardé automatiquement

**Langue supportées:**
- 🇫🇷 Français (par défaut)
- 🇬🇧 English

---

## Guide d'Utilisation

### Scénario 1: Test Simple (5 minutes)

**Objectif**: Vérifier que le simulateur se connecte au backend

```
1. Lancez l'app LeGuardian Simulator
2. Vérifiez que l'URL est correcte (http://localhost:8000)
3. Entrez un nom: "Test Simple"
4. Cliquez "✨ Créer le Bracelet"
   ✅ Vous devriez voir:
      - Un QR Code
      - "✓ Bracelet created"
      - "✓ Connected to backend"
5. Cliquez "▶️ Démarrer la Simulation"
   ✅ Vous devriez voir:
      - "💓 Heartbeat sent" tous les 5 secondes
      - La batterie décrémente lentement
6. Arrêtez avec "⏹️ Arrêter la Simulation"
```

---

### Scénario 2: Test des Événements (10 minutes)

**Objectif**: Tester les trois boutons d'événement

```
1. Suivez le Scénario 1
2. Cliquez "🟢 Arrivée en Sécurisée"
   ✅ Logs:
      - 🟢 BUTTON_ARRIVED_PRESSED
      - REQUEST: POST /devices/button/arrived
      - Battery: -1%
3. Cliquez "🟠 Perdu"
   ✅ Logs:
      - 🟠 BUTTON_LOST_PRESSED
      - REQUEST: POST /devices/button/lost
      - Battery: -1%
4. Cliquez "🔴 Urgence"
   ✅ Logs:
      - 🔴 BUTTON_DANGER_PRESSED
      - REQUEST: POST /devices/button/danger
      - Battery: -2%
5. Vérifiez dans l'app backend ou mobile que les événements sont reçus
```

---

### Scénario 3: Test End-to-End Complet (20 minutes)

**Objectif**: Tester le flux complet parent-enfant

```
PRÉREQUIS:
- Backend en cours d'exécution
- App mobile parent en cours d'exécution (ou simulée)
- Bracelet créé dans l'app mobile

ÉTAPES:

1️⃣ SIMULATEUR: Créer un bracelet
   - Entrez: "Child Test"
   - Cliquez: "✨ Créer le Bracelet"
   - Notez le code: TEST_ABC123

2️⃣ APP MOBILE: Appairer le bracelet
   - Scannez le QR Code OU entrez TEST_ABC123
   - Appuyez sur "✓ Appairer"
   - Attendez la confirmation

3️⃣ SIMULATEUR: Démarrer la simulation
   - Cliquez "▶️ Démarrer la Simulation"
   - Vérifiez: "💓 Heartbeat sent" chaque 5 sec
   - Vérifiez: La localisation s'affiche

4️⃣ APP MOBILE: Vérifier la localisation
   - La carte affiche la position du bracelet
   - La position se met à jour chaque 5 secondes

5️⃣ SIMULATEUR: Appuyer sur "🔴 Urgence"
   - Cliquez le bouton rouge
   - Logs: "REQUEST: POST /devices/button/danger"

6️⃣ APP MOBILE: Recevoir la notification
   - Push notification: "Urgence enfant détectée!"
   - Cliquez sur la notification

7️⃣ APP MOBILE: Répondre
   - Choisissez une réaction: "Tout va bien?"
   - Cliquez "✓ Envoyer"
   - App envoie: "POST /api/bracelets/{id}/respond"

8️⃣ SIMULATEUR: Recevoir la réponse
   - Attendez max 5 secondes
   - TOAST: "Réponse du Parent - Vibration en cours"
   - LOGS:
      - "REQUEST: GET /devices/commands"
      - "RESPONSE: 200 OK"
      - "📳 VIBRATE_SHORT: ⚡ 100ms"
      - "🔵 LED_BLINK: blue, fast"

✅ SUCCÈS: Tout fonctionne end-to-end!
```

---

### Scénario 4: Test de Performance

**Objectif**: Vérifier la stabilité sur 1 heure de simulation

```
1. Créez un bracelet
2. Démarrez la simulation
3. Laissez tourner pendant 1 heure
4. Vérifiez:
   ✅ Les heartbeats sont envoyés régulièrement
   ✅ La batterie diminue progressivement
   ✅ Pas de crash ou d'erreurs
   ✅ Les logs s'accumulent sans ralentissement
5. Cliquez "📥 Télécharger les Logs" pour exporter
6. Analysez le fichier .txt généré
```

---

## Dépannage

### ❌ Problème: "Cannot connect to API"

**Symptômes:**
```
✗ ERROR: Failed to fetch
✗ ERROR: Network request failed
```

**Solutions:**
1. Vérifiez que le backend Laravel est en cours d'exécution
   ```bash
   curl http://localhost:8000/api/health
   # Devrait répondre: {"status":"ok"}
   ```

2. Vérifiez l'URL de l'API
   - Doit être exactement: `http://localhost:8000`
   - Pas de `/api` à la fin (ajouté automatiquement)

3. Vérifiez les migrations sont appliquées
   ```bash
   php artisan migrate
   ```

4. Vérifiez les routes API existent
   ```bash
   php artisan route:list | grep devices
   ```

---

### ❌ Problème: "QR Code doesn't display"

**Symptômes:**
```
⚠️ QR Code library unavailable, showing code as text
```

**Explication:**
La CDN qrcodejs peut être inaccessible mais le code s'affiche en texte (vous pouvez le taper).

**Solution:**
Attendez quelques secondes ou vérifiez votre connexion internet.

---

### ❌ Problème: "Bracelet create successful but no QR Code"

**Symptômes:**
- Les logs montrent "✓ Bracelet created"
- Mais le QR Code ne s'affiche pas

**Solution:**
C'est normal! Vous pouvez copier-coller le code (TEST_ABC123) ou utiliser le lien pour partager.

---

### ❌ Problème: "Simulation won't start"

**Symptômes:**
```
Clique sur "▶️ Démarrer" → Rien ne se passe
```

**Solution:**
Vous devez d'abord créer un bracelet:
1. Entrez un nom
2. Cliquez "✨ Créer le Bracelet"
3. Attendez la confirmation
4. Puis cliquez "▶️ Démarrer la Simulation"

---

### ❌ Problème: "Parent responses not received"

**Symptômes:**
- Vous appuyez sur un bouton dans le simulateur
- Parent répond dans l'app mobile
- Mais le simulateur ne reçoit rien

**Solutions:**
1. Attendez 5-10 secondes (polling toutes les 5 sec)
2. Vérifiez l'endpoint `/devices/commands` existe au backend
3. Vérifiez les commandes sont créées en base de données
   ```bash
   php artisan tinker
   >>> App\Models\BraceletCommand::where('bracelet_id', 1)->get();
   ```

---

### ❌ Problème: "App crashes on startup"

**Symptômes:**
```
App opens then immediately closes
```

**Solution:**
1. Supprimez l'app du dossier Applications
2. Téléchargez et installez la dernière version
3. Relancez

---

## Spécifications Techniques

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LeGuardian Simulator (Electron)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Frontend HTML/CSS/JavaScript             │   │
│  │  - UI rendering                                       │   │
│  │  - User interactions                                  │   │
│  │  - Toast notifications                               │   │
│  │  - Log management                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Core Logic (JavaScript Async/Await)           │   │
│  │  - API URL management                                │   │
│  │  - Bracelet creation                                 │   │
│  │  - Heartbeat polling (5s interval)                   │   │
│  │  - Command polling (5s interval)                     │   │
│  │  - Button event handling                             │   │
│  │  - Battery simulation                                │   │
│  │  - i18n translation (FR/EN)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP REST
┌─────────────────────────────────────────────────────────────┐
│                    LeGuardian Backend (Laravel)              │
│  - API authentication                                       │
│  - Bracelet management                                      │
│  - Event processing                                         │
│  - Command queueing                                         │
│  - Database persistence                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Endpoints API Utilisés

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/devices/auth` | Authentifier le bracelet |
| POST | `/api/devices/heartbeat` | Envoyer localisation + batterie |
| POST | `/api/devices/button/arrived` | Bouton arrivée en sécurité |
| POST | `/api/devices/button/lost` | Bouton perdu |
| POST | `/api/devices/button/danger` | Bouton urgence |
| GET | `/api/devices/commands` | Récupérer les commandes en attente |
| POST | `/api/devices/commands/{id}/ack` | Marquer une commande comme exécutée |

---

### Fichiers et Versions

```
LeGuardian Simulator v1.0.0
├── Electron: 27.3.11
├── Node.js: 18.17.1
├── Build: electron-builder 24.6.0
├── Platform: macOS arm64 (Apple Silicon)
├── Architecture: Standalone DMG
└── Size: ~87 MB
```

---

### Stockage Local

Le simulateur stocke vos préférences :

| Clé | Valeur | Persistance |
|-----|--------|-------------|
| `language` | `'fr'` ou `'en'` | localStorage |
| (API URL) | `http://localhost:8000` | Pas de persistance |

---

### Limitations Connues

1. ⚠️ La localisation est simulée (toujours Paris)
2. ⚠️ Pas de GPS réel (c'est intentionnel pour un simulateur)
3. ⚠️ La batterie se décharge rapidement (simulation accélérée)
4. ⚠️ Une seule instance de bracelet à la fois
5. ⚠️ Les logs ne persiste pas si l'app ferme

---

### Possibilités Futures

- [ ] Géolocalisation réelle via GPS
- [ ] Plusieurs bracelets simultanés
- [ ] Persistance des logs en base de données
- [ ] Enregistrement vidéo des tests
- [ ] Interface de configuration avancée
- [ ] Mode offline avec synchronisation
- [ ] Support iOS via web app

---

## Support & Ressources

### Fichiers Importants

- **Source**: `/Users/kevindupas/CLIENTS/leguardian/simulateur/electron-app/`
- **Index.html**: Interface principale
- **i18n.json**: Traductions
- **package.json**: Configuration et dépendances

### Logs & Débogage

Pour exporter les logs :
1. Cliquez "📥 Télécharger les Logs"
2. Un fichier `.txt` est généré dans Téléchargements
3. Nommé: `bracelet-{code}-logs.txt`

### Rapporter un Bug

Si vous rencontrez un problème :
1. Cliquez "📥 Télécharger les Logs"
2. Envoyez le fichier `.txt` avec une description
3. Incluez votre version de macOS
4. Décrivez les étapes pour reproduire

---

## Résumé des Fonctionnalités

| Fonctionnalité | ✅ Implémentée | Statut |
|---|---|---|
| Création de bracelet | ✅ | Production-ready |
| QR Code | ✅ | Production-ready |
| Authentification API | ✅ | Production-ready |
| Heartbeat GPS | ✅ | Production-ready |
| Événement Arrivée | ✅ | Production-ready |
| Événement Perdu | ✅ | Production-ready |
| Événement Urgence | ✅ | Production-ready |
| Réponses Parent | ✅ | Production-ready |
| Vibration/LED | ✅ | Production-ready |
| Gestion Batterie | ✅ | Production-ready |
| Journal d'Activité | ✅ | Production-ready |
| Multi-langue FR/EN | ✅ | Production-ready |
| Toast Notifications | ✅ | Production-ready |
| Export des Logs | ✅ | Production-ready |

---

## Questions Fréquentes (FAQ)

**Q: Puis-je utiliser le simulateur sans backend?**
A: Non, le simulateur doit être connecté à un backend Laravel fonctionnel.

**Q: Comment changer l'API URL après création du bracelet?**
A: Vous ne pouvez pas. Créez un nouveau bracelet avec la nouvelle URL.

**Q: La batterie se décharge rapidement, est-ce normal?**
A: Oui! C'est volontaire pour accélérer les tests. Un vrai bracelet dure plusieurs jours.

**Q: Pourquoi le QR Code ne s'affiche pas?**
A: La CDN peut être bloquée. Le code texte s'affiche toujours en alternative.

**Q: Comment synchroniser plusieurs simulateurs?**
A: Créez plusieurs bracelets différents dans le même simulateur ou lancez plusieurs instances.

**Q: Les logs sont-ils sauvegardés quelque part?**
A: Oui, cliquez "📥 Télécharger les Logs" pour exporter en fichier texte.

---

## Conclusion

Le **LeGuardian Simulator** est un outil complet et production-ready pour tester chaque aspect du système LeGuardian sans matériel physique. Il reproduit fidèlement le comportement d'un vrai bracelet ESP32 connecté à votre backend.

### Pour Commencer
1. Lancez le DMG
2. Vérifiez l'URL du backend
3. Créez un bracelet
4. Testez les événements
5. Vérifiez dans l'app mobile

**Bon testing! 🎯**

---

*Dernière mise à jour: 6 novembre 2025*
*Version: 1.0.0 - Production Ready*
