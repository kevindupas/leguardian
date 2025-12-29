# Migration HTTP → MQTT Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace HTTP-based bracelet communication with MQTT over WebSockets for better reliability, lower latency, and persistent connections.

**Architecture:**
- Install and configure Mosquitto broker with WebSocket support on the server
- Implement Laravel MQTT client to subscribe to bracelet telemetry topics
- Adapt Arduino code to use MQTT over WebSockets (PubSubClient library)
- Implement bidirectional communication for future command support

**Tech Stack:** Mosquitto, PubSubClient (Arduino), MQTT PHP library (laravel-mqtt or pure MQTT client), WebSockets (port 9001)

---

## Task 1: Install and Configure Mosquitto on Server

**Files:**
- Create: `/etc/mosquitto/conf.d/websockets.conf`
- Modify: `/etc/mosquitto/mosquitto.conf`

**Step 1: SSH into your server and install Mosquitto**

Run:
```bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients
```

Expected: Installation completes successfully

**Step 2: Enable Mosquitto service**

Run:
```bash
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

Expected: Service starts without errors

**Step 3: Configure WebSocket support in Mosquitto**

Edit `/etc/mosquitto/mosquitto.conf` and add at the end:

```conf
# Standard MQTT port
listener 1883
protocol mqtt

# WebSocket port (unencrypted for now)
listener 9001
protocol websockets
```

**Step 4: Restart Mosquitto**

Run:
```bash
sudo systemctl restart mosquitto
```

Expected: Service restarts without errors

**Step 5: Test Mosquitto is running**

Run:
```bash
sudo mosquitto_sub -h localhost -p 1883 -t "test/topic" &
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "Hello MQTT"
```

Expected: Both commands complete, message appears in subscriber

**Step 6: Kill the background subscriber**

Run:
```bash
pkill mosquitto_sub
```

**Step 7: Commit this step**

Run:
```bash
git add /etc/mosquitto/
git commit -m "feat: configure mosquitto with websocket support on port 9001"
```

---

## Task 2: Set Up Laravel MQTT Client Package

**Files:**
- Modify: `leguardian-backend/composer.json`
- Modify: `leguardian-backend/config/mqtt.php` (new)
- Modify: `leguardian-backend/.env`

**Step 1: Add MQTT PHP library to composer**

Run from `leguardian-backend/`:
```bash
composer require php-mqtt/client
```

Expected: Package installed successfully

**Step 2: Create MQTT configuration file**

Create `leguardian-backend/config/mqtt.php`:

```php
<?php

return [
    'host' => env('MQTT_HOST', '127.0.0.1'),
    'port' => env('MQTT_PORT', 1883),
    'username' => env('MQTT_USERNAME', null),
    'password' => env('MQTT_PASSWORD', null),
    'client_id' => env('MQTT_CLIENT_ID', 'leguardian-backend'),
    'protocol' => env('MQTT_PROTOCOL', 'tcp'),
];
```

**Step 3: Add MQTT configuration to .env**

Add to `leguardian-backend/.env`:

```env
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=leguardian-backend
MQTT_PROTOCOL=tcp
```

**Step 4: Commit**

Run:
```bash
cd leguardian-backend
git add composer.json composer.lock config/mqtt.php .env
git commit -m "feat: add php-mqtt client package and configuration"
```

---

## Task 3: Create MQTT Service Class in Laravel

**Files:**
- Create: `leguardian-backend/app/Services/MqttService.php`

**Step 1: Write the MQTT Service class**

Create `leguardian-backend/app/Services/MqttService.php`:

```php
<?php

namespace App\Services;

use PhpMqtt\Client\Client;
use PhpMqtt\Client\ConnectionSettings;

class MqttService
{
    protected Client $client;
    protected bool $connected = false;

    public function __construct()
    {
        $connectionSettings = (new ConnectionSettings())
            ->setUsername(config('mqtt.username'))
            ->setPassword(config('mqtt.password'))
            ->setKeepAliveInterval(60)
            ->setUseTls(false);

        $this->client = new Client(
            config('mqtt.host'),
            config('mqtt.port'),
            config('mqtt.client_id'),
            null,
            $connectionSettings
        );
    }

    public function connect(): bool
    {
        try {
            $this->client->connect();
            $this->connected = true;
            return true;
        } catch (\Exception $e) {
            \Log::error('MQTT Connection failed: ' . $e->getMessage());
            return false;
        }
    }

    public function disconnect(): void
    {
        if ($this->connected) {
            $this->client->disconnect();
            $this->connected = false;
        }
    }

    public function publish(string $topic, string $message, int $qos = 0): bool
    {
        try {
            $this->client->publish($topic, $message, $qos);
            return true;
        } catch (\Exception $e) {
            \Log::error('MQTT Publish failed: ' . $e->getMessage());
            return false;
        }
    }

    public function subscribe(string $topic, callable $callback, int $qos = 0): void
    {
        try {
            $this->client->subscribe($topic, $callback, $qos);
        } catch (\Exception $e) {
            \Log::error('MQTT Subscribe failed: ' . $e->getMessage());
        }
    }

    public function isConnected(): bool
    {
        return $this->connected;
    }

    public function getClient(): Client
    {
        return $this->client;
    }
}
```

**Step 2: Commit**

Run:
```bash
cd leguardian-backend
git add app/Services/MqttService.php
git commit -m "feat: create MqttService for MQTT communication"
```

---

## Task 4: Create Laravel Console Command for MQTT Listener

**Files:**
- Create: `leguardian-backend/app/Console/Commands/MqttListenCommand.php`
- Modify: `leguardian-backend/app/Models/Device.php` (existing, need to add method)

**Step 1: Create the MQTT listener command**

Create `leguardian-backend/app/Console/Commands/MqttListenCommand.php`:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MqttService;
use App\Models\Device;
use Illuminate\Support\Facades\Log;

class MqttListenCommand extends Command
{
    protected $signature = 'mqtt:listen';
    protected $description = 'Listen for MQTT messages from bracelets';

    public function handle()
    {
        $mqtt = new MqttService();

        if (!$mqtt->connect()) {
            $this->error('Failed to connect to MQTT broker');
            return 1;
        }

        $this->info('Connected to MQTT broker');

        // Subscribe to all bracelet telemetry topics
        $mqtt->subscribe('bracelets/+/telemetry', function ($topic, $message) {
            $this->processTelemetry($topic, $message);
        });

        // Keep listening
        $this->info('Listening for MQTT messages (Ctrl+C to exit)...');

        try {
            while (true) {
                $mqtt->getClient()->loop(true, 1);
            }
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
        } finally {
            $mqtt->disconnect();
        }

        return 0;
    }

    private function processTelemetry(string $topic, string $message): void
    {
        try {
            // Extract bracelet_id from topic: bracelets/{bracelet_id}/telemetry
            $parts = explode('/', $topic);
            $braceletId = $parts[1] ?? null;

            if (!$braceletId) {
                Log::warning('Invalid MQTT topic format: ' . $topic);
                return;
            }

            // Find device by unique code
            $device = Device::where('unique_code', $braceletId)->first();
            if (!$device) {
                Log::warning('Device not found: ' . $braceletId);
                return;
            }

            // Parse JSON message
            $data = json_decode($message, true);
            if (!$data) {
                Log::warning('Invalid JSON received: ' . $message);
                return;
            }

            // Store telemetry (create new record or update)
            $device->updateTelemetry($data);

            Log::info('Telemetry received from ' . $braceletId);
        } catch (\Exception $e) {
            Log::error('Error processing MQTT telemetry: ' . $e->getMessage());
        }
    }
}
```

**Step 2: Commit**

Run:
```bash
cd leguardian-backend
git add app/Console/Commands/MqttListenCommand.php
git commit -m "feat: create MQTT listener console command"
```

---

## Task 5: Add updateTelemetry Method to Device Model

**Files:**
- Modify: `leguardian-backend/app/Models/Device.php`

**Step 1: Read the current Device model to understand its structure**

Run:
```bash
cat leguardian-backend/app/Models/Device.php
```

**Step 2: Add the updateTelemetry method to Device model**

Add this method to `App\Models\Device` class (before the closing brace):

```php
public function updateTelemetry(array $telemetryData): void
{
    // Create telemetry record
    $this->telemetryData()->create([
        'timestamp' => $telemetryData['timestamp'] ?? now(),
        'latitude' => $telemetryData['gps']['latitude'] ?? null,
        'longitude' => $telemetryData['gps']['longitude'] ?? null,
        'altitude' => $telemetryData['gps']['altitude'] ?? null,
        'satellites' => $telemetryData['gps']['satellites'] ?? null,
        'gps_date' => $telemetryData['gps']['date'] ?? null,
        'gps_time' => $telemetryData['gps']['time'] ?? null,
        'signal_csq' => $telemetryData['network']['signal_csq'] ?? null,
        'rsrp' => $telemetryData['network']['rsrp'] ?? null,
        'rsrq' => $telemetryData['network']['rsrq'] ?? null,
        'network_type' => $telemetryData['network']['type'] ?? null,
        'accel_x' => $telemetryData['imu']['accel']['x'] ?? null,
        'accel_y' => $telemetryData['imu']['accel']['y'] ?? null,
        'accel_z' => $telemetryData['imu']['accel']['z'] ?? null,
        'gyro_x' => $telemetryData['imu']['gyro']['x'] ?? null,
        'gyro_y' => $telemetryData['imu']['gyro']['y'] ?? null,
        'gyro_z' => $telemetryData['imu']['gyro']['z'] ?? null,
        'imu_temperature' => $telemetryData['imu']['temperature'] ?? null,
        'emergency_mode' => $telemetryData['emergency_mode'] ?? false,
    ]);
}

public function telemetryData()
{
    return $this->hasMany(DeviceTelemetry::class);
}
```

**Step 3: Commit**

Run:
```bash
cd leguardian-backend
git add app/Models/Device.php
git commit -m "feat: add updateTelemetry method to Device model"
```

---

## Task 6: Install PubSubClient Library on Arduino

**Files:**
- Modify: `TestModem/platformio.ini` (or arduino project file)

**Step 1: Add PubSubClient to platformio.ini**

Edit `TestModem/platformio.ini` and add to dependencies:

```ini
lib_deps =
    ...existing deps...
    knolleary/PubSubClient@^2.8
```

Or if using Arduino IDE, install via Library Manager: `PubSubClient` by Nick O'Leary

**Step 2: Verify installation**

Run:
```bash
cd TestModem
pio lib list
```

Expected: PubSubClient appears in the list

**Step 3: Commit**

Run:
```bash
cd TestModem
git add platformio.ini
git commit -m "feat: add PubSubClient MQTT library for Arduino"
```

---

## Task 7: Refactor Arduino Code to Use MQTT

**Files:**
- Modify: `TestModem/src/main.cpp`

**Step 1: Add MQTT includes and configuration**

At the top of `main.cpp`, after existing includes, add:

```cpp
#include <PubSubClient.h>

// MQTT Configuration
#define MQTT_SERVER "YOUR_SERVER_IP"
#define MQTT_PORT 9001  // WebSocket port
#define MQTT_RECONNECT_INTERVAL 5000  // Reconnect every 5 seconds if disconnected

// MQTT Topics
#define MQTT_TOPIC_TELEMETRY "bracelets/" BRACELET_UNIQUE_CODE "/telemetry"
#define MQTT_TOPIC_COMMANDS "bracelets/" BRACELET_UNIQUE_CODE "/commands"

// MQTT Client
WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long lastMqttReconnect = 0;
bool mqttConnected = false;
```

**Step 2: Add MQTT connection function**

Add before `setup()`:

```cpp
void connectToMqtt()
{
  if (millis() - lastMqttReconnect < MQTT_RECONNECT_INTERVAL)
    return;

  lastMqttReconnect = millis();

  if (mqttClient.connected())
  {
    mqttConnected = true;
    return;
  }

  SerialMon.println("Attempting MQTT connection...");

  if (mqttClient.connect(BRACELET_UNIQUE_CODE))
  {
    SerialMon.println("✓ MQTT connected");
    mqttConnected = true;

    // Subscribe to commands topic
    mqttClient.subscribe(MQTT_TOPIC_COMMANDS);

    // LED indication: green on
    leds.setPixelColor(0, leds.Color(0, 255, 0));
    leds.show();
  }
  else
  {
    SerialMon.print("✗ MQTT failed, rc=");
    SerialMon.println(mqttClient.state());
    mqttConnected = false;

    // LED indication: red flash
    leds.setPixelColor(0, leds.Color(255, 0, 0));
    leds.show();
  }
}
```

**Step 3: Add MQTT callback for commands**

Add before `setup()`:

```cpp
void onMqttMessage(char *topic, byte *payload, unsigned int length)
{
  SerialMon.print("MQTT message received on topic: ");
  SerialMon.println(topic);

  // Convert payload to string
  String message = "";
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  SerialMon.print("Payload: ");
  SerialMon.println(message);

  // Handle commands from server
  if (strcmp(topic, MQTT_TOPIC_COMMANDS) == 0)
  {
    // Parse JSON command
    // Example: {"action": "vibrate", "duration": 200}
    // Can add command handling here in future
  }
}
```

**Step 4: Modify setup() to initialize MQTT**

In the `setup()` function, after network initialization (after `modem.gprsConnect()`), add:

```cpp
// Initialize MQTT
SerialMon.println("\nInitializing MQTT...");
mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
mqttClient.setCallback(onMqttMessage);
mqttClient.setBufferSize(2048);  // For larger JSON payloads

// Attempt initial connection
connectToMqtt();
```

**Step 5: Modify loop() to use MQTT instead of HTTP**

Replace the HTTP sending section (lines 879-906) with:

```cpp
// Ensure MQTT connection is maintained
connectToMqtt();

// Send data based on mode - ONLY IF ASSOCIATED AND MQTT CONNECTED
unsigned long sendInterval = emergencyMode ? SEND_INTERVAL_EMERGENCY : SEND_INTERVAL_NORMAL;

if (braceletAssociated && mqttConnected && (now - lastDataTransmission > sendInterval))
{
  SerialMon.println("\n📤 === Envoi des données via MQTT ===");
  String payload = buildJsonPayload(currentGpsData, currentImuData);

  SerialMon.print("Mode: ");
  SerialMon.println(emergencyMode ? "URGENCE" : "NORMAL");
  SerialMon.print("Topic: ");
  SerialMon.println(MQTT_TOPIC_TELEMETRY);
  SerialMon.print("Payload: ");
  SerialMon.println(payload);

  if (mqttClient.publish(MQTT_TOPIC_TELEMETRY, payload.c_str()))
  {
    lastDataTransmission = now;
    SerialMon.println("✓ Transmission MQTT réussie");
    vibrate(100);

    // LED vert fixe pendant 500ms
    leds.setPixelColor(0, leds.Color(0, 255, 0));
    leds.show();
    delay(500);
    leds.setPixelColor(0, 0);
    leds.show();
  }
  else
  {
    SerialMon.println("✗ Erreur MQTT publish");
  }
}
else if (!braceletAssociated && (now - lastDataTransmission > sendInterval))
{
  SerialMon.println("⚠️  Not sending data - bracelet not associated");
  lastDataTransmission = now;
}
else if (!mqttConnected && braceletAssociated)
{
  SerialMon.println("⚠️  Waiting for MQTT connection...");
}
```

**Step 6: Add MQTT loop in main loop()**

In the main `loop()` function, after `handleButton()`, add:

```cpp
// Maintain MQTT connection
if (mqttConnected)
{
  mqttClient.loop();
}
```

**Step 7: Remove old HTTP sending function**

Delete the old `sendDataViaHTTP()` function (lines 204-286).

**Step 8: Commit**

Run:
```bash
cd TestModem
git add src/main.cpp
git commit -m "feat: migrate from HTTP to MQTT over WebSockets"
```

---

## Task 8: Test MQTT Connection Locally

**Files:**
- No code changes, testing only

**Step 1: Build Arduino code**

Run:
```bash
cd TestModem
pio run
```

Expected: Build succeeds

**Step 2: Upload to device**

Run:
```bash
cd TestModem
pio run -t upload
```

Expected: Upload succeeds

**Step 3: Monitor serial output**

Run:
```bash
cd TestModem
pio device monitor -b 115200
```

Expected: See initialization logs, then "Attempting MQTT connection..."

**Step 4: In another terminal, publish test message**

Run:
```bash
mosquitto_pub -h 127.0.0.1 -p 1883 -t "bracelets/ESP32_A7670E_001/commands" -m '{"action":"test"}'
```

**Step 5: Verify in serial monitor**

Expected: See "MQTT message received" log with the test command

**Step 6: Stop monitoring (Ctrl+C in monitor terminal)**

---

## Task 9: Run Laravel MQTT Listener

**Files:**
- No code changes, testing only

**Step 1: In a new terminal, start the MQTT listener**

Run:
```bash
cd leguardian-backend
php artisan mqtt:listen
```

Expected: See "Connected to MQTT broker" and "Listening for MQTT messages..."

**Step 2: Trigger telemetry send on bracelet**

Either:
- Wait for next scheduled send (3 minutes normal, 1 minute emergency)
- Or manually trigger by pressing button for 3+ seconds for emergency mode

**Step 3: Verify telemetry received in Laravel terminal**

Expected: See "Telemetry received from ESP32_A7670E_001"

**Step 4: Check database**

Run:
```bash
cd leguardian-backend
php artisan tinker
```

Then in tinker:
```php
Device::find(1)->telemetryData()->latest()->first();
```

Expected: Latest telemetry record shows correct GPS/IMU data

**Step 5: Stop the listener (Ctrl+C)**

---

## Task 10: Add MQTT to AppServiceProvider (Optional Auto-Start)

**Files:**
- Modify: `leguardian-backend/app/Providers/AppServiceProvider.php`

**Step 1: Update AppServiceProvider to register MQTT service**

Add to the `boot()` method in `AppServiceProvider.php`:

```php
// Register MQTT service as singleton (optional, for manual usage)
$this->app->singleton('mqtt', function ($app) {
    return new \App\Services\MqttService();
});
```

**Step 2: Commit**

Run:
```bash
cd leguardian-backend
git add app/Providers/AppServiceProvider.php
git commit -m "feat: register MQTT service in container"
```

---

## Task 11: Document Setup and Configuration

**Files:**
- Create: `docs/MQTT_SETUP.md`

**Step 1: Create documentation file**

Create `docs/MQTT_SETUP.md`:

```markdown
# MQTT Setup Documentation

## Overview
This system uses MQTT (via Mosquitto) for reliable, persistent communication between bracelets and the backend server.

## Architecture

### Topics
- `bracelets/{bracelet_id}/telemetry` - Bracelet sends GPS, IMU, and network data
- `bracelets/{bracelet_id}/commands` - Server sends commands to bracelet

### Data Flow
1. Bracelet connects to MQTT broker via WebSocket (port 9001)
2. Every 3 minutes (normal) or 1 minute (emergency), publishes telemetry as JSON
3. Laravel MQTT listener subscribes to all `bracelets/+/telemetry` topics
4. Telemetry data stored in database

## Installation

### Server Setup

1. **Install Mosquitto:**
   ```bash
   sudo apt-get update
   sudo apt-get install mosquitto mosquitto-clients
   ```

2. **Configure WebSocket support:**
   Edit `/etc/mosquitto/mosquitto.conf` and add:
   ```conf
   listener 1883
   protocol mqtt

   listener 9001
   protocol websockets
   ```

3. **Restart Mosquitto:**
   ```bash
   sudo systemctl restart mosquitto
   ```

4. **Test:**
   ```bash
   mosquitto_pub -h localhost -p 1883 -t "test" -m "hello"
   ```

### Laravel Setup

1. **Install PHP MQTT client:**
   ```bash
   cd leguardian-backend
   composer require php-mqtt/client
   ```

2. **Configure .env:**
   ```env
   MQTT_HOST=127.0.0.1
   MQTT_PORT=1883
   MQTT_USERNAME=
   MQTT_PASSWORD=
   ```

3. **Start listener (in production, use supervisor):**
   ```bash
   php artisan mqtt:listen
   ```

### Arduino Setup

1. **Install PubSubClient library:**
   - Via PlatformIO: Add `knolleary/PubSubClient@^2.8` to `platformio.ini`
   - Via Arduino IDE: Search "PubSubClient" in Library Manager

2. **Configure Arduino code:**
   Update `MQTT_SERVER` to your server IP/domain

3. **Upload to device**

## Monitoring

### Check Mosquitto status
```bash
sudo systemctl status mosquitto
```

### View Mosquitto logs
```bash
sudo tail -f /var/log/mosquitto/mosquitto.log
```

### Test MQTT connection
```bash
# Subscribe to all topics
mosquitto_sub -h 127.0.0.1 -p 1883 -t "bracelets/#"

# In another terminal, publish test
mosquitto_pub -h 127.0.0.1 -p 1883 -t "bracelets/test/telemetry" -m '{"test":"data"}'
```

## Production Deployment

### Security (TLS/SSL)

1. **Generate or obtain SSL certificate** (Let's Encrypt recommended)

2. **Update mosquitto.conf:**
   ```conf
   listener 9001
   protocol websockets
   cafile /etc/letsencrypt/live/yourdomain.com/chain.pem
   certfile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
   keyfile /etc/letsencrypt/live/yourdomain.com/privkey.pem
   ```

3. **Update Arduino code:**
   ```cpp
   #define MQTT_SERVER "yourdomain.com"
   // Add SSL verification if needed
   ```

4. **Restart Mosquitto**

### Supervisor Setup (for MQTT listener)

Create `/etc/supervisor/conf.d/mqtt-listener.conf`:
```ini
[program:mqtt-listener]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/leguardian-backend/artisan mqtt:listen
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/mqtt-listener.log
```

Reload supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mqtt-listener:*
```

## Troubleshooting

### Bracelet not connecting to MQTT
- Check if Mosquitto is running: `sudo systemctl status mosquitto`
- Check firewall: Ensure port 9001 (WebSocket) is open
- Check Arduino logs (serial monitor) for error messages
- Verify `MQTT_SERVER` IP in Arduino code matches server IP

### Laravel not receiving messages
- Check if listener is running: `ps aux | grep "mqtt:listen"`
- Check Laravel logs: `tail -f leguardian-backend/storage/logs/laravel.log`
- Test MQTT directly: `mosquitto_sub -h localhost -p 1883 -t "bracelets/#"`

### High latency/messages not arriving
- Check network connection on device (serial monitor logs)
- Check Mosquitto logs: `sudo tail -f /var/log/mosquitto/mosquitto.log`
- Ensure QoS settings appropriate (0 = fire-and-forget, 1 = at-least-once)

```

**Step 2: Commit**

Run:
```bash
git add docs/MQTT_SETUP.md
git commit -m "docs: add comprehensive MQTT setup and configuration guide"
```

---

## Summary

This plan implements:
- ✅ Mosquitto MQTT broker with WebSocket support
- ✅ Laravel MQTT client and listener service
- ✅ Arduino PubSubClient integration
- ✅ Bidirectional MQTT communication
- ✅ Complete documentation

**Total time estimate:** 2-3 hours for implementation + testing

---

