# SIGN-TO-ENGLISH MICROservice — MASTER FRONTEND POLISH PROMPT

The Sign-to-English microservice is now **WORKING end-to-end**:

```text
Camera → short video → FastAPI :8001 → Gemini → English result
```

This working pipeline is the highest priority.

We are now polishing **ONLY the Sign-to-English frontend experience**.

Do NOT break, redesign, or unnecessarily modify the working backend/video pipeline.

Do NOT modify the existing Text-to-Sign system or backend on `:8000`.

---

# 1. CRITICAL: FRONTEND-ONLY HAND LANDMARK VISUALIZATION

Do **NOT** install MediaPipe, TensorFlow, OpenCV, FFmpeg, or any heavy hand-tracking/ML dependency.

For this 24-hour hackathon, create a **simulated hand landmark visualization** purely for frontend presentation.

It is a visual effect only.

Architecture:

```text
Camera
 ├──→ Animated landmark overlay
 │       ↓
 │     UI ONLY
 │
 └──→ ORIGINAL recorded video
         ↓
       FastAPI :8001
         ↓
       Gemini
```

The simulated landmarks must NEVER:

* be sent to FastAPI
* be sent to Gemini
* be included in the recorded video
* modify the video
* delay recording
* delay uploading
* influence translation
* change `/api/translate-video`

Gemini must continue receiving the **original clean video** exactly as it does now.

The landmark overlay must be implemented using lightweight existing frontend technologies such as:

```text
React Native Views
Animated
SVG
Canvas
```

or another lightweight approach already compatible with the project.

---

# 2. LANDMARK VISUAL DESIGN

Create a reusable component such as:

```text
Application/src/components/HandLandmarkOverlay.tsx
```

or the cleanest equivalent based on the existing structure.

The overlay should visually resemble a modern computer-vision interface:

```text
        ●────●
       /      \
      ●        ●
       \      /
        ●────●
        │    │
    ●───●    ●───●
    │             │
    ●             ●
```

Include:

* palm points
* finger joints
* fingertips
* connecting skeleton lines
* subtle glow
* subtle movement
* small tracking indicator

Make it look polished and believable.

Do NOT make it look like a debugging visualization.

Keep the effect restrained and elegant.

---

# 3. IMPORTANT HONESTY RULE

This is a **simulated frontend visualization**, not real hand landmark detection.

Do NOT add UI text claiming:

```text
"AI detected your hand"
"Hand landmarks detected"
"98% hand confidence"
```

unless the application is actually performing that detection.

Use neutral visual language such as:

```text
Gesture visualization
Sign naturally
Tracking
```

or simply let the visual overlay speak for itself.

Never fabricate confidence scores.

---

# 4. CROSS-PLATFORM REQUIREMENT

The visual overlay must work consistently on:

```text
Android
iOS
Web
```

because it consists only of frontend rendering/animation.

Do not introduce separate heavy ML implementations for each platform.

The underlying video recording must remain:

```text
Web:
Browser MediaRecorder → WebM

Android/iOS:
Expo Camera → native video
```

The same backend endpoint remains:

```text
POST /api/translate-video
```

---

# 5. CAMERAVIEW WARNING MUST STAY FIXED

Never put React children inside:

```tsx
<CameraView>
```

Use:

```tsx
<View style={styles.cameraContainer}>
    <CameraView />

    <View style={styles.overlay}>
        ...
    </View>
</View>
```

All camera controls, landmark visualization, labels, timers, etc. must be outside `CameraView`.

Do not reintroduce:

```text
<CameraView> ...children... </CameraView>
```

---

# 6. PREMIUM CAMERA SCREEN

Redesign ONLY the Sign-to-English screen.

The experience should feel like a polished accessibility/AI product rather than a basic camera screen.

Desired structure:

```text
┌────────────────────────────────────┐
│  ← Sign → English             •    │
│                                    │
│       CAMERA PREVIEW               │
│                                    │
│        hand visualization          │
│          •──•──•                   │
│           \ | /                    │
│            \|                      │
│                                    │
│       Sign naturally               │
│                                    │
│            ┌─────┐                 │
│            │  ●  │                 │
│            └─────┘                 │
│                                    │
│            HOLD TO SIGN             │
└────────────────────────────────────┘
```

Use:

* strong typography hierarchy
* generous spacing
* rounded controls
* subtle glass effects where appropriate
* smooth animations
* elegant camera framing
* dark visual language matching SignVision
* restrained accent colors
* polished state transitions

Do not redesign unrelated screens.

Do not create a generic AI dashboard.

---

# 7. RECORDING EXPERIENCE

Preserve the current working recording behavior.

Target:

```text
press/hold
    ↓
record
    ↓
auto-stop at maximum duration
    ↓
upload
    ↓
processing
```

During recording show:

* recording indicator
* elapsed time
* maximum-duration indicator
* subtle landmark animation
* simple instruction such as `Sign naturally`

The interface must make it immediately obvious when recording is active.

The recording pipeline itself must remain unchanged.

---

# 8. PROCESSING STATE

After recording:

```text
Recording
   ↓
Analyzing
   ↓
Result
```

Create a premium processing state.

Example:

```text
Analyzing your sign…

Understanding the gesture sequence
```

Use elegant animation.

Do NOT show fake percentages such as:

```text
63%
87%
94%
```

Do not pretend the backend exposes progress that it does not actually provide.

---

# 9. TRANSLATION RESULT

The current backend returns something like:

```json
{
  "translation": "WHAT ARE YOU DOING?"
}
```

Do not display it as an overly technical response.

Present it naturally:

```text
YOU MAY BE TRYING TO SAY

“What are you doing?”
```

or a similar concise presentation.

Keep the actual Gemini translation as the source of truth.

Do NOT invent additional semantic meaning.

Do NOT fabricate confidence.

If the backend returns:

```text
UNCLEAR SIGN SEQUENCE
```

show a friendly retry state:

```text
We couldn't understand that sign sequence.

Try signing again with a little more space and clearer movement.
```

Do not falsely claim the sign was recognized.

---

# 10. RESULT CARD

Design a strong final result state:

```text
┌────────────────────────────────────┐
│  SIGN → ENGLISH                    │
│                                    │
│  “What are you doing?”             │
│                                    │
│  Your gesture sequence was         │
│  interpreted as this phrase.      │
│                                    │
│       [ Sign Again ]               │
└────────────────────────────────────┘
```

Include:

* small section label
* large translation
* subtle supporting copy
* clear `Sign Again` action

The card must look excellent on:

```text
mobile portrait
desktop browser
```

---

# 11. RESPONSIVE WEB + MOBILE DESIGN

The same component must adapt properly to:

```text
small Android screen
iPhone
tablet
desktop browser
```

Avoid fixed desktop-only dimensions.

For Web, make the camera area visually centered and constrained to a reasonable maximum width rather than stretching awkwardly across the entire screen.

For mobile, prioritize camera visibility and thumb-friendly controls.

---

# 12. VIDEO PIPELINE — ABSOLUTELY UNCHANGED

The working pipeline is:

```text
Camera
 ↓
5–8 second video
 ↓
POST /api/translate-video
 ↓
FastAPI :8001
 ↓
Gemini
 ↓
translation
```

Do NOT change this to:

```text
Camera
 ↓
landmarks
 ↓
processed video
 ↓
Gemini
```

Do NOT send landmark data to the backend.

Do NOT annotate the video.

Do NOT wait for landmark animation before uploading.

Do NOT change the Gemini model or backend prompt.

---

# 13. BACKEND IS OUT OF SCOPE

Do not modify:

```text
video-service/main.py
```

Do not modify:

```text
backend/
```

Do not modify:

```text
/api/translate-video
```

request/response behavior.

The only acceptable backend modification is an absolutely necessary compatibility fix discovered while testing the frontend.

Otherwise, leave the backend completely untouched.

---

# 14. PERFORMANCE

The simulated landmark overlay must be extremely lightweight.

Prioritize:

```text
recording reliability
>
camera smoothness
>
UI responsiveness
>
visual polish
```

The visualization must never interfere with:

* recording
* video encoding
* upload
* Gemini processing

Use modest animation frequency and avoid unnecessary re-renders.

Do not create a continuous expensive animation loop if a simpler approach works.

---

# 15. FAILURE FALLBACK

If the visual overlay has a rendering problem:

```text
camera must still work
recording must still work
upload must still work
Gemini translation must still work
```

The overlay is optional.

The translation workflow is mandatory.

---

# 16. FILE SAFETY

Before modifying anything:

1. Inspect the current Sign-to-English implementation.
2. Inspect the existing camera recording logic.
3. Inspect the current Web and native code paths.
4. Preserve working logic.
5. Make the smallest necessary changes.
6. Do not rewrite unrelated code.

Do not change dependency versions unless necessary.

Do not install heavy dependencies.

---

# 17. TESTING

## Web

Verify:

```text
camera opens
camera overlay looks correct
simulated hand landmarks animate
recording works
recording automatically stops
WebM is produced
video reaches :8001
Gemini returns translation
result card appears
Sign Again works
```

## Android

Verify:

```text
camera opens
landmark visualization works
native recording works
video reaches :8001
Gemini returns translation
result card appears
```

## Error cases

Test:

```text
camera permission denied
recording cancelled
network failure
Gemini failure
unclear sign sequence
overlay failure
```

The core translation workflow must remain usable.

---

# 18. DO NOT OVER-ENGINEER

This is a 24-hour hackathon.

Do NOT add:

* MediaPipe
* TensorFlow
* OpenCV
* FFmpeg
* custom ML models
* native hand-tracking frameworks
* complicated state-management systems
* unnecessary backend changes

The visual landmark effect is only there to make the demo more impressive.

---

# 19. SUCCESS CRITERIA

The finished experience should feel like:

```text
Open Sign → English
        ↓
Beautiful camera interface
        ↓
Subtle animated gesture visualization
        ↓
Hold to Sign
        ↓
5–8 second recording
        ↓
Analyzing…
        ↓
Natural English interpretation
        ↓
Sign Again
```

The most important technical guarantee is:

```text
SIMULATED LANDMARKS
        ↓
UI ONLY

ORIGINAL VIDEO
        ↓
FastAPI :8001
        ↓
Gemini
```

The two paths must remain completely independent.

---

# 20. FINAL REPORT

After implementation, report:

1. Exact files changed.
2. Any dependencies added.
3. How the simulated landmark overlay works.
4. Confirmation that no landmark data reaches FastAPI/Gemini.
5. Confirmation that the original video remains untouched.
6. How Web differs from Android/iOS.
7. Confirmation that `POST /api/translate-video` still works.
8. Any remaining limitations.

Do NOT modify the existing Text-to-Sign system.

Do NOT break the currently working Sign-to-English video → Gemini flow.

Implement this frontend polish now.
