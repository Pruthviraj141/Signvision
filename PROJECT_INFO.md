# SignVision Project Info

## Overall Project Purpose
SignVision is a mobile application that translates English text and speech into Indian Sign Language (ISL) animations in real-time. It provides Accessibility tools by bridging the communication gap using AI-powered NLP capable of reordering English grammatical structure into ISL-compliant GLOSS tokens, finally rendering them through a 3D WebGL Avatar (CWASA system).

## Architecture
SignVision follows a distributed Mobile-Client + AI-Backend system architecture:
1.  **Frontend**: Built in React Native (Expo). Manages user inputs (voice/text), interacts with the internal/local word dictionary, displays a 3D Sign Language avatar embedded in a WebView, and sends requests to the python backends.
2.  **Core Backend**: A Python FastAPI service that parses English sentences into their syntactic structure, utilizes LLMs (NVIDIA GPT-120b) for semantic extraction, applies ISL grammar transformations, and maps the results to stored signs.
3.  **Video Microservice**: A dedicated FastAPI endpoint (`video-service`) focused on analyzing uploaded sign videos and using Gemini to transcribe them into English text.

## Folder Structure
*   `Application/`: React Native Expo mobile frontend core.
*   `backend/`: Python FastAPI backend for Text/Speech to ISL translation.
*   `video-service/`: Python FastAPI microservice for Video to Text translation.
*   `data/`: Precompiled JSON dictionary linking ISL gloss tokens to S3 URLs.
*   `dataset/`: Granular ISL alphabet mapping, source JSONs for sign data.
*   `feats/`: Semantic search tools linking nearest-neighbor algorithms over sign vocabulary.
*   `docs/`: Drafts, architecture images, and project history documentation.
*   `app/`: Empty/legacy folder structure reflecting placeholder branches.

## Major Features
*   **Word-Level Lookup (Offline)**: Search literal dictionary words and instantly replay sign animations utilizing string-similarity matching.
*   **Sentence-Level Translation (Online)**: Captures voice or full text, applies ISL grammatical NLP transformation, and queues a continuous video avatar playback.
*   **Video-to-Text Sign Recognition**: Uploads continuous ISL sign video, sending it for multimodal interpretation via Gemini API to extract its English equivalent.

## Routes & Data Flow
**Core Backend (Port 8000)**
*   `POST /process`: Takes sentence `{"text": "I go to school"}` -> Tokenizes & NLP -> Outputs GLOSS `[SCHOOL, GO]` and mapped S3 Sign URLs.
*   `POST /transcribe`: Takes `.wav` audio -> Converts to Text -> Hits `/process`.
*   `GET /lookup/{word}`: Single word mapping.
*   `GET /search`: Returns closest matches via ChromaDB vector embeddings.

**Video Microservice (Port 8001)**
*   `POST /api/translate-video`: Takes `.mp4/.webm` chunk -> Prompts Gemini -> Returns string translation.

## Technologies
*   **Mobile**: React Native, Expo (`expo-speech-recognition`, `react-native-webview`).
*   **Backend**: Python, FastAPI, Uvicorn.
*   **NLP & ML**: spaCy (`en_core_web_trf`), Sentence-Transformers (`all-MiniLM-L6-v2`), ChromaDB, NVIDIA LLM API (`openai/gpt-oss-120b`), Google GenAI.
*   **Storage**: AWS S3 (for `.sigml` animation files), Local AsyncStorage.

## Database & Authentication
*   **Database**: No strict relational database is necessary. Instead, the application relies on an embedded vector database (**ChromaDB**) for semantic searching, and large embedded JSON dictionary objects (`sign_language_data.json`) for precise word lookups.
*   **Authentication**: The current system does not implement direct user accounts, auth flows, or login gates. API services are secured locally or via environment secrets (`GEMINI_API_KEY`, `GPT_API_KEY`) ensuring safe calls to upstream ML providers.

## Important Commands
**Frontend:**
*   `npx expo start` (Launch dev client)
*   `eas build -p android --profile development` (Build Android dev APK)

**Backend:**
*   `uvicorn app.main:app --reload --port 8000` (Start main translation API)
*   `uvicorn main:app --reload --port 8001` (Start video microservice API from `video-service` folder)
