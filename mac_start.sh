#!/bin/bash
set -e

# ==============================================================================
# SignVision - Mac Run Script (Zero-Error Fine-Tuned)
# This script robustly opens 3 Mac Terminal windows targeting the correct paths,
# activating the specific environments, and explicitly resolving any path issues.
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo " 🚀 Starting SignVision Environments..."
echo "========================================="

echo "1) Booting Core Backend API on Port 8000..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT/backend' && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000\""

sleep 1.5

echo "2) Booting Video Microservice API on Port 8001..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT/video-service' && source .venv/bin/activate && uvicorn main:app --reload --port 8001\""

sleep 1.5

echo "3) Booting Expo Application UI..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT/Application' && npx expo start --clear\""

echo "=========================================================================="
echo "✅ All 3 services have been successfully launched in separate windows!"
echo ""
echo "  - Core Backend:       http://localhost:8000/docs"
echo "  - Video Service:      http://localhost:8001/docs"
echo "  - Expo Dev Server:    http://localhost:8081"
echo ""
echo "📱 Developer Tips:"
echo "   - Press 'i' in the Expo terminal window to open the iOS Simulator."
echo "   - Press 'a' to open the Android emulator."
echo "   - Or scan the QR code using the Expo Go app on your physical device."
echo ""
echo "To shut down the servers, simply close the 3 newly opened Terminal windows."
echo "=========================================================================="
