# Communication Bidirectionnelle MQTT - Guide Complet

## Vue d'Ensemble

Le système de communication est maintenant entièrement bidirectionnel :

```
BACKEND (Laravel)                MOSQUITTO BROKER                BRACELET (Arduino ESP32)
┌──────────────────────┐        ┌──────────────┐             ┌─────────────────────┐
│                      │        │              │             │                     │
│  Listener Telemetry  │◄──────►│ Topic        │◄──────────►│ MQTT Client         │
│  mqtt:listen         │        │ bracelets/   │            │ PubSubClient        │
│                      │        │ {id}/        │            │                     │
│  Listener ACKs       │◄──────►│ telemetry    │             │ onMqttMessage()     │
│  mqtt:listen-acks    │        │              │             │ handleCommand()     │
│                      │        │ Topic        │             │                     │
│  Command Service     │        │ bracelets/   │             │ Serial Logs         │
│  MqttCommandService  │───────►│ {id}/        │────────────►│ Vibration           │
│                      │        │ commands     │             │ LED Control         │
│  Broadcast API       │        │              │             │                     │
│  POST /api/          │        │ Topic        │◄────────────│ ACK Messages        │
│  bracelets/{id}/     │        │ bracelets/   │             │                     │
│  command             │        │ {id}/ack     │             │ Battery             │
│                      │        │              │             │ GPS Data            │
└──────────────────────┘        └──────────────┘             └─────────────────────┘

Communication Flow:
1. Bracelet → Telemetry (every 60s normal, 10s emergency)
2. Backend processes and stores telemetry
3. User triggers command via API
4. Backend publishes command via MQTT
5. Bracelet receives command and executes it
6. Bracelet sends ACK back to Backend
7. Backend receives ACK and updates command status
```

## Flux 1: Envoi de la Télémétrie (Bracelet → Backend)

### Initiation (Bracelet)

```cpp
// main.cpp loop()
if (braceletAssociated && mqttConnected && (now - lastDataTransmission > sendInterval))
{
    String payload = buildJsonPayload(currentGpsData, currentImuData);
    mqttClient.publish(MQTT_TOPIC_TELEMETRY, payload.c_str());
    lastDataTransmission = now;
}
```

### Format du Payload

```json
{
  "timestamp": "2025-12-29T15:30:00Z",
  "emergency_mode": false,
  "gps": {
    "latitude": 48.8566,
    "longitude": 2.3522,
    "altitude": 35,
    "satellites": 12,
    "date": "29/12/2025",
    "time": "15:30:00"
  },
  "network": {
    "signal_csq": 15,
    "rsrp": "-110",
    "rsrq": "-8",
    "type": "LTE"
  },
  "imu": {
    "accel": {"x": 0.1, "y": 0.2, "z": 9.8},
    "gyro": {"x": 0.01, "y": 0.01, "z": 0.01},
    "temperature": 28
  }
}
```

### Traitement (Backend)

```bash
php artisan mqtt:listen
```

**MqttListenCommand.php** effectue :
1. Reçoit message sur `bracelets/{unique_code}/telemetry`
2. Cherche le bracelet dans la BD
3. **Si non trouvé** → Auto-enregistrement
4. Crée record dans `bracelet_telemetry` table
5. Met à jour status du bracelet :
   - `status` = 'online'
   - `last_ping_at` = timestamp
   - `last_latitude`, `last_longitude`
   - `battery_level` (si fourni)
   - `emergency_mode`
6. Logs : `[local.INFO] Telemetry received from ESP32_A7670E_001`

**Base de données** :
- ✅ 1 nouvelle ligne dans `bracelet_telemetry`
- ✅ Bracelet mis à jour avec dernière position
- ✅ Historique complet conservé

---

## Flux 2: Envoi d'une Commande (Backend → Bracelet)

### Étape 1: Utilisateur Déclenche la Commande

**API Request** :
```http
POST /api/mobile/bracelets/42/command
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "command_type": "vibrate_short",
  "led_color": "blue",
  "led_pattern": "solid"
}
```

**Commandes Supportées** :
- `vibrate_short` → 100ms vibration
- `vibrate_medium` → 300ms vibration
- `vibrate_sos` → SOS pattern
- `led_on` → Allumer LED avec couleur et pattern
- `led_off` → Éteindre LED
- `sync_time` → Synchroniser l'heure
- `configure_gps` → Configurer l'intervalle GPS
- `enable_emergency_mode` → Forcer mode urgence
- `disable_emergency_mode` → Quitter mode urgence

### Étape 2: Backend Crée et Envoie la Commande

**BraceletController::sendCommand()** :
```php
// 1. Validation et création en BD
$command = BraceletCommand::create([
    'bracelet_id' => $bracelet->id,
    'command_type' => 'vibrate_short',
    'status' => 'pending',
    'led_color' => 'blue',
    'led_pattern' => 'solid',
]);

// 2. Envoi via MQTT
$mqttService = new MqttCommandService();
$sent = $mqttService->sendCommand($command);
```

**MqttCommandService::sendCommand()** :
```php
// Construit le payload
$payload = [
    'command_id' => 1,
    'command_type' => 'vibrate_short',
    'timestamp' => '2025-12-29T15:31:00Z',
    'duration' => 100
];

// Publie sur topic
$this->client->publish('bracelets/ESP32_A7670E_001/commands', json_encode($payload));

// Met à jour status en BD
$command->update(['status' => 'sent']);
```

### Payload Envoyé

```json
{
  "command_id": 1,
  "command_type": "vibrate_short",
  "timestamp": "2025-12-29T15:31:00Z",
  "duration": 100
}
```

**Exemple avec LED** :
```json
{
  "command_id": 2,
  "command_type": "led_on",
  "timestamp": "2025-12-29T15:31:30Z",
  "color": "blue",
  "pattern": "solid"
}
```

**Exemple SOS** :
```json
{
  "command_id": 3,
  "command_type": "vibrate_sos",
  "timestamp": "2025-12-29T15:32:00Z",
  "pattern": "sos"
}
```

### API Response

```json
{
  "command_id": 1,
  "success": true,
  "message": "Command sent to bracelet"
}
```

---

## Flux 3: Réception et Exécution (Bracelet)

### Réception du Message MQTT

**TestModem/src/main.cpp** :
```cpp
void onMqttMessage(char *topic, byte *payload, unsigned int length)
{
    SerialMon.print("MQTT message received on topic: ");
    SerialMon.println(topic);

    // Convertir payload en string
    String message = "";
    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    // Traiter si topic = commands
    if (strcmp(topic, MQTT_TOPIC_COMMANDS) == 0)
    {
        // Parser JSON et extraire command_id, command_type, etc.
        // ...

        // Exécuter la commande
        handleCommand(commandType, 0, ledColor, ledPattern);

        // Envoyer ACK
        // ...
    }
}
```

### Exécution de la Commande

**handleCommand()** gère :

#### Vibrations
```cpp
if (commandType == "vibrate_short")
{
    vibrate(100);  // 100ms
}
else if (commandType == "vibrate_sos")
{
    // SOS: long long short
    vibrate(200);
    delay(100);
    vibrate(200);
    delay(100);
    vibrate(100);
}
```

#### LED Control
```cpp
else if (commandType == "led_on")
{
    uint32_t color = parseColor(ledColor);  // "red", "blue", "green", etc.

    if (ledPattern == "blink")
    {
        currentLedMode = LED_BLINKING;
    }
    else
    {
        leds.setPixelColor(0, color);
        leds.show();
    }
}
else if (commandType == "led_off")
{
    leds.clear();
    leds.show();
}
```

#### Mode d'Urgence
```cpp
else if (commandType == "enable_emergency_mode")
{
    emergencyMode = true;
    // Télémétry chaque 10 secondes au lieu de 60
}
else if (commandType == "disable_emergency_mode")
{
    emergencyMode = false;
    // Retour à 60 secondes
}
```

### Logs du Bracelet

```
MQTT message received on topic: bracelets/ESP32_A7670E_001/commands
Payload: {"command_id":1,"command_type":"vibrate_short","timestamp":"2025-12-29T15:31:00Z","duration":100}
⚙️ HANDLING COMMAND: vibrate_short
✓ ACK sent: {"command_id":1,"status":"executed","timestamp":"2025-12-29T15:31:01Z"}
```

---

## Flux 4: ACK du Bracelet (Bracelet → Backend)

### Publication de l'ACK

**TestModem/src/main.cpp** :
```cpp
// Après exécution de la commande

String ackPayload = "{\"command_id\":" + String(commandId) + ",\"status\":\"executed\",\"timestamp\":\"";

// Ajouter timestamp
int year, month, day, hour, minute, second;
if (modem.getNetworkTime(&year, &month, &day, &hour, &minute, &second, &milliseconds))
{
    char timeBuf[25];
    snprintf(timeBuf, sizeof(timeBuf), "%04d-%02d-%02dT%02d:%02d:%02dZ",
             year, month, day, hour, minute, second);
    ackPayload += String(timeBuf);
}

ackPayload += "\"}";

// Publier sur topic ACK
String ackTopic = "bracelets/" + String(BRACELET_UNIQUE_CODE) + "/ack";
mqttClient.publish(ackTopic.c_str(), ackPayload.c_str());
```

### Format de l'ACK

```json
{
  "command_id": 1,
  "status": "executed",
  "timestamp": "2025-12-29T15:31:01Z"
}
```

**ACK avec Erreur** :
```json
{
  "command_id": 5,
  "status": "failed",
  "error": "Unknown command type",
  "timestamp": "2025-12-29T15:32:00Z"
}
```

### Traitement du Backend

```bash
php artisan mqtt:listen-acks
```

**MqttListenAcksCommand.php** effectue :
1. Reçoit message sur `bracelets/{unique_code}/ack`
2. Extrait `command_id` et `status`
3. Cherche la commande en BD
4. Met à jour :
   ```php
   $command->update([
       'status' => 'executed',
       'executed_at' => now(),
   ])
   ```
5. Logs : `[local.INFO] Command executed on bracelet`

**Base de données** :
- ✅ `bracelet_commands.status` = 'executed'
- ✅ `bracelet_commands.executed_at` = timestamp
- ✅ Historique complet

---

## Architecture Complète des Topics MQTT

| Topic | Direction | Publié par | Écouté par | Contenu |
|-------|-----------|-----------|-----------|---------|
| `bracelets/{id}/telemetry` | Bracelet → Backend | Arduino | mqtt:listen | GPS, IMU, Network, Battery |
| `bracelets/{id}/commands` | Backend → Bracelet | Laravel API | Arduino | Vibrate, LED, Mode, Time |
| `bracelets/{id}/ack` | Bracelet → Backend | Arduino | mqtt:listen-acks | Command execution status |
| `bracelets/{id}/events` | Bracelet → Backend | Arduino | (future) | Fall, Emergency, Alert |

---

## Déploiement en Production

### 1. Migrer la Base de Données

```bash
cd leguardian-backend
php artisan migrate
```

Migrations :
- `create_bracelet_telemetry_table` (déjà appliquée)
- `add_metadata_to_bracelet_commands` (nouvelle)

### 2. Lancer les Listeners

```bash
# Terminal 1: Telemetry
php artisan mqtt:listen

# Terminal 2: ACKs
php artisan mqtt:listen-acks
```

### 3. Configurer Supervisor

**Version 1: Telemetry seulement** (avant)
```ini
[program:leguardian-mqtt-listener]
command=/usr/bin/php /path/to/artisan mqtt:listen
```

**Version 2: Deux daemons** (nouveau)
```ini
[program:leguardian-mqtt-telemetry]
command=/usr/bin/php /path/to/artisan mqtt:listen
autostart=true
autorestart=true

[program:leguardian-mqtt-acks]
command=/usr/bin/php /path/to/artisan mqtt:listen-acks
autostart=true
autorestart=true
```

### 4. Tester la Communication

**Test 1: Telemetry**
```bash
mosquitto_pub -h localhost -p 1883 -t "bracelets/TEST001/telemetry" -m '{"timestamp":"2025-12-29T15:30:00Z","emergency_mode":false,"gps":{"latitude":48.8,"longitude":2.3,"altitude":35,"satellites":12,"date":"29/12/2025","time":"15:30:00"},"network":{"signal_csq":15,"rsrp":"-110","rsrq":"-8","type":"LTE"},"imu":{"accel":{"x":0.1,"y":0.2,"z":9.8},"gyro":{"x":0.01,"y":0.01,"z":0.01},"temperature":28}}'
```

**Test 2: Command**
```bash
mosquitto_pub -h localhost -p 1883 -t "bracelets/TEST001/commands" -m '{"command_id":1,"command_type":"vibrate_short","timestamp":"2025-12-29T15:31:00Z","duration":100}'
```

**Test 3: ACK**
```bash
mosquitto_pub -h localhost -p 1883 -t "bracelets/TEST001/ack" -m '{"command_id":1,"status":"executed","timestamp":"2025-12-29T15:31:01Z"}'
```

---

## Scénarios d'Usage

### Scénario 1: Utilisateur Envoie une Vibration

1. **UI** : User taps "Alert" button on mobile app
2. **API** : `POST /api/mobile/bracelets/42/command` → `{"command_type": "vibrate_short"}`
3. **Laravel** :
   - Create `BraceletCommand` with status='pending'
   - Call `MqttCommandService::sendCommand()`
   - Publish to `bracelets/ESP32_A7670E_001/commands`
   - Update command status='sent'
   - Return success to mobile app
4. **Bracelet** :
   - Receives message on `/commands` topic
   - Parses JSON
   - Executes `vibrate(100)`
   - Sends ACK to `/ack` topic
5. **Backend** :
   - Listener receives ACK on `/ack` topic
   - Updates `BraceletCommand.status='executed'`
   - Mobile app polls and sees updated status

### Scénario 2: Auto-sync Emergency Mode

1. **Bracelet** détecte une chute (accélération anormale)
2. **Bracelet** active `emergencyMode = true`
3. **Bracelet** envoie télémétrie avec `emergency_mode: true`
4. **Backend** reçoit et met à jour `bracelet.status='emergency'`
5. **User** voit alert sur l'app
6. **User** peut envoyer `disable_emergency_mode` command
7. **Bracelet** reçoit et désactive
8. **Mode normal** reprend

### Scénario 3: Batch Commands (Multi-Vibrate)

```php
// Backend code
$command1 = BraceletCommand::create(['command_type' => 'vibrate_short']);
$command2 = BraceletCommand::create(['command_type' => 'led_on', 'led_color' => 'red']);
$command3 = BraceletCommand::create(['command_type' => 'vibrate_medium']);

foreach ([$command1, $command2, $command3] as $cmd) {
    $mqttService->sendCommand($cmd);
    sleep(0.5); // 500ms delay between commands
}
```

**Bracelet** exécute en séquence :
1. Vibrate 100ms
2. LED red solid
3. Vibrate 300ms
4. Envoi 3 ACKs

---

## Monitoring et Debugging

### Logs à Vérifier

```bash
# Laravel logs
tail -f leguardian-backend/storage/logs/laravel.log | grep -i mqtt

# Mosquitto logs
sudo tail -f /var/log/mosquitto/mosquitto.log

# Supervisor logs
sudo tail -f /var/log/supervisor/leguardian-mqtt-telemetry.log
tail -f leguardian-backend/storage/logs/mqtt-listener.log
```

### Vérifier les Topics

```bash
# Écouter tous les messages
mosquitto_sub -h localhost -p 1883 -t "bracelets/#"

# Écouter seulement telemetry
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/telemetry"

# Écouter seulement commands
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/commands"

# Écouter seulement ACKs
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/ack"
```

### Query la BD

```php
php artisan tinker

# Voir dernière commande
>>> $cmd = BraceletCommand::latest()->first();
>>> $cmd->status
>>> $cmd->executed_at

# Voir telemetry
>>> $t = BraceletTelemetry::latest()->first();
>>> $t->latitude
>>> $t->longitude
>>> $t->battery_level

# Voir bracelet status
>>> $b = Bracelet::find(42);
>>> $b->status
>>> $b->last_ping_at
>>> $b->emergency_mode
```

---

## Résumé

✅ **Communication Complète** :
- Bracelet → Backend (Telemetry)
- Backend → Bracelet (Commands)
- Bracelet → Backend (ACKs)

✅ **Architecture** :
- 2 listeners (Telemetry + ACKs)
- 1 service de publication (MqttCommandService)
- 3 endpoints API (vibrate, sendCommand, etc.)
- Full bidirectional MQTT

✅ **Prêt pour Production** :
- Auto-enregistrement des bracelets
- Gestion complète des commands
- ACK et retry logic
- Logging et monitoring
