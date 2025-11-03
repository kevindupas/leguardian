#!/usr/bin/env python3
"""
LeGuardian Virtual Bracelet GUI
Interactive interface to control and visualize virtual bracelets
"""

import sys
import os
import json
import time
import threading
import string
import random
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Callable
import requests
import qrcode
from io import BytesIO

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QSlider, QTextEdit, QFrame, QGridLayout,
    QScrollArea, QDialog, QLineEdit, QComboBox, QSpinBox
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer, QSize, QRect, QPoint
from PyQt5.QtGui import QPixmap, QImage, QColor, QFont, QPainter, QBrush, QPen, QIcon
from PyQt5.QtCore import QTimer as QtTimer

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
API_ENDPOINT = f"{BACKEND_URL}/api/devices"
QRCODE_DIR = Path("./qrcodes")
SIMULATION_LOG_DIR = Path("./simulation_logs")

QRCODE_DIR.mkdir(exist_ok=True)
SIMULATION_LOG_DIR.mkdir(exist_ok=True)


class VirtualBracelet:
    """Simulates a physical bracelet device"""

    def __init__(self, unique_code: str, name: str = None):
        self.unique_code = unique_code
        self.name = name or f"Bracelet-{unique_code[:8]}"
        self.battery_level = 100
        self.status = "active"  # active, lost, emergency
        self.latitude = 48.8566
        self.longitude = 2.3522
        self.accuracy = 15
        self.is_authenticated = False
        self.pending_commands = []
        self.log = []
        self.led_color = None
        self.led_blinking = False

    def log_action(self, action: str, details: dict = None):
        """Log an action with timestamp"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details or {}
        }
        self.log.append(entry)

    def authenticate(self) -> bool:
        """Authenticate with backend"""
        try:
            response = requests.post(
                f"{API_ENDPOINT}/auth",
                json={"unique_code": self.unique_code},
                headers={"X-Bracelet-ID": self.unique_code}
            )
            if response.status_code == 200:
                self.is_authenticated = True
                self.log_action("AUTHENTICATED", response.json())
                return True
            else:
                self.log_action("AUTH_FAILED", {"status": response.status_code})
                return False
        except Exception as e:
            self.log_action("AUTH_ERROR", {"error": str(e)})
            return False

    def send_heartbeat(self) -> bool:
        """Send periodic heartbeat"""
        if not self.is_authenticated:
            return False

        self.battery_level = max(0, self.battery_level - random.randint(1, 3))
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
                self.log_action("HEARTBEAT_OK", {"battery": self.battery_level})
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

    def check_commands(self) -> Optional[dict]:
        """Poll for pending commands"""
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
                    self.log_action("COMMAND_RECEIVED", {"command": command})

                    if command == "vibrate_short":
                        self.vibrate_short(command_id)
                    elif command == "vibrate_medium":
                        self.vibrate_medium(command_id)
                    elif command == "vibrate_sos":
                        self.vibrate_sos(command_id)

                    return data
                return None
            return None
        except Exception as e:
            self.log_action("COMMAND_CHECK_ERROR", {"error": str(e)})
            return None

    def vibrate_short(self, command_id: int = None):
        """Execute vibration: short pulse"""
        self.log_action("VIBRATE_SHORT", {"pattern": "100ms"})
        if command_id:
            self._acknowledge_command(command_id)

    def vibrate_medium(self, command_id: int = None):
        """Execute vibration: medium pulse"""
        self.log_action("VIBRATE_MEDIUM", {"pattern": "200ms"})
        if command_id:
            self._acknowledge_command(command_id)

    def vibrate_sos(self, command_id: int = None):
        """Execute vibration: SOS pattern"""
        self.log_action("VIBRATE_SOS", {"pattern": "SOS"})
        if command_id:
            self._acknowledge_command(command_id)

    def led_on(self, color: str = "blue", command_id: int = None):
        """Turn on LED"""
        self.led_color = color
        self.led_blinking = False
        self.log_action("LED_ON", {"color": color})
        if command_id:
            self._acknowledge_command(command_id)

    def led_blink(self, color: str = "red", pattern: str = "fast", command_id: int = None):
        """Blink LED"""
        self.led_color = color
        self.led_blinking = True
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

        self.log_action("LOG_SAVED", {"file": str(filepath)})


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
    return filepath


# ============================================================================
# GUI Components
# ============================================================================

class SimulationThread(QThread):
    """Thread for running simulation without blocking GUI"""

    battery_changed = pyqtSignal(int)
    status_changed = pyqtSignal(str)
    location_changed = pyqtSignal(float, float)
    log_updated = pyqtSignal(str)
    vibration_triggered = pyqtSignal()

    def __init__(self, bracelet: VirtualBracelet):
        super().__init__()
        self.bracelet = bracelet
        self.running = False
        self.heartbeat_interval = 5  # seconds
        self.command_check_interval = 5  # seconds

    def run(self):
        """Run simulation loop"""
        self.running = True
        last_heartbeat = 0
        last_command_check = 0

        while self.running:
            current_time = time.time()

            # Send heartbeat
            if current_time - last_heartbeat >= self.heartbeat_interval:
                self.bracelet.send_heartbeat()
                self.battery_changed.emit(self.bracelet.battery_level)
                self.status_changed.emit(self.bracelet.status)
                self.location_changed.emit(self.bracelet.latitude, self.bracelet.longitude)
                self.log_updated.emit(f"♥ Heartbeat - Battery: {self.bracelet.battery_level}%")
                last_heartbeat = current_time

            # Check for commands
            if current_time - last_command_check >= self.command_check_interval:
                self.bracelet.check_commands()
                self.log_updated.emit(f"📡 Command check")
                last_command_check = current_time

            time.sleep(1)

    def stop(self):
        """Stop simulation"""
        self.running = False


class BraceletPanel(QFrame):
    """Visual representation of bracelet"""

    def __init__(self):
        super().__init__()
        self.battery_level = 100
        self.status = "active"
        self.led_color = None
        self.led_blinking = False
        self.vibrating = False
        self.vibration_timer = None

        self.setMinimumSize(350, 400)
        self.setStyleSheet("background-color: #f0f0f0; border-radius: 10px; border: 2px solid #ccc;")

        self.blink_state = False
        self.blink_timer = QtTimer()
        self.blink_timer.timeout.connect(self.toggle_blink)

    def paintEvent(self, event):
        """Paint the bracelet"""
        super().paintEvent(event)

        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        w, h = self.width(), self.height()

        # Draw bracelet band (rectangle with rounded corners)
        painter.setBrush(QBrush(QColor(100, 150, 200)))
        painter.setPen(QPen(QColor(50, 100, 150), 2))
        painter.drawRoundedRect(50, 80, w - 100, 150, 20, 20)

        # Draw LED indicator
        led_x, led_y = w // 2 - 25, 100
        if self.led_blinking and self.blink_state:
            led_brush = QBrush(QColor(self.led_color or "blue"))
        elif self.led_color and not self.led_blinking:
            led_brush = QBrush(QColor(self.led_color))
        else:
            led_brush = QBrush(QColor(200, 200, 200))

        painter.setBrush(led_brush)
        painter.setPen(QPen(QColor(100, 100, 100), 1))
        painter.drawEllipse(led_x, led_y, 50, 50)

        # Draw vibration indicator
        if self.vibrating:
            painter.setBrush(QBrush(QColor(255, 150, 0)))
            painter.setPen(QPen(QColor(255, 100, 0), 2))
            painter.drawEllipse(led_x + 60, led_y, 50, 50)

        # Draw battery gauge
        battery_x, battery_y = 80, 260
        battery_w, battery_h = w - 160, 30

        # Battery outline
        painter.setPen(QPen(QColor(0, 0, 0), 2))
        painter.setBrush(QBrush(QColor(255, 255, 255)))
        painter.drawRect(battery_x, battery_y, battery_w, battery_h)

        # Battery fill
        fill_w = int((self.battery_level / 100) * battery_w)
        if self.battery_level > 50:
            color = QColor(0, 200, 0)
        elif self.battery_level > 20:
            color = QColor(255, 165, 0)
        else:
            color = QColor(255, 0, 0)

        painter.setBrush(QBrush(color))
        painter.drawRect(battery_x, battery_y, fill_w, battery_h)

        # Status text
        font = painter.font()
        font.setPointSize(12)
        painter.setFont(font)

        status_colors = {
            "active": "#00AA00",
            "lost": "#FFA500",
            "emergency": "#FF0000"
        }
        painter.setPen(QPen(QColor(status_colors.get(self.status, "#000000"))))
        painter.drawText(100, h - 40, self.status.upper())

    def set_battery(self, level: int):
        """Update battery level"""
        self.battery_level = max(0, min(100, level))
        self.update()

    def set_status(self, status: str):
        """Update status"""
        self.status = status
        self.update()

    def set_led(self, color: str = None, blinking: bool = False):
        """Set LED state"""
        self.led_color = color
        self.led_blinking = blinking
        if blinking:
            self.blink_timer.start(500)
        else:
            self.blink_timer.stop()
            self.blink_state = False
        self.update()

    def trigger_vibration(self):
        """Trigger vibration animation"""
        self.vibrating = True
        self.update()

        if self.vibration_timer:
            self.vibration_timer.stop()

        self.vibration_timer = QtTimer()
        self.vibration_timer.singleShot(500, self.stop_vibration)

    def stop_vibration(self):
        """Stop vibration"""
        self.vibrating = False
        self.update()

    def toggle_blink(self):
        """Toggle blink state"""
        self.blink_state = not self.blink_state
        self.update()


class BraceletGUI(QMainWindow):
    """Main GUI Application"""

    def __init__(self):
        super().__init__()
        self.bracelet: Optional[VirtualBracelet] = None
        self.simulation_thread: Optional[SimulationThread] = None

        self.setWindowTitle("LeGuardian Virtual Bracelet Simulator")
        self.setGeometry(100, 100, 1200, 800)

        # Main widget
        main_widget = QWidget()
        self.setCentralWidget(main_widget)

        layout = QHBoxLayout(main_widget)

        # Left side: Bracelet visualization
        left_layout = QVBoxLayout()

        # QR Code display
        self.qr_label = QLabel()
        self.qr_label.setAlignment(Qt.AlignCenter)
        self.qr_label.setMinimumSize(300, 300)
        left_layout.addWidget(QLabel("QR Code"))
        left_layout.addWidget(self.qr_label)

        # Bracelet info
        self.code_label = QLabel("Code: --")
        self.code_label.setFont(QFont("Courier", 10))
        left_layout.addWidget(self.code_label)

        self.name_label = QLabel("Name: --")
        left_layout.addWidget(self.name_label)

        left_layout.addStretch()

        layout.addLayout(left_layout, 1)

        # Center: Bracelet visualization
        center_layout = QVBoxLayout()
        self.bracelet_panel = BraceletPanel()
        center_layout.addWidget(self.bracelet_panel)

        # Button controls
        buttons_layout = QHBoxLayout()

        self.btn_arrived = QPushButton("✓ Arrivé")
        self.btn_arrived.setStyleSheet("background-color: #00AA00; color: white; font-weight: bold; padding: 10px; border-radius: 5px;")
        self.btn_arrived.clicked.connect(self.on_button_arrived)
        buttons_layout.addWidget(self.btn_arrived)

        self.btn_lost = QPushButton("⚠ Perdu")
        self.btn_lost.setStyleSheet("background-color: #FFA500; color: white; font-weight: bold; padding: 10px; border-radius: 5px;")
        self.btn_lost.clicked.connect(self.on_button_lost)
        buttons_layout.addWidget(self.btn_lost)

        self.btn_danger = QPushButton("🚨 Danger")
        self.btn_danger.setStyleSheet("background-color: #FF0000; color: white; font-weight: bold; padding: 10px; border-radius: 5px;")
        self.btn_danger.clicked.connect(self.on_button_danger)
        buttons_layout.addWidget(self.btn_danger)

        center_layout.addLayout(buttons_layout)

        layout.addLayout(center_layout, 1)

        # Right side: Logs and controls
        right_layout = QVBoxLayout()

        # Status panel
        status_layout = QGridLayout()

        status_layout.addWidget(QLabel("Battery:"), 0, 0)
        self.battery_label = QLabel("100%")
        status_layout.addWidget(self.battery_label, 0, 1)

        status_layout.addWidget(QLabel("Status:"), 1, 0)
        self.status_label = QLabel("active")
        status_layout.addWidget(self.status_label, 1, 1)

        status_layout.addWidget(QLabel("Location:"), 2, 0)
        self.location_label = QLabel("48.8566, 2.3522")
        status_layout.addWidget(self.location_label, 2, 1)

        right_layout.addLayout(status_layout)

        # LED control
        right_layout.addWidget(QLabel("LED Control:"))
        led_layout = QHBoxLayout()

        self.btn_led_blue = QPushButton("Blue")
        self.btn_led_blue.setStyleSheet("background-color: #0099FF; color: white;")
        self.btn_led_blue.clicked.connect(lambda: self.on_led_control("blue"))
        led_layout.addWidget(self.btn_led_blue)

        self.btn_led_red = QPushButton("Red")
        self.btn_led_red.setStyleSheet("background-color: #FF0000; color: white;")
        self.btn_led_red.clicked.connect(lambda: self.on_led_control("red"))
        led_layout.addWidget(self.btn_led_red)

        self.btn_led_off = QPushButton("Off")
        self.btn_led_off.clicked.connect(lambda: self.on_led_control(None))
        led_layout.addWidget(self.btn_led_off)

        right_layout.addLayout(led_layout)

        # Vibration control
        right_layout.addWidget(QLabel("Vibration:"))
        vib_layout = QHBoxLayout()

        self.btn_vib_short = QPushButton("Short")
        self.btn_vib_short.clicked.connect(self.on_vibration_short)
        vib_layout.addWidget(self.btn_vib_short)

        self.btn_vib_medium = QPushButton("Medium")
        self.btn_vib_medium.clicked.connect(self.on_vibration_medium)
        vib_layout.addWidget(self.btn_vib_medium)

        self.btn_vib_sos = QPushButton("SOS")
        self.btn_vib_sos.clicked.connect(self.on_vibration_sos)
        vib_layout.addWidget(self.btn_vib_sos)

        right_layout.addLayout(vib_layout)

        # Logs
        right_layout.addWidget(QLabel("Logs:"))
        self.logs_text = QTextEdit()
        self.logs_text.setReadOnly(True)
        self.logs_text.setStyleSheet("background-color: #1e1e1e; color: #00FF00; font-family: Courier;")
        right_layout.addWidget(self.logs_text)

        # Bottom controls
        bottom_layout = QHBoxLayout()

        self.btn_create = QPushButton("Create Bracelet")
        self.btn_create.setStyleSheet("background-color: #0066CC; color: white; font-weight: bold; padding: 10px;")
        self.btn_create.clicked.connect(self.on_create_bracelet)
        bottom_layout.addWidget(self.btn_create)

        self.btn_start_sim = QPushButton("Start Simulation")
        self.btn_start_sim.setStyleSheet("background-color: #00AA00; color: white; font-weight: bold; padding: 10px;")
        self.btn_start_sim.clicked.connect(self.on_start_simulation)
        self.btn_start_sim.setEnabled(False)
        bottom_layout.addWidget(self.btn_start_sim)

        self.btn_stop_sim = QPushButton("Stop Simulation")
        self.btn_stop_sim.setStyleSheet("background-color: #FF0000; color: white; font-weight: bold; padding: 10px;")
        self.btn_stop_sim.clicked.connect(self.on_stop_simulation)
        self.btn_stop_sim.setEnabled(False)
        bottom_layout.addWidget(self.btn_stop_sim)

        self.btn_save = QPushButton("Save Log")
        self.btn_save.clicked.connect(self.on_save_log)
        self.btn_save.setEnabled(False)
        bottom_layout.addWidget(self.btn_save)

        right_layout.addLayout(bottom_layout)

        layout.addLayout(right_layout, 1)

    def on_create_bracelet(self):
        """Create new bracelet"""
        unique_code = generate_unique_code()
        name = f"Bracelet_{unique_code[:6]}"

        # Create in database
        try:
            result = subprocess.run(
                ['php', 'leguardian-backend/artisan', 'tinker', '--execute',
                 f'$b = \\App\\Models\\Bracelet::firstOrCreate(['
                 f'"unique_code" => "{unique_code}"'
                 f'], ["name" => "{name}", "status" => "active"]);'
                 f'echo "OK";'],
                capture_output=True,
                text=True,
                timeout=10
            )
        except Exception as e:
            self.add_log(f"❌ DB Error: {e}")
            return

        # Create bracelet instance
        self.bracelet = VirtualBracelet(unique_code, name)

        # Generate QR code
        qr_path = generate_qrcode(unique_code)
        qr_pixmap = QPixmap(str(qr_path))
        self.qr_label.setPixmap(qr_pixmap.scaledToWidth(300, Qt.SmoothTransformation))

        # Update labels
        self.code_label.setText(f"Code: {unique_code}")
        self.name_label.setText(f"Name: {name}")
        self.battery_label.setText("100%")
        self.status_label.setText("active")

        # Clear logs
        self.logs_text.clear()

        # Authenticate
        if self.bracelet.authenticate():
            self.add_log(f"✅ Bracelet created and authenticated: {unique_code}")
            self.btn_start_sim.setEnabled(True)
            self.btn_save.setEnabled(True)
        else:
            self.add_log(f"❌ Authentication failed")

    def on_start_simulation(self):
        """Start simulation"""
        if not self.bracelet:
            return

        self.simulation_thread = SimulationThread(self.bracelet)
        self.simulation_thread.battery_changed.connect(self.on_battery_changed)
        self.simulation_thread.status_changed.connect(self.on_status_changed)
        self.simulation_thread.location_changed.connect(self.on_location_changed)
        self.simulation_thread.log_updated.connect(self.add_log)

        self.simulation_thread.start()

        self.btn_start_sim.setEnabled(False)
        self.btn_stop_sim.setEnabled(True)
        self.btn_create.setEnabled(False)
        self.add_log("▶️ Simulation started")

    def on_stop_simulation(self):
        """Stop simulation"""
        if self.simulation_thread:
            self.simulation_thread.stop()
            self.simulation_thread.wait()
            self.simulation_thread = None

        self.btn_start_sim.setEnabled(True)
        self.btn_stop_sim.setEnabled(False)
        self.btn_create.setEnabled(True)
        self.add_log("⏹️ Simulation stopped")

    def on_button_arrived(self):
        """Button 1: Arrived"""
        if not self.bracelet:
            return
        if self.bracelet.button_arrived():
            self.bracelet_panel.set_status("active")
            self.add_log("✅ Arrived button pressed")
        else:
            self.add_log("❌ Arrived button failed")

    def on_button_lost(self):
        """Button 2: Lost"""
        if not self.bracelet:
            return
        if self.bracelet.button_lost():
            self.bracelet_panel.set_status("lost")
            self.add_log("⚠️ Lost button pressed")
        else:
            self.add_log("❌ Lost button failed")

    def on_button_danger(self):
        """Button 3: Danger"""
        if not self.bracelet:
            return
        if self.bracelet.button_danger():
            self.bracelet_panel.set_status("emergency")
            self.add_log("🚨 Danger button pressed")
        else:
            self.add_log("❌ Danger button failed")

    def on_led_control(self, color: str = None):
        """Control LED"""
        if not self.bracelet:
            return
        if color:
            self.bracelet.led_on(color)
            self.bracelet_panel.set_led(color, False)
            self.add_log(f"💡 LED on: {color}")
        else:
            self.bracelet.led_color = None
            self.bracelet_panel.set_led(None, False)
            self.add_log("💡 LED off")

    def on_vibration_short(self):
        """Trigger short vibration"""
        if not self.bracelet:
            return
        self.bracelet.vibrate_short()
        self.bracelet_panel.trigger_vibration()
        self.add_log("📳 Short vibration")

    def on_vibration_medium(self):
        """Trigger medium vibration"""
        if not self.bracelet:
            return
        self.bracelet.vibrate_medium()
        self.bracelet_panel.trigger_vibration()
        self.add_log("📳 Medium vibration")

    def on_vibration_sos(self):
        """Trigger SOS vibration"""
        if not self.bracelet:
            return
        self.bracelet.vibrate_sos()
        self.bracelet_panel.trigger_vibration()
        self.add_log("📳 SOS vibration")

    def on_battery_changed(self, level: int):
        """Update battery display"""
        self.battery_label.setText(f"{level}%")
        self.bracelet_panel.set_battery(level)

    def on_status_changed(self, status: str):
        """Update status display"""
        self.status_label.setText(status)
        self.bracelet_panel.set_status(status)

    def on_location_changed(self, lat: float, lon: float):
        """Update location display"""
        self.location_label.setText(f"{lat:.4f}, {lon:.4f}")

    def on_save_log(self):
        """Save simulation log"""
        if self.bracelet:
            self.bracelet.save_log()
            self.add_log(f"💾 Log saved to simulation_logs/")

    def add_log(self, message: str):
        """Add message to logs"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.logs_text.append(f"[{timestamp}] {message}")
        # Scroll to bottom
        self.logs_text.verticalScrollBar().setValue(
            self.logs_text.verticalScrollBar().maximum()
        )


def main():
    app = QApplication(sys.argv)
    window = BraceletGUI()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
