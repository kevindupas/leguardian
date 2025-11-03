# 🚀 Lancement Rapide - GUI Bracelet

## TL;DR - Démarre en 3 commandes

```bash
# Terminal 1: Démarrer le backend
cd leguardian-backend
php artisan serve --host=localhost --port=8000

# Terminal 2: Lancer la GUI
cd /Users/kevindupas/CLIENTS/leguardian
./launch_gui.sh
```

## 🎯 Utilisation Rapide

1. **Fenêtre s'ouvre** → Click "Create Bracelet"
2. **QR Code s'affiche** → Code unique généré et enregistré
3. **Click "Start Simulation"** → Bracelet commence à fonctionner
4. **Interaction:**
   - Click boutons ✓ Arrivé / ⚠ Perdu / 🚨 Danger
   - Click LED colors ou vibrations
   - Watch logs en direct
5. **Click "Stop Simulation"** → Arrête la simulation
6. **Click "Save Log"** → Exporte les données JSON

## 📊 Ce que tu vois

```
┌─────────────────────────────────────────────────────┐
│ QR Code      │ 🎨 Bracelet Visual │  📝 Logs        │
│ (image)      │ • LED indicator   │ [12:34:56] ...  │
│              │ • Battery gauge    │ [12:34:57] ...  │
│ Code: ABC123 │ • Status display   │ [12:34:58] ...  │
│              │                    │                  │
│              │ [✓] [⚠] [🚨]      │ LED | Vibration │
│              │ Buttons            │ [Blue][Red][Off]│
│              │                    │ [Short][Med][SOS]
└─────────────────────────────────────────────────────┘
```

## 🔧 Fonctionnalités

### Boutons Bracelet
- **✓ Arrivé** (Vert): L'enfant est en sécurité
- **⚠ Perdu** (Orange): L'enfant est perdu
- **🚨 Danger** (Rouge): Situation dangereuse

### Contrôles LED
- **Blue**: Allume LED bleu
- **Red**: Allume LED rouge
- **Off**: Éteint LED

### Vibrations
- **Short**: 100ms
- **Medium**: 200ms
- **SOS**: Pattern SOS

### Statut Réel
- Battery: Diminue progressivement
- Status: Änderungen basé sur les boutons
- Location: GPS avec dérive réaliste

## 🐛 Problèmes Courants

### "Backend is not running"
```bash
# Terminal séparé:
cd leguardian-backend
php artisan serve --host=localhost --port=8000
```

### "Authentication failed"
- Backend doit être running
- Database doit être initialisée
- Check les logs pour les erreurs

### Fenêtre ne s'affiche pas
```bash
# Relancer manuellement:
source bracelet_env/bin/activate
python3 bracelet_gui.py
```

## 📂 Fichiers Générés

- `qrcodes/ABC123_qrcode.png` - Le QR code
- `simulation_logs/ABC123_simulation.json` - Les données complètes

## 🧪 Test Scenario

1. Click "Create Bracelet" → Attend 2 sec
2. Click "Start Simulation" → Observe battery dropping
3. Click "🚨 Danger" → Status devient "emergency", location update
4. Click "Blue" LED → LED becomes blue in visualization
5. Click "Short" vibration → Voir l'animation
6. Click "Stop Simulation" → Simulation arrête
7. Click "Save Log" → Données exportées

## 📚 Documentation Complète

Pour plus de détails:
- `BRACELET_GUI_README.md` - Documentation GUI complète
- `BRACELET_SIMULATOR_README.md` - Simulator CLI (sans GUI)
- `SIMULATOR_SUMMARY.md` - Résumé technique

## 🎓 Ce que tu peux tester

✅ Créer des bracelets illimités
✅ Simuler tous les boutons
✅ Contrôler LED et vibrations
✅ Voir la batterie diminuer en temps réel
✅ Voir la localisation changer
✅ Exporter les logs pour analyse

---

**Besoin d'aide?** Check la FAQ dans BRACELET_GUI_README.md
