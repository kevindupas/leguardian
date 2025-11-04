# 🧪 Tester la GUI - Guide Complet

## ✅ Checklist de Test

### Avant de Démarrer
- [ ] Backend running: `php artisan serve`
- [ ] Env virtuel: `source bracelet_env/bin/activate`
- [ ] Database initialisée

### Lancement
```bash
./launch_gui.sh
```

Ou manuellement:
```bash
source bracelet_env/bin/activate
python3 bracelet_gui.py
```

## 🎯 Tests Fonctionnels

### Test 1: Création de Bracelet
**Étapes:**
1. Click bouton "Create Bracelet"
2. Observer:
   - [ ] QR Code s'affiche
   - [ ] Code unique généré (ex: ABC123DEF456)
   - [ ] Nom du bracelet affiché
   - [ ] Message de confirmation en logs

**Résultat attendu:**
```
[HH:MM:SS] ✅ Bracelet created and authenticated: ABC123...
```

### Test 2: Simulation Basique
**Étapes:**
1. Click "Create Bracelet"
2. Click "Start Simulation"
3. Observer pendant 30 secondes
4. Click "Stop Simulation"

**Résultats attendus:**
- [ ] Heartbeats chaque ~5 sec (logs montrent ♥)
- [ ] Batterie diminue progressivement
- [ ] Status affiche "active"
- [ ] Location change légèrement
- [ ] Logs continuent de s'ajouter

**Logs à voir:**
```
[HH:MM:SS] ▶️ Simulation started
[HH:MM:SS] ♥ Heartbeat - Battery: 98%
[HH:MM:SS] 📡 Command check
[HH:MM:SS] ♥ Heartbeat - Battery: 96%
...
[HH:MM:SS] ⏹️ Simulation stopped
```

### Test 3: Bouton Arrivé
**Étapes:**
1. Click "Create Bracelet"
2. Click "Start Simulation"
3. Attendre 2-3 heartbeats
4. Click "✓ Arrivé"
5. Observer

**Résultats attendus:**
- [ ] Status reste "active" (vert)
- [ ] Log: "✅ Arrived button pressed"
- [ ] Backend enregistre l'événement

**Logs:**
```
[HH:MM:SS] ✅ Arrived button pressed
```

### Test 4: Bouton Perdu
**Étapes:**
1. Click "Create Bracelet"
2. Click "Start Simulation"
3. Click "⚠ Perdu"
4. Observer le changement

**Résultats attendus:**
- [ ] Status devient "lost" (orange)
- [ ] Bracelet panel affiche l'état orange
- [ ] Log: "⚠️ Lost button pressed"

**Logs:**
```
[HH:MM:SS] ⚠️ Lost button pressed
```

### Test 5: Bouton Danger
**Étapes:**
1. Click "Create Bracelet"
2. Click "Start Simulation"
3. Click "🚨 Danger"
4. Observer durant 10 secondes

**Résultats attendus:**
- [ ] Status devient "emergency" (rouge)
- [ ] Bracelet panel affiche l'état rouge
- [ ] Location change rapidement (plus de mouvement)
- [ ] Log: "🚨 Danger button pressed"

**Logs:**
```
[HH:MM:SS] 🚨 Danger button pressed
```

### Test 6: Contrôle LED
**Étapes:**
1. Click "Create Bracelet"
2. Click "Blue" LED
3. Observer (LED doit être bleue)
4. Click "Red" LED
5. Observer (LED doit être rouge)
6. Click "Off" LED
7. Observer (LED grise)

**Résultats attendus:**
- [ ] LED visual change immédiatement
- [ ] Couleur correcte affichée
- [ ] Logs enregistrent les changements

**Logs:**
```
[HH:MM:SS] 💡 LED on: blue
[HH:MM:SS] 💡 LED on: red
[HH:MM:SS] 💡 LED off
```

### Test 7: Vibrations
**Étapes:**
1. Click "Create Bracelet"
2. Click "Short" vibration
3. Observer animation (vibration_indicator doit "scintiller")
4. Click "Medium" vibration
5. Attendre 500ms
6. Click "SOS" vibration

**Résultats attendus:**
- [ ] Animation visuelle pour chaque vibration
- [ ] Durée correcte (500ms visible)
- [ ] Logs enregistrent le type

**Logs:**
```
[HH:MM:SS] 📳 Short vibration
[HH:MM:SS] 📳 Medium vibration
[HH:MM:SS] 📳 SOS vibration
```

### Test 8: Affichage de Batterie
**Étapes:**
1. Click "Create Bracelet"
2. Note la batterie (100%)
3. Click "Start Simulation"
4. Attendre 1 minute
5. Observer la diminution

**Résultats attendus:**
- [ ] Batterie diminue chaque heartbeat
- [ ] Jauge visuelle se réduit
- [ ] Texte battery_label met à jour
- [ ] Couleur change: vert → orange → rouge

**Progression observée:**
- 100% → 95% → 90% → 85% → ... → 0%
- Vert (>50%) → Orange (20-50%) → Rouge (<20%)

### Test 9: Affichage de Localisation
**Étapes:**
1. Click "Create Bracelet"
2. Note la localisation initiale (48.8566, 2.3522)
3. Click "Start Simulation"
4. Observer les changements

**Résultats attendus:**
- [ ] Localisation change légèrement chaque heartbeat
- [ ] Valeurs restent réalistes (±0.0001)
- [ ] Format: "XX.XXXX, YY.YYYY"

**Exemple:**
```
48.8566, 2.3522
48.8567, 2.3522
48.8567, 2.3521
48.8566, 2.3521
...
```

### Test 10: Export des Logs
**Étapes:**
1. Click "Create Bracelet"
2. Click "Start Simulation"
3. Attendre 10 secondes
4. Click "Stop Simulation"
5. Click "Save Log"
6. Vérifier le fichier généré

**Résultats attendus:**
- [ ] Log: "💾 Log saved to simulation_logs/"
- [ ] Fichier créé: `simulation_logs/ABC123_simulation.json`
- [ ] Fichier contient tous les événements
- [ ] Format JSON valide

**Contenu du fichier:**
```json
{
  "bracelet_id": "ABC123...",
  "name": "Bracelet_ABC123...",
  "final_battery": 95,
  "final_status": "active",
  "final_location": {
    "latitude": 48.8567,
    "longitude": 2.3521,
    "accuracy": 15
  },
  "log_entries": [
    {
      "timestamp": "2025-11-03T...",
      "action": "AUTHENTICATED",
      "details": {...}
    },
    ...
  ]
}
```

## 🚨 Tests Scénarios Complexes

### Scénario: Enfant Perdu
```
1. Create Bracelet
2. Start Simulation
3. Attendre 5 heartbeats
4. Click "⚠ Perdu"
5. Observe: Status orange, location change
6. Attendre 20 secondes
7. Stop Simulation
8. Save Log
9. Vérifier: event_type = "lost" dans le JSON
```

### Scénario: Situation Urgente
```
1. Create Bracelet
2. Start Simulation
3. Click "🚨 Danger"
4. Observe: Status rouge
5. Click "Red" LED
6. Click "SOS" Vibration
7. Attendre 20 secondes (location update rapide)
8. Stop Simulation
9. Save Log
10. Vérifier: event_type = "danger" dans JSON
```

### Scénario: Batterie Critique
```
1. Create Bracelet
2. Start Simulation
3. Attendre ~45 secondes (batterie va de 100 à ~20%)
4. Observe: Batterie rouge
5. Stop Simulation
6. Save Log
7. Vérifier: final_battery < 25
```

## 🔍 Points à Vérifier

### GUI Responsiveness
- [ ] Boutons répondent immédiatement
- [ ] Logs scroll sans lag
- [ ] Simulation ne gèle pas l'interface
- [ ] Fermeture propre (pas de crash)

### Backend Communication
- [ ] Bracelet enregistré en base de données
- [ ] Authentification réussit
- [ ] Heartbeats envoyés correctement
- [ ] Buttons enregistrent les événements

### Données
- [ ] Battery décrémente réaliste (1-3% par heartbeat)
- [ ] Location drifts correctement
- [ ] Status changent correctement
- [ ] Logs JSON valide et complet

### Affichage
- [ ] QR code visible et valide
- [ ] Bracelet visual clairement visible
- [ ] LED color correct (bleu/rouge/gris)
- [ ] Battery gauge correct
- [ ] Status text correct et coloré
- [ ] Logs lisibles

## 📊 Résultats Attendus

### Après "Create Bracelet"
```
Panel: QR code visible
Code: ABC123DEFGHIJ
Name: Bracelet_ABC123
Battery: 100%
Status: active
Location: 48.8566, 2.3522
Logs: ✅ Bracelet created and authenticated
```

### Après "Start Simulation" (20 sec)
```
Battery: ~90% (diminué de ~10%)
Status: active
Location: 48.8566±0.0003, 2.3522±0.0003
Logs: 4x ♥ Heartbeat, 4x 📡 Command check
```

### Après "🚨 Danger"
```
Status: emergency (rouge)
Bracelet panel: rouge
Logs: 🚨 Danger button pressed
```

### Après "Save Log"
```
Logs: 💾 Log saved to simulation_logs/
File: simulation_logs/ABC123DEFGHIJ_simulation.json
```

## 🐛 Debugging

### Si bracelet n'authentifie pas:
```bash
# Check backend running
curl http://localhost:8000/api/health

# Check database
php artisan tinker
>>> Bracelet::count()
```

### Si GUI crash:
```bash
# Relancer avec debugging
python3 -u bracelet_gui.py 2>&1 | tee gui.log
```

### Si logs ne s'affichent pas:
- Check que simulation thread est bien lancé
- Check que les signaux sont connectés
- Relancer l'application

## ✅ Test Complet (5 minutes)

```
[0:00] Launch ./launch_gui.sh
[0:10] Click "Create Bracelet" - Check QR code
[0:20] Click "Start Simulation" - Check heartbeats in logs
[0:40] Click "🚨 Danger" - Check status change to red
[1:00] Click "Blue" LED - Check LED change
[1:10] Click "SOS" - Check vibration animation
[1:30] Click "Stop Simulation" - Check logs stop
[1:40] Click "Save Log" - Verify file created
[1:50] Check logs in simulation_logs/
[2:00] Test terminé ✅
```

---

**Tous les tests doivent passer pour validation complète de l'interface.**
