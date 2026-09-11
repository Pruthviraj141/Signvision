# Backend Services

## Overview
The `backend` folder contains the primary FastAPI server for SignVision. Its core purpose is to convert Text or Audio (speech) into Indian Sign Language (ISL) gloss and return the corresponding sign URL representations.

## Structure
*   `app/`: Main application code containing core logic and services.
    *   `main.py`: The entry point for the FastAPI application.
    *   `core/`: Core configurations or base classes.
    *   `services/`: Service logic like NLP for generating GLOSS tokens, semantic search, and S3 lookups.
*   `data/`: Data assets (e.g., embeddings or sign directories).
*   `recordings/`: Likely stores audio recordings uploaded to the transcription endpoint.
*   `requirements.txt`: Python dependencies (`spacy`, `fastapi`, `uvicorn`, etc.).
*   `.env` / `.env.example`: Configuration, expects NVIDIA API key or similar.
*   `README.md`: Setup and execution guide.

## Key Flow
1. **Input**: User provides audio (speech) or text. Audio is transcribed inside the backend.
2. **NLP Engine**: Converts the text to ISL grammar representation (GLOSS).
3. **Lookup**: Finds the exact or semantically matching signs in an S3 bucket (or local storage).
4. **Output**: Returns the appropriate sign URLs to the client.

## Routes & APIs
*   `POST /process`: Takes `{"text": "..."}`, returns GLOSS and Sign URLs.
*   `POST /transcribe`: Takes audio file, transcribes to text, then returns GLOSS and Sign URLs.
*   `GET /lookup/{word}`: Single word search.
*   `GET /search`: Semantic search against the available database of signs.
*   `GET /health`: Healthcheck.

## Important Dependencies
*   `FastAPI`, `uvicorn`
*   `spaCy` (`en_core_web_trf` model)
*   Integrates with some STT (Speech-to-Text) API (NVIDIA referenced in README) and semantic search logic (likely HuggingFace).

## Connection to Project
This forms the core logic for the "Speech/Text to Sign Language" feature of the Application. The frontend application makes HTTP requests here to display signs on the screen.
