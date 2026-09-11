# video-service

## Overview
The `video-service` folder contains a dedicated microservice for performing "Sign-to-English" translations from user-uploaded video streams. It acts as an intermediary between the client application and Google's Gemini API, interpreting continuous string sign language videos into complete English sentences.

## Structure
*   `main.py`: The entry point and primary FastAPI router.
*   `requirements.txt`: Defines the Python dependencies (FastAPI, google-genai, etc.).
*   `.env` / `.env.example`: Configuration files holding the `GEMINI_API_KEY`.

## Key Files & Logic
### `main.py`
*   Initializes a FastAPI application (Port 8001).
*   Configures CORS middleware.
*   **Gemini Integration**: Uses `google.genai.Client` to upload temporary videos and prompt `gemini-3.6-flash` for interpretations.
*   Temporarily caches incoming fragments to `/tmp/` before uploading.

## Routes & APIs
*   **`GET /health`**: General health-check endpoint. Returns `{status: "ok"}` and port info.
*   **`POST /api/translate-video`**: Receives an `.mp4` or `.webm` video payload file via `UploadFile`, uploads the buffer to Gemini with a dedicated prompt to act as a sign language interpreter, handles the `PROCESSING` loop, and returns the natural English translation (or "UNCLEAR SIGN SEQUENCE"). 

## Important Dependencies
*   `fastapi`, `uvicorn`, `python-multipart` (for file uploads)
*   `google-genai` (For Gemini capabilities)
*   `python-dotenv`

## Connection to Project
This microservice stands slightly decoupled from the primary ISL `backend`, handling specifically the "reverse" route: sign-video streams going *into* valid text, complementing the ISL text-to-gloss conversion. Client apps would send video files to this API on port `8001`.
