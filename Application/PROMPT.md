# SignVision: visual-only Expo UI refresh

## Role and operating contract

You are the implementation agent for the SignVision React Native + Expo application. Redesign the **Home / text-and-speech-to-sign** experience to match the supplied target reference: an elegant, focused, premium dark mobile interface with a large white avatar stage, a pill-shaped search control, a prominent microphone action, and layered blue ocean waves at the bottom.

This is a **UI-only task**. The app must behave exactly as it does today. Do not reinterpret, replace, stub, remove, or modify backend and feature behavior. Preserve existing TypeScript types, APIs, request payloads, endpoint URLs, retry logic, permissions, storage keys, WebView messaging, and camera flow.

Work in this repository only. Do not install a web-only UI library or rewrite the app as a web app. The source is React Native via Expo and must remain so.

## Required first steps (Antigravity harness)

1. Read this file completely, then inspect `package.json`, `App.tsx`, `src/screens/HomeScreen.tsx`, `src/components/SearchBar.tsx`, `src/components/AvatarWebView.tsx`, `src/screens/CameraTranslateScreen.tsx`, `src/services/`, and `src/types/` before editing.
2. If `.agents/skills/ui-ux-pro-max/` exists, read its `SKILL.md` and use its React Native guidance. It is the canonical UI/UX skill location for the Antigravity/universal harness. If it does not exist, continue without installing packages or changing dependencies.
3. Inspect the current implementation and preserve every current user path before making visual changes.
4. Make small, reviewable changes. Do not touch generated native projects (`android/`) unless a UI-only Expo change genuinely requires it (it should not).
5. Run the existing TypeScript check and relevant Expo lint/test commands if present. Manually exercise the affected happy paths on an Expo target. Report exactly what was verified and any limitation.

## Product and reference interpretation

The desired design is the supplied first reference image, **not** the current application screenshot.

Build a calm, confident sign-language translation interface—not a dashboard. The user’s attention should land on the avatar, then the query field, then the microphone. The design should feel crafted, accessible, and premium while retaining the reference’s simple composition.

### Visual direction

- Portrait-first, mobile-first layout. Must remain stable with safe areas, Android navigation bars, iOS home indicators, small phones, large phones, and text scaling.
- Background: deep ink/navy `#10244D` (or an equally accessible near-black navy). Do not use black-on-black, neon, rainbow gradients, glassmorphism, excessive borders, or generic AI-purple effects.
- Avatar stage: a single high-contrast, warm-white card (`#F7F8FA` / `#FFFFFF`) with a 20–24 px corner radius and enough breathing room to make the signing avatar clearly legible. Retain the existing `AvatarWebView` instance and all its callbacks/ref behavior; only its surrounding presentation may change.
- Search region: a muted navy/slate filled pill (`#263A6C` family), white text and icons, 48–52 px minimum height. It should have a search affordance, real text input, an intentional submit affordance, and the existing speech-recognition action.
- Primary voice action: large, centered, easy-to-hit circular/round icon button directly below the search field. Use a clear mic glyph and a visible listening/processing state. It must call the existing speech-recognition behavior—never create a second recognition implementation.
- Decorative footer: use the existing `assets/waves.png` as a bottom-aligned, non-interactive, non-accessible decorative image. It must respect safe-area space, never cover controls, and never steal touches. Preserve the source aspect ratio; do not stretch it.
- Typography: use the system typeface unless an already-installed Expo-compatible font exists. Favor clear medium/semibold hierarchy, sentence case, readable sizes, and 4.5:1 text contrast. Do not add a font dependency merely for styling.
- Motion: subtle and functional only (e.g., listening pulse or loading transition). Respect reduced-motion behavior when feasible; never make motion convey state by itself.

### Information architecture

1. Keep the visual frame nearly as sparse as the target reference: avatar stage first; input second; microphone third; waves last.
2. The app identity and available-sign count may be represented as a small, low-emphasis header or overlay only if needed; it must not compete with the avatar.
3. Preserve Word/Sentence mode. Implement it as a compact `Tabs`, `Switch`, or `Toggle Group` control that is visible before input and does not crowd the hero composition.
4. Preserve the Sign-to-English/camera entry point as an accessible icon `Button` with a label/tooltip in the header or an unobtrusive secondary location. It must still enter the current `CameraTranslateScreen` and return correctly.
5. Preserve playback status, error copy, sentence gloss tokens, suggestions, recent searches, and clear-history action. Reveal supporting information progressively below the primary controls or in a `Sheet`/`Drawer`; it must remain reachable, readable, and keyboard-safe. Never discard a capability merely because it is absent in the static reference.
6. While the avatar initializes, loads, plays, finishes, errors, or processes a sentence, show the existing state accurately through polished UI. Keep the stop action available while playback is active.

## Component policy: shadcn catalog only

Use only patterns corresponding to the following components from the official shadcn/ui component catalog:

- `Avatar` / `Card` for the avatar stage shell
- `Input` or `Input Group` for text search
- `Button` / `Button Group` for submit, microphone, stop, camera, history, and clear actions
- `Tabs`, `Switch`, or `Toggle Group` for Word/Sentence mode
- `Badge` for compact status/gloss tokens
- `Popover`, `Sheet`, `Drawer`, `Scroll Area`, `Item`, `Separator`, and `Empty` for suggestions/history/supporting content
- `Progress`, `Spinner`, `Skeleton`, `Alert`, and `Toast` for transient states, loading, and errors
- `Tooltip` for icon-only controls

This constraint means **component semantics and visual patterns**, not importing web shadcn packages into React Native. Build Expo-compatible React Native equivalents from the existing React Native primitives (or an already-present, Expo-compatible native library). Do not add components outside this list, custom novelty controls, browser DOM, Tailwind web configuration, Radix, or `@/components/ui` shadcn imports.

## Strict functional invariants

Do not change any of the following:

- `src/services/apiService.ts`, `src/services/s3Service.ts`, their API base URLs, endpoints, headers, retries, timeout behavior, request/response types, or error semantics.
- Search behavior: local word lookup, autocomplete, submit-on-return, clearing, suggestion selection, persisted AsyncStorage history, and history clearing.
- Sentence flow: `processSentence`, gloss token display, queue creation, sequential avatar playback, queue index/status transitions, error and similar-word behavior.
- Speech behavior: `expo-speech-recognition`, permission prompts, locale resolution, event listeners, final-result auto-submit, error alerts, and cancellation.
- Avatar behavior: the current `AvatarWebView`, WebView/iframe implementation, `play`, `stop`, `ping`, ready/playing/finished/error/status messages, and the actual sign URL passed to it.
- Camera flow: the existing entry action, permission handling, video translation, back navigation, and backend integration.
- Expo identity/configuration, dependencies, lockfiles, native Android files, asset paths, and app navigation behavior unless a direct UI-only change is unavoidable and justified.

You may refactor presentation-local styles and split UI-only native components if their props preserve the above contracts exactly. Keep existing business/state logic in place wherever possible.

## Accessibility and quality bar

- Every icon-only control needs an accessibility label, role, hint where useful, and at least a 44 × 44 pt touch target.
- Native controls must have visible pressed, disabled, focused (where supported), loading, listening, selected, error, and success states. Do not use color as the only state indicator.
- Ensure text never clips at narrow widths, with larger accessibility font sizes, or with longer labels. Chips must wrap or expose overflow accessibly.
- Use `SafeAreaView`/safe-area-aware spacing. The keyboard must not obscure suggestions, the input, submit action, or error feedback.
- Decorative waves require `pointerEvents="none"` and must be hidden from accessibility.
- Preserve or improve contrast, semantic labels, screen-reader announcements for meaningful status changes, and reduced-motion behavior.

## Deliverables and acceptance criteria

1. Implement the UI refresh in the smallest relevant React Native files, preserving all functionality listed above.
2. Reuse `assets/waves.png` for the footer decoration. Do not generate or substitute unrelated imagery.
3. The primary Home screen should visually read like the supplied target: premium dark navy field, white rounded avatar panel, compact navy search pill, large centered microphone, and blue wave footer.
4. No backend, API, data-model, storage, speech, avatar playback, or camera-regression changes.
5. No unnecessary dependency changes.
6. Provide a concise final report listing changed files, test/verification results, and any known UI limitation. Do not claim a check passed unless it was actually run.

## Completion checklist

- [ ] Home screen matches the target hierarchy and premium dark/white direction.
- [ ] Avatar rendering and sign playback work in word and sentence modes.
- [ ] Text search, autocomplete, suggestions, and recent history still work.
- [ ] Speech mic starts/stops and final speech still submits the query.
- [ ] Sentence queue, gloss state, loading/error/finished states, and stop work.
- [ ] Sign-to-English camera flow still opens and returns.
- [ ] Small and large devices, safe areas, keyboard, and text scaling are checked.
- [ ] Accessibility labels and touch targets are present.
- [ ] No backend/services/native configuration changes were made.
