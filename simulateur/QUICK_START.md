# ⚡ LeGuardian Simulator - Quick Start Guide

## 📦 Installation (2 minutes)

### Step 1: Download & Install
```
1. Double-click: LeGuardian Simulator-1.0.0-arm64.dmg
2. Drag the app to your Applications folder
3. Eject the DMG
4. Done! ✓
```

### Step 2: First Launch
```
1. Open Applications folder
2. Double-click "LeGuardian Simulator"
3. App opens immediately
4. No setup required!
```

---

## 🚀 Your First Test (5 minutes)

### Create a Bracelet
```
┌─────────────────────────────────────┐
│ Left Sidebar:                       │
│                                     │
│ ⚙️ SETUP                            │
│ [API URL: http://localhost:8000]    │
│ [Bracelet Name: "My Test"]          │
│ [✨ Create Bracelet]                │
│                                     │
└─────────────────────────────────────┘

1. Leave API URL as-is (if backend on localhost)
2. Enter a name for the bracelet
3. Click "✨ Create Bracelet" button
```

### What Happens
- ✓ A unique code is generated (e.g., TEST_ABC123)
- ✓ QR Code appears (scannable with mobile app)
- ✓ Code also shown as text (for manual entry)
- ✓ Buttons become enabled

---

## 🎮 Start Simulation (5 seconds)

### Click Start Button
```
🎮 CONTROLS
[▶️ Start Simulation]  ← Click here
```

### What Happens
- ✓ Button text changes to "⏹️ Stop Simulation"
- ✓ Button color changes to red
- ✓ Status changes from "Idle" to "Running"
- ✓ Battery stays at 100%
- ✓ Logs show: "▶️ Simulation started"

### Every 5 Seconds
- ✓ Heartbeat is sent to backend
- ✓ Battery decrements slightly
- ✓ Location is updated
- ✓ Check for parent commands
- ✓ All visible in logs

---

## 🔴 Test Emergency Button (10 seconds)

### Click Emergency Button
```
📢 EVENTS
[🟢 Safe Arrival]
[🟠 Lost]
[🔴 Emergency]  ← Click here
```

### What Happens
- ✓ Battery drops -2%
- ✓ Status changes to "Emergency"
- ✓ Log shows: "🔴 BUTTON_DANGER_PRESSED"
- ✓ API request visible: "REQUEST: POST /devices/button/danger"
- ✓ Backend receives the alert
- ✓ Parent gets push notification (if app is configured)

---

## 👨‍👩‍👦 See Parent Response (if paired with mobile app)

### What to Do
1. Parent receives notification on their phone
2. Parent opens LeGuardian app
3. Parent sees the emergency alert
4. Parent clicks response button (e.g., "Everything is fine")

### What Happens in Simulator
- ✓ Wait 5-10 seconds...
- ✓ Toast appears: "Parent responded"
- ✓ Logs show vibration command
- ✓ Logs show LED command
- ✓ Example:
  ```
  📳 VIBRATE_SHORT: ⚡ 100ms
  🔵 LED_BLINK: blue, fast
  ```

---

## 📋 Check the Logs

### What You See (Right Side)
```
✓ Bracelet created: TEST_ABC123
REQUEST: POST /devices/auth
  {unique_code: "TEST_ABC123"}
RESPONSE: 200 OK
  {id: 1, status: "active", ...}

💓 Heartbeat sent
REQUEST: POST /devices/heartbeat
  {latitude: 48.8566, longitude: 2.3522, ...}
RESPONSE: 200 OK

🔴 BUTTON_DANGER_PRESSED
REQUEST: POST /devices/button/danger
  {latitude: 48.8575, longitude: 2.3530, ...}
RESPONSE: 200 OK

REQUEST: GET /devices/commands
RESPONSE: 200 OK
  {commands: [{command_type: "vibrate_short", ...}]}

📳 VIBRATE_SHORT: ⚡ 100ms
🔵 LED_BLINK: blue, fast
```

### Log Colors
- 🔵 **Blue** = API Request going out
- 🟢 **Green** = Success / Response received
- 🔴 **Red** = Error
- 🟠 **Orange** = Warning

---

## 📥 Export Your Results

### Download Logs
```
Right side, bottom:
[🗑️ Clear Logs] [📥 Download Logs]
                        ↑ Click here
```

### Get a File
- A text file is downloaded automatically
- File name: `bracelet-{code}-logs.txt`
- Location: Your Downloads folder
- Contains: All API traffic from your test

---

## 🎯 Common Tests

### Test 1: API Connection (30 seconds)
```
1. Create bracelet
2. Check logs for "✓ Authentication successful"
3. If you see it → Backend is connected! ✓
```

### Test 2: Live Tracking (1 minute)
```
1. Create bracelet
2. Start simulation
3. Watch logs for "💓 Heartbeat sent" every 5 seconds
4. Watch battery decrease gradually
5. After 1 min: Battery should be ~98% or less
```

### Test 3: Emergency Alert (3 minutes)
```
1. Create bracelet in simulator
2. Pair with mobile app (scan QR Code)
3. Start simulation in simulator
4. Click "🔴 Emergency" button
5. Parent receives notification on their phone
6. Parent responds in app
7. Simulator shows response within 10 seconds
```

---

## ⚠️ Common Issues

### "Can't connect to backend"
```
❌ PROBLEM: Error logs show connection failed

✅ SOLUTION:
1. Make sure backend is running
   $ php artisan serve
2. Backend should be at: http://localhost:8000
3. Can verify with: curl http://localhost:8000/api/health
4. If you get {status: ok} → Backend is good
5. Try creating bracelet again
```

### "QR Code shows as text, not image"
```
❌ PROBLEM: QR Code appears as text code only

✅ SOLUTION:
This is OK! It means:
→ Internet might be slow loading CDN library
→ You can still use the text code
→ Share the text code: TEST_ABC123
→ Parent can type it into the app instead
```

### "Parent responses not appearing"
```
❌ PROBLEM: Press button, parent responds, but nothing shows

✅ SOLUTION:
1. Wait 5-10 seconds (polling takes time)
2. Check backend database:
   $ php artisan tinker
   >>> App\Models\BraceletCommand::latest()->first();
   → If no results, backend didn't create command
   → Check parent app is sending response
3. Check simulator logs for "GET /devices/commands"
   → If you see 404, endpoint might be missing
```

---

## 🎚️ Adjust Simulator

### Change API URL (Before Creating Bracelet)
```
Left side, in SETUP section:
[API URL Input Field]

1. Clear the field
2. Enter your backend URL
   Example: http://192.168.1.100:8000
3. Click "Create Bracelet"
```

### Change Language
```
Top right corner:
[🌐 Français]  ← Click here

Toggles between:
🇫🇷 Français
🇬🇧 English
```

### Change Bracelet Name
```
Left side, in SETUP section:
[Name Input Field: "My Bracelet"]

1. Clear the field
2. Enter a new name
3. Click "Create Bracelet"
```

---

## 🧪 Full Testing Workflow

### For Developer
```
1. Start backend server
2. Open LeGuardian Simulator
3. Create bracelet (note the code)
4. Start simulation (watch heartbeats)
5. Export logs to verify API traffic
6. Share logs with team for analysis
```

### For QA/Testing
```
1. Get the DMG file from developer
2. Install following "Installation" section above
3. Run the "First Test" scenario
4. Document results
5. Try different buttons and scenarios
6. Export logs for issue reporting
```

### For Product Owner/Client
```
1. Install simulator
2. Test with your mobile app
3. Try creating child profile with QR Code
4. Verify location shows on map
5. Send test alerts from child bracelet
6. Respond to alerts from parent app
7. See simulator react to responses
8. Download logs to show to team
```

---

## 📊 What to Expect

### Realistic Behavior
- **Heartbeat** every 5 seconds (fast for testing)
- **Battery** decreases 0.5-2% per heartbeat
- **Location** is simulated (always Paris for demo)
- **Latency** depends on your network

### Not Realistic
- GPS is simulated (not real location)
- Battery drains fast (test acceleration)
- Same location every time (configurable in code)
- No actual vibration/LED on device

### Time to First Working Test
- **Backend running**: ~5 minutes
- **First heartbeat**: ~30 seconds after start
- **Parent response**: ~10 seconds after mobile app responds
- **Full end-to-end**: ~20 minutes

---

## 🎯 Success Indicators

### ✅ Everything Works If...
- [ ] App launches immediately
- [ ] QR Code (or text code) displays
- [ ] Heartbeats appear every 5 seconds
- [ ] Battery decrements
- [ ] Buttons send requests
- [ ] Logs show "RESPONSE: 200 OK"
- [ ] No errors in logs
- [ ] Parent response appears <10 seconds

### ⚠️ Something Wrong If...
- [ ] App crashes on startup
- [ ] API URL keeps failing
- [ ] Logs show red errors constantly
- [ ] Heartbeats don't appear
- [ ] Battery doesn't change
- [ ] Buttons don't work
- [ ] Parent responses never appear

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| App won't start | Reinstall DMG |
| API won't connect | Verify backend running |
| QR Code won't scan | Use text code instead |
| Commands don't arrive | Wait 10 sec, check DB |
| Battery frozen | Restart simulation |
| Language wrong | Click 🌐 button |
| Logs too long | Click 🗑️ button |

---

## 🎓 Next Steps

After this quick start:

1. **Read full guide** → `SIMULATOR_USER_GUIDE.md`
2. **Understand architecture** → `TECHNICAL_DOCUMENTATION.md`
3. **Check implementation** → `API_INTEGRATION_COMPLETE.md`
4. **Troubleshoot issues** → See full guides above

---

## 📧 Need Help?

### If Backend Won't Connect
```bash
# Verify backend is running
curl http://localhost:8000/api/health
# Should return: {"status":"ok"}

# Check Laravel logs
tail -f storage/logs/laravel.log

# Restart backend
php artisan serve
```

### If Something Crashes
```
1. Close the simulator
2. Download latest DMG
3. Reinstall from scratch
4. Try again
```

### If Still Stuck
```
1. Download logs: Click "📥 Download Logs"
2. Check the text file for error messages
3. Share logs + problem description
4. Ask for help with full context
```

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Install | 2 min |
| Create bracelet | 30 sec |
| First heartbeat | 5-10 sec |
| Full test | 5-10 min |
| End-to-end test | 20 min |
| Export results | 1 sec |

---

## 🎉 You're Ready!

You now have everything you need to test the LeGuardian system.

**Next**: Install the DMG and create your first bracelet!

---

*Quick Start Guide - Version 1.0*
*Last Updated: November 6, 2025*
