#!/bin/bash
# Launch LeGuardian Bracelet GUI

cd "$(dirname "$0")" || exit 1

# Check if backend is running
echo "🔍 Checking backend..."
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "Start it with: cd leguardian-backend && php artisan serve --host=localhost --port=8000"
    exit 1
fi

echo "✅ Backend is running"

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source bracelet_env/bin/activate

# Launch GUI
echo "🎨 Launching GUI..."
python3 bracelet_gui.py
