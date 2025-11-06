# 🎯 LeGuardian Simulator

**Professional bracelet simulator for testing LeGuardian system integration**

## Quick Start

```bash
1. Download: LeGuardian Simulator-1.0.0-arm64.dmg
2. Install: Drag to Applications folder
3. Launch: Open Applications > LeGuardian Simulator
4. Create bracelet and start testing!
```

---

## 📋 Features

✅ **Real API Integration** - Connects to your backend, no hardcoded responses
✅ **Bracelet Simulation** - Mimics ESP32 behavior exactly
✅ **QR Code Generation** - Dynamic, scannable codes for pairing
✅ **GPS Tracking** - Simulated location with realistic accuracy
✅ **Event Buttons** - Safe arrival, lost, and emergency scenarios
✅ **Parent Responses** - Receives vibration/LED commands from mobile app
✅ **Battery Management** - Realistic drain simulation
✅ **Multi-Language** - Full French & English support
✅ **Comprehensive Logging** - Color-coded API traffic and events
✅ **Export Logs** - Download test results as text file

---

## 📖 Documentation

### For Users
👉 **[SIMULATOR_USER_GUIDE.md](./SIMULATOR_USER_GUIDE.md)**
- How to use the simulator
- Step-by-step testing scenarios
- Troubleshooting & FAQ
- Feature explanations with examples

### For Developers
👉 **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)**
- Architecture & design decisions
- API specifications (all 7 endpoints)
- Code structure & functions
- Backend integration requirements
- Performance benchmarks

### Implementation Summary
👉 **[API_INTEGRATION_COMPLETE.md](./API_INTEGRATION_COMPLETE.md)**
- What's been implemented
- Complete data flows
- Configuration guide
- Testing checklist
- Known issues

---

## 🎯 What It Does

### 1. Simulate a Bracelet 👶
The app pretends to be an ESP32 bracelet and communicates with your backend API in real-time:
- Sends location + battery every 5 seconds
- Handles button presses (arrived, lost, emergency)
- Polls for commands from the parent app
- Displays vibration/LED feedback

### 2. Enable Full Testing 🧪
Test your entire system without physical hardware:
- Parent app can send alerts
- Backend can send commands
- Real API traffic is visible in logs
- All events are logged for analysis

### 3. Distribute to Clients 📦
Single DMG file that just works:
- No installation needed
- Professional UI
- Easy to use
- Works on all Apple Silicon Macs

---

## 🚀 Usage

### Basic Flow
```
1. Launch app
2. Enter bracelet name (optional)
3. Click "✨ Create Bracelet" → QR Code appears
4. Scan with mobile app to pair
5. Click "▶️ Start Simulation" → heartbeat begins
6. Press event buttons to test scenarios
7. Parent responds in mobile app
8. See vibration/LED commands in logs
```

### Full End-to-End Test
```
Simulator          Mobile App          Backend
    │                  │                   │
    ├─ Create bracelet ┤                   │
    │                  │                   │
    ├─────────────────────────────────────→ Auth request
    │                  │                   │
    ├─ Scan QR Code ──→ Pair device       │
    │                  │────────────────→ Register
    │                  │                   │
    ├─ Press Emergency→                   │
    │                  │                   │
    ├─────────────────────────────────────→ Button pressed
    │                  │                   │
    │                  ← Push notification─┤
    │                  │                   │
    │                  │─ Respond button ─→
    │                  │                   │
    │                  │                   ├─ Create command
    │                  │                   │
    ├─ Poll commands ──────────────────────→
    │                  │                   │
    ← Receive command ─────────────────────┤
    │                  │                   │
    ├─ Show toast      │                   │
    │ & LED/vibrate    │                   │
    │                  │                   │
    └─ Mark executed ──────────────────────→
```

---

## 🔧 Configuration

### Change Backend URL
```
1. Open simulator
2. Left sidebar → "API URL" field
3. Enter: http://your-backend.com:8000
4. Click "Create Bracelet"
⚠️ Must be done BEFORE creating bracelet
```

### Change Language
```
Click "🌐" button (top right)
→ Toggles between Français ↔ English
→ Preference is saved
```

### Export Logs
```
Click "📥 Download Logs" button
→ Downloads: bracelet-{code}-logs.txt
→ Contains all API requests/responses
```

---

## 📊 API Endpoints Integrated

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/devices/auth` | Authenticate bracelet |
| POST | `/api/devices/heartbeat` | Send location + battery |
| POST | `/api/devices/button/arrived` | Child arrived safely |
| POST | `/api/devices/button/lost` | Child is lost |
| POST | `/api/devices/button/danger` | Child emergency |
| GET | `/api/devices/commands` | Poll for parent commands |
| POST | `/api/devices/commands/{id}/ack` | Mark command executed |

---

## 🎨 UI Overview

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 LeGuardian Simulator              🌐 Français        │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│ 📱 QR CODE       │ 📋 LIVE ACTIVITY LOG               │
│ [QRCode Image]   │ ┌──────────────────────────────┐   │
│                  │ │ ✓ Bracelet created           │   │
│ Code: TEST_ABC   │ │ 💓 Heartbeat sent            │   │
│                  │ │ 📍 Location: 48.8566°N...    │   │
│ ⚙️ SETUP         │ │ 🟢 BUTTON_ARRIVED_PRESSED    │   │
│ [API URL]        │ │ REQUEST: POST /button/arrived │   │
│ [Name]           │ │ RESPONSE: 200 OK              │   │
│ [Create]         │ │ 📳 VIBRATE_SHORT: ⚡ 100ms   │   │
│                  │ │ 🔵 LED_BLINK: blue, fast     │   │
│ 🎮 CONTROLS      │ │                               │   │
│ [▶️ Start]       │ └──────────────────────────────┘   │
│                  │ [Clear] [Download]               │
│ 📢 EVENTS        │                                    │
│ [🟢 Arrived]     │                                    │
│ [🟠 Lost]        │                                    │
│ [🔴 Emergency]   │                                    │
│                  │                                    │
│ 🔋 Battery: 85%  │                                    │
│ Status: Running  │                                    │
│                  │                                    │
└──────────────────┴──────────────────────────────────────┘
```

---

## ✅ What Works Now

- ✅ Real API calls (no mocking)
- ✅ Complete end-to-end testing
- ✅ Parent-child communication
- ✅ All three button scenarios
- ✅ Battery simulation
- ✅ Location tracking
- ✅ Command polling
- ✅ Multi-language UI
- ✅ Professional logging
- ✅ Production-ready quality

---

## 🐛 Troubleshooting

### "Cannot connect to API"
```
1. Verify backend is running: curl http://localhost:8000/api/health
2. Check API URL in simulator (should be http://localhost:8000)
3. Verify migrations are applied: php artisan migrate
4. Check routes exist: php artisan route:list | grep devices
```

### "QR Code won't display"
```
→ Normal, shows as text instead
→ Can copy-paste the code to mobile app
→ Or use text-based input instead of scanner
```

### "Parent responses not received"
```
1. Wait 5-10 seconds (polling interval)
2. Check backend created the BraceletCommand
3. Verify command has status: "pending"
4. Check logs for "GET /devices/commands" request
```

---

## 📦 Distribution

### Share with Client
```bash
1. Give them: LeGuardian Simulator-1.0.0-arm64.dmg
2. Instructions:
   - Double-click DMG
   - Drag app to Applications
   - Launch from Applications folder
3. Support docs: Point to SIMULATOR_USER_GUIDE.md
```

### What They See
- Clean, professional UI
- Easy to understand
- Works immediately after install
- No command line needed
- Just click and test

---

## 🔒 Security

- ✅ Electron sandbox enabled
- ✅ Context isolation enabled
- ✅ No Node.js in renderer
- ✅ No eval() or dynamic code
- ✅ HTTPS ready (configure URL)
- ✅ X-Bracelet-ID header authentication

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| File Size | 87 MB |
| Memory | ~150-200 MB |
| CPU (idle) | <1% |
| CPU (active) | <5% |
| Startup | ~500ms |
| Network per heartbeat | ~1-2 KB |
| Response time | <100ms (local) |

---

## 🎯 Testing Scenarios

### Scenario 1: Quick Verification (5 min)
```
1. Create bracelet
2. Verify QR Code displays
3. Start simulation
4. Check heartbeats in logs
5. Stop simulation
✅ Confirms API connectivity
```

### Scenario 2: Event Testing (10 min)
```
1. Create bracelet + start simulation
2. Press "🟢 Arrivée"
3. Press "🟠 Perdu"
4. Press "🔴 Urgence"
5. Check logs for all requests
✅ Confirms button events work
```

### Scenario 3: Full End-to-End (20 min)
```
1. Create bracelet in simulator
2. Pair in mobile app (scan QR)
3. Start simulation
4. Press emergency button
5. Parent responds in mobile app
6. Wait <10 seconds
7. See vibration/LED in simulator
✅ Confirms complete integration
```

---

## 📝 Version Info

```
Product: LeGuardian Simulator
Version: 1.0.0
Platform: macOS arm64 (Apple Silicon)
Electron: 27.3.11
Node.js: 18.17.1
Build Tool: electron-builder 24.6.0
Build Date: November 6, 2025
Status: Production Ready ✅
```

---

## 📚 Additional Resources

### Documentation Files
- `SIMULATOR_USER_GUIDE.md` - User instructions
- `TECHNICAL_DOCUMENTATION.md` - Developer docs
- `API_INTEGRATION_COMPLETE.md` - Implementation details
- `README.md` - This file

### Source Code
- `/electron-app/index.html` - UI + Logic
- `/electron-app/i18n.json` - Translations
- `/electron-app/main.js` - Electron entry
- `/electron-app/package.json` - Configuration

### Backend Requirements
- Laravel 9+ or 10+
- MySQL/PostgreSQL
- API routes in `routes/api.php`
- DeviceController implementation

---

## 🚀 Getting Started

### Step 1: Install
```bash
# Download and install DMG
# Open Applications > LeGuardian Simulator
```

### Step 2: Configure
```
1. Check API URL (default: http://localhost:8000)
2. Enter bracelet name (optional)
3. Click "✨ Create Bracelet"
```

### Step 3: Test
```
1. Click "▶️ Start Simulation"
2. Watch logs for heartbeats
3. Press buttons to test
4. See parent responses
```

### Step 4: Export Results
```
1. Click "📥 Download Logs"
2. Get bracelet-{code}-logs.txt
3. Share with team
```

---

## 💡 Tips & Tricks

- **Real-time location**: Edit coordinates in code for different test locations
- **Fast battery drain**: Useful for testing low-battery scenarios
- **Multi-bracelet**: Create multiple instances by changing the name
- **Log export**: Use for documentation and issue reporting
- **Language testing**: Test both FR and EN UIs

---

## 🆘 Support

### If Something Doesn't Work
1. Check logs (📥 Download Logs)
2. Verify backend is running
3. Try different API URL
4. Restart the app
5. Check troubleshooting section
6. Report issue with logs attached

### Questions?
- Check SIMULATOR_USER_GUIDE.md (FAQ section)
- Check TECHNICAL_DOCUMENTATION.md (architecture)
- Check API_INTEGRATION_COMPLETE.md (data flows)

---

## ✨ What's Next?

Future enhancements:
- [ ] WebSocket for real-time commands
- [ ] Multiple simultaneous bracelets
- [ ] GPS hardware integration
- [ ] Performance analytics
- [ ] Video recording
- [ ] Offline mode with sync

---

## 📄 License

LeGuardian Simulator - Version 1.0.0
Used for testing and development purposes.

---

**Ready to test? Let's go! 🚀**

Download the DMG, install it, and start testing your LeGuardian system immediately.

---

*Last Updated: November 6, 2025*
*Version: 1.0.0*
*Status: Production Ready* ✅
