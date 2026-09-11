# Plan: The Gaslight Mirror

A single-page, self-roasting webcam toy. FastAPI just serves two static
routes; all vision, audio, and FX run client-side for zero-lag 60fps.

## 1. Goal

Detect the user's facial expression in the browser and respond with an
absurd, theatrical "emotional sabotage" reaction:

| Detected state | Reaction |
|---|---|
| Sad / angry / disgusted / fearful | Mockery: laugh-track audio, confetti burst, spinning skull emoji, party hat on the face, taunting captions |
| Happy | Guilt-trip: desaturate video, violin sting, streaming cartoon tears from the eyes, gloomy rain, guilt captions |
| Neutral for > 3s | "Boring detected" HUD with a 3-2-1 countdown + alarm beeps, then randomly deploys mockery or guilt-trip |

## 2. Architecture

```
Browser (all real work happens here)
 ├── getUserMedia            → raw webcam stream
 ├── face-api.js (CDN)       → TinyFaceDetector + landmarks + expressions
 ├── state machine (app.js)  → idle | mock | guilt | threat
 ├── Canvas2D                → confetti / skulls / tears / rain / HUD text
 └── Web Audio API           → synthesized laugh track / violin / beep
          │
          ▼ (only ever serves the page + static files, never frames)
FastAPI (app.py)
 ├── GET /        → templates/index.html
 └── /static/*    → css/js
```

No frame or audio data is ever sent to the backend — this keeps latency
at "however fast the browser is" and sidesteps any server-side ML
dependency headaches on Windows.

## 3. Milestones

1. **Scaffold** — FastAPI app serving a static page; confirm webcam
   permission flow works end to end.
2. **Detection** — Load face-api.js models from CDN, run
   `detectSingleFace().withFaceLandmarks().withFaceExpressions()` on a
   throttled interval (~5-6/sec is enough; UI still renders at 60fps).
3. **State machine** — Map expression scores → `idle | mock | guilt |
   threat`, with the 3-second neutral timer feeding the threat HUD.
4. **FX layer** — Canvas particle systems (confetti, skulls, tears,
   rain), CSS filters (grayscale for guilt), mirrored coordinate math
   so overlays track the mirrored `<video>` correctly.
5. **Audio layer** — Web Audio API oscillator-based synthesis for the
   laugh track, violin sting, and alarm beep (no external audio
   licensing / asset hosting needed).
6. **Captions** — Randomized caption pools per state, swapped every
   ~2.4s.
7. **Polish** — carnival/broken-CRT visual identity, status chip,
   responsive layout, reduced-motion fallback, `run.bat` for
   double-click Windows setup.

## 4. File layout

```
gaslight-mirror/
├── app.py
├── requirements.txt
├── run.bat
├── plan.md
├── skill.md
├── static/
│   ├── js/app.js
│   ├── css/style.css
│   └── sounds/        (kept empty — audio is synthesized, not loaded)
└── templates/
    └── index.html
```

## 5. Setup (Windows)

```bat
cd gaslight-mirror
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
:: or just double-click run.bat, which does all of the above
```

Then open `http://localhost:5000` and click **ENTER THE MIRROR**
(camera + audio permission prompts will appear — audio must be
unlocked by a user gesture, hence the click-to-start button).

## 6. Key implementation notes / gotchas

- **Mirrored coordinates**: the `<video>` is flipped with
  `transform: scaleX(-1)` for a natural mirror look, but face-api
  detects on the *unflipped* frame. The canvas is left unflipped and
  every drawn x-coordinate is remapped as `canvas.width - x` instead
  of flipping the whole canvas, so text/emoji aren't drawn backwards.
- **Detection vs. render loop**: detection runs on its own throttled
  `setTimeout` loop (~180ms) so the CPU-heavy model inference never
  drops the `requestAnimationFrame` render loop below 60fps.
- **Audio unlock**: `AudioContext` is created/resumed inside the
  start-button click handler, since Chrome/Edge block autoplay audio
  without a user gesture.
- **CDN models**: face-api.js weights load from jsDelivr
  (`justadudewhohacks/face-api.js` weights folder) — no local model
  files to manage.
- **Tone**: this is a joke/novelty app. Keep the captions absurd and
  over-the-top rather than genuinely hurtful, and keep a visible way
  to close/stop it at all times.

## 7. Possible extensions (not required for v1)

- Swap synthesized audio for real hosted sound effects in
  `static/sounds/`.
- Add a "roast intensity" slider.
- Add a screenshot/share button for the funniest caught frame.
