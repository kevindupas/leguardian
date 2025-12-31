# 🚀 Déploiement Rapide - MQTT Listeners

## En Prod, Tu Fais Juste Ça :

```bash
# 1. SSH vers ton serveur
ssh user@tracklify.app

# 2. Va dans le projet
cd /var/www/leguardian/leguardian-backend

# 3. Lance le script une fois
sudo bash scripts/setup-mqtt-supervisor.sh

# 4. Verify
sudo supervisorctl status
```

**C'est tout !** Les deux listeners tournent maintenant 24/7.

---

## C'est Quoi Exactement ?

```
leguardian-mqtt-telemetry  ← Reçoit: GPS, IMU, Battery
leguardian-mqtt-acks       ← Reçoit: Confirmations d'exécution

Redémarrage automatique en cas de crash ✅
Logs dans storage/logs/ ✅
Auto-start au boot ✅
```

---

## Vérifier que ça Marche

### Voir le Statut

```bash
sudo supervisorctl status
```

Devrait montrer :
```
leguardian-mqtt-telemetry:... RUNNING   pid 12345, uptime 0:05:23
leguardian-mqtt-acks:...      RUNNING   pid 12346, uptime 0:05:24
```

### Voir les Logs

```bash
# Telemetry
tail -f storage/logs/mqtt-telemetry.log

# ACKs
tail -f storage/logs/mqtt-acks.log
```

### Tester avec un Message

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "bracelets/TEST001/telemetry" \
  -m '{"timestamp":"2025-12-29T15:30:00Z","emergency_mode":false,"gps":{"latitude":48.8,"longitude":2.3,"altitude":35,"satellites":12,"date":"29/12/2025","time":"15:30:00"},"network":{"signal_csq":15,"rsrp":"-110","rsrq":"-8","type":"LTE"},"imu":{"accel":{"x":0.1,"y":0.2,"z":9.8},"gyro":{"x":0.01,"y":0.01,"z":0.01},"temperature":28}}'
```

Tu devrais voir dans le log :
```
[local.INFO] Telemetry received from TEST001
```

---

## Commandes Utiles (Au Besoin)

### Redémarrer un Listener

```bash
# Après modification du code
sudo supervisorctl restart leguardian-mqtt-telemetry:*
sudo supervisorctl restart leguardian-mqtt-acks:*
```

### Arrêter Temporairement

```bash
sudo supervisorctl stop leguardian-mqtt-telemetry:*
sudo supervisorctl stop leguardian-mqtt-acks:*
```

### Relancer

```bash
sudo supervisorctl start leguardian-mqtt-telemetry:*
sudo supervisorctl start leguardian-mqtt-acks:*
```

---

## Architecture

```
Mosquitto (port 1883)
    ↓
Topic: bracelets/{id}/telemetry  →  php artisan mqtt:listen (Supervisor)
Topic: bracelets/{id}/ack        →  php artisan mqtt:listen-acks (Supervisor)
Topic: bracelets/{id}/commands   ←  Backend API (on demand)
```

---

## Fichiers Créés

- `config/supervisor/leguardian-mqtt-telemetry.conf` - Config telemetry
- `config/supervisor/leguardian-mqtt-acks.conf` - Config ACKs
- `scripts/setup-mqtt-supervisor.sh` - Script setup automatique
- `storage/logs/mqtt-telemetry.log` - Logs telemetry
- `storage/logs/mqtt-acks.log` - Logs ACKs

---

## Si Ça Marche Pas

```bash
# 1. Vérifier que Supervisor tourne
sudo systemctl status supervisor

# 2. Vérifier les logs d'erreur
sudo tail -f /var/log/supervisor/supervisord.log

# 3. Tester la commande manuellement
sudo -u www-data php artisan mqtt:listen

# 4. Vérifier la BD
php artisan tinker
>>> DB::connection()->getPdo()

# 5. Vérifier MQTT
sudo systemctl status mosquitto
mosquitto_sub -h localhost -p 1883 -t "test"
```

---

## Résumé

**Une seule commande en prod :**

```bash
sudo bash /var/www/leguardian/leguardian-backend/scripts/setup-mqtt-supervisor.sh
```

**Done !** ✅

Les listeners tournent maintenant en permanence et se relancent automatiquement.
