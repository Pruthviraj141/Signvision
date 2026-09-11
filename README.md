# SignVision

SignVision is an intelligent bidirectional translation system bridging the gap between spoken/written language and Indian Sign Language (ISL). 

use this for creating  embeddings so it should not fail 

python -c "from app.services.semantic_search import build_embeddings; build_embeddings()"



It features two distinct operation modes:
1. **Text-to-Sign:** Translate natural language into accurate ISL grammar and visual representations.
2. **Sign-to-English (Video Microservice):** Captures real-life signs natively through your phone/browser camera and processes them smoothly into a natural English translation using Gemini generative AI.

## Project Architecture

This project is separated into three fully isolated microservices to ensure stability and compatibility across platforms. You must run all three to fully boot up the development environment.

### 1. Application (`/Application`)
The cross-platform Expo React Native frontend that builds natively to iOS, Android, and Web browsers.
- **Framework Required:** Node.js (via `npm` or `yarn`) & Expo
- **Run the web client:** `npm run web` or `npx expo start --web`

### 2. Core Backend (`/backend`)
The original text-to-sign Natural Language Processing pipeline built in FastAPI.
- **Framework Required:** Python 3.x
- **Configuration:** Copy `.env.example` to `.env` and add your Groq API keys. 
- **Start the server (Port 8000):**
  ```bash
  cd backend
  source .venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ```

### 3. Video Microservice (`/video-service`)
A high-performance lightweight multimodal FastAPI application responsible exclusively for the intelligent video-to-text Gemini vision flow.
- **Framework Required:** Python 3.x
- **Configuration:** Copy `.env.example` to `.env` and add your Gemini API Key.
- **Start the server (Port 8001):**
  ```bash
  cd video-service
  source .venv/bin/activate
  uvicorn main:app --host 0.0.0.0 --port 8001 --reload
  ```

## Getting Started for Teammates

1. Open **three separate terminal windows**.
2. Boot the two backends on ports 8000 and 8001 according to the startup commands above.
3. Start the Frontend via Expo natively or via `--web`.
4. The Web app automatically routes traffic locally cleanly parsing `.mp4` on mobile apps and `.webm` seamlessly for Chrome/Firefox without cross-origin configuration issues.

*Note: We included `.vscode/settings.json` which disables automated background compilation of Android Java/Gradle scripts reducing RAM consumption exponentially while developing visually in the Frontend layer.*
