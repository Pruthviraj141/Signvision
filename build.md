# SignVision - Master Project Build & Handoff

This file is the absolute source of truth for the SignVision architectural state, environment configuration, debugging history, and constraints. **Do not modify working constraints.**

## 1. Project Overview
SignVision is an intelligent bidirectional translation system bridging the gap between spoken/written language and Indian Sign Language (ISL). 

**Text/Speech → ISL:** Natural language -> NLP (FastAPI 8000) -> ISL Gloss -> SiGML -> CWASA Avatar.
**Sign Video → English:** Camera -> MP4/WebM -> Microservice (FastAPI 8001) -> Gemini AI -> English text.

## 2. Folder Structure
- `/Application` : Expo React Native cross-platform UI.
- `/backend` : Core NLP / Vector original monolithic API.
- `/video-service` : Isolated Gemini API wrapper for translation.

## 3. Architecture Overview
```
📱 PHONE / FRONTEND (Port 8081)
    |--------------------|
    v                    v
FastAPI :8000       FastAPI :8001
(Text to Sign)      (Video to English)
    |                    |
CWASA Avatar        Google Gemini 3.6 Flash
```

## 4. Port Allocations
- Frontend Metro: `8081`
- Text-to-Sign Backend: `8000`
- Sign-to-English Microservice: `8001`

## 5. Environment Execution Rules & Setup
### Wi-Fi Architecture (No USB required)
**Crucial:** Physical Android devices treat `localhost` as themselves. All React Native API (`apiService.ts`) endpoints must use the Developer Laptop's local LAN IP (e.g. `10.99.60.213`).

### Run Commands:
1. Text-to-Sign: `cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
2. Video-to-English: `cd video-service && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
3. Frontend Native Wi-Fi: `cd Application && npx expo start --dev-client`
4. Frontend Web: `cd Application && npm run web`

## 6. Android Development Build & Environment
- **Expo SDK Version:** 55.0.x-canary (DO NOT UPGRADE TO 57)
- **AsyncStorage Version:** 2.2.0
- **Android SDK:** `/opt/android-sdk`

Because the app relies on heavy Native dependencies (Camera, Speech), standard Expo Go caused total version rejection. The app is bundled successfully as a custom Development Build APK.

**Missing Local NDK Fixes applied to machine:**
```bash
sudo sdkmanager --sdk_root=/opt/android-sdk --install "ndk;27.1.12297006"
sudo sdkmanager --sdk_root=/opt/android-sdk --install "build-tools;36.0.0"
sudo sdkmanager --sdk_root=/opt/android-sdk --install "cmake;3.22.1"
```

**Low-RAM Config (Application/android/gradle.properties):**
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.workers.max=2
org.gradle.parallel=false
```

## 7. Camera Implementation details
We rely heavily on Platform boundaries for performance.
- **Android/iOS:** Uses standard `Expo CameraView` and records natively resolving into a static `uri` ending in `.mp4`.
- **Web:** Utilizes HTML5 `<video>` binding a live MediaStream, recorded manually via a chunked `MediaRecorder` API resolved into a `video/webm` Blob.

## 8. Gemini Processing Flow
- Raw MP4/WebM files are piped natively across port 8001. No FFMPEG logic interrupts the core stream. Let Gemini ingest natively via `google-genai` File API.
- Working Model: **gemini-3.6-flash**. (Prior 1.5 model triggered extreme 404 rejection cascades).
- Sometimes Gemini internal processing queues evaluate a clip and fault inside Google (state changes from `PROCESSING` -> `FAILED`); API responds smartly requesting a gesture re-record using a 400 rejection trap instead of hard 500 crashes.

## 9. Error History & Fixes
- `Storage/Version Mismatch:` Dev Client utilized instead of Expo Go.
- `CameraView nested children warnings:` Frontend layout strictly modified to utilize Absolute overlays floating atop siblings.
- `Java Build terminal loops over-consuming CPU RAM:` `.vscode/settings.json` blocks Redhat java from compiling Android Native folders.
- `400 File format errors:` FastAPI extended explicitly mapped to accept both `.webm` & `.mp4`.

## 10. Future DO NOT TOUCH Rules
- DO NOT invent "Fake confidence UI". Simulated landmarks are UI only.
- DO NOT rewrite recording loops.
- DO NOT merge FastAPI endpoints.
- DO NOT send landmark strings into Gemini Prompts.
- DO NOT install OpenCV or Tensorflow JS.
