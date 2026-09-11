# Application

## Overview
The `Application` folder contains the primary React Native frontend mobile application built with Expo. It provides the user interface for SignVision, connecting to both the main backend (for text/speech to ISL) and the video-service (for ISL video to text/speech).

## Structure
*   `App.tsx`: Main entry point for the React Native application.
*   `app.json` / `eas.json`: Expo configuration and build profiles for deployment (e.g., EAS builds for Android/iOS).
*   `package.json`: NPM dependencies.
*   `src/`: Primary source code directory.
    *   `assets/`: Images, icons, or static files.
    *   `components/`: Reusable React components (UI elements).
    *   `data/`: Possibly local state, mock data, or constants.
    *   `screens/`: Top-level navigational screens (e.g., Home, Dictionary, Camera/Recording, Translate).
    *   `services/`: API wrappers or communication logic bridging the frontend to `backend` (FastAPI) and `video-service` endpoints.
    *   `types/`: TypeScript type definitions and interfaces.

## Major Technologies
*   **React Native** via **Expo**
*   **TypeScript**

## Connection to Project
This is the core user-facing piece of SignVision. It communicates with the python backends over network requests. Users see the translated English sentences from their Sign Language videos, and they see Indian Sign Language avatars/videos returned when they type or speak text through this application.
