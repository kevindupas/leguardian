# LeGuardian Virtual Bracelet Simulator

A comprehensive Python simulator for testing all LeGuardian bracelet features without physical hardware.

## Features

The simulator can test all bracelet functionality:

- **Bracelet Registration**: Automatically creates bracelets in the database with QR codes
- **Authentication**: Authenticates with the backend using unique codes
- **Heartbeat Monitoring**: Sends periodic heartbeat signals with battery level and location
- **Battery Drain Simulation**: Simulates realistic battery consumption
- **Geolocation Tracking**: GPS location updates with accuracy simulation and realistic drift
- **Button Simulation**: Tests all three physical buttons:
  - Button 1: "Safe Arrival" (Je suis bien arrivé)
  - Button 2: "Lost" (Je suis perdu)
  - Button 3: "Emergency/Danger" (Je me sens en danger)
- **Emergency Mode**: Simulates continuous location tracking during emergencies
- **Command Polling**: Receives and executes commands from backend (vibration, LED)
- **Command Acknowledgment**: Confirms successful command execution
- **Detailed Logging**: Exports all actions to JSON logs for analysis

## Setup

### Prerequisites

- Python 3.7+
- Laravel backend running locally on `http://localhost:8000`
- PHP artisan CLI available
- MySQL/PostgreSQL database with LeGuardian schema

### Installation

1. Create a Python virtual environment:

```bash
cd /path/to/leguardian
python3 -m venv bracelet_env
source bracelet_env/bin/activate  # On Windows: bracelet_env\Scripts\activate
```

2. Install dependencies:

```bash
pip install requests qrcode pillow
```

3. Ensure the Laravel backend is running:

```bash
cd leguardian-backend
php artisan serve --host=localhost --port=8000
```

## Usage

### Basic Usage - Interactive Mode

Create a bracelet and control it manually:

```bash
source bracelet_env/bin/activate
python3 bracelet_simulator.py create
```

Then follow the interactive menu to:
- Press buttons
- Send heartbeats
- Check for commands
- Run auto-simulation
- View battery/location
- View logs

### Command Line Usage - Auto Simulation

Create a bracelet and run automated simulation for a specified duration:

```bash
source bracelet_env/bin/activate
python3 bracelet_simulator.py create "BraceletName" auto 5
```

This will:
1. Generate a unique 12-character code
2. Create a QR code (saved to `qrcodes/`)
3. Register the bracelet in the database
4. Authenticate with the backend
5. Run a 5-minute simulation with:
   - Heartbeats every 10 seconds
   - Random button presses (5% chance per heartbeat)
   - Geolocation updates every 30 seconds during emergencies
   - Command polling every 5 seconds
   - Battery drain simulation
   - GPS drift simulation

### Examples

```bash
# Interactive mode with random bracelet name
python3 bracelet_simulator.py create

# Interactive mode with custom name
python3 bracelet_simulator.py create "My Test Bracelet"

# Auto-simulation for 5 minutes
python3 bracelet_simulator.py create "Test" auto 5

# Auto-simulation for 10 minutes
python3 bracelet_simulator.py create "Emergency Test" auto 10
```

## Output Files

### QR Codes

Generated QR codes are saved to `qrcodes/`:

```
qrcodes/
├── UNIQUE_CODE_1_qrcode.png
├── UNIQUE_CODE_2_qrcode.png
└── ...
```

You can scan these QR codes with the mobile app to register the simulated bracelets.

### Simulation Logs

Detailed logs are saved to `simulation_logs/`:

```
simulation_logs/
├── UNIQUE_CODE_1_simulation.json
├── UNIQUE_CODE_2_simulation.json
└── ...
```

Each log contains:
- Bracelet ID and name
- Final battery percentage
- Final status (active, lost, emergency)
- Final location with coordinates
- Complete timeline of all actions with timestamps

Example log structure:

```json
{
  "bracelet_id": "UNIQUE_CODE",
  "name": "Bracelet Name",
  "final_battery": 72,
  "final_status": "active",
  "final_location": {
    "latitude": 48.8566,
    "longitude": 2.3522,
    "accuracy": 15
  },
  "log_entries": [
    {
      "timestamp": "2025-11-03T05:37:01.203728",
      "action": "AUTHENTICATED",
      "details": {
        "bracelet_id": 10,
        "commands_endpoint": "/api/devices/commands"
      }
    },
    {
      "timestamp": "2025-11-03T05:37:01.223387",
      "action": "HEARTBEAT_OK",
      "details": {
        "battery": 97,
        "location": [48.8566, 2.3522]
      }
    }
  ]
}
```

## API Integration

The simulator interacts with the following backend endpoints:

### Authentication
- `POST /api/devices/auth` - Authenticate device
- Request: `{"unique_code": "XXXXX"}`

### Heartbeat & Status
- `POST /api/devices/heartbeat` - Send heartbeat with battery/location
- `POST /api/devices/button/arrived` - Safe arrival button
- `POST /api/devices/button/lost` - Lost button
- `POST /api/devices/button/danger` - Emergency button

### Danger Mode
- `POST /api/devices/danger/update` - Update location during emergency

### Command Polling
- `GET /api/devices/commands` - Poll for pending commands
- `POST /api/devices/commands/{id}/ack` - Acknowledge command execution

## Configuration

To use a different backend URL, set the environment variable:

```bash
export BACKEND_URL=http://your-backend.local:8000
python3 bracelet_simulator.py create
```

Default: `http://localhost:8000`

## Testing Scenarios

### Scenario 1: Normal Operation

```bash
python3 bracelet_simulator.py create "Daily Test" auto 2
```

Watch heartbeats and random button presses, observe battery drain.

### Scenario 2: Emergency Response

Run the simulator in interactive mode:

```bash
python3 bracelet_simulator.py create "Emergency Test"
```

Then:
1. Select option `3` - Press Button 3 (Danger/Emergency)
2. Select option `5` - Check for commands (test if vibration commands work)
3. Select option `8` - View location (see emergency coordinates)
4. Select option `9` - View logs to see emergency events

### Scenario 3: Lost Child Scenario

```bash
python3 bracelet_simulator.py create "Lost Test" auto 5
```

The simulator will randomly press buttons, which might include the "lost" button, triggering tracking mode.

## Troubleshooting

### "Auth Failed" Error

**Problem**: `AUTH_FAILED: {'status': 422, 'error': 'The selected unique code is invalid.'}`

**Solution**: The bracelet code doesn't exist in the database. This might happen if:
- Laravel artisan tinker is not available
- Database migrations haven't run

Try manually creating a bracelet:

```bash
php artisan tinker
>>> Bracelet::create(['unique_code' => 'TEST001', 'name' => 'Test', 'status' => 'active'])
>>> exit
```

### "No Backend Response" Error

**Problem**: Connection timeout or refused

**Solution**:
1. Ensure Laravel backend is running: `php artisan serve --host=localhost --port=8000`
2. Check `BACKEND_URL` environment variable
3. Verify firewall isn't blocking localhost:8000

### Insufficient Permissions on Linux/Mac

**Problem**: Permission denied when creating directories

**Solution**:

```bash
chmod +x bracelet_simulator.py
mkdir -p qrcodes simulation_logs
```

## API Response Codes

The simulator properly handles all backend response codes:

- `200/201`: Success
- `401`: Unauthorized (authentication failed)
- `422`: Validation error
- `404`: Resource not found

## Advanced Usage

### Testing Command Execution

Create a command for a bracelet, then run the simulator:

```bash
php artisan tinker
>>> $b = Bracelet::where('unique_code', 'TEST001')->first()
>>> $b->commands()->create(['command_type' => 'vibrate_short', 'status' => 'pending'])
>>> exit

python3 bracelet_simulator.py create "Command Test" auto 2
```

Watch the logs for `COMMAND_RECEIVED` and `VIBRATE_SHORT` actions.

### Analyzing Simulation Data

Simulation logs are valid JSON and can be processed:

```python
import json

with open('simulation_logs/YOUR_CODE_simulation.json') as f:
    data = json.load(f)

for log in data['log_entries']:
    print(f"{log['timestamp']}: {log['action']}")
```

## Development

### Project Structure

```
bracelet_simulator.py
├── VirtualBracelet class
│   ├── Initialization and logging
│   ├── authenticate()
│   ├── send_heartbeat()
│   ├── button_arrived/lost/danger()
│   ├── update_danger_location()
│   ├── check_commands()
│   ├── vibrate_*() and led_*()
│   └── save_log()
├── Helper functions
│   ├── generate_unique_code()
│   ├── generate_qrcode()
│   └── create_new_bracelet()
├── Main simulation
│   ├── simulate_bracelet()
│   └── interactive_mode()
└── CLI entry point
    └── main()
```

### Extending the Simulator

To add new features:

1. Add a new method to `VirtualBracelet` class
2. Add corresponding API endpoint to backend
3. Call the method from `simulate_bracelet()` or `interactive_mode()`
4. Test with `python3 bracelet_simulator.py create "Test" auto 2`

## License

Part of the LeGuardian child safety system.
