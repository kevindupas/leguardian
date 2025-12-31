# Structure des Fichiers MQTT

## Vue d'Ensemble

```
/var/www/leguardian/
├── leguardian-backend/
│   ├── app/
│   │   ├── Console/
│   │   │   └── Commands/
│   │   │       ├── MqttListenCommand.php          ← NOUVEAU: Écoute telemetry
│   │   │       └── MqttListenAcksCommand.php      ← NOUVEAU: Écoute ACKs
│   │   ├── Http/
│   │   │   └── Controllers/Api/
│   │   │       └── BraceletController.php         ← MODIFIÉ: sendCommand()
│   │   ├── Models/
│   │   │   ├── Bracelet.php                       ← MODIFIÉ: updateTelemetry()
│   │   │   └── BraceletCommand.php                ← MODIFIÉ: + metadata
│   │   └── Services/
│   │       ├── MqttService.php                    ← EXISTANT: Connexion MQTT
│   │       └── MqttCommandService.php             ← NOUVEAU: Publish commands
│   ├── config/
│   │   ├── mqtt.php                               ← EXISTANT: Config MQTT
│   │   └── supervisor/                            ← NOUVEAU: Supervisor configs
│   │       ├── leguardian-mqtt-telemetry.conf     ← NOUVEAU
│   │       └── leguardian-mqtt-acks.conf          ← NOUVEAU
│   ├── database/
│   │   └── migrations/
│   │       └── 2025_12_29_170000_add_metadata_to_bracelet_commands.php ← NOUVEAU
│   ├── scripts/
│   │   └── setup-mqtt-supervisor.sh               ← NOUVEAU: Setup script
│   └── storage/
│       └── logs/
│           ├── mqtt-telemetry.log                 ← NOUVEAU: Telemetry logs
│           └── mqtt-acks.log                      ← NOUVEAU: ACKs logs
└── TestModem/
    ├── src/
    │   └── main.cpp                               ← MODIFIÉ: handleCommand()
    └── platformio.ini                             ← EXISTANT (pas changé)

Documentation/
├── MQTT_WORKFLOW.md                               ← Workflow complet
├── MQTT_BIDIRECTIONAL_COMMUNICATION.md            ← Communication détaillée
├── IMPLEMENTATION_SUMMARY.md                      ← Synthèse
├── PRODUCTION_DEPLOYMENT.md                       ← Déploiement prod
├── QUICK_DEPLOY.md                                ← Déploiement rapide
└── MQTT_FILES_STRUCTURE.md                        ← CE FICHIER
```

---

## Fichiers Détaillés

### 1. **Commandes Artisan**

#### `app/Console/Commands/MqttListenCommand.php`
**Rôle** : Écouter les messages de télémétrie du bracelet

**Topics écoutés** :
- `bracelets/+/telemetry`

**Actions** :
- ✅ Reçoit les messages MQTT
- ✅ Auto-enregistre les nouveaux bracelets
- ✅ Crée des records dans `bracelet_telemetry`
- ✅ Met à jour le statut du bracelet (`status`, `last_ping_at`, etc.)

**Lancé avec** :
```bash
php artisan mqtt:listen
```

**Ou via Supervisor** :
```bash
sudo supervisorctl start leguardian-mqtt-telemetry:*
```

---

#### `app/Console/Commands/MqttListenAcksCommand.php` ← NOUVEAU
**Rôle** : Écouter les ACKs du bracelet

**Topics écoutés** :
- `bracelets/+/ack`

**Actions** :
- ✅ Reçoit les confirmations d'exécution
- ✅ Met à jour le statut des commandes (`pending` → `executed`)
- ✅ Enregistre le timestamp d'exécution

**Lancé avec** :
```bash
php artisan mqtt:listen-acks
```

**Ou via Supervisor** :
```bash
sudo supervisorctl start leguardian-mqtt-acks:*
```

---

### 2. **Services**

#### `app/Services/MqttService.php`
**Rôle** : Gestion de la connexion MQTT (existant)

**Méthodes** :
- `connect()` - Se connecter au broker
- `disconnect()` - Se déconnecter
- `publish(topic, message)` - Publier un message
- `subscribe(topic, callback)` - S'abonner à un topic
- `isConnected()` - Vérifier la connexion
- `getClient()` - Récupérer le client PubSubClient

**Utilisé par** : MqttCommandService, MqttListenCommand, MqttListenAcksCommand

---

#### `app/Services/MqttCommandService.php` ← NOUVEAU
**Rôle** : Publier les commandes vers les bracelets

**Méthodes** :
- `sendCommand(BraceletCommand)` - Publier une commande
- `buildCommandPayload(BraceletCommand)` - Construire le JSON
- `markAsExecuted(BraceletCommand)` - Marquer comme exécutée
- `markAsFailed(BraceletCommand)` - Marquer comme échouée
- `getPendingCommands(Bracelet)` - Récupérer les commandes en attente

**Utilisé par** : BraceletController (vibrate, sendCommand)

**Exemple d'utilisation** :
```php
$mqttService = new MqttCommandService();
$mqttService->sendCommand($command);
```

---

### 3. **Contrôleurs API**

#### `app/Http/Controllers/Api/BraceletController.php`
**Modifié** :
- `vibrate()` - Amélioré pour envoyer via MQTT
- `sendCommand()` ← NOUVEAU - Commandes génériques

**Endpoints** :
```
POST /api/mobile/bracelets/{id}/vibrate
{
  "pattern": "short|medium|sos"
}

POST /api/mobile/bracelets/{id}/command
{
  "command_type": "vibrate_short|vibrate_medium|vibrate_sos|led_on|led_off|sync_time|configure_gps",
  "led_color": "red|green|blue|yellow|white",
  "led_pattern": "solid|blink|pulse"
}
```

---

### 4. **Modèles**

#### `app/Models/Bracelet.php`
**Modifié** :
- `updateTelemetry(array)` - Met à jour les données + status

**Nouvelles données trackées** :
- `status` → 'online' à chaque telemetry
- `last_ping_at` → Timestamp de la dernière telemetry
- `battery_level` → Du payload
- `emergency_mode` → Du payload
- `last_latitude`, `last_longitude` → GPS actuel

---

#### `app/Models/BraceletCommand.php`
**Modifié** :
- Ajout du champ `metadata` (JSON)

**Statuts** :
- `pending` → Créée, pas encore envoyée
- `sent` → Publiée via MQTT
- `executed` → Bracelet a confirmé
- `failed` → Erreur d'exécution

---

### 5. **Migrations**

#### `database/migrations/2025_12_29_170000_add_metadata_to_bracelet_commands.php` ← NOUVEAU
**Ajoute** : Colonne `metadata` JSON à la table `bracelet_commands`

**Appliquée avec** :
```bash
php artisan migrate
```

---

### 6. **Configuration Supervisor**

#### `config/supervisor/leguardian-mqtt-telemetry.conf` ← NOUVEAU
**Définit** : Comment Supervisor lance `php artisan mqtt:listen`

**Paramètres importants** :
- `command` → La commande à exécuter
- `autostart=true` → Démarrer automatiquement
- `autorestart=true` → Redémarrer en cas de crash
- `user=www-data` → Exécuter comme www-data
- `stdout_logfile` → Où écrire les logs

**Copié vers** : `/etc/supervisor/conf.d/leguardian-mqtt-telemetry.conf`

---

#### `config/supervisor/leguardian-mqtt-acks.conf` ← NOUVEAU
**Définit** : Comment Supervisor lance `php artisan mqtt:listen-acks`

**Identique à telemetry.conf, mais** :
- `command` → `mqtt:listen-acks`
- `stdout_logfile` → `mqtt-acks.log`

**Copié vers** : `/etc/supervisor/conf.d/leguardian-mqtt-acks.conf`

---

### 7. **Scripts**

#### `scripts/setup-mqtt-supervisor.sh` ← NOUVEAU
**Automatise le déploiement** :

1. ✅ Vérifie les prérequis (Supervisor, chemins)
2. ✅ Crée les répertoires de logs
3. ✅ Copie les fichiers de configuration
4. ✅ Recharge Supervisor
5. ✅ Démarre les listeners
6. ✅ Affiche le statut

**Exécution** :
```bash
sudo bash scripts/setup-mqtt-supervisor.sh
```

---

### 8. **Code Arduino**

#### `TestModem/src/main.cpp`
**Modifié** :

1. **Nouvelle fonction** : `handleCommand()`
   - Traite les commandes reçues
   - Contrôle vibrations, LED, mode d'urgence

2. **Fonction améliorée** : `onMqttMessage()`
   - Parse les commandes JSON
   - Exécute via `handleCommand()`
   - Envoie les ACKs automatiquement

**Commandes gérées** :
- `vibrate_short` → vibrate(100)
- `vibrate_medium` → vibrate(300)
- `vibrate_sos` → SOS morse pattern
- `led_on` → Allumer avec couleur/pattern
- `led_off` → Éteindre
- `enable_emergency_mode` → Mode urgence
- `disable_emergency_mode` → Mode normal
- `sync_time` → Sync horloge

---

## Architecture Complète

### Topics MQTT

| Topic | Direction | Écoute par | Publie par |
|-------|-----------|-----------|-----------|
| `bracelets/{id}/telemetry` | ← Bracelet | `mqtt:listen` | Arduino |
| `bracelets/{id}/commands` | → Bracelet | Arduino | Backend API |
| `bracelets/{id}/ack` | ← Bracelet | `mqtt:listen-acks` | Arduino |

### Base de Données

```sql
-- Tables principales
bracelets
├─ id (PK)
├─ unique_code (Bracelet ESP32_XXX_001)
├─ status (online|offline|emergency)
├─ last_ping_at (Dernière telemetry)
├─ last_latitude, last_longitude
├─ battery_level
├─ emergency_mode
└─ ...

bracelet_telemetry (Historique)
├─ id (PK)
├─ bracelet_id (FK)
├─ timestamp
├─ latitude, longitude
├─ satellites
├─ signal_csq, rsrp, rsrq
├─ accel_x/y/z, gyro_x/y/z
├─ emergency_mode
└─ ...

bracelet_commands
├─ id (PK)
├─ bracelet_id (FK)
├─ command_type (vibrate_short, led_on, etc.)
├─ status (pending|sent|executed|failed)
├─ executed_at
├─ led_color, led_pattern
├─ metadata (JSON - flexible)
└─ ...
```

### Supervision

```
/etc/supervisor/conf.d/
├─ leguardian-mqtt-telemetry.conf
└─ leguardian-mqtt-acks.conf

Supervisant :
├─ php artisan mqtt:listen (PID: 12345)
└─ php artisan mqtt:listen-acks (PID: 12346)

Avec logs dans :
├─ storage/logs/mqtt-telemetry.log
└─ storage/logs/mqtt-acks.log
```

---

## Cycle de Déploiement

```
1. Code changé → git push
2. Pull sur le serveur
3. php artisan migrate (if any)
4. sudo supervisorctl restart leguardian-mqtt-telemetry:*
5. sudo supervisorctl restart leguardian-mqtt-acks:*
6. Vérifier : tail -f storage/logs/mqtt-telemetry.log
```

---

## Fichiers par Rôle

### Pour Recevoir la Télémétrie

1. `app/Console/Commands/MqttListenCommand.php` - Écoute
2. `app/Models/Bracelet.php::updateTelemetry()` - Traite
3. `database/migrations/create_bracelet_telemetry_table.php` - Stocke

### Pour Envoyer des Commandes

1. `app/Http/Controllers/Api/BraceletController.php::sendCommand()` - Déclenche
2. `app/Services/MqttCommandService.php` - Publie
3. `TestModem/src/main.cpp::handleCommand()` - Reçoit

### Pour Recevoir les ACKs

1. `app/Console/Commands/MqttListenAcksCommand.php` - Écoute
2. `app/Models/BraceletCommand.php` - Met à jour

---

## Résumé

**Total ajouté** :
- ✅ 2 commandes Artisan
- ✅ 1 service MQTT
- ✅ 2 fichiers de configuration Supervisor
- ✅ 1 script de setup automatique
- ✅ 1 migration de BD
- ✅ ~200 lignes de code Arduino
- ✅ ~400 lignes de code PHP
- ✅ 5 fichiers de documentation

**Prêt pour** : Production, auto-restart, logs, monitoring
