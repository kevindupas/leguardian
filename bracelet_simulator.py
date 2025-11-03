#!/usr/bin/env python3
"""
LeGuardian Virtual Bracelet Simulator
Generates bracelets with QR codes and simulates all device functionality
"""

import os
import sys
import json
import time
import random
import string
import subprocess
from datetime import datetime
from typing import Optional
import requests
import qrcode
from io import BytesIO
from pathlib import Path

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
API_ENDPOINT = f"{BACKEND_URL}/api/devices"
QRCODE_DIR = Path("./qrcodes")
SIMULATION_LOG_DIR = Path("./simulation_logs")

# Create directories
QRCODE_DIR.mkdir(exist_ok=True)
SIMULATION_LOG_DIR.mkdir(exist_ok=True)


class VirtualBracelet:
    """Simulates a physical bracelet device"""

    def __init__(self, unique_code: str, name: str = None):
        self.unique_code = unique_code
        self.name = name or f"Bracelet-{unique_code[:8]}"
        self.battery_level = 100
        self.status = "active"
        self.latitude = 48.8566  # Paris default
        self.longitude = 2.3522
        self.accuracy = 15
        self.is_authenticated = False
        self.pending_commands = []
        self.log = []

    def log_action(self, action: str, details: dict = None):
        """Log an action with timestamp"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details or {}
        }
        self.log.append(entry)
        print(f"[{entry['timestamp']}] {action}: {details or ''}")

    def authenticate(self) -> bool:
        """Authenticate with backend"""
        try:
            response = requests.post(
                f"{API_ENDPOINT}/auth",
                json={"unique_code": self.unique_code},
                headers={"X-Bracelet-ID": self.unique_code, "Content-Type": "application/json"}
            )
            if response.status_code == 200:
                self.is_authenticated = True
                self.log_action("AUTHENTICATED", response.json())
                return True
            else:
                self.log_action("AUTH_FAILED", {"status": response.status_code, "error": response.text})
                return False
        except Exception as e:
            self.log_action("AUTH_ERROR", {"error": str(e)})
            return False

    def send_heartbeat(self) -> bool:
        """Send periodic heartbeat with location"""
        if not self.is_authenticated:
            self.log_action("HEARTBEAT_SKIPPED", {"reason": "Not authenticated"})
            return False

        # Simulate slight battery drain
        self.battery_level = max(0, self.battery_level - random.randint(1, 3))

        # Simulate GPS drift
        self.latitude += random.uniform(-0.0001, 0.0001)
        self.longitude += random.uniform(-0.0001, 0.0001)

        try:
            payload = {
                "battery_level": self.battery_level,
                "latitude": round(self.latitude, 8),
                "longitude": round(self.longitude, 8),
                "accuracy": self.accuracy
            }

            response = requests.post(
                f"{API_ENDPOINT}/heartbeat",
                json=payload,
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code == 200:
                self.log_action("HEARTBEAT_OK", {"battery": self.battery_level, "location": (self.latitude, self.longitude)})
                return True
            else:
                self.log_action("HEARTBEAT_FAILED", {"status": response.status_code})
                return False
        except Exception as e:
            self.log_action("HEARTBEAT_ERROR", {"error": str(e)})
            return False

    def button_arrived(self) -> bool:
        """Press button 1: Safe arrival"""
        if not self.is_authenticated:
            self.log_action("BUTTON_ARRIVED_SKIPPED", {"reason": "Not authenticated"})
            return False

        try:
            payload = {
                "battery_level": self.battery_level,
                "latitude": round(self.latitude, 8),
                "longitude": round(self.longitude, 8),
                "accuracy": self.accuracy
            }

            response = requests.post(
                f"{API_ENDPOINT}/button/arrived",
                json=payload,
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code in [200, 201]:
                self.log_action("BUTTON_ARRIVED_PRESSED", response.json())
                self.status = "active"
                return True
            else:
                self.log_action("BUTTON_ARRIVED_FAILED", {"status": response.status_code})
                return False
        except Exception as e:
            self.log_action("BUTTON_ARRIVED_ERROR", {"error": str(e)})
            return False

    def button_lost(self) -> bool:
        """Press button 2: Lost"""
        if not self.is_authenticated:
            self.log_action("BUTTON_LOST_SKIPPED", {"reason": "Not authenticated"})
            return False

        try:
            payload = {
                "battery_level": self.battery_level,
                "latitude": round(self.latitude, 8),
                "longitude": round(self.longitude, 8),
                "accuracy": self.accuracy
            }

            response = requests.post(
                f"{API_ENDPOINT}/button/lost",
                json=payload,
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code in [200, 201]:
                self.log_action("BUTTON_LOST_PRESSED", response.json())
                self.status = "lost"
                return True
            else:
                self.log_action("BUTTON_LOST_FAILED", {"status": response.status_code})
                return False
        except Exception as e:
            self.log_action("BUTTON_LOST_ERROR", {"error": str(e)})
            return False

    def button_danger(self) -> bool:
        """Press button 3: Emergency/Danger"""
        if not self.is_authenticated:
            self.log_action("BUTTON_DANGER_SKIPPED", {"reason": "Not authenticated"})
            return False

        try:
            payload = {
                "battery_level": self.battery_level,
                "latitude": round(self.latitude, 8),
                "longitude": round(self.longitude, 8),
                "accuracy": self.accuracy
            }

            response = requests.post(
                f"{API_ENDPOINT}/button/danger",
                json=payload,
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code in [200, 201]:
                self.log_action("BUTTON_DANGER_PRESSED", response.json())
                self.status = "emergency"
                return True
            else:
                self.log_action("BUTTON_DANGER_FAILED", {"status": response.status_code})
                return False
        except Exception as e:
            self.log_action("BUTTON_DANGER_ERROR", {"error": str(e)})
            return False

    def update_danger_location(self) -> bool:
        """Continuous location update while in danger"""
        if not self.is_authenticated or self.status != "emergency":
            return False

        # Move randomly (simulating panic/running)
        self.latitude += random.uniform(-0.001, 0.001)
        self.longitude += random.uniform(-0.001, 0.001)
        self.accuracy = random.randint(8, 20)

        try:
            payload = {
                "latitude": round(self.latitude, 8),
                "longitude": round(self.longitude, 8),
                "accuracy": self.accuracy
            }

            response = requests.post(
                f"{API_ENDPOINT}/danger/update",
                json=payload,
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code == 200:
                self.log_action("DANGER_UPDATE_OK", {"location": (self.latitude, self.longitude)})
                return True
            else:
                self.log_action("DANGER_UPDATE_FAILED", {"status": response.status_code})
                return False
        except Exception as e:
            self.log_action("DANGER_UPDATE_ERROR", {"error": str(e)})
            return False

    def check_commands(self) -> Optional[dict]:
        """Poll for pending commands (vibration/LED)"""
        if not self.is_authenticated:
            return None

        try:
            response = requests.get(
                f"{API_ENDPOINT}/commands",
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("command"):
                    command = data.get("command")
                    command_id = data.get("command_id")
                    self.log_action("COMMAND_RECEIVED", {"command": command, "id": command_id})

                    # Execute command
                    if command == "vibrate_short":
                        self.vibrate_short(command_id)
                    elif command == "vibrate_medium":
                        self.vibrate_medium(command_id)
                    elif command == "vibrate_sos":
                        self.vibrate_sos(command_id)

                    return data
                else:
                    self.log_action("NO_PENDING_COMMANDS", {})
                    return None
            else:
                self.log_action("COMMAND_CHECK_FAILED", {"status": response.status_code})
                return None
        except Exception as e:
            self.log_action("COMMAND_CHECK_ERROR", {"error": str(e)})
            return None

    def vibrate_short(self, command_id: int):
        """Execute vibration pattern: short pulse"""
        self.log_action("VIBRATE_SHORT", {"pattern": "100ms"})
        self._acknowledge_command(command_id)

    def vibrate_medium(self, command_id: int):
        """Execute vibration pattern: medium pulse"""
        self.log_action("VIBRATE_MEDIUM", {"pattern": "200ms"})
        self._acknowledge_command(command_id)

    def vibrate_sos(self, command_id: int):
        """Execute vibration pattern: SOS distress signal"""
        self.log_action("VIBRATE_SOS", {"pattern": "100-100-100-200-200-200-100-100-100ms"})
        self._acknowledge_command(command_id)

    def led_on(self, color: str = "blue", command_id: int = None):
        """Turn on LED light"""
        self.log_action("LED_ON", {"color": color})
        if command_id:
            self._acknowledge_command(command_id)

    def led_blink(self, color: str = "red", pattern: str = "fast", command_id: int = None):
        """Blink LED light"""
        self.log_action("LED_BLINK", {"color": color, "pattern": pattern})
        if command_id:
            self._acknowledge_command(command_id)

    def _acknowledge_command(self, command_id: int) -> bool:
        """Acknowledge command execution"""
        try:
            response = requests.post(
                f"{API_ENDPOINT}/commands/{command_id}/ack",
                headers={"X-Bracelet-ID": self.unique_code}
            )

            if response.status_code == 200:
                self.log_action("COMMAND_ACKNOWLEDGED", {"command_id": command_id})
                return True
            else:
                self.log_action("ACK_FAILED", {"command_id": command_id, "status": response.status_code})
                return False
        except Exception as e:
            self.log_action("ACK_ERROR", {"error": str(e)})
            return False

    def save_log(self, filename: str = None):
        """Save simulation log to file"""
        if not filename:
            filename = f"{self.unique_code}_simulation.json"

        filepath = SIMULATION_LOG_DIR / filename
        with open(filepath, 'w') as f:
            json.dump({
                "bracelet_id": self.unique_code,
                "name": self.name,
                "final_battery": self.battery_level,
                "final_status": self.status,
                "final_location": {
                    "latitude": round(self.latitude, 8),
                    "longitude": round(self.longitude, 8),
                    "accuracy": self.accuracy
                },
                "log_entries": self.log
            }, f, indent=2)

        print(f"\n✅ Simulation log saved to: {filepath}")


def generate_unique_code(length: int = 12) -> str:
    """Generate unique bracelet code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def generate_qrcode(unique_code: str) -> Path:
    """Generate QR code image"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(unique_code)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    filepath = QRCODE_DIR / f"{unique_code}_qrcode.png"
    img.save(filepath)

    print(f"✅ QR Code generated: {filepath}")
    return filepath


def create_new_bracelet(name: str = None) -> VirtualBracelet:
    """Create a new virtual bracelet in database and instance"""
    unique_code = generate_unique_code()

    print(f"\n{'='*60}")
    print(f"Creating new virtual bracelet")
    print(f"{'='*60}")
    print(f"Unique Code: {unique_code}")

    # Register bracelet in database via Laravel CLI
    try:
        result = subprocess.run(
            ['php', 'leguardian-backend/artisan', 'tinker', '--execute',
             f'$bracelet = \\App\\Models\\Bracelet::firstOrCreate(['
             f'"unique_code" => "{unique_code}"'
             f'], ["name" => "{name or unique_code}", "status" => "active"]);'
             f'echo "Bracelet created in DB";'],
            capture_output=True,
            text=True,
            timeout=10
        )
        if "Bracelet created in DB" not in result.stdout and "created" not in result.stdout:
            print(f"⚠️  Warning: Bracelet DB registration may have failed")
            print(f"stdout: {result.stdout}")
            print(f"stderr: {result.stderr}")
    except Exception as e:
        print(f"⚠️  Warning: Could not register bracelet in database: {e}")
        print(f"You may need to manually add it via: php artisan tinker")

    # Generate QR code
    qr_path = generate_qrcode(unique_code)

    # Create bracelet instance
    bracelet = VirtualBracelet(unique_code, name)

    print(f"\n{'='*60}")
    print(f"Virtual Bracelet Created!")
    print(f"{'='*60}")
    print(f"ID: {bracelet.unique_code}")
    print(f"Name: {bracelet.name}")
    print(f"Battery: {bracelet.battery_level}%")
    print(f"Status: {bracelet.status}")
    print(f"Location: {bracelet.latitude:.4f}, {bracelet.longitude:.4f}")
    print(f"QR Code: {qr_path}")

    return bracelet


def simulate_bracelet(bracelet: VirtualBracelet, duration_minutes: int = 5):
    """Run bracelet simulation for specified duration"""
    print(f"\n{'='*60}")
    print(f"Starting simulation for {duration_minutes} minutes")
    print(f"{'='*60}\n")

    # Authenticate
    if not bracelet.authenticate():
        print("❌ Failed to authenticate bracelet")
        return

    start_time = time.time()
    duration_seconds = duration_minutes * 60
    heartbeat_interval = 10  # seconds (every 10 seconds for testing, normally 300)
    geolocation_update_interval = 30  # seconds (every 30 seconds)
    command_check_interval = 5  # seconds

    last_heartbeat = 0
    last_geolocation = 0
    last_command_check = 0

    try:
        while True:
            elapsed = time.time() - start_time

            if elapsed > duration_seconds:
                print(f"\n✅ Simulation complete after {duration_minutes} minutes")
                break

            current_time = time.time()

            # Send heartbeat
            if current_time - last_heartbeat >= heartbeat_interval:
                bracelet.send_heartbeat()
                last_heartbeat = current_time

                # Simulate button press (5% chance)
                if random.random() < 0.05:
                    choice = random.choice(['arrived', 'lost', 'danger'])
                    if choice == 'arrived':
                        bracelet.button_arrived()
                    elif choice == 'lost':
                        bracelet.button_lost()
                    else:
                        bracelet.button_danger()

            # Update location if in danger mode
            if bracelet.status == "emergency" and current_time - last_geolocation >= geolocation_update_interval:
                bracelet.update_danger_location()
                last_geolocation = current_time

            # Check for commands every few seconds
            if current_time - last_command_check >= command_check_interval:
                bracelet.check_commands()
                last_command_check = current_time

            time.sleep(1)

    except KeyboardInterrupt:
        print("\n⏸️  Simulation paused by user")

    # Save logs
    bracelet.save_log()


def interactive_mode(bracelet: VirtualBracelet):
    """Interactive simulation control"""
    print(f"\n{'='*60}")
    print(f"Interactive Mode - Control Bracelet")
    print(f"{'='*60}")
    print("""
Commands:
  1 - Press Button 1 (Safe Arrival)
  2 - Press Button 2 (Lost)
  3 - Press Button 3 (Danger/Emergency)
  4 - Send Heartbeat
  5 - Check for Commands
  6 - Auto-simulate for 5 minutes
  7 - View Battery Level
  8 - View Current Location
  9 - View Logs
  0 - Exit
    """)

    if not bracelet.authenticate():
        print("❌ Failed to authenticate bracelet")
        return

    while True:
        try:
            choice = input("\n> Enter command (0-9): ").strip()

            if choice == '1':
                bracelet.button_arrived()
            elif choice == '2':
                bracelet.button_lost()
            elif choice == '3':
                bracelet.button_danger()
            elif choice == '4':
                bracelet.send_heartbeat()
            elif choice == '5':
                bracelet.check_commands()
            elif choice == '6':
                simulate_bracelet(bracelet, duration_minutes=5)
            elif choice == '7':
                print(f"Battery Level: {bracelet.battery_level}%")
            elif choice == '8':
                print(f"Location: {bracelet.latitude:.8f}, {bracelet.longitude:.8f}")
                print(f"Accuracy: {bracelet.accuracy}m")
            elif choice == '9':
                print("\nSimulation Log:")
                for entry in bracelet.log[-10:]:  # Last 10 entries
                    print(f"  [{entry['timestamp']}] {entry['action']}")
            elif choice == '0':
                bracelet.save_log()
                print("\n👋 Goodbye!")
                break
            else:
                print("❌ Invalid command")

        except KeyboardInterrupt:
            bracelet.save_log()
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


def main():
    """Main entry point"""
    print("""
╔════════════════════════════════════════════════════════╗
║   LeGuardian Virtual Bracelet Simulator              ║
║   Test all bracelet features in the system           ║
╚════════════════════════════════════════════════════════╝
    """)

    if len(sys.argv) > 1:
        if sys.argv[1] == 'create':
            name = sys.argv[2] if len(sys.argv) > 2 else None
            bracelet = create_new_bracelet(name)

            if len(sys.argv) > 3 and sys.argv[3] == 'auto':
                duration = int(sys.argv[4]) if len(sys.argv) > 4 else 5
                simulate_bracelet(bracelet, duration)
            else:
                interactive_mode(bracelet)
        else:
            print("Usage:")
            print("  python bracelet_simulator.py create [name] [auto [duration]]")
            print("\nExamples:")
            print("  python bracelet_simulator.py create")
            print("  python bracelet_simulator.py create 'My Bracelet'")
            print("  python bracelet_simulator.py create 'My Bracelet' auto 10")
    else:
        # Interactive menu
        print("\nOptions:")
        print("1. Create and test a new bracelet")
        print("2. Exit")

        choice = input("\n> Select option: ").strip()

        if choice == '1':
            name = input("Enter bracelet name (optional): ").strip() or None
            bracelet = create_new_bracelet(name)
            interactive_mode(bracelet)
        else:
            print("Goodbye!")


if __name__ == "__main__":
    main()
