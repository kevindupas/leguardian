#!/bin/bash
# Fix Mosquitto configuration for tracklify.app

set -e

echo "=== Fixing Mosquitto Configuration ==="

# Step 1: Stop Mosquitto
echo "Stopping Mosquitto..."
sudo systemctl stop mosquitto

# Step 2: Replace the WebSocket configuration
echo "Updating WebSocket configuration..."
sudo tee /etc/mosquitto/conf.d/websocket.conf > /dev/null << 'EOF'
# Standard MQTT port (non-encrypted for internal communication)
listener 1883
protocol mqtt
allow_anonymous true

# WebSocket port with SSL/TLS
listener 9001
protocol websockets
cafile /etc/letsencrypt/live/tracklify.app/chain.pem
certfile /etc/letsencrypt/live/tracklify.app/fullchain.pem
keyfile /etc/letsencrypt/live/tracklify.app/privkey.pem
allow_anonymous true
EOF

# Step 3: Test the configuration
echo ""
echo "Testing configuration..."
sudo mosquitto -c /etc/mosquitto/mosquitto.conf -v

echo ""
echo "=== Configuration looks good! ==="
echo ""
echo "Starting Mosquitto..."
sudo systemctl start mosquitto

echo ""
echo "Checking status..."
sudo systemctl status mosquitto

echo ""
echo "Done!"
