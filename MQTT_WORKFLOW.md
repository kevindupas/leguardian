# MQTT Communication Workflow - Complete Guide

## Overview

This document describes the complete end-to-end workflow for MQTT communication between bracelets, the Laravel backend, and the web/mobile applications.

## Architecture

```
┌─────────────┐                    ┌──────────────┐                 ┌────────────┐
│  Bracelet   │                    │  Mosquitto   │                 │  Laravel   │
│ (ESP32+4G)  │ ◄─────MQTT────────►│   Broker     │ ◄──MQTT────────┤  Backend   │
│             │                    │  (port 1883) │                 │            │
└─────────────┘                    │  (port 9001) │                 └────────────┘
                                   └──────────────┘                        │
                                                                           │
                                                                      ┌─────▼─────┐
                                                                      │  Laravel   │
                                                                      │   Artisan  │
                                                                      │  Command   │
                                                                      │ mqtt:listen│
                                                                      └────────────┘
```

## Step-by-Step Workflow

### 1. Bracelet Initialization (First Power On)

**Scenario**: A new bracelet with unique code `ESP32_NEW_001` is powered on for the first time.

**Bracelet Actions**:
- Connects to 4G network via SIM7600 modem
- Attempts MQTT connection to `tracklify.app:9001` (WebSocket MQTT)
- Uses `ESP32_NEW_001` as MQTT client ID
- Waits for user association via the mobile/web app

**System State**:
- Bracelet is **NOT** in the database yet
- LED: Red (indicating not associated/not paired)
- Does NOT send telemetry yet (waiting for association)

### 2. Automatic Registration (First Telemetry Message)

**Scenario**: User manually triggers first data transmission or bracelet auto-sends test message.

**Bracelet Actions**:
```cpp
// Publishes to: bracelets/ESP32_NEW_001/telemetry
{
  "timestamp": "2025-12-29T15:30:00Z",
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
    "rsrp": -110,
    "rsrq": -8,
    "type": "LTE"
  },
  "imu": {
    "accel": {"x": 0.1, "y": 0.2, "z": 9.8},
    "gyro": {"x": 0.01, "y": 0.01, "z": 0.01},
    "temperature": 28
  },
  "emergency_mode": false
}
```

**Laravel Listener (mqtt:listen)**:
1. Receives message from topic `bracelets/ESP32_NEW_001/telemetry`
2. Extracts bracelet_id: `ESP32_NEW_001`
3. Searches database: `Bracelet::where('unique_code', 'ESP32_NEW_001')->first()`
4. **Bracelet NOT found** → Auto-registers:
   ```php
   Bracelet::create([
       'unique_code' => 'ESP32_NEW_001',
       'name' => 'Bracelet ESP32_NEW_001',
       'status' => 'online',
       'is_paired' => false,
       'battery_level' => 0,
   ])
   ```
5. Logs: `[local.INFO] New bracelet auto-registered: ESP32_NEW_001 (ID: 42)`
6. Stores telemetry record in `bracelet_telemetry` table
7. Updates bracelet status to `online` with `last_ping_at`

**Database State**:
- New `Bracelet` record created with ID 42
- Status: `online` (because telemetry received)
- `is_paired`: `false` (no user assigned yet)
- `guardian_id`: `null` (no user assigned yet)
- One `BraceletTelemetry` record stored

### 3. User Association (Pairing)

**Scenario**: User opens mobile app, scans QR code or enters `ESP32_NEW_001`, and pairs it to their account.

**Mobile/Web App Request**:
```http
POST /api/mobile/bracelets/register
Content-Type: application/json
Authorization: Bearer {user_token}

{
  "unique_code": "ESP32_NEW_001",
  "alias": "John's Bracelet"
}
```

**Laravel API Processing (BraceletController::register)**:
1. Validates request
2. Looks up bracelet: `Bracelet::where('unique_code', 'ESP32_NEW_001')->first()`
3. Checks if already paired to another user (returns error if true)
4. Updates bracelet:
   ```php
   $bracelet->update([
       'guardian_id' => 1,           // User ID
       'is_paired' => true,
       'paired_at' => now(),
       'status' => 'active',
       'alias' => 'John\'s Bracelet',
   ])
   ```
5. Creates pivot table record in `bracelet_guardian`:
   ```php
   $bracelet->guardians()->attach(1, [
       'role' => 'owner',
       'can_edit' => true,
       'can_view_location' => true,
       'can_view_events' => true,
       'can_send_commands' => true,
       'shared_at' => now(),
       'accepted_at' => now(),
   ])
   ```
6. Sends Discord notification of pairing
7. Returns success response with bracelet data

**Database State**:
```sql
-- Bracelet table
UPDATE bracelets SET
  guardian_id = 1,
  is_paired = true,
  paired_at = '2025-12-29 15:45:00',
  status = 'active',
  alias = 'John\'s Bracelet'
WHERE unique_code = 'ESP32_NEW_001'

-- Bracelet Guardian pivot table
INSERT INTO bracelet_guardian (
  bracelet_id, guardian_id, role, can_edit,
  can_view_location, can_view_events, can_send_commands,
  shared_at, accepted_at, created_at, updated_at
) VALUES (
  42, 1, 'owner', true, true, true, true,
  '2025-12-29 15:45:00', '2025-12-29 15:45:00',
  '2025-12-29 15:45:00', '2025-12-29 15:45:00'
)
```

### 4. Continuous Telemetry Reception

**Scenario**: Bracelet is paired and continues sending telemetry data.

**Bracelet Actions** (normal mode):
- Every 60 seconds: Publishes telemetry to `bracelets/ESP32_NEW_001/telemetry`
- LED: Green (indicating paired and connected)
- Monitors battery, GPS, IMU, and network status
- Checks for commands from server (not yet implemented)

**Emergency Mode**:
- If fall detected or manual SOS activated
- Every 10 seconds: Publishes telemetry
- Changes `emergency_mode` field to `true`
- LED: Red blinking

**Laravel Listener Processing**:
1. Each message received and logged
2. Telemetry stored in `bracelet_telemetry` table
3. Bracelet status updated:
   - `status`: 'online'
   - `last_ping_at`: current timestamp
   - `last_latitude`, `last_longitude`: latest GPS coordinates
   - `last_accuracy`: GPS accuracy
   - `battery_level`: from telemetry data
   - `emergency_mode`: from telemetry data

**Database Results**:
```sql
-- One new row in bracelet_telemetry table every 60 seconds
INSERT INTO bracelet_telemetry (bracelet_id, timestamp, latitude, longitude, ...)
VALUES (42, '2025-12-29 15:31:00', 48.8566, 2.3522, ...);

-- Bracelet record updated with latest data
UPDATE bracelets SET
  status = 'online',
  last_ping_at = '2025-12-29 15:31:00',
  last_latitude = 48.8566,
  last_longitude = 2.3522,
  battery_level = 85,
  emergency_mode = false
WHERE id = 42;
```

### 5. User Views Bracelet Status

**Scenario**: User opens mobile app to check bracelet location.

**Mobile/Web App Request**:
```http
GET /api/mobile/bracelets/42
Authorization: Bearer {user_token}
```

**Laravel API Response (BraceletController::show)**:
```json
{
  "bracelet": {
    "id": 42,
    "unique_code": "ESP32_NEW_001",
    "name": "Bracelet ESP32_NEW_001",
    "alias": "John's Bracelet",
    "status": "online",
    "battery_level": 85,
    "last_ping_at": "2025-12-29T15:31:00Z",
    "is_paired": true,
    "emergency_mode": false,
    "created_at": "2025-12-29T15:30:00Z",
    "updated_at": "2025-12-29T15:31:00Z"
  },
  "last_location": {
    "latitude": 48.8566,
    "longitude": 2.3522,
    "accuracy": 10,
    "updated_at": "2025-12-29T15:31:00Z"
  },
  "status_info": {
    "status": "online",
    "emergency_mode": false,
    "battery_level": 85,
    "last_ping_at": "2025-12-29T15:31:00Z"
  }
}
```

### 6. Emergency Detection

**Scenario**: Bracelet detects fall or user triggers SOS button.

**Bracelet Actions**:
- Sets `emergency_mode` to `true`
- Increases send frequency to every 10 seconds (vs 60 seconds normal)
- Publishes with `emergency_mode: true`
- LED: Red blinking pattern

**Laravel Processing**:
1. Listener receives message with `emergency_mode: true`
2. Creates event in `bracelet_events` table (not implemented in listener yet)
3. Updates bracelet `status` to 'emergency'
4. Updates `emergency_mode` flag
5. Would trigger notification to associated users (future feature)

**Mobile App Behavior**:
- Shows emergency alert
- Displays real-time location
- Provides quick action buttons (acknowledge, resolve, call emergency services)

## Configuration Files

### Arduino Configuration (TestModem/src/main.cpp)

```cpp
#define MQTT_SERVER "tracklify.app"
#define MQTT_PORT 9001  // WebSocket MQTT for 4G connectivity

#define MQTT_TOPIC_TELEMETRY "bracelets/" BRACELET_UNIQUE_CODE "/telemetry"
#define MQTT_TOPIC_COMMANDS "bracelets/" BRACELET_UNIQUE_CODE "/commands"

#define SEND_INTERVAL_NORMAL 60000      // 60 seconds normal mode
#define SEND_INTERVAL_EMERGENCY 10000   // 10 seconds emergency mode
```

### Laravel Configuration (leguardian-backend/.env)

```env
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_CLIENT_ID=leguardian-backend
MQTT_PROTOCOL=tcp
```

### Mosquitto Configuration (Server)

**Port 1883 (MQTT)**: For Laravel backend internal communication
**Port 9001 (WebSocket MQTT)**: For Arduino bracelet over 4G (uses WebSocket protocol)

Both ports use TLS with Let's Encrypt certificates from tracklify.app

## Running the Listener

### Development

```bash
cd leguardian-backend
php artisan mqtt:listen
```

### Production with Supervisor

1. Install supervisor:
```bash
sudo apt-get install supervisor
```

2. Copy config to supervisor:
```bash
sudo cp supervisord.conf /etc/supervisor/conf.d/leguardian-mqtt.conf
```

3. Start the daemon:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start leguardian-mqtt-listener:*
```

4. Monitor:
```bash
sudo supervisorctl status
tail -f storage/logs/mqtt-listener.log
```

## Testing the Workflow

### Step 1: Start MQTT Listener

```bash
cd leguardian-backend
php artisan mqtt:listen
```

Expected output:
```
Connected to MQTT broker
Listening for MQTT messages (Ctrl+C to exit)...
```

### Step 2: Publish Test Message

```bash
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -t "bracelets/ESP32_TEST_001/telemetry" \
  -m '{
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
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
      "rsrp": -110,
      "rsrq": -8,
      "type": "LTE"
    },
    "imu": {
      "accel": {"x": 0.1, "y": 0.2, "z": 9.8},
      "gyro": {"x": 0.01, "y": 0.01, "z": 0.01},
      "temperature": 28
    },
    "emergency_mode": false
  }'
```

### Step 3: Verify Registration

```bash
# Check listener output
# Should show: "New bracelet auto-registered: ESP32_TEST_001 (ID: ...)"

# Check database
php artisan tinker
>>> Bracelet::where('unique_code', 'ESP32_TEST_001')->first()
```

### Step 4: Associate with User

```bash
curl -X POST http://localhost:8000/api/mobile/bracelets/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user_token}" \
  -d '{
    "unique_code": "ESP32_TEST_001",
    "alias": "Test Bracelet"
  }'
```

### Step 5: Verify Association

```bash
# Check in tinker
php artisan tinker
>>> $b = Bracelet::where('unique_code', 'ESP32_TEST_001')->first()
>>> $b->is_paired  // Should be true
>>> $b->guardian_id  // Should be 1 (your user ID)
>>> $b->guardians()->get()  // Should show user with role 'owner'
```

## Troubleshooting

### Bracelet Not Registering

**Problem**: Listener shows "Bracelet not found" but bracelet is sending messages

**Solution**:
1. Check MQTT connection:
```bash
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/telemetry"
# Should see messages coming in
```

2. Check listener is running:
```bash
sudo supervisorctl status leguardian-mqtt-listener
# Should show: running
```

3. Check logs:
```bash
tail -f storage/logs/mqtt-listener.log
```

### User Can't Pair Bracelet

**Problem**: API returns "Bracelet not found"

**Solution**:
1. Verify bracelet is in database:
```bash
php artisan tinker
>>> Bracelet::where('unique_code', 'ESP32_XXX')->exists()
```

2. If not exists, manually create it or send one telemetry message from bracelet

3. Verify user has correct token with sufficient permissions

### Data Not Appearing in Database

**Problem**: Listener shows "Telemetry received" but no data in DB

**Solution**:
1. Check telemetry table exists:
```bash
php artisan migrate --check
```

2. Verify JSON structure matches expected format

3. Check database logs:
```bash
tail -f storage/logs/laravel.log | grep -i telemetry
```

## Data Structure Reference

### Bracelet Model

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| guardian_id | integer | Owner user ID |
| unique_code | string | Unique device identifier (e.g., ESP32_A7670E_001) |
| name | string | Display name |
| alias | string | User-friendly name |
| status | enum | 'online', 'offline', 'emergency', 'active', 'inactive' |
| battery_level | integer | Current battery percentage (0-100) |
| last_ping_at | datetime | Last telemetry received timestamp |
| is_paired | boolean | Whether associated with a user |
| last_latitude | float | Latest GPS latitude |
| last_longitude | float | Latest GPS longitude |
| last_accuracy | integer | GPS accuracy in meters |
| last_location_update | datetime | When location was last updated |
| emergency_mode | boolean | Whether currently in emergency state |

### BraceletTelemetry Model

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| bracelet_id | integer | FK to bracelet |
| timestamp | datetime | When data was collected |
| latitude | float | GPS latitude |
| longitude | float | GPS longitude |
| altitude | float | GPS altitude in meters |
| satellites | integer | Number of GPS satellites |
| signal_csq | integer | Signal quality (0-31) |
| rsrp | integer | Reference signal received power (dBm) |
| rsrq | integer | Reference signal received quality (dB) |
| network_type | string | Network type (LTE, GSM, etc.) |
| accel_x, accel_y, accel_z | float | Accelerometer values (m/s²) |
| gyro_x, gyro_y, gyro_z | float | Gyroscope values (°/s) |
| imu_temperature | float | IMU sensor temperature (°C) |
| emergency_mode | boolean | Whether in emergency mode at this time |
| created_at, updated_at | datetime | Record timestamps |

## Future Enhancements

1. **Command Handler**: Implement receiving commands from server
   - Wake bracelet from sleep
   - Update firmware
   - Trigger vibration/LED patterns

2. **Event Detection**: Create BraceletEvents on emergency/fall detection

3. **Real-time Notifications**: WebSocket push to connected users when:
   - Emergency detected
   - Bracelet goes offline
   - Battery critical

4. **Geo-fencing**: Check location against SafetyZone boundaries

5. **Data Analytics**: Track movement patterns, battery degradation, etc.

6. **Multi-guardian Support**: Share bracelet with multiple users with different permissions
