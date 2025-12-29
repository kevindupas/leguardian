#!/bin/bash
# Mosquitto Installation Script for Debian 12
# Domain: tracklify.app with SSL certificates from Let's Encrypt
# This script sets up Mosquitto with MQTT and WebSocket support over SSL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Mosquitto Installation for tracklify.app ===${NC}"

# Step 1: Update system
echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install Mosquitto
echo -e "${GREEN}Step 2: Installing Mosquitto...${NC}"
sudo apt-get install -y mosquitto mosquitto-clients

# Step 3: Stop Mosquitto before configuration
echo -e "${GREEN}Step 3: Stopping Mosquitto for configuration...${NC}"
sudo systemctl stop mosquitto

# Step 4: Create Mosquitto configuration directory if it doesn't exist
echo -e "${GREEN}Step 4: Creating Mosquitto configuration directory...${NC}"
sudo mkdir -p /etc/mosquitto/conf.d

# Step 5: Backup original configuration
echo -e "${GREEN}Step 5: Backing up original mosquitto.conf...${NC}"
sudo cp /etc/mosquitto/mosquitto.conf /etc/mosquitto/mosquitto.conf.bak

# Step 6: Create WebSocket configuration
echo -e "${GREEN}Step 6: Creating WebSocket configuration...${NC}"
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

# Persistence
persistence true
persistence_location /var/lib/mosquitto/

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_dest stdout
log_type all
connection_messages true
log_timestamp true
EOF

# Step 7: Set correct permissions for SSL certificates
echo -e "${GREEN}Step 7: Setting permissions for SSL certificates...${NC}"
sudo setfacl -m u:mosquitto:rx /etc/letsencrypt/live/tracklify.app/
sudo setfacl -m u:mosquitto:rx /etc/letsencrypt/archive/tracklify.app/

# Step 8: Create systemd service to automatically update certificate permissions
echo -e "${GREEN}Step 8: Creating certificate renewal hook...${NC}"
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post
sudo tee /etc/letsencrypt/renewal-hooks/post/mosquitto-permissions.sh > /dev/null << 'EOF'
#!/bin/bash
# Refresh Mosquitto certificate permissions after renewal
setfacl -m u:mosquitto:rx /etc/letsencrypt/live/tracklify.app/
setfacl -m u:mosquitto:rx /etc/letsencrypt/archive/tracklify.app/
systemctl reload mosquitto
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/mosquitto-permissions.sh

# Step 9: Start Mosquitto
echo -e "${GREEN}Step 9: Starting Mosquitto service...${NC}"
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Step 10: Verify Mosquitto is running
echo -e "${GREEN}Step 10: Verifying Mosquitto is running...${NC}"
sudo systemctl status mosquitto

# Step 11: Test basic connectivity
echo -e "${GREEN}Step 11: Testing MQTT connectivity on port 1883...${NC}"
(
  mosquitto_pub -h localhost -p 1883 -t "test/connection" -m "Hello MQTT" &
  sleep 1
  mosquitto_sub -h localhost -p 1883 -t "test/connection" -C 1
  pkill -P $$ mosquitto_sub 2>/dev/null || true
) || echo -e "${YELLOW}Note: Test may timeout, but that's OK${NC}"

echo ""
echo -e "${GREEN}=== Installation Complete! ===${NC}"
echo ""
echo "Configuration Summary:"
echo "  - Standard MQTT: localhost:1883 (non-encrypted)"
echo "  - WebSocket MQTT: tracklify.app:9001 (SSL/TLS encrypted)"
echo "  - SSL Certificates: /etc/letsencrypt/live/tracklify.app/"
echo "  - Logs: /var/log/mosquitto/mosquitto.log"
echo ""
echo "Next steps:"
echo "  1. Verify certificate files exist:"
echo "     sudo ls -la /etc/letsencrypt/live/tracklify.app/"
echo ""
echo "  2. Check Mosquitto logs:"
echo "     sudo tail -f /var/log/mosquitto/mosquitto.log"
echo ""
echo "  3. Test from remote (replace YOUR_SERVER_IP):"
echo "     mosquitto_sub -h YOUR_SERVER_IP -p 9001 --cafile /path/to/ca.crt -t 'bracelets/#'"
echo ""
echo "  4. Test WebSocket connection with Arduino:"
echo "     Update MQTT_SERVER in Arduino code to: tracklify.app"
echo "     Update MQTT_PORT in Arduino code to: 9001"
echo ""
