#include <Arduino.h>
#include <Wire.h>
#include <Arduino_LSM6DS3.h>
#include <Adafruit_NeoPixel.h>
#include <EEPROM.h>

#define TINY_GSM_MODEM_SIM7600
#define TINY_GSM_RX_BUFFER 1024
#define EEPROM_SIZE 512
#define EEPROM_REGISTERED_FLAG 0 // Byte 0: flag indicating if bracelet has been registered

#define SerialMon Serial
#define SerialAT Serial1

// Pins pour T-A7670
#define PIN_TX 26
#define PIN_RX 27
#define PWR_PIN 4
#define POWER_PIN 12
#define DTR_PIN 25

// Pins I2C pour LSM6DS3
#define I2C_SDA 21
#define I2C_SCL 22

// Pins Vibreur
#define VIBRER_PIN 5

// Pins LEDs NeoPixel
#define LED_PIN 33
#define NUM_LEDS 2

// Pins Bouton
#define BUTTON_PIN 35

#include <TinyGsmClient.h>

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);  // SIM7600 supports HTTPS natively
bool imuReady = false;

// Structure pour stocker les données GPS
struct GPSData
{
  float latitude;
  float longitude;
  float altitude;
  int satellites;
  String date;
  String time;
  int signalCSQ;
  String rsrp;
  String rsrq;
  String networkType;
};

// Structure pour stocker les données IMU
struct IMUData
{
  float accelX, accelY, accelZ;
  float gyroX, gyroY, gyroZ;
  float temperature;
  bool available;
};

// LEDs NeoPixel
Adafruit_NeoPixel leds(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
bool ledModemState = false;
bool ledGpsState = false;
unsigned long lastModemToggle = 0;
unsigned long lastGpsToggle = 0;

// Emergency mode tracking
bool emergencyMode = false;
unsigned long buttonPressStartTime = 0;
#define BUTTON_PRESS_THRESHOLD 3000 // 3 seconds to toggle mode

// Data collection and transmission
GPSData currentGpsData = {0, 0, 0, 0, "", "", 0, "", "", ""};
IMUData currentImuData = {0, 0, 0, 0, 0, 0, 0, false};
unsigned long lastDataCollection = 0;
unsigned long lastDataTransmission = 0;
#define DATA_COLLECTION_INTERVAL 5000 // Collect data every 5 seconds
#define SEND_INTERVAL_NORMAL 180000   // Send every 3 minutes in normal mode
#define SEND_INTERVAL_EMERGENCY 60000 // Send every 1 minute in emergency mode

// Data ready flags
bool gpsDataReady = false;
bool networkDataReady = false;
bool imuDataReady = false;

// Bracelet identification
#define BRACELET_UNIQUE_CODE "ESP32_A7670E_001" // TODO: Use IMEI or generate UUID

// Association status
bool braceletAssociated = false;
unsigned long lastAssociationCheck = 0;
#define ASSOCIATION_CHECK_INTERVAL 3600000 // Check every 1 hour

// First-boot registration
bool braceletRegistered = false;

// Bouton
bool lastButtonState = HIGH;
unsigned long lastButtonPress = 0;
#define DEBOUNCE_DELAY 50
enum LEDMode
{
  LED_OFF,
  LED_BLINKING,
  LED_NORMAL
};
LEDMode currentLedMode = LED_OFF;

// HTTP Configuration
#define SERVER_URL "82.64.114.218" // Production API IP (tracklify.app)
#define SERVER_PORT 80 // HTTP port (TinyGSM 0.11.7 doesn't support HTTPS, will use HTTP)
#define SERVER_HOST "api.tracklify.app" // For Host header
unsigned long lastDataSend = 0;
#define SEND_INTERVAL 30000 // Envoyer tous les 30 secondes

// Fonction vibreur
void vibrate(int duration)
{
  digitalWrite(VIBRER_PIN, HIGH);
  delay(duration);
  digitalWrite(VIBRER_PIN, LOW);
}

// Construire JSON avec les données
String buildJsonPayload(const GPSData &gps, const IMUData &imu)
{
  String json = "{";

  // Timestamp - get current time from modem's RTC (synchronized via 4G network)
  // Falls back to GPS time if available, otherwise sends current millis as fallback
  String timestamp = "";
  int year, month, day, hour, minute, second;
  float milliseconds = 0;

  // Try to get time from modem's internal clock (synchronized via 4G)
  if (modem.getNetworkTime(&year, &month, &day, &hour, &minute, &second, &milliseconds)) {
    // Format as ISO 8601: YYYY-MM-DDTHH:MM:SS
    // Pad with zeros for single digits
    char buf[25];
    snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02dZ",
             year, month, day, hour, minute, second);
    timestamp = String(buf);
  } else if (gps.date != "" && gps.time != "") {
    // Fallback to GPS time if available
    timestamp = gps.date + "T" + gps.time + "Z";
  } else {
    // Last resort: use current millis (will be converted on backend)
    timestamp = String(millis() / 1000); // Convert ms to seconds for better accuracy
  }

  json += "\"timestamp\":\"" + timestamp + "\",";

  // Emergency mode flag
  json += "\"emergency_mode\":" + String(emergencyMode ? "true" : "false") + ",";

  // Données GPS
  json += "\"gps\":{";
  json += "\"latitude\":" + String(gps.latitude, 6) + ",";
  json += "\"longitude\":" + String(gps.longitude, 6) + ",";
  json += "\"altitude\":" + String(gps.altitude, 2) + ",";
  json += "\"satellites\":" + String(gps.satellites) + ",";
  json += "\"date\":\"" + gps.date + "\",";
  json += "\"time\":\"" + gps.time + "\"";
  json += "},";

  // Données Réseau 4G
  json += "\"network\":{";
  json += "\"signal_csq\":" + String(gps.signalCSQ) + ",";
  json += "\"rsrp\":\"" + gps.rsrp + "\",";
  json += "\"rsrq\":\"" + gps.rsrq + "\",";
  json += "\"type\":\"" + gps.networkType + "\"";
  json += "},";

  // Données IMU (si disponibles)
  if (imu.available)
  {
    json += "\"imu\":{";
    json += "\"accel\":{\"x\":" + String(imu.accelX, 4) + ",\"y\":" + String(imu.accelY, 4) + ",\"z\":" + String(imu.accelZ, 4) + "},";
    json += "\"gyro\":{\"x\":" + String(imu.gyroX, 4) + ",\"y\":" + String(imu.gyroY, 4) + ",\"z\":" + String(imu.gyroZ, 4) + "},";
    json += "\"temperature\":" + String(imu.temperature, 2);
    json += "}";
  }
  else
  {
    json += "\"imu\":null";
  }

  json += "}";
  return json;
}

// Envoyer les données via HTTPS POST
bool sendDataViaHTTP(const String &jsonData)
{
  SerialMon.println("\n>> Envoi des données via HTTPS...");

  if (!client.connect(SERVER_URL, SERVER_PORT))
  {
    SerialMon.println("✗ Impossible de se connecter au serveur (HTTPS)");
    return false;
  }

  SerialMon.println("✓ Connecté au serveur (HTTPS)");

  // Construire la requête HTTP POST avec header d'identification
  String endpoint = emergencyMode ? "/api/devices/danger/update" : "/api/devices/heartbeat";
  String request = "POST " + endpoint + " HTTP/1.1\r\n";
  request += "Host: " + String(SERVER_HOST) + "\r\n";
  request += "Content-Type: application/json\r\n";
  request += "Content-Length: " + String(jsonData.length()) + "\r\n";
  request += "X-Bracelet-ID: " + String(BRACELET_UNIQUE_CODE) + "\r\n";
  request += "Connection: close\r\n";
  request += "\r\n";
  request += jsonData;

  // Envoyer la requête
  client.print(request);

  // LED vert clignote pendant l'envoi
  leds.setPixelColor(0, leds.Color(0, 255, 0)); // Green
  leds.show();
  delay(100);
  leds.setPixelColor(0, 0); // Off
  leds.show();

  // Attendre la réponse HTTP - juste lire le status line
  delay(500); // Donner du temps au serveur
  unsigned long timeout = millis() + 5000;
  String statusLine = "";
  bool gotStatusLine = false;

  while (millis() < timeout)
  {
    if (client.available())
    {
      char c = client.read();
      if (!gotStatusLine)
      {
        statusLine += c;
        // Status line ends with \r\n
        if (statusLine.endsWith("\r\n"))
        {
          gotStatusLine = true;
          break;
        }
      }
    }
  }

  if (gotStatusLine)
  {
    SerialMon.println("Status: " + statusLine);

    // Vérifier le code de statut HTTP (200 ou 201)
    if (statusLine.indexOf("200") > 0 || statusLine.indexOf("201") > 0)
    {
      SerialMon.println("✓ Données envoyées avec succès");
      vibrate(100);

      // LED vert fixe pendant 500ms
      leds.setPixelColor(0, leds.Color(0, 255, 0));
      leds.show();
      delay(500);
      leds.setPixelColor(0, 0);
      leds.show();

      client.stop();
      return true;
    }
  }

  client.stop();
  SerialMon.println("✗ Erreur lors de l'envoi des données");
  return false;
}

// Fonction pour initialiser les LEDs
void initLeds()
{
  leds.begin();
  leds.setBrightness(50);
  leds.clear();
  leds.show();
  SerialMon.println("✓ LEDs initialisées sur GPIO 32");
}

// Gestion du bouton et changement de mode des LEDs
void handleButton()
{
  bool currentButtonState = digitalRead(BUTTON_PIN);
  unsigned long now = millis();

  // Button pressed (falling edge)
  if (currentButtonState == LOW && lastButtonState == HIGH)
  {
    buttonPressStartTime = now;
    SerialMon.println("🔔 BOUTON APPUYÉ - Début du chronométrage...");
  }

  // Button released (rising edge)
  if (currentButtonState == HIGH && lastButtonState == LOW && buttonPressStartTime > 0)
  {
    unsigned long pressDuration = now - buttonPressStartTime;
    SerialMon.print("🔔 BOUTON RELÂCHÉ - Durée: ");
    SerialMon.print(pressDuration);
    SerialMon.println("ms");

    // Check if press duration >= 3 seconds
    if (pressDuration >= BUTTON_PRESS_THRESHOLD)
    {
      // Toggle emergency mode
      emergencyMode = !emergencyMode;

      if (emergencyMode)
      {
        SerialMon.println("🚨 MODE URGENCE ACTIVÉ!");
        // 3 short vibrations
        vibrate(100);
        delay(50);
        vibrate(100);
        delay(50);
        vibrate(100);
      }
      else
      {
        SerialMon.println("✓ MODE NORMAL ACTIVÉ");
        // 1 longer vibration
        vibrate(300);
      }
    }
    else
    {
      SerialMon.println("⏱️ Appui trop court (< 3s) - ignoré");
    }

    buttonPressStartTime = 0;
  }

  lastButtonState = currentButtonState;
}

// Fonction pour mettre à jour l'état des LEDs selon le mode
void updateLeds()
{
  unsigned long now = millis();

  if (currentLedMode == LED_OFF)
  {
    // Éteindre les LEDs
    leds.clear();
    leds.show();
  }
  else if (currentLedMode == LED_BLINKING)
  {
    // LED Modem (index 0) - Vert - clignote
    if (now - lastModemToggle > 500)
    {
      ledModemState = !ledModemState;
      lastModemToggle = now;
      if (ledModemState)
      {
        leds.setPixelColor(0, leds.Color(0, 255, 0)); // Vert
      }
      else
      {
        leds.setPixelColor(0, 0); // Éteint
      }
      leds.show();
    }

    // LED GPS (index 1) - Bleu - clignote
    if (now - lastGpsToggle > 500)
    {
      ledGpsState = !ledGpsState;
      lastGpsToggle = now;
      if (ledGpsState)
      {
        leds.setPixelColor(1, leds.Color(0, 0, 255)); // Bleu
      }
      else
      {
        leds.setPixelColor(1, 0); // Éteint
      }
      leds.show();
    }
  }
  else if (currentLedMode == LED_NORMAL)
  {
    // LED Modem (index 0) - Vert - allumée
    leds.setPixelColor(0, leds.Color(0, 255, 0)); // Vert fixe

    // LED GPS (index 1) - Bleu - allumée
    leds.setPixelColor(1, leds.Color(0, 0, 255)); // Bleu fixe

    leds.show();
  }
}

// Collect GPS data from modem
void collectGpsData()
{
  float lat, lon;
  float speed, alt;
  float accuracy;
  int vsat, usat, year, month, day, hour, minute, second;

  if (modem.getGPS(&lat, &lon, &speed, &alt, &vsat, &usat, &accuracy, &year, &month, &day, &hour, &minute, &second))
  {
    currentGpsData.latitude = lat;
    currentGpsData.longitude = lon;
    currentGpsData.altitude = alt;
    currentGpsData.satellites = vsat;
    currentGpsData.date = String(year) + "-" + String(month) + "-" + String(day);
    currentGpsData.time = String(hour) + ":" + String(minute) + ":" + String(second);
    gpsDataReady = true;
    SerialMon.println("✓ GPS data collected");
  }
  else
  {
    gpsDataReady = false;
    SerialMon.println("✗ GPS data not available");
  }
}

// Collect network signal data
void collectNetworkData()
{
  int csq = modem.getSignalQuality();
  currentGpsData.signalCSQ = csq;
  currentGpsData.rsrp = ""; // Will be populated if available
  currentGpsData.rsrq = ""; // Will be populated if available
  currentGpsData.networkType = "4G";
  networkDataReady = true;
  SerialMon.println("✓ Network data collected");
}

// Collect IMU data
void collectImuData()
{
  if (!imuReady)
  {
    currentImuData.available = false;
    imuDataReady = false;
    return;
  }

  if (IMU.accelerationAvailable())
  {
    IMU.readAcceleration(currentImuData.accelX, currentImuData.accelY, currentImuData.accelZ);
  }

  if (IMU.gyroscopeAvailable())
  {
    IMU.readGyroscope(currentImuData.gyroX, currentImuData.gyroY, currentImuData.gyroZ);
  }

  currentImuData.temperature = 0; // TODO: Add temperature sensor reading if available
  currentImuData.available = true;
  imuDataReady = true;
  SerialMon.println("✓ IMU data collected");
}

// Register bracelet on first boot
bool registerBracelet()
{
  SerialMon.println("\n>> Registering bracelet on first boot (HTTPS)...");

  if (!client.connect(SERVER_URL, SERVER_PORT))
  {
    SerialMon.println("✗ Cannot connect to server for registration");
    return false;
  }

  // Build JSON payload
  String jsonPayload = "{\"unique_code\":\"" + String(BRACELET_UNIQUE_CODE) + "\"}";

  String request = "POST /api/devices/register HTTP/1.1\r\n";
  request += "Host: " + String(SERVER_HOST) + "\r\n";
  request += "Content-Type: application/json\r\n";
  request += "Content-Length: " + String(jsonPayload.length()) + "\r\n";
  request += "Connection: close\r\n";
  request += "\r\n";
  request += jsonPayload;

  client.print(request);

  delay(500); // Give server time to respond

  unsigned long timeout = millis() + 10000; // Increased to 10 seconds
  String response = "";
  bool gotData = false;

  while (millis() < timeout)
  {
    if (client.available())
    {
      char c = client.read();
      response += c;
      gotData = true;
    }
    else if (gotData && !client.connected())
    {
      // We got some data and connection is closed, we're done
      break;
    }
    delay(10); // Small delay to avoid spinning
  }

  if (response.length() > 0)
  {
    SerialMon.println("Registration response:");
    SerialMon.println(response);

    if (response.indexOf("\"id\"") > 0)
    {
      SerialMon.println("✓ Bracelet registered successfully");

      // Mark as registered in EEPROM
      EEPROM.write(EEPROM_REGISTERED_FLAG, 1);
      EEPROM.commit();

      return true;
    }
    else
    {
      SerialMon.println("✗ Registration failed");
      return false;
    }
  }

  client.stop();
  SerialMon.println("✗ Registration timeout");
  return false;
}

// Check if bracelet is associated with a user
bool checkAssociation()
{
  SerialMon.println("\n>> Checking association (HTTPS)...");

  if (!client.connect(SERVER_URL, SERVER_PORT))
  {
    SerialMon.println("✗ Cannot connect to server for association check");
    return false;
  }

  String request = "GET /api/devices/check-association HTTP/1.1\r\n";
  request += "Host: " + String(SERVER_HOST) + "\r\n";
  request += "X-Bracelet-ID: " + String(BRACELET_UNIQUE_CODE) + "\r\n";
  request += "Connection: close\r\n";
  request += "\r\n";

  client.print(request);

  delay(500); // Give server time to respond

  unsigned long timeout = millis() + 10000; // Increased to 10 seconds
  String response = "";
  bool gotData = false;

  while (millis() < timeout)
  {
    if (client.available())
    {
      char c = client.read();
      response += c;
      gotData = true;
    }
    else if (gotData && !client.connected())
    {
      // We got some data and connection is closed, we're done
      break;
    }
    delay(10); // Small delay to avoid spinning
  }

  if (response.length() > 0)
  {
    SerialMon.println("Association response:");
    SerialMon.println(response);

    // Look for "associated":true in the response (without escaping the quotes)
    if (response.indexOf("associated") > 0)
    {
      // Parse the JSON value: look for true or false after "associated"
      int associatedIdx = response.indexOf("associated");
      int colonIdx = response.indexOf(":", associatedIdx);

      if (colonIdx > 0)
      {
        // Skip whitespace and get the value
        String valueStr = response.substring(colonIdx + 1);

        if (valueStr.indexOf("true") == 0 || valueStr.indexOf("true") < 10)
        {
          SerialMon.println("✓ Bracelet is associated");
          return true;
        }
      }
    }

    SerialMon.println("✗ Bracelet is NOT associated");
    return false;
  }

  client.stop();
  SerialMon.println("✗ Association check timeout");
  return false;
}

void setup()
{
  SerialMon.begin(115200);
  delay(2000);

  SerialMon.println("\n=== GPS A7670E ===\n");

  // Initialize EEPROM for first-boot detection
  EEPROM.begin(EEPROM_SIZE);
  braceletRegistered = EEPROM.read(EEPROM_REGISTERED_FLAG);

  // DEBUG: Reset EEPROM flag to force re-registration (comment out after testing)
  EEPROM.write(EEPROM_REGISTERED_FLAG, 0);
  EEPROM.commit();
  braceletRegistered = 0;
  SerialMon.println("DEBUG: EEPROM flag reset - forcing re-registration");

  SerialMon.print("EEPROM: Bracelet registered = ");
  SerialMon.println(braceletRegistered);

  // Init Vibreur
  pinMode(VIBRER_PIN, OUTPUT);
  digitalWrite(VIBRER_PIN, LOW);

  // Init Bouton
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Init LEDs
  initLeds();

  // Power control
  pinMode(POWER_PIN, OUTPUT);
  digitalWrite(POWER_PIN, HIGH);

  // DTR
  pinMode(DTR_PIN, OUTPUT);
  digitalWrite(DTR_PIN, LOW);

  // Hard Reset du modem
  SerialMon.println("Reset modem...");
  pinMode(PWR_PIN, OUTPUT);
  digitalWrite(PWR_PIN, LOW);
  delay(2000);
  digitalWrite(PWR_PIN, HIGH);

  SerialMon.println("Attente démarrage modem...");
  delay(5000);

  SerialAT.begin(115200, SERIAL_8N1, PIN_RX, PIN_TX);

  SerialMon.println("Attente liaison série...");
  delay(2000);

  SerialMon.println("Initialisation modem...");
  int initAttempts = 0;
  while (!modem.init() && initAttempts < 3)
  {
    initAttempts++;
    SerialMon.print("Tentative ");
    SerialMon.print(initAttempts);
    SerialMon.println("/3 - réessai...");
    delay(1000);
  }

  if (initAttempts >= 3)
  {
    SerialMon.println("Échec init modem après 3 tentatives");
    while (1)
      ;
  }

  // Initialisation I2C pour LSM6DS3
  SerialMon.println("\nInitialisation I2C et LSM6DS3...");
  Wire.begin(I2C_SDA, I2C_SCL, 400000);

  // Scanner I2C
  SerialMon.println("Scanning I2C bus (pins 21/22)...");
  int deviceCount = 0;
  for (uint8_t addr = 1; addr < 127; addr++)
  {
    Wire.beginTransmission(addr);
    uint8_t error = Wire.endTransmission();
    if (error == 0)
    {
      deviceCount++;
      SerialMon.print("  Device trouvé à 0x");
      if (addr < 16)
        SerialMon.print("0");
      SerialMon.println(addr, HEX);
    }
  }

  if (deviceCount == 0)
  {
    SerialMon.println("  ⚠️  AUCUN device trouvé sur I2C!");
  }

  SerialMon.println("Tentative init LSM6DS3...");
  if (!IMU.begin())
  {
    SerialMon.println("✗ Erreur init LSM6DS3 - continuant sans capteur");
    imuReady = false;
  }
  else
  {
    SerialMon.println("✓ LSM6DS3 initialisé");
    SerialMon.print("  Taux d'accélération: ");
    SerialMon.print(IMU.accelerationSampleRate());
    SerialMon.println(" Hz");
    imuReady = true;
  }

  String name = modem.getModemName();
  SerialMon.print("Modem: ");
  SerialMon.println(name);

  String info = modem.getModemInfo();
  SerialMon.println(info);

  // INFOS CARTE SIM
  SerialMon.println("\n--- Infos SIM ---");

  String imei = modem.getIMEI();
  SerialMon.print("IMEI: ");
  SerialMon.println(imei);

  String ccid = modem.getSimCCID();
  SerialMon.print("ICCID (N° SIM): ");
  SerialMon.println(ccid);

  String imsi = modem.getIMSI();
  SerialMon.print("IMSI: ");
  SerialMon.println(imsi);

  modem.sendAT("+CNUM");
  if (modem.waitResponse(2000, "+CNUM:") == 1)
  {
    String cnum = modem.stream.readStringUntil('\n');
    cnum.trim();
    SerialMon.print("Numéro tél: ");
    SerialMon.println(cnum);
  }
  else
  {
    SerialMon.println("Numéro tél: Non disponible (normal pour certaines SIM data-only)");
  }

  SerialMon.println();

  // Active le GPS
  SerialMon.println("\nActivation GPS...");

  modem.sendAT("+CGNSSPWR=0");
  modem.waitResponse(2000);

  modem.sendAT("+CGNSSPWR=1");
  modem.waitResponse(2000);

  // Attente GPS ready
  SerialMon.print("Attente GPS ready");
  while (modem.waitResponse(1000UL, "+CGNSSPWR: READY!") != 1)
  {
    SerialMon.print(".");
  }
  SerialMon.println("\n✓ GPS prêt");
  vibrate(200);

  modem.sendAT("+CGNSSMODE=1");
  modem.waitResponse(2000);

  SerialMon.println("\n=== PRÊT ===");
  SerialMon.println("Placez près d'une fenêtre");
  SerialMon.println("Premier fix: 2-10 minutes\n");

  // Connexion réseau
  SerialMon.println("Connexion au réseau 4G...");

  if (!modem.waitForNetwork(30000L))
  {
    SerialMon.println("✗ Pas de réseau");
  }
  else
  {
    SerialMon.println("✓ Réseau OK");

    if (modem.gprsConnect("orange", "", ""))
    {
      SerialMon.println("✓ Connexion 4G OK");
      vibrate(200);
      IPAddress ip = modem.localIP();
      SerialMon.print("IP: ");
      SerialMon.println(ip);
    }
  }

  SerialMon.println();

  SerialMon.println("Vérification état GPS:");
  modem.sendAT("+CGNSSPWR?");
  modem.waitResponse(2000);

  modem.sendAT("+CGNSSMODE?");
  modem.waitResponse(2000);

  // Auto-register bracelet on first boot if not already registered
  if (!braceletRegistered)
  {
    SerialMon.println("\n=== First Boot - Auto Registration ===");
    registerBracelet();
  }
  else
  {
    SerialMon.println("\n=== Bracelet Already Registered ===");
  }

  // Check if bracelet is associated with a user
  SerialMon.println("\n=== Association Check ===");
  braceletAssociated = checkAssociation();
  lastAssociationCheck = millis();

  if (braceletAssociated)
  {
    SerialMon.println("✓ Bracelet will send data");
  }
  else
  {
    SerialMon.println("⚠️  Bracelet is not associated - data will NOT be sent");
  }
}

void loop()
{
  unsigned long now = millis();

  // Gestion du bouton
  handleButton();

  // Mise à jour des LEDs
  updateLeds();

  // Collect data periodically
  if (now - lastDataCollection > DATA_COLLECTION_INTERVAL)
  {
    SerialMon.println("\n📊 === Collecte des données ===");
    collectGpsData();
    collectNetworkData();
    collectImuData();
    lastDataCollection = now;
  }

  // Check association periodically
  if (now - lastAssociationCheck > ASSOCIATION_CHECK_INTERVAL)
  {
    braceletAssociated = checkAssociation();
    lastAssociationCheck = now;
  }

  // Send data based on mode - ONLY IF ASSOCIATED
  unsigned long sendInterval = emergencyMode ? SEND_INTERVAL_EMERGENCY : SEND_INTERVAL_NORMAL;

  if (braceletAssociated && (now - lastDataTransmission > sendInterval))
  {
    SerialMon.println("\n📤 === Envoi des données ===");
    String payload = buildJsonPayload(currentGpsData, currentImuData);

    SerialMon.print("Mode: ");
    SerialMon.println(emergencyMode ? "URGENCE" : "NORMAL");
    SerialMon.print("Payload: ");
    SerialMon.println(payload);

    if (sendDataViaHTTP(payload))
    {
      lastDataTransmission = now;
      SerialMon.println("✓ Transmission réussie");
    }
    else
    {
      SerialMon.println("✗ Transmission échouée - réessai dans " + String(sendInterval / 1000) + "s");
    }
  }
  else if (!braceletAssociated && (now - lastDataTransmission > sendInterval))
  {
    SerialMon.println("⚠️  Not sending data - bracelet not associated");
    lastDataTransmission = now; // Update timer so we don't spam
  }

  // Petit délai pour ne pas surcharger
  delay(10);
}

// Legacy loop data reading (kept for reference, now in collection functions)
void loop_legacy()
{
  // Structures pour stocker les données
  GPSData gpsData = {0, 0, 0, 0, "", "", 0, "", "", ""};
  IMUData imuData = {0, 0, 0, 0, 0, 0, 0, false};

  // Lecture données LSM6DS3
  if (imuReady)
  {
    float x, y, z;
    SerialMon.println("\n=== DONNÉES LSM6DS3 ===");

    if (IMU.accelerationAvailable())
    {
      IMU.readAcceleration(x, y, z);
      imuData.accelX = x;
      imuData.accelY = y;
      imuData.accelZ = z;
      SerialMon.println("--- Accélération (m/s²) ---");
      SerialMon.print("  Accel X: ");
      SerialMon.println(x, 4);
      SerialMon.print("  Accel Y: ");
      SerialMon.println(y, 4);
      SerialMon.print("  Accel Z: ");
      SerialMon.println(z, 4);
    }

    if (IMU.gyroscopeAvailable())
    {
      IMU.readGyroscope(x, y, z);
      imuData.gyroX = x;
      imuData.gyroY = y;
      imuData.gyroZ = z;
      SerialMon.println("--- Gyroscope (dps) ---");
      SerialMon.print("  Gyro X: ");
      SerialMon.println(x, 4);
      SerialMon.print("  Gyro Y: ");
      SerialMon.println(y, 4);
      SerialMon.print("  Gyro Z: ");
      SerialMon.println(z, 4);
    }

    if (IMU.temperatureAvailable())
    {
      float temp;
      IMU.readTemperature(temp);
      imuData.temperature = temp;
      SerialMon.println("--- Température ---");
      SerialMon.print("  Temp: ");
      SerialMon.print(temp, 2);
      SerialMon.println(" °C");
    }

    imuData.available = true;
  }

  // Demande info GPS
  SerialMon.println("\n>> AT+CGNSSINFO");
  modem.sendAT("+CGNSSINFO");
  if (modem.waitResponse(2000, "+CGNSSINFO:") == 1)
  {
    String res = modem.stream.readStringUntil('\n');
    res.trim();

    SerialMon.print("Réponse brute: [");
    SerialMon.print(res);
    SerialMon.println("]");

    if (res.length() > 10)
    {
      int idx = 0;
      String fields[20];
      int fieldCount = 0;

      while (idx < res.length() && fieldCount < 20)
      {
        int nextComma = res.indexOf(',', idx);
        if (nextComma == -1)
        {
          fields[fieldCount++] = res.substring(idx);
          break;
        }
        fields[fieldCount++] = res.substring(idx, nextComma);
        idx = nextComma + 1;
      }

      if (fieldCount >= 12)
      {
        String mode = fields[0];
        String satView = fields[1];
        String lat = fields[5];
        String ns = fields[6];
        String lon = fields[7];
        String ew = fields[8];
        String date = fields[9];
        String time = fields[10];
        String alt = fields[11];

        if (lat.length() > 0 && lon.length() > 0)
        {
          SerialMon.println("\n=== POSITION GPS ===");

          float flat = lat.toFloat();
          if (ns == "S")
            flat = -flat;

          float flon = lon.toFloat();
          if (ew == "W")
            flon = -flon;

          SerialMon.print("Latitude: ");
          SerialMon.println(flat, 6);
          SerialMon.print("Longitude: ");
          SerialMon.println(flon, 6);
          SerialMon.print("Altitude: ");
          SerialMon.print(alt);
          SerialMon.println(" m");
          SerialMon.print("Satellites: ");
          SerialMon.println(satView);
          SerialMon.print("Date: ");
          SerialMon.println(date);
          SerialMon.print("Heure: ");
          SerialMon.println(time);

          SerialMon.println("\n--- Réseau 4G ---");

          int csq = modem.getSignalQuality();
          SerialMon.print("Signal (CSQ): ");
          SerialMon.print(csq);
          SerialMon.println(csq > 20 ? " (Excellent)" : csq > 15 ? " (Bon)"
                                                    : csq > 10   ? " (Moyen)"
                                                                 : " (Faible)");

          modem.sendAT("+CPSI?");
          if (modem.waitResponse(2000, "+CPSI:") == 1)
          {
            String cpsi = modem.stream.readStringUntil('\n');
            cpsi.trim();
            SerialMon.print("Détails signal: ");
            SerialMon.println(cpsi);

            int lastComma = cpsi.lastIndexOf(',');
            if (lastComma > 0)
            {
              int prevComma = cpsi.lastIndexOf(',', lastComma - 1);
              if (prevComma > 0)
              {
                String rsrq = cpsi.substring(prevComma + 1, lastComma);
                String rsrp = cpsi.substring(cpsi.lastIndexOf(',', prevComma - 1) + 1, prevComma);
                SerialMon.print("  RSRP: ");
                SerialMon.print(rsrp);
                SerialMon.println(" dBm");
                SerialMon.print("  RSRQ: ");
                SerialMon.print(rsrq);
                SerialMon.println(" dB");
              }
            }
          }

          String op = modem.getOperator();
          SerialMon.print("Opérateur: ");
          SerialMon.println(op);

          IPAddress ip = modem.localIP();
          SerialMon.print("IP: ");
          SerialMon.println(ip);

          modem.sendAT("+COPS?");
          if (modem.waitResponse(2000, "+COPS:") == 1)
          {
            String cops = modem.stream.readStringUntil('\n');
            SerialMon.print("Type réseau: ");
            SerialMon.println(cops);
          }

          SerialMon.println("====================\n");
        }
      }
      else
      {
        SerialMon.println("Pas encore de fix GPS...");
      }
    }
    else
    {
      SerialMon.println("Pas de données GPS valides");
    }
  }
  else
  {
    SerialMon.println("Attente signal GPS...");
  }
  delay(5000);
}
