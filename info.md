# SignVision — Full Project Documentation

> **Version**: 1.0.0 | **Platform**: Android / iOS / Web | **Language Supported**: Indian Sign Language (ISL)

---

## Table of Contents

1. [What is SignVision?](#1-what-is-signvision)
2. [The Problem It Solves](#2-the-problem-it-solves)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Repository Structure](#4-repository-structure)
5. [Frontend — Mobile Application](#5-frontend--mobile-application)
   - [Why Expo?](#51-why-expo)
   - [Key Dependencies](#52-key-dependencies)
   - [App Entry Point](#53-app-entry-point)
   - [HomeScreen](#54-homescreen)
   - [SearchBar Component](#55-searchbar-component)
   - [AvatarWebView Component](#56-avatarwebview-component)
   - [s3Service — Local Word Lookup](#57-s3service--local-word-lookup)
   - [apiService — Backend Communication](#58-apiservice--backend-communication)
   - [Type System](#59-type-system)
   - [Processing Modes: Word vs. Sentence](#510-processing-modes-word-vs-sentence)
   - [Search History with AsyncStorage](#511-search-history-with-asyncstorage)
   - [EAS Build Configuration](#512-eas-build-configuration)
6. [Backend — Python AI Engine](#6-backend--python-ai-engine)
   - [Why Python + FastAPI?](#61-why-python--fastapi)
   - [Key Dependencies](#62-key-dependencies)
   - [API Endpoints](#63-api-endpoints)
   - [NLP Engine — The Brain](#64-nlp-engine--the-brain)
   - [Word Lookup Service](#65-word-lookup-service)
   - [Semantic Search Service](#66-semantic-search-service)
   - [Configuration System](#67-configuration-system)
7. [Data Layer](#7-data-layer)
   - [Sign Language Data JSON](#71-sign-language-data-json)
   - [Dataset](#72-dataset)
   - [AWS S3 Storage](#73-aws-s3-storage)
   - [ChromaDB Vector Store](#74-chromadb-vector-store)
8. [The SiGML Avatar System (CWASA)](#8-the-sigml-avatar-system-cwasa)
9. [End-to-End Data Flow](#9-end-to-end-data-flow)
10. [Technology Decisions — The Why](#10-technology-decisions--the-why)
11. [Development & Build Workflow](#11-development--build-workflow)
12. [Key Design Decisions & Trade-offs](#12-key-design-decisions--trade-offs)
13. [Limitations & Future Work](#13-limitations--future-work)

---

## 1. What is SignVision?

SignVision is a cross-platform mobile application that bridges the communication gap between spoken/written English and **Indian Sign Language (ISL)**. It lets any user — whether hearing or Deaf — type a word or an entire sentence and instantly see a **3D avatar** perform the corresponding sign language animation on their screen.

Beyond a simple dictionary, SignVision is an **AI-powered translation pipeline**: it understands the grammatical structure of English sentences, converts them to ISL grammatical order (GLOSS notation), and then sequences the correct sign animations — all in real time.

### What it does in plain language

- You type **"I am going to school"** or speak it aloud via your microphone.
- SignVision's AI engine reads the sentence, understands it means a future action, and converts it to ISL gloss: `[SCHOOL] [GO]` (ISL is topic-prominent and drops auxiliary verbs).
- A 3D signing avatar on your screen then performs "SCHOOL" followed by "GO" in Indian Sign Language.
- If you just want to look up a single word like **"APPLE"**, you can use the quick Word mode — no AI required, it's instant.

---

## 2. The Problem It Solves

India has approximately **2.7 million Deaf/Hard-of-Hearing individuals** (Census 2011). Indian Sign Language is their primary language. The communication barrier between Deaf and hearing people is enormous — most hearing people do not know ISL.

Existing resources for ISL learning are scarce, fragmented, and not mobile-first. SignVision provides:

- **Accessibility**: Works on any Android or iOS phone, no special hardware required.
- **AI Translation**: Not just a sign dictionary — it handles full sentences with correct ISL grammatical ordering.
- **Voice Input**: Hearing individuals can speak a sentence and immediately see it translated to ISL.
- **Offline-first Word Mode**: Individual word lookup works without a backend, using a bundled JSON dataset.
- **Educational Tool**: Useful for parents of Deaf children, healthcare workers, teachers, or anyone wanting to communicate better.

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SignVision System                                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  Mobile App (Expo / React Native)                │   │
│  │                                                                  │   │
│  │  ┌──────────────┐   ┌───────────────┐   ┌─────────────────────┐ │   │
│  │  │  SearchBar   │   │  HomeScreen   │   │  AvatarWebView      │ │   │
│  │  │  ┌────────┐  │   │  (State mgmt) │   │  ┌───────────────┐  │ │   │
│  │  │  │ Voice  │  │   │               │   │  │ CWASA Avatar  │  │ │   │
│  │  │  │ Input  │  │   │               │   │  │ (SiGML WebGL) │  │ │   │
│  │  │  └────────┘  │   │               │   │  └───────────────┘  │ │   │
│  │  └──────────────┘   └───────────────┘   └─────────────────────┘ │   │
│  │                              │                        ▲           │   │
│  │                   ┌──────────┴──────────┐            │           │   │
│  │                   │                     │            │           │   │
│  │           ┌───────▼────────┐   ┌────────▼──────────┐│           │   │
│  │           │  s3Service     │   │  apiService       ││           │   │
│  │           │  (local JSON   │   │  (REST HTTP)      ││           │   │
│  │           │   word lookup) │   └────────┬──────────┘│           │   │
│  │           └───────┬────────┘            │           │           │   │
│  │                   │                     │           │           │   │
│  │           ┌───────▼────────┐            │     SiGML URL         │   │
│  │           │ AWS S3 (.sigml)◄────────────┘           │           │   │
│  │           └────────────────┘                        │           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                          │                              │
│                              HTTP POST /process                         │
│                                          ▼                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  Backend (Python / FastAPI)                      │   │
│  │                                                                  │   │
│  │  ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐   │   │
│  │  │ NLP Engine   │   │  Word Lookup   │   │ Semantic Search  │   │   │
│  │  │ ┌──────────┐ │   │  Service       │   │ Service          │   │   │
│  │  │ │  spaCy   │ │   │  (JSON)        │   │ (ChromaDB +      │   │   │
│  │  │ │ (en_core │ │   └────────────────┘   │ SentenceTransf.) │   │   │
│  │  │ │ _web_trf)│ │                        └──────────────────┘   │   │
│  │  │ └──────────┘ │                                               │   │
│  │  │ ┌──────────┐ │                                               │   │
│  │  │ │  NVIDIA  │ │                                               │   │
│  │  │ │  LLM API │ │                                               │   │
│  │  │ │(GPT-oss  │ │                                               │   │
│  │  │ │ -120b)   │ │                                               │   │
│  │  │ └──────────┘ │                                               │   │
│  │  └──────────────┘                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Repository Structure

```
Signvision/
├── Application/               # Expo React Native mobile app
│   ├── App.tsx                # Root component
│   ├── app.json               # Expo config (permissions, icons, bundle ID)
│   ├── eas.json               # EAS Build profiles (dev, preview, production)
│   ├── metro.config.js        # Metro bundler config
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── src/
│       ├── components/
│       │   ├── AvatarWebView.tsx   # WebView-wrapped CWASA 3D avatar
│       │   └── SearchBar.tsx       # Search + speech recognition component
│       ├── screens/
│       │   └── HomeScreen.tsx      # Main (and only) screen
│       ├── services/
│       │   ├── apiService.ts       # REST API client (sentence mode)
│       │   └── s3Service.ts        # Local JSON word lookup + S3 URL utils
│       ├── types/
│       │   └── index.ts            # All TypeScript type definitions
│       └── data/
│           └── sign_language_data.json  # Bundled ISL word → S3 URL map
│
├── backend/                   # Python FastAPI AI backend
│   ├── requirements.txt       # Python dependencies
│   └── app/
│       ├── main.py            # FastAPI app + all endpoints
│       ├── core/
│       │   ├── config.py      # Pydantic Settings (env vars)
│       │   └── nlp_engine.py  # NLP pipeline: text → GLOSS
│       └── services/
│           ├── word_lookup.py       # Sign dictionary lookup
│           └── semantic_search.py  # ChromaDB vector similarity search
│
├── data/                      # Master sign language dataset
│   ├── sign_language_data.json     # ~1,500+ word sign dictionary
│   └── Initial-sigml-files/       # Raw .sigml animation source files
│
├── dataset/                   # Raw ISL datasets by letter (a.json, b.JSON, …)
│   ├── a.json → z.json        # Per-letter sign data
│   ├── alphabets.json         # Finger-spelling alphabets
│   ├── numbers.json           # Numeric signs
│   └── words.txt              # Full word list for embedding generation
│
├── docs/
│   ├── architecture.png       # Architecture diagram image
│   └── draft.pdf              # Research/project report draft
│
├── feats/
│   └── Semantic-search/       # Prototype/spike for semantic search feature
│       ├── embedStore.py
│       ├── searchEmbeddings.py
│       └── README.md
│
└── app/                       # Placeholder (frontend dir, currently empty)
```

---

## 5. Frontend — Mobile Application

The mobile app lives in the `Application/` directory and is built with **Expo** and **React Native**.

### 5.1 Why Expo?

Expo was chosen over bare React Native for several key reasons:

| Reason | Detail |
|---|---|
| **Managed Workflow** | Handles native build complexity — no Xcode/Android Studio required for most development |
| **EAS Build** | Cloud builds for Android APK/AAB and iOS IPA without needing local build machines |
| **expo-speech-recognition** | Pre-built native module for on-device speech-to-text on both Android and iOS — saves weeks of native development |
| **expo-asset** | Simple, reliable asset bundling — lets the large `sign_language_data.json` be bundled into the app at build time |
| **expo-dev-client** | Custom development client supports native modules (like the WebView) that are not supported in Expo Go |
| **Cross-platform** | Single codebase also targets web (via react-native-web) for desktop preview/testing |
| **Fast Iteration** | Metro hot-reload drastically speeds up UI development |

The app targets **React Native 0.83.4** with **React 19.2.0** and uses TypeScript throughout (`typescript ~5.9.2`).

### 5.2 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | 55.0.10-canary | App container, plugin system, build tooling |
| `react-native` | 0.83.4 | Primitive UI components (View, Text, etc.) |
| `react` | 19.2.0 | UI library |
| `expo-speech-recognition` | ^3.1.2 | Native speech-to-text using device's speech engine |
| `react-native-webview` | ^13.16.1 | Embeds the CWASA avatar HTML page natively |
| `@react-native-async-storage/async-storage` | ^3.0.2 | Persistent key-value store for search history |
| `expo-asset` | ^55.0.11 | Bundles `./src/assets` (sign data) into the app |
| `expo-dev-client` | 55.0.20 | Custom dev client for native module support |
| `react-native-web` | ^0.21.2 | Web rendering target for development mode |
| `@expo/ngrok` | ^4.1.3 | Dev tunneling for connecting Android device to local backend |
| `typescript` | ~5.9.2 | Static typing |

### 5.3 App Entry Point

`index.ts` → `App.tsx` → `HomeScreen.tsx`

`App.tsx` is minimal — just a full-screen container that renders `HomeScreen`. All logic lives in the screen and its child components.

```tsx
// App.tsx
export default function App() {
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}
```

The background color `#0f0f1e` (deep navy-black) is set both in `App.tsx` and in `app.json` via `backgroundColor` and `splash.backgroundColor` to prevent a white flash during loading.

### 5.4 HomeScreen

`src/screens/HomeScreen.tsx` is the sole screen (622 lines). It owns all application state and orchestrates the three main child components.

**State managed:**

| State | Type | Purpose |
|---|---|---|
| `searchQuery` | `string` | Current text in the search bar |
| `currentWord` | `string \| null` | Word currently being signed |
| `playbackStatus` | `PlaybackStatus` | `idle \| loading \| playing \| finished \| error` |
| `errorMessage` | `string \| null` | User-facing error message |
| `isAvatarReady` | `boolean` | Whether the CWASA avatar has initialized |
| `searchHistory` | `HistoryItem[]` | Last 20 searches (persisted to AsyncStorage) |
| `suggestions` | `string[]` | "Did you mean?" alternates for not-found words |
| `processingMode` | `'word' \| 'sentence'` | Toggle between modes |
| `signQueue` | `SignQueueItem[]` | Queue of signs to play (sentence mode) |
| `currentQueueIndex` | `number` | Which sign in the queue is currently playing |
| `isProcessing` | `boolean` | Backend API call in flight |
| `glossTokens` | `string[]` | ISL GLOSS tokens shown as a visual breadcrumb |

**Critical refs pattern:** The `handleFinished` callback is registered on the `AvatarWebView` and must access the current `signQueue` and `currentQueueIndex`, but React's stale closure problem would make these stale inside the callback. The solution is to **mirror the state into refs**:

```tsx
const signQueueRef = useRef<SignQueueItem[]>([]);
const currentQueueIndexRef = useRef(0);
// keep them in sync:
useEffect(() => { signQueueRef.current = signQueue; }, [signQueue]);
```

The `handleFinished` callback reads from the refs, never from state, ensuring it always has the latest values without any re-subscription overhead.

**Queue playback via `useEffect`:** Rather than imperatively calling play after setting queue state (which would race), a `useEffect` watches `[signQueue, currentQueueIndex, playbackStatus, isAvatarReady]` and triggers the next avatar play when conditions are right:

```tsx
useEffect(() => {
  if (signQueue.length > 0 && currentQueueIndex < signQueue.length 
      && playbackStatus === 'idle' && isAvatarReady) {
    const nextSign = signQueue[currentQueueIndex];
    avatarRef.current?.play(nextSign.url, nextSign.word);
    setPlaybackStatus('loading');
  }
}, [signQueue, currentQueueIndex, playbackStatus, isAvatarReady]);
```

### 5.5 SearchBar Component

`src/components/SearchBar.tsx` (505 lines) handles all input-related logic.

**Features:**
1. **Text input** with real-time autocomplete (prefix-based, from `s3Service.autocomplete()`).
2. **Voice/Speech Recognition** using `expo-speech-recognition`:
   - Checks if recognition is available on the device.
   - Requests microphone permissions at runtime.
   - Resolves the best available locale (`en-US` > `en-IN` > `en-GB` > first available).
   - Shows a pulsing microphone indicator while listening.
   - Handles interim results (shows partial transcript in real-time) and fires `onSubmit` on the final result.
   - Handles errors gracefully (no-speech and aborted are silent; others show an alert).
3. **Animated pulse** on the search bar container during loading state.
4. **Speech stop button** replaces the search button while listening.

**Why `expo-speech-recognition`?** The library wraps Android's `SpeechRecognizer` and iOS's `SFSpeechRecognizer` natively. It provides interim results (partial transcripts as the user speaks), which gives immediate visual feedback. The alternative (Web Speech API in WebView) is unreliable in React Native's WebView context and has no permissions integration.

### 5.6 AvatarWebView Component

`src/components/AvatarWebView.tsx` (409 lines) is the most architecturally interesting component. It embeds the **University of East Anglia's CWASA (Connected World Avatar System for Accessibility)** sign language avatar.

**Architecture:**

The CWASA avatar is a complex JavaScript library (`allcsa.js`) that renders a 3D signing avatar using WebGL. It was designed to run in a web browser. To embed it in a React Native app, an HTML page is injected directly into a `WebView` (on native) or an `<iframe>` (on web):

```tsx
// Native (Android/iOS)
<WebView source={{ html: AVATAR_HTML_CONTENT }} ... />

// Web browser
<iframe src={blobUrl} ... />
```

The entire HTML page (with all CSS and JavaScript bridge code) is stored as a template literal string directly in the `.tsx` file. This avoids file access issues on Android (where `file://` URIs can have CSP restrictions).

**Communication bridge:** The HTML page and React Native communicate via `postMessage`:

- **RN → WebView**: `avatarRef.current.play(url, word)` → `postMessage({ type: 'play', url, word })`
- **WebView → RN**: `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'finished', word }))` → `onMessage` handler

The bridge is bidirectional and event-driven. The avatar HTML polls a hidden `<input type="text">` element every 200ms that CWASA uses to publish its status string (containing "playing", "complete", etc.), and translates those into structured events for React Native.

**`useImperativeHandle`**: The component uses `forwardRef` + `useImperativeHandle` to expose a clean imperative API (`play`, `stop`, `ping`) to the parent while keeping the WebView implementation details internal.

**Android-specific settings:**
```tsx
androidHardwareAccelerationDisabled: false,
androidLayerType: 'hardware',
hardwareAccelerated: true  // in app.json
```
Hardware acceleration is required for the WebGL 3D rendering inside the WebView.

**Blob URL caching (web):** On web, the HTML blob URL is computed once and cached (module-level `blobUrlCache` variable), preventing repeated blob creation on re-renders.

### 5.7 s3Service — Local Word Lookup

`src/services/s3Service.ts` is the **offline word dictionary**. It imports `sign_language_data.json` (200KB, bundled into the app at build time) and provides all word lookup logic without any network call.

**Lookup strategy (multi-tier, in order):**

1. **Exact match**: Normalize query to `UPPERCASE_WITH_UNDERSCORES`, look up directly in JSON.
2. **Anchor match**: Check synonyms. e.g., `"AIRPLANE"` → found as anchor of `"AEROPLANE"`.
3. **Partial match**: Substring overlap. e.g., `"AFRIC"` → partially matches `"AFRICA"`.
4. **Not found**: Return suggestions via `findSimilarWords()`.

**Similarity algorithm** (`findSimilarWords`): Uses **Dice's coefficient** on character bigrams — a simple, zero-dependency, fast algorithm that works well for short words without a network or ML model:

```
similarity("APPLE", "APPL") = 2 * |bigrams("APPLE") ∩ bigrams("APPL")| 
                             / (|bigrams("APPLE")| + |bigrams("APPL")|)
```

**Additional utilities:** `getCategories()`, `searchByCategory()`, `autocomplete()`, `buildS3Url()`, `checkUrlExists()`.

**Why bundle the JSON?** This makes Word Mode work **completely offline** — no network, no backend. The 200KB JSON is small relative to modern app sizes and loads instantly since it's pre-parsed by the JS engine at startup.

### 5.8 apiService — Backend Communication

`src/services/apiService.ts` is the **network client** for Sentence Mode.

**Retry logic with exponential back-off:**
```ts
const API_CONFIG = {
  timeout: 60000,  // 60s (LLM calls can be slow)
  retries: 3,
  retryDelay: 1000,
};
```

Failed requests that are classified as retryable (`5xx`, `429`, network errors, timeouts) are automatically retried with increasing delays (1s, 2s, 3s).

**`AbortController` for timeouts:** Every request creates its own controller, preventing memory leaks and ensuring hung connections are cleaned up:
```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
```

**Dev vs. Production URL:** The base URL switches between a local IP (for device testing) and a production URL based on `__DEV__`. During development, the Android device connects to the development machine via `adb reverse tcp:8000 tcp:8000` (port forwarding via USB), which is more reliable than Wi-Fi IP.

**Typed responses:** All response types (`ProcessResponse`, `LookupResponse`, `SearchResponse`) are defined with TypeScript interfaces matching the backend's Pydantic models, ensuring compile-time safety across the stack.

### 5.9 Type System

`src/types/index.ts` is the canonical type source of truth for the frontend. Key types:

```typescript
type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'finished' | 'error';
type ProcessingMode = 'word' | 'sentence';

interface SignQueueItem {
  word: string;
  url: string;
  matchType: 'exact' | 'anchor' | 'partial' | 'semantic' | 'none';
}

interface HistoryItem {
  word: string;
  timestamp: number;
  found: boolean;
}

// WebView message protocol
type AvatarMessage = {
  type: 'ready' | 'playing' | 'finished' | 'stopped' | 'error' | 'status' | 'pong' | 'avatarChanged';
  word?: string; message?: string; status?: string; ...
};
```

All API response shapes are mirrored exactly from the backend Pydantic models.

### 5.10 Processing Modes: Word vs. Sentence

The app has a toggle switch between two modes:

**Word Mode (default, offline):**
- Single word lookup in local JSON.
- Instant — no network, no AI.
- Uses `s3Service.lookupWord()`.
- Falls back to string-similarity suggestions.

**Sentence Mode (online, AI):**
- Full English sentence → ISL GLOSS → sequential sign playback.
- Requires the Python backend to be running.
- Goes through NLP pipeline: tokenization → LLM extraction → ISL rule transformation → sign queue.
- Shows a visual GLOSS breadcrumb (e.g., `SCHOOL → GO`) with the currently playing token highlighted green.
- Plays each sign in sequence, automatically advancing after each finishes.

### 5.11 Search History with AsyncStorage

The app persists the last 20 searches using `@react-native-async-storage/async-storage` under the key `@signvision_history`. Each entry records the word, timestamp, and whether it was found. History items are shown as horizontal chips at the bottom of the screen; tapping one replays the search.

### 5.12 EAS Build Configuration

`eas.json` defines three build profiles:

| Profile | Purpose | Output |
|---|---|---|
| `development` | Dev client for testing native modules | Debug APK (`assembleDebug`) |
| `preview` | Internal distribution testing | Internal download link |
| `production` | App store release | Signed AAB (auto-increment version) |

The development build uses `withoutCredentials: true` so anyone can build without signing keys. The production build sets `autoIncrement: true` to automatically bump the build number.

---

## 6. Backend — Python AI Engine

The backend lives in `backend/` and is a **Python FastAPI** application that handles the AI-heavy sentence translation work.

### 6.1 Why Python + FastAPI?

| Reason | Detail |
|---|---|
| **ML Ecosystem** | Python has the best-in-class NLP libraries: spaCy, Hugging Face, sentence-transformers, OpenAI SDK |
| **FastAPI** | Modern, async Python framework with automatic OpenAPI docs, Pydantic validation, great performance |
| **Pydantic** | Type-safe request/response models with automatic JSON schema generation |
| **spaCy** | Production-grade NLP — POS tagging with `en_core_web_trf` (transformer-based, accurate) |
| **NVIDIA API Compatibility** | The OpenAI SDK's compatibility with NVIDIA's LLM API (same HTTP interface) makes the integration trivial |
| **ChromaDB** | Embedded vector database — no separate server needed, runs in-process |

### 6.2 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | ≥0.104.0 | Web framework |
| `uvicorn` | ≥0.24.0 | ASGI server |
| `pydantic` | ≥2.5.0 | Data validation and settings |
| `pydantic-settings` | ≥2.1.0 | Environment variable configuration |
| `spacy` | ≥3.7.0 | NLP: tokenization, POS tagging, dependency parsing |
| `openai` | ≥1.3.0 | LLM API client (used for NVIDIA's compatible API) |
| `sentence-transformers` | ≥2.2.0 | Semantic embedding model (`all-MiniLM-L6-v2`) |
| `chromadb` | ≥0.4.0 | Vector database for semantic word search |
| `SpeechRecognition` | ≥3.10.0 | Audio transcription (Google Speech API) |
| `pydub` | ≥0.25.0 | Audio file format conversion (any format → WAV) |
| `python-dotenv` | ≥1.0.0 | `.env` file loading |
| `python-multipart` | ≥0.0.6 | Multipart form upload for audio files |

### 6.3 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/process` | Text → NLP → GLOSS → Sign URLs (main sentence endpoint) |
| `POST` | `/transcribe` | Audio file → Text → GLOSS → Sign URLs (voice pipeline) |
| `POST` | `/process_text` | Text → GLOSS only (no sign lookup, for debugging) |
| `GET` | `/lookup/{word}` | Single word lookup with semantic fallback |
| `GET` | `/search?query=` | Semantic similarity search (top-k results) |
| `GET` | `/health` | Health check with word count |
| `GET` | `/` | API info and endpoint listing |

**CORS:** All origins are allowed (`allow_origins=["*"]`). This is appropriate for a local dev/LAN deployment but should be restricted in production.

### 6.4 NLP Engine — The Brain

`app/core/nlp_engine.py` (817 lines) is the most complex module. It converts English text to ISL GLOSS tokens through a multi-stage pipeline.

#### Stage 1: Preprocessing (`preprocess_text`)

1. Lowercase the input.
2. Expand contractions: `"don't"` → `"do not"`, `"I'm"` → `"i am"`, etc. (comprehensive map of ~40 contractions).
3. Split into sentences on `.`, `!`, `?`.
4. Strip punctuation and extra whitespace.

#### Stage 2: Fixed Expression Shortcuts (`_check_fixed_expression`)

Before running the expensive AI pipeline, check if the entire sentence matches a known phrase:
- `"thank you"` → `GLOSS: [THANKYOU]`
- `"how are you"` → `GLOSS: [HOWAREYOU]`
- `"good morning"` → `GLOSS: [GOOD MORNING]`

These bypass the LLM entirely — fast and deterministic.

#### Stage 3: Linguistic Analysis (`analyze_text`)

Uses spaCy's **`en_core_web_trf`** (English web transformer model) to get:
- Token list
- POS tags (NOUN, VERB, ADJ, PROPN, AUX, etc.)

The transformer model is much more accurate than the smaller `en_core_web_sm` for ambiguous POS tagging (e.g., "light" as adjective vs. noun vs. verb).

#### Stage 4: LLM Semantic Extraction (`detect_phrases_llm`)

A carefully engineered prompt is sent to the **NVIDIA-hosted LLM API** (`openai/gpt-oss-120b`) to extract structured semantic data:

```json
{
  "subject": "i",
  "object": "school",
  "tense": "FUTURE",
  "negation": false,
  "sentence_type": "statement",
  "normalized_verb": "go",
  "adjective": null,
  "has_explicit_time_word": false,
  "requires_time_marker": true,
  "confidence": 98
}
```

**Prompt engineering highlights:**
- The LLM is instructed to be an **NLP extraction engine only**, not an ISL translator — this keeps its role well-scoped.
- Extensive rules are embedded: WH-word handling, possessive decomposition (`"your name"` → `subject="you", object="name"`), identity sentences, state vs. action sentences.
- If the LLM returns `confidence < 95`, the prompt is extended with the previous response and retried (up to 2 times).
- Uses streaming response mode (`stream=True`) with a custom `_parse_llm_json()` that handles JSON in code blocks or plain text.
- Falls back to `_fallback_extraction()` (pure spaCy, no LLM) if the LLM fails entirely.

**Why NVIDIA LLM API?** The project uses NVIDIA's OpenAI-compatible API endpoint (base URL `https://integrate.api.nvidia.com/v1`) with the `openai/gpt-oss-120b` model. This gives access to a powerful 120-billion-parameter model designed for reasoning tasks, without needing OpenAI API credits.

#### Stage 5: ISL Rule Transformation (`apply_isl_rules`)

Takes the LLM's semantic extraction and applies **Indian Sign Language grammatical rules**:

1. **Strip articles**: `"the school"` → `"school"` (ISL has no articles).
2. **Strip auxiliary verbs**: ISL omits "is", "are", "am", "was" etc.
3. **Detect state sentences**: If subject + linking verb + adjective (e.g., "I am sick"), there is no action verb — just subject + adjective.
4. **Add time markers**: If the action is past tense and no explicit time word exists, prepend `YESTERDAY`. Future → `FUTURE`. Present actions → `NOW`. (ISL marks time at the beginning of the sentence.)
5. **Handle explicit time words**: Extract "yesterday", "tomorrow", "last week", etc. and preserve them at the GLOSS start.
6. **WH-questions**: Place the WH-word at the END of the GLOSS (ISL has sentence-final WH). E.g., `"What do you eat?"` → `[YOU] [EAT] [WHAT]`.
7. **Yes/No questions**: Append `Q` marker.
8. **Negation**: Append `NOT` after the verb.

#### Stage 6: GLOSS Assembly (`build_gloss_output`)

Assembles the final ordered token list using ISL grammar:

```
[TIME/TENSE MARKER] [SUBJECT] [OBJECT] [VERB] [ADJECTIVE] [NOT?] [WH-WORD?]
```

Example: `"I am not going to school"` →
- LLM extract: subject=I, object=school, verb=go, tense=FUTURE, negation=true
- ISL rules: future + action → `requires_time_marker=true`, time_marker=`FUTURE`
- GLOSS: `[FUTURE] [I] [SCHOOL] [GO] [NOT]`

### 6.5 Word Lookup Service

`app/services/word_lookup.py` — The `WordLookupService` class loads `sign_language_data.json` at startup and provides multi-tier lookup of sign URLs:

1. **Exact match**: Normalize to `UPPER_UNDERSCORE`, direct dict lookup.
2. **Anchor match**: Check the `anchors` array of each entry (synonyms).
3. **Partial match**: Substring containment check.
4. **Semantic fallback**: Call `SemanticSearchService.search()` and try the top-k results in order.

The `lookup_gloss_sequence()` method processes a full GLOSS token array, returning one `WordLookupResult` per token. Each result carries: `word`, `original_query`, `found: bool`, `s3_url`, `match_type` (exact/anchor/partial/semantic/none), `similar_words`.

### 6.6 Semantic Search Service

`app/services/semantic_search.py` — The `SemanticSearchService` provides vector similarity search using:

- **`sentence-transformers`**: The `all-MiniLM-L6-v2` model converts words to 384-dimensional embedding vectors. It is small (22MB), fast, and runs on CPU without GPU. It was trained for semantic textual similarity tasks.
- **ChromaDB**: A local, embedded vector database. It stores the pre-computed embeddings for all ~1,500 words in `sign_language_data.json`. ChromaDB uses the HNSW (Hierarchical Navigable Small World) graph algorithm for approximate nearest neighbor search — O(log n) lookup time even for large collections. Distance metric: **cosine similarity**.

**One-time embedding generation:**
```bash
python -c "from app.services.semantic_search import build_embeddings; build_embeddings()"
```
This reads `words.txt`, encodes all words with `SentenceTransformer`, and stores the embeddings in ChromaDB under `./data/chroma_db`. This only needs to be run once (or when the word list changes).

**Search at runtime:**
```python
vec = model.encode([query])  # 384-dim vector for query
results = collection.query(query_embeddings=vec, n_results=top_k)
# Filter by min_similarity = 0.5
```

This powers the "Did you mean?" feature — even if a user types `"furious"` and it's not in the sign dictionary, semantic search might return `"ANGRY"` (cosine similarity ≈ 0.75).

### 6.7 Configuration System

`app/core/config.py` uses `pydantic-settings` to load all configuration from environment variables (with an `.env` file fallback):

| Setting | Default | Description |
|---|---|---|
| `GPT_API_KEY` | `""` | NVIDIA API key (required for sentence mode) |
| `GPT_BASE_URL` | `https://integrate.api.nvidia.com/v1` | LLM API base URL |
| `GPT_MODEL` | `openai/gpt-oss-120b` | Model name |
| `CHROMA_DB_PATH` | `./data/chroma_db` | ChromaDB storage path |
| `CHROMA_COLLECTION` | `words` | Collection name |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `SEMANTIC_SEARCH_TOP_K` | `5` | Max semantic results |
| `SEMANTIC_SEARCH_MIN_SIMILARITY` | `0.5` | Minimum cosine similarity threshold |
| `DATA_DIR` | `../data` (relative to app) | Sign language data directory |
| `SIGN_LANGUAGE_DATA_FILE` | `sign_language_data.json` | Main data file name |
| `RECORDINGS_DIR` | `./recordings` | Where uploaded audio is saved |

The `@lru_cache()` on `get_settings()` ensures the settings object is created once and reused — no repeated `.env` file reads.

---

## 7. Data Layer

### 7.1 Sign Language Data JSON

`data/sign_language_data.json` (~200KB, ~1,500+ entries) is the master sign dictionary. It has this schema per entry:

```json
"ACCEPT": {
  "anchors": ["AGREE", "RECEIVE", "APPROVE"],
  "category": "verb",
  "s3_url": "https://signvision-085587597556.s3.ap-south-1.amazonaws.com/sigml-files/accept.sigml",
  "hamnosys": "..."  // optional: phonological notation
}
```

- **Key**: Word in `UPPER_CASE` (or `UPPER_CASE_WITH_UNDERSCORES` for multi-word).
- **`anchors`**: Alternate forms / synonyms that map to this sign.
- **`category`**: Grammatical category (noun, verb, adjective, pronoun, etc.).
- **`s3_url`**: Direct HTTPS URL to the `.sigml` file on AWS S3. Empty string `""` if SiGML is not yet available.
- **`hamnosys`**: HamNoSys notation string for the sign (optional, present for some entries).

The same JSON file exists in two places:
- `data/sign_language_data.json` — master, used by backend.
- `Application/src/data/sign_language_data.json` — copy bundled into the mobile app.

### 7.2 Dataset

`dataset/` contains the raw source data used to build `sign_language_data.json`. It is organized alphabetically (one JSON file per letter: `a.json`, `b.JSON`, …, `z.json`) plus `alphabets.json` (A-Z finger-spelling) and `numbers.json` (0-9 and compound numbers).

`dataset/words.txt` is the full word list (~20,000 lines, 210KB) used as input to `build_embeddings()` to create the ChromaDB vector store. It was likely sourced from standard English word lists combined with ISL-specific vocabulary.

### 7.3 AWS S3 Storage

All `.sigml` animation files are hosted on **AWS S3**:
- **Bucket**: `signvision-085587597556` (private bucket, ap-south-1 Mumbai region)
- **Path**: `sigml-files/{word_lowercase}.sigml`
- **Access**: Public read (the URLs are served directly to the app and avatar renderer)

SiGML (Signing Gesture Markup Language) is an XML-based format that encodes 3D hand and body movements as parameterized gestures. The CWASA avatar renderer reads these files and drives the 3D avatar accordingly.

Example URL structure:
```
https://signvision-085587597556.s3.ap-south-1.amazonaws.com/sigml-files/accept.sigml
```

### 7.4 ChromaDB Vector Store

At runtime, `app/services/semantic_search.py` connects to a persistent ChromaDB instance at `./data/chroma_db`. The collection `words` stores:
- **IDs**: Sequential integers as strings (`"0"`, `"1"`, …)
- **Documents**: The word strings themselves
- **Embeddings**: 384-dimensional float vectors from `all-MiniLM-L6-v2`
- **HNSW index**: Pre-built for approximate nearest neighbor search

The collection is built once and persisted to disk. ChromaDB uses SQLite internally for metadata and flat files for the embedding vectors.

---

## 8. The SiGML Avatar System (CWASA)

The visual signing avatar is powered by the **CWASA** (Connected World Avatar System for Accessibility) system developed by the University of East Anglia's **Virtual Human Group (VHG)**.

- **Library**: `allcsa.js` + `cwasa.css` loaded from `https://vhg.cmp.uea.ac.uk/tech/jas/vhg2020/cwa/`
- **Avatar**: `anna` (default female avatar) — also available: `marc`, `francoise`, `luna`
- **Format**: SiGML (Signing Gesture Markup Language) — XML files hosted on S3
- **Rendering**: WebGL-based 3D rendering inside a WebView
- **FPS**: 30 frames per second (`animgenFPS: 30`)
- **Camera**: Configurable angle `[0, 0.23, 3.24, 5, 18, 30, -1, -1]` for an upper-body view

**Why embed the avatar in a WebView instead of a native 3D library?**

CWASA is a mature, proven research system with a large library of pre-encoded ISL signs. Reimplementing it natively (e.g., in Unity or SceneKit) would require months of work. By wrapping it in a WebView, the full signing capability is available immediately. The performance trade-off is acceptable because:
1. The WebGL rendering happens inside the WebView's own process.
2. The React Native UI is in a separate thread.
3. Hardware acceleration is enabled for the WebView.

---

## 9. End-to-End Data Flow

### Word Mode (Offline)

```
User types "APPLE" → presses Go
      ↓
HomeScreen.handleSearch('apple')
      ↓
s3Service.lookupWord('apple')
  → normalize: 'apple' → 'APPLE'
  → exact match found in sign_language_data.json
  → s3_url = "https://...s3.../apple.sigml"
      ↓
avatarRef.current.play(s3_url, 'APPLE')
      ↓
WebView receives message {type: 'play', url: ..., word: 'APPLE'}
      ↓
CWASA fetches apple.sigml from AWS S3 over HTTPS
      ↓
3D avatar performs the ISL sign for "APPLE"
      ↓
WebView sends {type: 'finished', word: 'APPLE'}
→ HomeScreen.handleFinished('APPLE')
→ playbackStatus = 'finished'
→ History item saved to AsyncStorage
```

### Sentence Mode (Online, AI-Powered)

```
User speaks "I am not going to school"
      ↓
expo-speech-recognition → transcript: "I am not going to school"
→ onSubmit trigger
      ↓
HomeScreen.handleSearch("I am not going to school")
→ setIsProcessing(true), setPlaybackStatus('loading')
      ↓
apiService.processSentence("I am not going to school")
→ POST http://10.x.x.x:8000/process
  { "text": "I am not going to school" }
      ↓
  [BACKEND PIPELINE]
  1. preprocess: "i am not going to school"
  2. check_fixed_expression: no match
  3. spaCy POS: [i=PRON, am=AUX, not=PART, going=VERB, to=PART, school=NOUN]
  4. LLM call → {subject:"i", object:"school", verb:"go",
                  tense:"FUTURE", negation:true, requires_time_marker:true}
  5. apply_isl_rules: strip articles, add tense marker=FUTURE
  6. build_gloss: [FUTURE, I, SCHOOL, GO, NOT]
  7. word_lookup_service.lookup_gloss_sequence([FUTURE, I, SCHOOL, GO, NOT])
     → FUTURE: found (exact)
     → I: found (exact)
     → SCHOOL: found (exact)
     → GO: found (exact)
     → NOT: found (exact)
  Returns: [{gloss: {...}, signs: [{word, s3_url}, ...]}]
      ↓
Response JSON → HomeScreen
→ setGlossTokens(['FUTURE', 'I', 'SCHOOL', 'GO', 'NOT'])
→ setSignQueue([{word:'FUTURE', url:...}, {word:'I', url:...}, ...])
→ setCurrentQueueIndex(0), setPlaybackStatus('idle')
      ↓
useEffect fires → play sign 0 (FUTURE)
→ Avatar plays FUTURE sign
→ WebView: 'finished' for FUTURE
→ setCurrentQueueIndex(1), setPlaybackStatus('idle')
→ useEffect fires → play sign 1 (I)
... and so on until all 5 signs are played
```

---

## 10. Technology Decisions — The Why

| Decision | Why |
|---|---|
| **Expo over bare RN** | `expo-speech-recognition` native module, EAS cloud builds, no local native toolchain needed |
| **React Native WebView for avatar** | CWASA is a proven ISL signing system; WebView embedding saves months of native reimplementation |
| **FastAPI over Flask/Django** | Async support, auto OpenAPI docs, native Pydantic integration, faster dev iteration |
| **spaCy `en_core_web_trf`** | Transformer-based model for accurate POS tagging of ambiguous words; more reliable than rule-based or smaller models |
| **LLM for semantic extraction** | ISL grammar rules are complex and language-dependent; a rule-only parser would require hundreds of edge-case rules. LLM handles nuance (possessives, identity sentences, question types) with high accuracy |
| **NVIDIA LLM API** | Similar interface to OpenAI, powerful 120B model, good for structured JSON extraction tasks |
| **ChromaDB + all-MiniLM-L6-v2** | Lightweight embedded vector DB (no server), compact yet effective semantic embedding model; runs on CPU |
| **AWS S3 for SiGML files** | Highly available, CDN-backed, cost-effective for static file serving; `.sigml` files are small XML |
| **JSON bundled in the app** | Eliminates network dependency for word mode; 200KB is negligible; instant lookups |
| **AsyncStorage for history** | Simple, persistent, built for React Native; no need for SQLite for 20-item history |
| **TypeScript throughout** | Catches interface mismatches between frontend services and backend API response shapes at compile time |
| **Dice coefficient for frontend similarity** | Zero-dependency, O(n) algorithm, works well for short words, no ML model needed on device |

---

## 11. Development & Build Workflow

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_trf

# Copy and fill in .env
cp .env.example .env
# NVIDIA API key is required

# One-time: build ChromaDB embeddings
python -c "from app.services.semantic_search import build_embeddings; build_embeddings()"

# Run
uvicorn app.main:app --reload --port 8000
# Docs available at http://localhost:8000/docs
```

### Frontend Setup (Mobile Dev)

```bash
cd Application
npm install

# Start Metro bundler
npx expo start

# Run on connected Android device
npx expo run:android

# Forward backend port to Android device (run on host machine)
adb reverse tcp:8000 tcp:8000
```

### EAS Cloud Build

```bash
# Development APK (install on device, no signing required)
eas build --profile development --platform android

# Preview / internal test
eas build --profile preview --platform android

# Production
eas build --profile production --platform android
```

---

## 12. Key Design Decisions & Trade-offs

### Dual-mode architecture (Word vs. Sentence)

**Decision**: Keep Word Mode fully offline with a bundled dataset, while Sentence Mode requires the backend.

**Why**: Not all users have reliable internet. A basic lookup tool should always work. The AI pipeline (spaCy + LLM + semantic search) is too heavy to run on a mobile device.

**Trade-off**: Sentence Mode requires the user to be on the same network as the backend server (or have the server deployed online). This is currently a development limitation.

### GLOSS intermediate representation

**Decision**: Convert English → GLOSS → Signs, not directly English → Signs.

**Why**: ISL has fundamentally different grammar from English (SOV word order, no articles, no auxiliary verbs, topic-prominent, time-front). A direct English-to-animation approach would produce incorrect ISL. GLOSS is the standard notation used by ISL linguists and makes the pipeline linguistically grounded.

### LLM for extraction, rules for transformation

**Decision**: Use the LLM only for semantic understanding and structured data extraction; apply ISL grammar rules deterministically afterwards.

**Why**: LLMs are good at understanding ambiguous language, but making them produce correct ISL grammar directly is harder to control. Separating concerns makes the system more predictable — LLM failures cause fallback to spaCy; rule failures are debuggable.

### Polling for avatar status

**Decision**: The WebView polls a hidden `<input>` element every 200ms to detect CWASA state changes.

**Why**: CWASA doesn't expose a callback API — it only updates a DOM element. Polling that DOM element and bridging to React Native via `postMessage` is the only available approach without forking the CWASA library itself.

**Trade-off**: 200ms polling interval means "finished" events can be delayed up to 200ms. This is imperceptible to users.

---

## 13. Limitations & Future Work

### Current Limitations

| Limitation | Impact |
|---|---|
| Backend must be on the same LAN | Sentence Mode doesn't work without the Python server; no cloud deployment yet |
| Limited ISL vocabulary (~1,500 words) | Many words are not found; system falls back to semantic search or shows suggestions |
| Not all words have `.sigml` files | Some entries have `s3_url: ""` — the sign exists in the data but the animation file hasn't been created |
| Single screen | No settings screen, no avatar selector, no language/locale settings |
| LLM latency | NVIDIA API calls take 2–5 seconds; the 60s timeout is generous but latency is noticeable |
| `en_core_web_trf` is large | The spaCy transformer model is ~400MB; backend startup takes a few seconds |
| No accessibility features | No high-contrast mode, no font scaling for the UI text |

### Potential Future Enhancements

1. **Cloud Backend Deployment**: Deploy the FastAPI backend to a cloud provider (e.g., GCP Cloud Run, AWS Lambda + API Gateway) with a stable URL, removing the LAN dependency.

2. **Expanded Sign Dataset**: Add more `.sigml` files to cover a larger vocabulary. Automate .sigml generation from HamNoSys notation (some entries already have `hamnosys` fields).

3. **Avatar Customization**: Expose the avatar selector (anna, marc, francoise, luna) in the UI settings.

4. **Offline Sentence Mode**: Explore on-device LLM (Mistral 7B via `llama.cpp`) for completely offline sentence processing.

5. **Reverse Translation**: Video → Sign Language Recognition (SLR) — using a camera to recognize ISL gestures and convert them to text, enabling two-way communication.

6. **Progressive playback**: Pre-fetch the next sign's `.sigml` file while the current one is playing to reduce perceived latency in sentence mode.

7. **ISL Fingerspelling fallback**: When a word is completely not found, fingerspell it letter by letter using the alphabet signs.

8. **Multi-sentence input**: Currently processes one sentence at a time. Could be extended to handle paragraphs with sequential sentence playback.

9. **Saved phrases**: Let users bookmark frequently used sentences.

10. **Export/share**: Generate an animated GIF or video of the avatar performing a sign for sharing.

---

*This document was generated on 2026-09-10 from a full code audit of the SignVision repository. It reflects the state of the codebase as of that date.*
