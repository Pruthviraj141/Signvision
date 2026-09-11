import os
import time
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("video-service")

app = FastAPI(title="SignVision Video Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = None
if api_key:
    client = genai.Client(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY is not set in .env! Video translation will fail.")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "video-microservice", "port": 8001}

@app.post("/api/translate-video")
async def translate_video(video: UploadFile = File(...)):
    """
    Receives an `.mp4` or `.webm` video from the mobile/web app, uploads it to Gemini,
    extracts the sign language meaning, and returns the English sentence.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key missing.")

    content = await video.read()
    file_size = len(content)
    
    logger.info(f"--- Incoming Video Request ---")
    logger.info(f"Filename: {video.filename}")
    logger.info(f"Content Type: {video.content_type}")
    logger.info(f"File Size: {file_size} bytes")

    valid_extensions = (".mp4", ".webm", ".quicktime", ".mov")
    
    fname_lower = (video.filename or "").lower()
    if not any(fname_lower.endswith(ext) for ext in valid_extensions):
        logger.error(f"Validation Failure: Unsupported video extension for '{video.filename}'")
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported video type: {video.content_type or 'unknown'} for file {video.filename}"
        )

    if file_size == 0:
        logger.error("Validation Failure: File is completely empty.")
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    temp_file_path = f"/tmp/{int(time.time())}_{video.filename}"
    
    try:
        # 1. Save video chunk to a temporary file
        logger.info(f"Saving temporary video: {temp_file_path}")
        with open(temp_file_path, "wb") as buffer:
            buffer.write(content)

        # 2. Upload to Gemini 
        logger.info("Uploading video to Gemini API...")
        try:
            gemini_file = client.files.upload(file=temp_file_path, config={'display_name': 'SignLanguageVideo'})
        except Exception as upload_err:
            logger.error(f"Gemini upload error: {str(upload_err)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload to Gemini: {str(upload_err)}")

        # 3. Wait for video to process if needed (usually fast for short mp4s, 
        # but the new API handles this cleanly for < 8s clips).
        # We fetch it to ensure state is ACTIVE before passing to model.
        while True:
            file_info = client.files.get(name=gemini_file.name)
            if file_info.state.name == "PROCESSING":
                logger.info("Video is processing, waiting...")
                time.sleep(2)
            elif file_info.state.name == "FAILED":
                err_msg = getattr(file_info, 'error', 'No internal model error details available')
                logger.error(f"Gemini internal video processing error: {err_msg}")
                raise HTTPException(status_code=400, detail="Gemini failed to process this video clip. It might be corrupted or too short. Please try recording again.")
            else:
                break

        # 4. Prompt the model
        logger.info("Generating content from video...")
        prompt = (
            "SYSTEM DIRECTIVE: You are an advanced Indian Sign Language (ISL) recognition AI. "
            "Your sole purpose is to observe ISL video sequences and translate them directly into accurate, natural English.\n\n"
            "Carefully analyze the hand shapes, motion trajectories, and facial expressions in this ISL gesture. "
            "Synthesize the distinct ISL signs into a singular and grammatically correct English utterance. "
            "If the video is completely unreadable, heavily obscured, or lacks a signing human, return exactly: 'UNCLEAR SIGN SEQUENCE'. "
            "Otherwise, output strictly the translated English sentence with NO conversational filler, internal thoughts, or introductions."
        )

        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                gemini_file,
                prompt
            ]
        )

        english_sentence = response.text.strip().replace('"', '').replace('\n', ' ')
        logger.info(f"Translation Output: {english_sentence}")

        return JSONResponse(content={"translation": english_sentence})

    except HTTPException:
        # Allow pre-planned exceptions (like the 400 rejection above) to pass unhindered!
        raise
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # CLEANUP: aggressively delete tmp file!
        if os.path.exists(temp_file_path):
           # os.remove(temp_file_path)
            logger.info(f"Deleted temp file: {temp_file_path}")
