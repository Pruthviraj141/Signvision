#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# ==============================================================================
# SignVision - Mac Installation Script (Zero-Error Fine-Tuned)
# This script sets up all virtual environments, system dependencies,
# and npm packages for the Backend, Video-Service, and Frontend safely.
# ==============================================================================

echo "========================================="
echo " 🛠️   SignVision Mac Setup Script"
echo "========================================="

# --- 1. Check System Prerequisites (Homebrew, Node, Python, FFmpeg, Watchman) ---
echo "[1/4] Checking prerequisites..."

if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install it first: https://brew.sh/"
    exit 1
fi

# Check for necessary commands; install via brew if missing
for pkg in node python3 ffmpeg watchman; do
    if ! command -v $pkg &> /dev/null; then
        echo "⚠️ $pkg is missing. Installing via Homebrew..."
        brew install $pkg
    fi
done

echo "✅ Prerequisites met (Homebrew, Node, Python3, FFmpeg, Watchman)."

# Save absolute path to project root securely (works even if called from another directory)
export PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- 2. Setup Core Backend ---
echo -e "\n[2/4] Setting up Core Backend..."
cd "$PROJECT_ROOT/backend"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment for backend..."
    python3 -m venv .venv
fi

echo "Activating backend virtual environment..."
source .venv/bin/activate
echo "Installing pip dependencies..."
python3 -m pip install --upgrade pip
pip install -r requirements.txt
echo "Downloading spaCy English transformer model (if not already cached)..."
python3 -m spacy download en_core_web_trf
deactivate
echo "✅ Backend setup complete."

# --- 3. Setup Video Service ---
echo -e "\n[3/4] Setting up Video Microservice..."
cd "$PROJECT_ROOT/video-service"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment for video-service..."
    python3 -m venv .venv
fi

echo "Activating video-service virtual environment..."
source .venv/bin/activate
echo "Installing pip dependencies..."
python3 -m pip install --upgrade pip
pip install -r requirements.txt
deactivate
echo "✅ Video Microservice setup complete."

# --- 4. Setup Frontend (Expo Application) ---
echo -e "\n[4/4] Setting up Mobile Frontend..."
cd "$PROJECT_ROOT/Application"
echo "Installing npm dependencies (disabling strict peer checks for React Native)..."
npm install --legacy-peer-deps
echo "✅ Frontend setup complete."

# --- 5. Bootstrapping Secrets (.env) ---
echo -e "\n[Extra] Checking Environment Variables..."
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating a copy of .env.example..."
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env" 2>/dev/null || true
fi
if [ ! -f "$PROJECT_ROOT/video-service/.env" ]; then
    echo "⚠️  video-service/.env not found. Creating a copy of .env.example..."
    cp "$PROJECT_ROOT/video-service/.env.example" "$PROJECT_ROOT/video-service/.env" 2>/dev/null || true
fi

echo "=========================================================================="
echo "🎉 SETUP COMPLETED SUCCESSFULLY (ZERO ERRORS)!"
echo "Before running, please edit your API keys in:"
echo "  1. backend/.env          (Add your GPT_API_KEY)"
echo "  2. video-service/.env    (Add your GEMINI_API_KEY)"
echo ""
echo "To start the application, run: ./mac_start.sh"
echo "=========================================================================="
