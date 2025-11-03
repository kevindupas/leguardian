# LeGuardian Virtual Bracelet GUI

Une interface graphique PyQt5 complète pour contrôler et visualiser des bracelets virtuels.

## Fonctionnalités

### 🎨 Interface Visuelle
- **Visualisation du bracelet**: Représentation graphique du bracelet avec couleur du band
- **QR Code**: Affichage du code QR pour l'enregistrement mobile
- **Indicateur LED**: LED avec animation de clignotement
- **Jauge de batterie**: Affichage en temps réel avec code couleur (vert/orange/rouge)
- **Indicateur de vibration**: Animation lors des vibrations
- **Affichage d'état**: Status du bracelet (actif, perdu, urgence)

### 🎮 Contrôles

#### Boutons du Bracelet
- **✓ Arrivé** (Vert): Signaler l'arrivée en sécurité
- **⚠ Perdu** (Orange): Signaler que l'enfant est perdu
- **🚨 Danger** (Rouge): Déclencher la mode urgence

#### Contrôle LED
- **Blue**: Allumer LED en bleu
- **Red**: Allumer LED en rouge
- **Off**: Éteindre la LED

#### Vibrations
- **Short**: Vibration courte (100ms)
- **Medium**: Vibration moyenne (200ms)
- **SOS**: Motif de vibration SOS

### 📊 Panneau de Statut
- Battery: Niveau de batterie en temps réel (%)
- Status: État du bracelet (active/lost/emergency)
- Location: Coordonnées GPS actuelles

### 📝 Logs
- Console en direct avec tous les événements
- Timestamps précis pour chaque action
- Scroll automatique vers les derniers messages

## Installation

### Prérequis
- Python 3.7+
- Backend Laravel en cours d'exécution sur `http://localhost:8000`

### Setup

1. **Créer/Activer l'environnement virtuel:**
```bash
cd /Users/kevindupas/CLIENTS/leguardian
source bracelet_env/bin/activate
```

2. **Les dépendances sont déjà installées:**
```bash
# PyQt5, requests, qrcode, pillow sont déjà dans l'env
```

## Utilisation

### Lancement Simple
```bash
./launch_gui.sh
```

### Lancement Manual
```bash
source bracelet_env/bin/activate
python3 bracelet_gui.py
```

### Workflow Typique

1. **Créer un bracelet**
   - Cliquer sur "Create Bracelet"
   - Le code QR s'affiche automatiquement
   - Le bracelet est enregistré dans la base de données

2. **Démarrer la simulation**
   - Cliquer sur "Start Simulation"
   - Les heartbeats s'envoient automatiquement
   - La batterie diminue progressivement
   - Les commandes sont vérifiées

3. **Interagir manuellement**
   - Appuyer sur les boutons du bracelet
   - Contrôler les LED
   - Déclencher les vibrations
   - Voir les logs en temps réel

4. **Arrêter et sauvegarder**
   - Cliquer "Stop Simulation"
   - Cliquer "Save Log" pour exporter les données

## Architecture

### Composants Principaux

#### `VirtualBracelet` Class
- Émulation complète du bracelet physique
- Communication avec les APIs backend
- Gestion de l'état et des logs

#### `SimulationThread` Class
- Simulation en arrière-plan (non-bloquante)
- Signaux PyQt5 pour mise à jour GUI
- Heartbeats et vérifications de commandes

#### `BraceletPanel` Class
- Rendu graphique custom du bracelet
- Animation LED et vibration
- Jauge de batterie avec code couleur

#### `BraceletGUI` Class
- Fenêtre principale
- Gestion des événements
- Coordination entre bracelet et GUI

## États du Bracelet

### Status
- **active** (Vert): Normal, connecté
- **lost** (Orange): Enfant perdu, mode suivi activé
- **emergency** (Rouge): Mode urgence, localisation continue

### LED
- **Vert**: Normal
- **Bleu**: Message reçu
- **Rouge**: Urgence
- **Clignotant**: Alerte active

### Batterie
- **Vert**: > 50%
- **Orange**: 20-50%
- **Rouge**: < 20%

## Fonctionnalités Avancées

### Simulation Automatique
Quand "Start Simulation" est activé:
- Heartbeat chaque 5 secondes
- Vérification des commandes chaque 5 secondes
- Drain de batterie réaliste (1-3% par heartbeat)
- Dérive GPS simulée

### Logs en Temps Réel
- Tous les événements sont loggés
- Format: `[HH:MM:SS] Message`
- Auto-scroll vers les derniers messages
- Export JSON des logs complets

### Export des Données
- Fichier `simulation_logs/UNIQUE_CODE_simulation.json`
- Contient tous les événements avec timestamps
- Batterie et localisation finales
- Décodable par n'importe quel outil JSON

## Backend API Integration

L'interface communique avec ces endpoints:

### Device Endpoints
- `POST /api/devices/auth` - Authentifier le bracelet
- `POST /api/devices/heartbeat` - Envoyer un battement de cœur
- `POST /api/devices/button/arrived` - Bouton arrivé
- `POST /api/devices/button/lost` - Bouton perdu
- `POST /api/devices/button/danger` - Bouton danger
- `GET /api/devices/commands` - Vérifier les commandes
- `POST /api/devices/commands/{id}/ack` - Confirmer une commande

### Database Integration
- Auto-création des bracelets via `php artisan tinker`
- Enregistrement avec code QR unique
- Statut initial "active"

## Dépannage

### Erreur: "Backend is not running"
```bash
cd leguardian-backend
php artisan serve --host=localhost --port=8000
```

### Erreur: "Permission denied" sur launch_gui.sh
```bash
chmod +x launch_gui.sh
```

### Fenêtre GUI ne s'affiche pas
- Sur macOS, vérifier les permissions d'accès au Dock
- Relancer l'application
- Vérifier que PyQt5 est bien installé

### Bracelet non authentifié
- Vérifier que le backend est en cours d'exécution
- Vérifier que la base de données est accessible
- Vérifier les logs pour les erreurs de connexion

## Fonctionnalités Futures

- [ ] Interface de création de commandes (vibration/LED)
- [ ] Support de plusieurs bracelets simultanés
- [ ] Graphiques en temps réel de la batterie
- [ ] Visualisation de la carte avec localisation
- [ ] Export PDF des rapports de simulation
- [ ] Sauvegarde/chargement de scénarios de test

## Licence

Partie du système de sécurité enfants LeGuardian.
