# Guide de Déploiement en Production - MQTT Listeners

## Vue d'Ensemble

Ce guide explique comment déployer les deux MQTT listeners (`mqtt:listen` et `mqtt:listen-acks`) en production avec Supervisor, afin qu'ils se lancent automatiquement au démarrage du serveur et se relancent en cas de crash.

```
Mosquitto (systemd)
    ↓
Supervisor
    ├─ leguardian-mqtt-telemetry (php artisan mqtt:listen)
    └─ leguardian-mqtt-acks (php artisan mqtt:listen-acks)
```

---

## Prérequis

- ✅ Mosquitto installé et actif (`sudo systemctl status mosquitto`)
- ✅ Laravel backend déployé dans `/var/www/leguardian/leguardian-backend`
- ✅ Composer dependencies installées
- ✅ Base de données migrée

---

## Étape 1 : Préparer l'Environnement

### 1.1 Vérifier l'installation de Mosquitto

```bash
sudo systemctl status mosquitto
```

Vous devriez voir :
```
● mosquitto.service - Mosquitto MQTT Broker
     Loaded: loaded (/lib/systemd/system/mosquitto.service; enabled; preset: enabled)
     Active: active (running) since Mon 2025-12-29 14:57:12 CET; 1h 43min ago
```

### 1.2 Créer les répertoires de logs

```bash
mkdir -p /var/www/leguardian/leguardian-backend/storage/logs
sudo chown -R www-data:www-data /var/www/leguardian/leguardian-backend/storage/logs
sudo chmod -R 755 /var/www/leguardian/leguardian-backend/storage/logs
```

### 1.3 Vérifier les migrations

```bash
cd /var/www/leguardian/leguardian-backend
php artisan migrate
```

Cela s'assure que la table `bracelet_commands` a la colonne `metadata`.

---

## Étape 2 : Installer Supervisor (si nécessaire)

```bash
sudo apt-get update
sudo apt-get install -y supervisor
```

Vérifier l'installation :
```bash
supervisorctl --version
```

---

## Étape 3 : Utiliser le Script de Configuration Automatique

### Méthode 1 : Script Automatique (Recommandé)

```bash
cd /var/www/leguardian/leguardian-backend
sudo bash scripts/setup-mqtt-supervisor.sh
```

Le script effectue automatiquement :
- ✅ Copie les fichiers de configuration
- ✅ Recharge Supervisor
- ✅ Démarre les listeners
- ✅ Affiche le statut

### Résultat Attendu

```
================================
Setup Supervisor pour MQTT
================================

✓ Supervisor est installé
✓ Répertoires créés
✓ Configurations copiées
✓ Supervisor reconfiguré
✓ Listeners démarrés

📊 Statut des services:
leguardian-mqtt-telemetry:leguardian-mqtt-telemetry_00   RUNNING   pid 12345, uptime 0:00:05
leguardian-mqtt-acks:leguardian-mqtt-acks_00              RUNNING   pid 12346, uptime 0:00:05

================================
✅ Configuration terminée!
================================
```

---

## Étape 4 : Vérifier les Listeners

### 4.1 Vérifier le Statut

```bash
sudo supervisorctl status
```

Résultat attendu :
```
leguardian-mqtt-acks:leguardian-mqtt-acks_00       RUNNING   pid 12346, uptime 0:01:23
leguardian-mqtt-telemetry:leguardian-mqtt-telemetry_00 RUNNING   pid 12345, uptime 0:01:24
```

### 4.2 Voir les Logs en Temps Réel

**Telemetry** :
```bash
tail -f /var/www/leguardian/leguardian-backend/storage/logs/mqtt-telemetry.log
```

**ACKs** :
```bash
tail -f /var/www/leguardian/leguardian-backend/storage/logs/mqtt-acks.log
```

Vous devriez voir :
```
Connected to MQTT broker
Listening for MQTT messages (Ctrl+C to exit)...
```

### 4.3 Tester la Communication

**Terminal 1** : Voir la telemetry en direct
```bash
tail -f /var/www/leguardian/leguardian-backend/storage/logs/mqtt-telemetry.log
```

**Terminal 2** : Publier un message de test
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "bracelets/ESP32_TEST_001/telemetry" \
  -m '{"timestamp":"2025-12-29T15:30:00Z","emergency_mode":false,"gps":{"latitude":48.8,"longitude":2.3,"altitude":35,"satellites":12,"date":"29/12/2025","time":"15:30:00"},"network":{"signal_csq":15,"rsrp":"-110","rsrq":"-8","type":"LTE"},"imu":{"accel":{"x":0.1,"y":0.2,"z":9.8},"gyro":{"x":0.01,"y":0.01,"z":0.01},"temperature":28}}'
```

**Terminal 1** devrait afficher :
```
[2025-12-29 15:30:01] local.INFO: Telemetry received from ESP32_TEST_001
```

---

## Étape 5 : Configurer Auto-Start au Boot

Supervisor est configuré pour auto-start, mais vérifiez :

```bash
sudo systemctl status supervisor
```

Devrait afficher :
```
Active: active (running) since ...
Loaded: loaded (...; enabled; ...)
```

Pour l'activer au démarrage (si nécessaire) :
```bash
sudo systemctl enable supervisor
```

---

## Configuration Manuelle (Alternative)

Si vous préférez configurer manuellement au lieu d'utiliser le script :

### Copier les fichiers de configuration

```bash
sudo cp /var/www/leguardian/leguardian-backend/config/supervisor/leguardian-mqtt-telemetry.conf \
        /etc/supervisor/conf.d/leguardian-mqtt-telemetry.conf

sudo cp /var/www/leguardian/leguardian-backend/config/supervisor/leguardian-mqtt-acks.conf \
        /etc/supervisor/conf.d/leguardian-mqtt-acks.conf
```

### Recharger Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
```

### Démarrer les services

```bash
sudo supervisorctl start leguardian-mqtt-telemetry:*
sudo supervisorctl start leguardian-mqtt-acks:*
```

### Vérifier le statut

```bash
sudo supervisorctl status
```

---

## Commandes de Management

### Voir le statut de tous les services

```bash
sudo supervisorctl status
```

### Voir le statut d'un service spécifique

```bash
sudo supervisorctl status leguardian-mqtt-telemetry:*
sudo supervisorctl status leguardian-mqtt-acks:*
```

### Redémarrer un listener

```bash
# Redémarrer telemetry
sudo supervisorctl restart leguardian-mqtt-telemetry:*

# Redémarrer ACKs
sudo supervisorctl restart leguardian-mqtt-acks:*

# Redémarrer tous les listeners
sudo supervisorctl restart leguardian-mqtt-telemetry:* leguardian-mqtt-acks:*
```

### Arrêter un listener

```bash
# Arrêter telemetry
sudo supervisorctl stop leguardian-mqtt-telemetry:*

# Arrêter ACKs
sudo supervisorctl stop leguardian-mqtt-acks:*

# Arrêter tous les listeners
sudo supervisorctl stop leguardian-mqtt-telemetry:* leguardian-mqtt-acks:*
```

### Relancer après modification du code

```bash
# Après modification de MqttListenCommand.php
sudo supervisorctl restart leguardian-mqtt-telemetry:*

# Après modification de MqttListenAcksCommand.php
sudo supervisorctl restart leguardian-mqtt-acks:*
```

---

## Monitoring

### Vérifier que les services tournent

```bash
# Voir tous les processus Supervisor
sudo supervisorctl status

# Voir les processus PHP
ps aux | grep "artisan mqtt"

# Voir les connexions MQTT
sudo lsof -i :1883
```

### Logs Importants

**Logs des listeners** :
```bash
# Telemetry
tail -f /var/www/leguardian/leguardian-backend/storage/logs/mqtt-telemetry.log

# ACKs
tail -f /var/www/leguardian/leguardian-backend/storage/logs/mqtt-acks.log
```

**Logs Laravel** :
```bash
tail -f /var/www/leguardian/leguardian-backend/storage/logs/laravel.log | grep -i mqtt
```

**Logs Supervisor** :
```bash
sudo tail -f /var/log/supervisor/supervisord.log
```

**Logs Mosquitto** :
```bash
sudo tail -f /var/log/mosquitto/mosquitto.log
```

### Vérifier les Topics MQTT

```bash
# Écouter tous les messages
mosquitto_sub -h localhost -p 1883 -t "bracelets/#" -v

# Écouter seulement telemetry
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/telemetry"

# Écouter seulement ACKs
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/ack"

# Écouter seulement commands
mosquitto_sub -h localhost -p 1883 -t "bracelets/+/commands"
```

---

## Troubleshooting

### Les listeners ne démarrent pas

**Problème** : `sudo supervisorctl status` montre `FATAL`

**Solutions** :
```bash
# 1. Vérifier la syntaxe des fichiers
sudo supervisord -c /etc/supervisor/supervisord.conf

# 2. Vérifier les logs
sudo tail -f /var/log/supervisor/supervisord.log

# 3. Vérifier que le chemin du PHP est correct
which php
# Devrait afficher: /usr/bin/php

# 4. Tester la commande manuellement
sudo -u www-data php /var/www/leguardian/leguardian-backend/artisan mqtt:listen
```

### Les listeners s'arrêtent après quelques secondes

**Problème** : Status passe de RUNNING à EXITED

**Solutions** :
```bash
# 1. Vérifier que la BD est accessible
php /var/www/leguardian/leguardian-backend/artisan tinker
>>> DB::connection()->getPdo()

# 2. Vérifier la connexion MQTT
mosquitto_sub -h localhost -p 1883 -t "test"

# 3. Voir l'erreur complète
php /var/www/leguardian/leguardian-backend/artisan mqtt:listen

# 4. Vérifier les migrations
php artisan migrate --check
```

### Listener consomme trop de CPU/RAM

**Problème** : Le processus PHP prend 100% CPU

**Solutions** :
```bash
# 1. Ajouter un délai dans la boucle
# Vérifier MqttListenCommand.php

# 2. Ajouter un timeout
sudo supervisorctl restart leguardian-mqtt-telemetry:*

# 3. Limiter les ressources dans supervisor
# Ajouter à la config:
# minfds=1024
# minprocs=200
```

### Mosquitto n'écoute pas le port 1883

**Problème** : Connection refused sur le port 1883

**Solutions** :
```bash
# 1. Vérifier que Mosquitto tourne
sudo systemctl status mosquitto

# 2. Vérifier que le port est ouvert
sudo lsof -i :1883
sudo ss -tlnp | grep mosquitto

# 3. Vérifier la configuration
cat /etc/mosquitto/mosquitto.conf
cat /etc/mosquitto/conf.d/websocket.conf

# 4. Redémarrer Mosquitto
sudo systemctl restart mosquitto
```

---

## Mise à Jour du Code

Quand vous modifiez le code des listeners :

```bash
# 1. Modifier le fichier (ex: MqttListenCommand.php)
nano /var/www/leguardian/leguardian-backend/app/Console/Commands/MqttListenCommand.php

# 2. Redémarrer le listener
sudo supervisorctl restart leguardian-mqtt-telemetry:*

# 3. Vérifier le statut
sudo supervisorctl status leguardian-mqtt-telemetry:*

# 4. Voir les logs
tail -f /var/www/leguardian/leguardian-backend/storage/logs/mqtt-telemetry.log
```

---

## Architecture Finale

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SERVER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  systemd                                             │  │
│  │  ├─ mosquitto.service (MQTT Broker)                 │  │
│  │  ├─ supervisor.service                              │  │
│  │  │  ├─ leguardian-mqtt-telemetry (auto-start)       │  │
│  │  │  └─ leguardian-mqtt-acks (auto-start)            │  │
│  │  └─ nginx/apache (Web Server)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↑                                   │
│                    Supervisor                              │
│               (gère auto-restart)                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          MQTT Topics (port 1883, 9001)              │  │
│  │  ├─ bracelets/+/telemetry   (Bracelet → Backend)   │  │
│  │  ├─ bracelets/+/commands    (Backend → Bracelet)   │  │
│  │  └─ bracelets/+/ack        (Bracelet → Backend)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↑ 4G/WiFi
                        Bracelets
```

---

## Checklist de Déploiement

- [ ] Mosquitto installé et actif
- [ ] Laravel backend déployé
- [ ] Migrations appliquées (`php artisan migrate`)
- [ ] Script setup-mqtt-supervisor.sh exécuté (`sudo bash scripts/setup-mqtt-supervisor.sh`)
- [ ] Supervisorctl status montre les deux services RUNNING
- [ ] Logs montrent "Connected to MQTT broker"
- [ ] Test telemetry fonctionne
- [ ] Supervisor auto-start activé (`sudo systemctl enable supervisor`)
- [ ] Mosquitto auto-start activé (déjà fait)
- [ ] Documentation accessible pour maintenance future

---

## Résumé

Pour mettre en place les listeners en production :

```bash
# 1. Une seule commande !
sudo bash /var/www/leguardian/leguardian-backend/scripts/setup-mqtt-supervisor.sh

# 2. Vérifier que tout fonctionne
sudo supervisorctl status

# 3. C'est tout ! Les listeners redémarrent automatiquement
```

Les deux listeners tournent maintenant 24/7 et redémarrent automatiquement en cas de crash. 🚀
