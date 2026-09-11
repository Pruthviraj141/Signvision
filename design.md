# SignVision System Architecture Design

This document outlines the architecture for the SignVision project. It is split into two sections: a **High-Level Design** intended for non-technical stakeholders (focusing on user flow and abstract components) and a **Low-Level Design** intended for engineers (focusing on microservices, specific technologies, pipelines, and data flow). 

Both sections feature a **Plain Text (ASCII) diagram** for quick reading natively in any text editor, followed by an advanced **Mermaid diagram** for enhanced visual rendering.

---

## 1. High-Level Architecture (For Non-Technical Audiences)

### Plain Text Diagram
```text
                          [ User (Target Audience: Deaf / Hearing) ]
                                                |
               [ Voice/Speech Input ]    [ Text Input ]    [ Video File Upload ]
                         \                      |                      /
                          \                     |                     /
                           v                    v                    v
 +-----------------------------------------------------------------------------------------+
 |                                 SignVision Mobile App                                   |
 |                                                                                         |
 |                [ Smart Input UI ]                    [ 3D Avatar Display UI ]           |
 +------------------|----------------|---------------------------------^-------------------+
                    |                |                                 |
   (Sends Voice/Text String)    (Sends Sign Video)                     |
                    |                |                                 |
                    v                v                                 |
 +-------------------------+     +--------------------------+          |
 |   Core AI Cloud Brain   |     | Video Translation Cloud  |          |
 |                         |     |                          |          |
 |  [ ISL Grammar Engine ] |     | [ Video Vision Engine ]  |          |
 |  (Understands rules &   |     |  (Analyzes sign language |          |
 |   translates English    |     |   video and translates   |          |
 |   into Sign structure)  |     |   it into English Text)  |          |
 +----------|--------------+     +------------|-------------+          |
            |                                 |                        |
            v                                 | (Returns English Text) |
 +-------------------------+                  |                        |
 |   Databases & Storage   |                  |                        |
 |                         |                  |                        |
 | [Text-to-Sign Mapping]  |                  |                        |
 | (Matches words to signs)|                  |                        |
 |                         |                  |                        |
 | [3D Animation Cloud]    |                  |                        |
 | (Provides AWS 3D files) |                  |                        |
 +----------|--------------+                  |                        |
            |                                 |                        |
            +---------------------------------+------------------------+
                                              |
                                              |
                                              |
                     (Displays 3D Avatar Animation OR Printed English Text)
```

### Mermaid Diagram
```mermaid
flowchart TD
    %% Styling
    classDef user fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#000
    classDef app fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef brain fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef storage fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000

    User((🧑 Deaf & Hearing<br>Users)):::user

    subgraph MobileApp [SignVision Mobile App]
        VoiceInput[🎙️ Voice Input]:::app
        TextInput[⌨️ Text Input]:::app
        VideoInput[📷 Video Upload]:::app
        AvatarScreen[🧍 3D Signing Avatar / Text Screen]:::app
    end

    subgraph AIEdge [Core AI Translation Cloud]
        GrammarBrain[🧠 ISL Grammar Engine<br>Converts English to Sign Grammar]:::brain
    end
    
    subgraph VideoEdge [Video Translation Cloud]
        VideoBrain[👁️ Video Vision Engine<br>Translates Video to English]:::brain
    end

    subgraph DataHousings [Databases & Storage]
        Dictionary[(📖 Sign Dictionary<br>Offline & Online)]:::storage
        AnimationFiles[(🎞️ AWS Cloud<br>Animation Files)]:::storage
    end

    User -- Speaks --> VoiceInput
    User -- Types --> TextInput
    User -- Uploads Video --> VideoInput

    VoiceInput -- "Sends words" --> GrammarBrain
    TextInput -- "Sends words" --> GrammarBrain
    VideoInput -- "Sends mp4/webm" --> VideoBrain

    GrammarBrain -- "Reads structure" --> Dictionary
    Dictionary -- "Retrieves signs" --> AnimationFiles
    AnimationFiles -- "Streams 3D Animation" --> AvatarScreen

    VideoBrain -- "Returns English Text" --> AvatarScreen
    
    AvatarScreen -- "Plays Animation or Shows Text" --> User
```

---

## 2. Low-Level Architecture (For Technical Engineers)

### Plain Text Diagram
```text
 +-------------------------------------------------------------------------+
 |                      Expo React Native Frontend                         |
 |                                                                         |
 |   [ SearchBar.tsx ] (Text/Voice)            [ Video UI ] (Video)        |
 |          |                                        |                     |
 |  (If offline word match)                          | (HTTP POST          |
 |  [ s3Service.ts ]          (HTTP POST /process)   |  /translate-video)  |
 +----------|------------------------|---------------|---------------------+
            |                        |               |
       (Local JSON)                  v               v
            |       +------------------------+  +------------------------+
            |       |Core Backend (Port 8000)|  |Video Service (Port 8001|
            |       |                        |  |                        |
            |       | [ spaCy POS Tagging ]  |  | [ File chunk uploader ]|
            |       |          |             |  |            |           |
            |       | [ NVIDIA LLM APIs ]    |  |            v           |
            |       |          |             |  |[Google Gemini Vision & |
            |       | [ ISL Transformer ]    |  | LLM Interpretation API]|
            |       |          |             |  |            |           |
            |       | [ ChromaDB Database ]  |  |            |           |
            |       +----------|-------------+  +------------|-----------+
            |                  |                             |
            |           (Returns Object)             (Returns English)
            v                  v                             |
 +--------------------------------------------------+        |
 |   [ AvatarWebView.tsx ] (Plays Sign Queue)       |<-------+
 |                       |                          |
 |   [ WebGL CWASA Avatar HTML ] <-- fetch .sigml   |
 +-----------------------|--------------------------+
                         v
              [ AWS S3 Cloud Bucket ]
```

### Mermaid Diagram
```mermaid
flowchart TD
    %% Styling
    classDef frontend fill:#1c2833,stroke:#3498db,stroke-width:2px,color:#fff
    classDef backend fill:#117864,stroke:#2ecc71,stroke-width:2px,color:#fff
    classDef pipeline fill:#7d3c98,stroke:#9b59b6,stroke-width:2px,color:#fff
    classDef external fill:#f39c12,stroke:#e67e22,stroke-width:2px,color:#fff
    classDef storage fill:#34495e,stroke:#95a5a6,stroke-width:2px,color:#fff

    subgraph Frontend [Expo React Native Mobile App]
        Input[SearchBar.tsx<br>expo-speech-recognition]:::frontend
        AppLogic[HomeScreen.tsx<br>State & Queue Control]:::frontend
        OfflineDict[s3Service.ts<br>Local JSON Exact/Fuzzy Match]:::frontend
        CWASA[AvatarWebView.tsx<br>WebGL CWASA Bridge]:::frontend
    end

    CloudS3[(AWS S3<br>sigml-files/)]:::external
    NVIDIA[NVIDIA API<br>openai/gpt-oss-120b]:::external
    Gemini[Google Gemini API<br>gemini-3.6-flash]:::external

    subgraph VideoService [Video Microservice - Port 8001]
        MainVideo[main.py<br>POST /translate-video]:::backend
        GeminiWrapper[Gemini Model Upload Logic]:::backend
    end

    subgraph CoreBackend [Core ISL Backend - Port 8000]
        MainCore[app.main:app<br>POST /process]:::backend
        
        subgraph NLP_Pipeline [nlp_engine.py]
            Preprocess[Pre-processing]:::pipeline
            SpaCy[spaCy en_core_web_trf]:::pipeline
            LLM[LLM Semantic Extraction]:::pipeline
            ISLRules[ISL Grammar Rules]:::pipeline
        end
        
        WordLookup[word_lookup.py<br>Match GLOSS to URLs]:::backend
        SemanticSearch[semantic_search.py<br>Sentence-Transformers]:::backend
        ChromaDB[(ChromaDB Vector Store)]:::storage
        DictJSON[(sign_language_data.json)]:::storage
    end

    %% DATA FLOW
    Input -- "String / Voice Audio" --> AppLogic
    AppLogic -- "Offline Local Lookup" --> OfflineDict
    OfflineDict -- "Fallback to Online" --> MainCore

    Input -- "File Upload (mp4/webm)" --> MainVideo
    MainVideo --> GeminiWrapper
    GeminiWrapper -- "Sends video + ISL prompt" --> Gemini
    Gemini -- "Returns English" --> AppLogic

    MainCore --> Preprocess
    Preprocess --> SpaCy
    SpaCy --> LLM
    LLM --> NVIDIA
    NVIDIA --> LLM
    LLM --> ISLRules
    ISLRules --> WordLookup

    WordLookup --> DictJSON
    WordLookup -- "Semantic Fallback" --> SemanticSearch
    SemanticSearch --> ChromaDB

    WordLookup -- "Returns {word, s3_url}" --> MainCore
    MainCore -- "JSON Response" --> AppLogic

    AppLogic -- "Sequence URLs via Ref Queue" --> CWASA
    CWASA -- "HTTPS Fetch .sigml" --> CloudS3
```

---

## 3. High-Level Summary of System Layers

### Presentation Layer
*   **Expo / React Native**: Acts as a thick client. Handles exact dictionary lookups instantly on device without a network requirement by scanning a bundled `sign_language_data.json` file.
*   **CWASA Render Bridge**: Embedded webview running UEA's CWASA javascript library to render WebGL 3D bone animations from SiGML descriptors. 

### Inference & Integration Layer
*   **Video to Text (8001)**: Relies on `google-genai` multi-modal vision capabilities to bypass custom ML vision training. Isolated microservice due to drastically different throughput/LLM requirements.
*   **Text to ISL (8000)**: Multi-stage pipeline. Uses `spaCy` for POS extraction, `NVIDIA LLM` strictly for contextual decomposition, and deterministic Python logic for ISL grammatical reordering to prevent hallucination.

### Storage & Embeddings Layer
*   **ChromaDB**: Holds 384-dimensional dense vectors created by `all-MiniLM-L6-v2` for semantic search (e.g. mapping "furious" to "ANGRY").
*   **AWS S3**: Securely hosts static `.sigml` animation payloads globally.
