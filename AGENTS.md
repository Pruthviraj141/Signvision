# SignVision — AGENTS.md

Welcome, AI Agent. This is your pragmatic guide to working safely and effectively on the SignVision codebase.

## 1. Project Overview
SignVision is a mobile application translating audio/text to Indian Sign Language (ISL), and ISL videos back to English. It relies heavily on an Expo React Native frontend speaking to separate Python FastAPI backends representing the NLP logic pipelines.

## 2. Important Folders & Files
*   `Application/src/screens/HomeScreen.tsx`: Core Frontend React Native View. State-heavy component handling queueing and animation coordination.
*   `Application/src/components/AvatarWebView.tsx`: Embedded CWASA 3D WebGL Avatar handler. Contains strict `postMessage` bridging requirements.
*   `backend/app/core/nlp_engine.py`: Complex text-to-ISL logic. Parses grammar, applies ISL transformations (omitting articles, prepending time markers). **Be very careful modifying this**.
*   `video-service/main.py`: Video-to-Text inference API. Relies on the Gemini API with a heavily tailored prompt. 

## 3. Architecture & Data Flow
1.  **Frontend ↔ Backend (`apiService.ts`)**: The Expo app routes AI text/audio queries to Python backend (`:8000`).
2.  **Avatar Rendering**: Backend queries give URL outputs leading to an S3 bucket `.sigml` file. The frontend feeds these via `postMessage()` into a WebGL HTML template. 
3.  **Local vs Semantic**: Fallback words use simple substring distance (`s3Service.ts`), but full semantics ping the Python `ChromaDB` embeddings `/search` endpoint.

## 4. Development Commands
**From `Application/`:**
*   Install: `npm install`
*   Start React Native Dev Server: `npx expo start`

**From `backend/`:**
*   Install: `pip install -r requirements.txt; python -m spacy download en_core_web_trf` (Requires matching venv)
*   Start Backend: `uvicorn app.main:app --reload --port 8000`

**From `video-service/`:**
*   Start microservice: `uvicorn main:app --reload --port 8001`

## 5. Coding Conventions
*   **Frontend**: Strict TypeScript definitions within `Application/src/types`. Use React Contexts, Refs, and Hooks securely to manage the video queue rendering state without clashing side-effects. 
*   **Backend**: Type-safe FastAPI with Pydantic Models for every Request and Response. Ensure all outputs strictly mirror the TypeScript definitions in `apiService.ts`. All endpoints must document their intended use.
*   **Error Bubbling**: Keep standard HTTP exceptions unmasked in FastAPI. Log explicitly at each stage of the API transformation to catch pipeline breakages. 

## 6. Important Rules & Things to Avoid
*   **DO NOT** mock tests unprompted or modify the `CWASA` WebGL HTML template in `AvatarWebView.tsx` unless directly requested; it is a sensitive bridge implementation running external UEA Javascript logic.
*   **DO NOT** modify the dataset `data/sign_language_data.json` without also updating `Application/src/data/sign_language_data.json` and vice-versa.
*   **DO NOT** rewrite logic replacing `expo-speech-recognition` with web audio nodes on React Native, as the Expo native bindings are strictly relied upon for device permissions.
*   **Always maintain** existing Pydantic shapes on the server if touching endpoints. The React Native TypeScript compiler relies heavily on matching these shapes.

## 7. Basic Verification Workflow
If you make a change, systematically verify:
1.  **Typing**: Ensure Pydantic Python output matches `src/types/index.ts` models.
2.  **API Route Start**: Use `curl` to guarantee backend routes (like `/health` on 8000 and 8001) behave nominally.
3.  **App Compile**: Ensure `npx expo start` does not break due to metro bundler TS errors.
4.  **Logging**: Inspect logging in FastAPI terminal when shooting an intended payload to ensure all pipeline stages (preprocess -> LLM -> rules -> assemble) are succeeding sequentially.
