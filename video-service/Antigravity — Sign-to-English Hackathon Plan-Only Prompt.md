# SIGNVISION — SIGN-TO-ENGLISH
## PHASE 1 ONLY: REPOSITORY ANALYSIS + IMPLEMENTATION PLAN
## DO NOT CREATE OR MODIFY ANY FILES YET

We are adding a new **Sign-to-English** feature to the existing SignVision project.

This is a **24-hour hackathon implementation**.

The priority is:

```text
WORKING DEMO > SIMPLICITY > LOW LATENCY > CLEAN ARCHITECTURE > ADVANCED FEATURES
```

We are NOT trying to build a production-grade continuous Indian Sign Language recognition system in this phase.

The goal is a practical demo:

```text
Short ISL video
      ↓
AI video understanding
      ↓
English sentence
```

Example:

```text
User signs for a few seconds
        ↓
Camera records short clip
        ↓
Gemini vision model analyzes the video
        ↓
"HOW ARE YOU"
```

The system should be capable of interpreting a short sequence containing multiple signs and producing a natural English sentence, rather than returning only one word per request.

---

# 1. FIRST: UNDERSTAND THE CURRENT PROJECT

Read:

```text
/home/pruthvi/projects/signvision/Signvision/info.md
```

Then inspect the actual repository and relevant source files.

Do not assume the documentation is perfectly current.

Verify the important parts of the real codebase, especially:

```text
Application/
backend/
Application/src/
Application/src/screens/
Application/src/services/
Application/package.json
backend/requirements.txt
App.tsx
app.json
```

The existing Text-to-Sign system is already working.

Do NOT break it.

---

# 2. CURRENT SYSTEM

The existing architecture is approximately:

```text
English text / speech
        ↓
Expo React Native
        ↓
FastAPI backend :8000
        ↓
NLP / LLM extraction
        ↓
ISL GLOSS
        ↓
Sign lookup
        ↓
SiGML
        ↓
CWASA avatar
```

The existing backend is responsible for:

```text
Text → ISL
```

The new service will be responsible for:

```text
ISL video → English
```

These responsibilities must remain isolated.

---

# 3. NEW ARCHITECTURE

We want:

```text
                 SIGNVISION
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
     Text / Speech           Camera
          │                     │
          ▼                     ▼
   Existing backend       Short ISL video
        :8000                   │
          │                     ▼
          │              Video microservice
          │                     :8001
          │                     │
          │                     ▼
          │              Gemini Vision AI
          │                     │
          │                     ▼
          │              English sentence
          │                     │
          └──────────────┬──────┘
                         ▼
                    Mobile UI
```

The new microservice must live separately at:

```text
/home/pruthvi/projects/signvision/Signvision/video-service
```

and run on:

```text
8001
```

The existing backend remains on:

```text
8000
```

---

# 4. HACKATHON GOAL

The target experience is:

```text
1. User opens Sign-to-English screen
2. Camera preview is visible
3. User records a short ISL clip
4. Recording automatically stops after a small maximum duration
5. Video is sent to :8001
6. Microservice sends the video to Gemini
7. Gemini interprets the sequence of signs
8. Gemini returns an English sentence
9. UI displays that sentence
```

For example:

```text
ISL video:
[sign 1] [sign 2] [sign 3]

Result:
"WHAT ARE YOU DOING?"
```

The service should NOT require the user to manually divide their signs into individual recordings.

The entire short sequence should be analyzed as one video.

---

# 5. IMPORTANT SCOPE DECISION

Do NOT implement:

```text
real-time streaming recognition
frame-by-frame live translation
continuous conversation
custom neural-network training
ISL dataset training
full linguistic grammar research system
word-by-word API calls
separate API request for every sign
```

The user records:

```text
ONE short clip
```

and Gemini receives:

```text
ONE short clip
```

and returns:

```text
ONE English sentence
```

That is the core demo.

---

# 6. GEMINI MODEL DECISION

Use a CURRENT Gemini multimodal model.

Do not use outdated model names from older plans.

Investigate the currently available Gemini Flash models and recommend the best model for this hackathon based on:

```text
video input support
vision quality
latency
free-tier availability
API simplicity
reliability
```

The preferred direction is a Flash-class Gemini model because speed and practicality matter more than maximum reasoning quality.

The important requirement is:

```text
MUST SUPPORT VIDEO INPUT
```

Do NOT use Google Cloud Vision as the primary model.

Google Cloud Vision is not the same type of multimodal video-understanding model we need.

We need a model that can interpret a sequence of visual gestures and generate natural language.

---

# 7. DIRECT VIDEO FIRST

Our initial implementation should prefer:

```text
MP4
 ↓
Gemini
 ↓
English sentence
```

rather than:

```text
MP4
 ↓
OpenCV
 ↓
5 frames
 ↓
Base64
 ↓
Gemini
```

Reason:

The hackathon timeline is only 24 hours.

Avoid unnecessary infrastructure.

Use direct video understanding if the selected Gemini API/model supports it reliably.

However, design the code so that frame sampling can be added later if testing shows that it improves recognition.

Do NOT add OpenCV or FFmpeg merely because they were present in the original proposal.

---

# 8. RECORDING LENGTH

The mobile app should record a short clip.

Recommended initial target:

```text
5–8 seconds
```

Maximum duration should be enforced by the frontend.

Do not create a complicated recording editor.

The interaction should be simple:

```text
PRESS / HOLD
     ↓
RECORD
     ↓
AUTO STOP
     ↓
TRANSLATE
```

The exact UI interaction can be finalized after inspecting the current application architecture.

---

# 9. FRONTEND

Current application:

```text
/home/pruthvi/projects/signvision/Signvision/Application
```

Investigate the existing screen/navigation structure.

A new screen is expected to be something similar to:

```text
src/screens/CameraTranslateScreen.tsx
```

but do not blindly assume this exact structure.

Determine the cleanest implementation from the existing code.

The screen should eventually contain:

```text
Camera Preview

[ recording state ]

[ Hold to Record ]

Recognized sentence:
"WHAT ARE YOU DOING?"
```

Also include:

```text
loading state
error state
retry state
```

Keep the UI simple and demo-friendly.

Do NOT redesign the rest of the application.

---

# 10. CAMERA

Investigate the project's current Expo version and determine the correct camera library/version.

Consider:

```text
expo-camera
```

but verify compatibility first.

Check:

```text
Expo SDK
React Native version
existing native modules
dev-client
Android permissions
iOS permissions
```

Do not install anything yet.

---

# 11. VIDEO MICROservice

Create a completely isolated FastAPI service under:

```text
/home/pruthvi/projects/signvision/Signvision/video-service
```

Target:

```text
http://<host>:8001
```

The service should eventually expose at minimum:

```text
GET  /health
POST /api/translate-video
```

Keep the API minimal.

Do not create unnecessary endpoints.

---

# 12. REQUEST FORMAT

The intended request is:

```text
POST /api/translate-video
Content-Type: multipart/form-data

video=<short MP4>
```

The service should:

```text
receive video
validate video
send video to Gemini
parse response
return JSON
```

No persistent video storage is required.

Use temporary storage only when technically necessary.

---

# 13. RESPONSE FORMAT

Recommend a simple response structure similar to:

```json
{
  "translation": "WHAT ARE YOU DOING?"
}
```

You may include optional fields such as:

```json
{
  "translation": "WHAT ARE YOU DOING?",
  "confidence": 0.86
}
```

only if they are meaningful and reliable.

IMPORTANT:

Do not invent a fake numeric confidence score just because it looks nice.

If Gemini cannot provide a meaningful confidence value, leave it out.

You may also recommend:

```json
{
  "translation": "WHAT ARE YOU DOING?",
  "recognized_signs": ["YOU", "DO", "WHAT"]
}
```

only if this improves the demo or debugging.

Keep the response simple.

---

# 14. GEMINI PROMPTING

The Gemini prompt is one of the most important parts.

The model should be instructed that:

```text
The uploaded video contains Indian Sign Language.
The user may perform multiple signs in sequence.
Interpret the complete sequence as one utterance.
Use hand movement, orientation, position, body movement, and facial expression where relevant.
Do not translate the video frame-by-frame as independent captions.
Infer the overall intended English meaning.
Return one natural English sentence or phrase.
```

The prompt should encourage the model to reason about the sequence:

```text
sign 1 → sign 2 → sign 3
```

rather than:

```text
frame 1 → word
frame 2 → word
frame 3 → word
```

The prompt should also explicitly say:

```text
Do not invent details when the gesture is unclear.
When uncertain, return the most plausible interpretation of the visible sign sequence.
```

The exact final prompt should be determined during implementation.

---

# 15. LANGUAGE

The project is specifically for:

```text
Indian Sign Language (ISL)
```

Do not accidentally implement:

```text
ASL
```

The model prompt and documentation must clearly refer to:

```text
Indian Sign Language
```

The English output should be natural English.

---

# 16. NO WORD-BY-WORD ARCHITECTURE

Do NOT design:

```text
video
 ↓
sign 1 → API call
sign 2 → API call
sign 3 → API call
```

Instead:

```text
video
 ↓
ONE Gemini analysis
 ↓
ONE English sentence
```

This reduces:

```text
latency
API usage
rate-limit risk
implementation complexity
```

and is much more suitable for a 24-hour hackathon.

---

# 17. FREE-TIER PRIORITY

The solution must prioritize a free or free-tier API suitable for hackathon testing.

Investigate current Gemini pricing and limits.

Document:

```text
current model
free-tier availability
important rate limits
video size limits
expected number of demo requests
```

Do not claim "unlimited free".

Free-tier services generally have quotas/rate limits.

The final plan should be honest about this.

---

# 18. FALLBACK MODEL

A fallback is OPTIONAL.

Do not add a second provider unless it is genuinely useful.

If you recommend a fallback:

1. verify that the model currently exists
2. verify that it supports visual/video input
3. verify that the API is accessible
4. explain why it is worth the additional complexity

Because this is a 24-hour hackathon, the default should be:

```text
ONE GOOD MODEL
```

rather than:

```text
TWO HALF-FINISHED PROVIDERS
```

---

# 19. TEMPORARY FILE HANDLING

The backend must safely handle uploaded videos.

Investigate:

```text
temporary files
maximum file size
MIME validation
cleanup
request timeout
```

No permanent video database is needed for this demo.

---

# 20. ERROR HANDLING

Plan handling for:

```text
no video
invalid video
unsupported MIME type
video too large
Gemini timeout
Gemini rate limit
Gemini API error
empty model response
model cannot interpret sign
network error
```

The mobile UI should convert these into simple human-readable messages.

Do not expose raw stack traces to users.

---

# 21. NETWORKING

Inspect the current project networking strategy.

The final architecture should support:

```text
Existing backend:
8000

New video service:
8001
```

Determine the best development configuration for the actual project.

Check how the current application handles:

```text
localhost
LAN IP
adb reverse
environment variables
development builds
```

Do not hard-code a machine-specific IP if the existing architecture already has a cleaner configuration mechanism.

---

# 22. DEPENDENCY ISOLATION

This is extremely important.

The existing backend should ideally NOT receive:

```text
OpenCV
FFmpeg
video processing packages
camera-related packages
```

The microservice should have its own:

```text
requirements.txt
virtual environment
environment variables
```

The frontend should only receive the camera-related dependency it actually needs.

---

# 23. SECURITY

The Gemini API key must remain inside the microservice.

Never place:

```text
GEMINI_API_KEY
```

inside the Expo client.

Use:

```text
video-service/.env
video-service/.env.example
```

and ensure the real `.env` is ignored by git.

---

# 24. EXISTING SYSTEM MUST REMAIN INTACT

Do not break or unnecessarily modify:

```text
HomeScreen
SearchBar
AvatarWebView
s3Service
existing apiService behavior
NLP engine
ChromaDB
CWASA
existing port 8000
existing sentence translation functionality
```

The new functionality should be additive.

---

# 25. DEMO-FIRST SUCCESS CRITERIA

The minimum successful demo is:

```text
Open camera
      ↓
Record short ISL sequence
      ↓
Upload
      ↓
Gemini interprets sequence
      ↓
English sentence appears
```

Example:

```text
ISL:
[HELLO] [HOW] [YOU]

Result:
"HELLO, HOW ARE YOU?"
```

Another example:

```text
ISL:
[YOU] [DO] [WHAT]

Result:
"WHAT ARE YOU DOING?"
```

These examples are illustrative only.

Do not hard-code these phrases into the application unless there is an explicit technical reason.

---

# 26. IMPORTANT LIMITATION

Be brutally honest in the plan.

A general-purpose multimodal model is NOT guaranteed to correctly recognize arbitrary ISL.

The system may fail on:

```text
subtle hand differences
similar signs
fast motion
occluded hands
poor lighting
unusual camera angle
regional signing variations
complex ISL grammar
longer utterances
```

The hackathon objective is a convincing working prototype, not a scientifically validated ISL translation engine.

This limitation should be documented.

---

# 27. IMPLEMENTATION PLAN REQUIRED

After studying the repository, produce a detailed plan containing:

## A. Existing Architecture Understanding

Explain what the current codebase actually does.

## B. New Sign-to-English Architecture

Provide an ASCII architecture diagram.

## C. Recommended Model

State:

```text
model
API method
why chosen
video support
free-tier situation
limitations
```

## D. Direct Video vs Frame Sampling

Compare:

```text
Direct MP4 → Gemini
```

vs.

```text
MP4 → sampled frames → Gemini
```

Then choose ONE for the initial hackathon implementation.

## E. Frontend Files

List exact files to create/modify.

## F. Microservice Files

List exact files to create.

## G. Dependencies

Separate:

```text
frontend dependencies
video-service dependencies
existing backend dependencies
```

## H. API Contract

Show the request and response.

## I. End-to-End Flow

Show:

```text
camera
→ upload
→ FastAPI
→ Gemini
→ response
→ mobile UI
```

## J. Error Handling

Explain each major failure case.

## K. Networking

Explain how the phone reaches ports:

```text
8000
8001
```

## L. Security

Explain API-key handling and temporary files.

## M. Performance

Explain likely bottlenecks.

## N. Implementation Order

Give the smallest practical sequence of implementation steps.

## O. Testing Plan

Include:

```text
microservice health test
manual API upload test
Gemini test
camera test
mobile integration test
full demo test
```

## P. Hackathon Risk Assessment

Classify risks as:

```text
LOW
MEDIUM
HIGH
```

especially:

```text
ISL recognition quality
Gemini API availability
camera integration
networking
latency
free-tier limits
```

## Q. Documentation Changes

List what needs to be updated later in:

```text
info.md
```

---

# 28. ABSOLUTE RULE

THIS IS PLANNING ONLY.

Do NOT:

- create files
- modify files
- install packages
- change package.json
- change requirements.txt
- edit info.md
- start servers
- add camera code
- add Gemini code
- create video-service files

Only inspect and produce the implementation plan.

At the end, write exactly:

**PLAN READY — Please review this plan. I will not modify or create any files until you explicitly approve it.**