#include <Arduino.h>
#include <Wire.h>
#include <Arduino_LSM6DS3.h>

#define TINY_GSM_RX_BUFFER 1024

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

#include <TinyGsmClient.h>

TinyGsm modem(SerialAT);
bool imuReady = false;

void setup()
{
  SerialMon.begin(115200);
  delay(2000);

  SerialMon.println("\n=== GPS A7670E ===\n");

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
  delay(2000);  // Maintien du reset pendant 2s
  digitalWrite(PWR_PIN, HIGH);

  SerialMon.println("Attente démarrage modem...");
  delay(5000);  // Augmenté pour laisser le temps au modem de booter

  SerialAT.begin(115200, SERIAL_8N1, PIN_RX, PIN_TX);

  // Attendre que la liaison série soit stable
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

  // Initialisation I2C pour LSM6DS3 (APRÈS modem)
  SerialMon.println("\nInitialisation I2C et LSM6DS3...");
  Wire.begin(I2C_SDA, I2C_SCL, 400000); // 400kHz

  // Scanner I2C - cherche les devices sur le bus
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
      if (addr < 16) SerialMon.print("0");
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

  // IMEI (identifiant modem)
  String imei = modem.getIMEI();
  SerialMon.print("IMEI: ");
  SerialMon.println(imei);

  // ICCID (numéro carte SIM)
  String ccid = modem.getSimCCID();
  SerialMon.print("ICCID (N° SIM): ");
  SerialMon.println(ccid);

  // IMSI (identifiant abonné)
  String imsi = modem.getIMSI();
  SerialMon.print("IMSI: ");
  SerialMon.println(imsi);

  // Numéro de téléphone (MSISDN) - parfois vide si non configuré par l'opérateur
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

  // Désactive d'abord
  modem.sendAT("+CGNSSPWR=0");
  modem.waitResponse(2000);

  // Active le GPS
  modem.sendAT("+CGNSSPWR=1");
  modem.waitResponse(2000);

  // Attente GPS ready
  SerialMon.print("Attente GPS ready");
  while (modem.waitResponse(1000UL, "+CGNSSPWR: READY!") != 1)
  {
    SerialMon.print(".");
  }
  SerialMon.println("\n✓ GPS prêt");

  // Mode GPS only
  modem.sendAT("+CGNSSMODE=1");
  modem.waitResponse(2000);

  SerialMon.println("\n=== PRÊT ===");
  SerialMon.println("Placez près d'une fenêtre");
  SerialMon.println("Premier fix: 2-10 minutes\n");

  // Connexion réseau
  SerialMon.println("Connexion au réseau 4G...");

  // Attente réseau
  if (!modem.waitForNetwork(30000L))
  {
    SerialMon.println("✗ Pas de réseau");
  }
  else
  {
    SerialMon.println("✓ Réseau OK");

    // Connexion GPRS
    if (modem.gprsConnect("orange", "", ""))
    {
      SerialMon.println("✓ Connexion 4G OK");
      IPAddress ip = modem.localIP();
      SerialMon.print("IP: ");
      SerialMon.println(ip);
    }
  }

  SerialMon.println();

  // Vérifie l'état du GPS
  SerialMon.println("Vérification état GPS:");
  modem.sendAT("+CGNSSPWR?");
  modem.waitResponse(2000);

  modem.sendAT("+CGNSSMODE?");
  modem.waitResponse(2000);
}

void loop()
{
  // Lecture données LSM6DS3 (si disponible)
  if (imuReady)
  {
    float x, y, z;
    SerialMon.println("\n=== DONNÉES LSM6DS3 ===");

    // Accélération
    if (IMU.accelerationAvailable())
    {
      IMU.readAcceleration(x, y, z);
      SerialMon.println("--- Accélération (m/s²) ---");
      SerialMon.print("  Accel X: ");
      SerialMon.println(x, 4);
      SerialMon.print("  Accel Y: ");
      SerialMon.println(y, 4);
      SerialMon.print("  Accel Z: ");
      SerialMon.println(z, 4);
    }

    // Gyroscope
    if (IMU.gyroscopeAvailable())
    {
      IMU.readGyroscope(x, y, z);
      SerialMon.println("--- Gyroscope (dps) ---");
      SerialMon.print("  Gyro X: ");
      SerialMon.println(x, 4);
      SerialMon.print("  Gyro Y: ");
      SerialMon.println(y, 4);
      SerialMon.print("  Gyro Z: ");
      SerialMon.println(z, 4);
    }

    // Température
    if (IMU.temperatureAvailable())
    {
      float temp;
      IMU.readTemperature(temp);
      SerialMon.println("--- Température ---");
      SerialMon.print("  Temp: ");
      SerialMon.print(temp, 2);
      SerialMon.println(" °C");
    }
  }

  // Demande info GPS
  SerialMon.println("\n>> AT+CGNSSINFO");
  modem.sendAT("+CGNSSINFO");
  if (modem.waitResponse(2000, "+CGNSSINFO:") == 1)
  {
    String res = modem.stream.readStringUntil('\n');
    res.trim();

    // AFFICHE LA RÉPONSE BRUTE
    SerialMon.print("Réponse brute: [");
    SerialMon.print(res);
    SerialMon.println("]");

    // Format: mode,fix,utc,lat,N/S,lon,E/W,alt,speed,course,pdop,hdop,vdop,satView,satUse,gpsView,glnView,bdView
    // Exemple: 1,1,20231225120000.000,4851.1234,N,00223.4567,E,123.4,0.0,0.0,1.2,0.8,0.7,12,8,8,0,4

    if (res.length() > 10)
    {
      // Parse les données
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
        String mode = fields[0];    // Mode GNSS
        String satView = fields[1]; // Satellites visibles
        String lat = fields[5];     // Latitude (déjà en décimal)
        String ns = fields[6];      // N/S
        String lon = fields[7];     // Longitude (déjà en décimal)
        String ew = fields[8];      // E/W
        String date = fields[9];    // Date DDMMYY
        String time = fields[10];   // Heure HHMMSS.ss
        String alt = fields[11];    // Altitude

        if (lat.length() > 0 && lon.length() > 0)
        {
          SerialMon.println("\n=== POSITION GPS ===");

          // Les coordonnées sont DÉJÀ en décimal
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

          // INFOS RÉSEAU
          SerialMon.println("\n--- Réseau 4G ---");

          // Signal quality
          int csq = modem.getSignalQuality();
          SerialMon.print("Signal (CSQ): ");
          SerialMon.print(csq);
          SerialMon.println(csq > 20 ? " (Excellent)" : csq > 15 ? " (Bon)"
                                                    : csq > 10   ? " (Moyen)"
                                                                 : " (Faible)");

          // Détails signal 4G via AT+CPSI?
          modem.sendAT("+CPSI?");
          if (modem.waitResponse(2000, "+CPSI:") == 1)
          {
            String cpsi = modem.stream.readStringUntil('\n');
            cpsi.trim();
            SerialMon.print("Détails signal: ");
            SerialMon.println(cpsi);

            // Parse RSRP, RSRQ si disponible
            // Format: +CPSI: LTE,Online,20801-Orange F,0x4F05,466183429,43,EUTRAN-BAND7,3000,5,5,-95,-11,-64,13
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

          // Opérateur
          String op = modem.getOperator();
          SerialMon.print("Opérateur: ");
          SerialMon.println(op);

          // IP locale
          IPAddress ip = modem.localIP();
          SerialMon.print("IP: ");
          SerialMon.println(ip);

          // Type réseau
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
  delay(5000); // Lecture toutes les 5 secondes
}
