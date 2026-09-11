---
name: gaslight-mirror-builder
description: Use this skill when building, extending, or debugging "The Gaslight Mirror" — a FastAPI-backed, client-side webcam toy that detects facial expression (via face-api.js) and reacts with theatrical mockery, guilt-tripping, or a "boring detected" countdown. Trigger this skill for tasks like adding new reaction states, new caption pools, new canvas particle effects, swapping synthesized audio for hosted sound files, or fixing webcam/model-loading issues in this specific project.
---

# Gaslight Mirror Builder

## What this project is

A single-page novelty app. The backend (FastAPI, `app.py`) only serves
the HTML page and static assets. Every real feature — webcam capture,
face/expression detection, particle FX, audio — runs client-side in
`static/js/app.js`, so there is no frame-streaming or server-side ML.

Keep it that way: do not add server-side video/image processing unless
explicitly asked. The zero-lag design depends on staying client-side.

## File map

- `app.py` — FastAPI app, two routes (`/` and `/static/*`). Rarely
  needs changes.
- `templates/index.html` — page structure: video element, canvas
  overlay, threat HUD, subtitle bar, start button.
- `static/css/style.css` — carnival / broken-CRT visual identity
  (near-black background, alarm red / acid yellow / cyan accents,
  scanline texture, glitch brand text). Reuse these CSS variables
  (`--ink`, `--alarm`, `--acid`, `--cyan`, `--paper`) for any new UI
  rather than introducing new ad-hoc colors.
- `static/js/app.js` — the engine. Organized into:
  - `AudioEngine` — Web Audio API oscillator synthesis (laugh track,
    violin sting, alarm beep). No audio files required.
  - `loadModels` / `startWebcam` — bootstrap.
  - `detectionLoop` — throttled (~180ms) face-api inference.
  - `evaluateEmotion` / `setMode` — the state machine
    (`idle | mock | guilt | threat`).
  - Particle functions (`burstConfetti`, `spawnSkulls`,
    `updateAndDrawTears`, `drawPartyHat`) — Canvas2D FX.
  - `renderLoop` — the `requestAnimationFrame` loop that draws FX and
    swaps captions every ~2.4s.

## Conventions to follow when extending

1. **New reaction state** → add a branch in `evaluateEmotion`, a case
   in `setMode`, a caption pool constant (`ALL_CAPS_SNAKE` naming like
   `MOCK_CAPTIONS`), and, if it has visuals, a drawing function called
   from `renderLoop`.
2. **Mirrored coordinates**: the `<video>` is CSS-flipped
   (`scaleX(-1)`) but the canvas is not. Any landmark-anchored drawing
   must remap x as `canvas.width - x` — never flip the canvas itself,
   or text/emoji will render backwards.
3. **Audio unlock**: any new sound must be triggered from inside code
   paths that already run after the user's initial click on
   `#startBtn` (where `AudioEngine.ensure()` unlocks the
   `AudioContext`). Don't call audio-producing code before that.
4. **Detection loop stays throttled**: don't move `detectSingleFace`
   calls into the `requestAnimationFrame` render loop — that couples
   FX smoothness to model inference speed and will drop frames.
5. **Tone guardrail**: captions should stay absurd/meme-y (e.g. "Skill
   issue honestly") rather than genuinely cruel, and the app must keep
   an obvious, always-available way to stop (closing the tab / a
   visible start/stop control). This is a joke novelty app, not a
   genuine emotional-manipulation tool — keep new copy in that spirit.

## Common tasks

- **Add a caption**: append a string to `MOCK_CAPTIONS`,
  `GUILT_CAPTIONS`, or `IDLE_CAPTIONS` in `app.js`.
- **Swap synthesized audio for real files**: drop files into
  `static/sounds/`, add a `<link>`-free fetch via
  `new Audio('/static/sounds/whatever.mp3')`, and call `.play()` in
  place of the relevant `AudioEngine.play...()` call. Keep a fallback
  to the synth version in case the asset fails to load.
- **New particle effect**: model it after `burstConfetti` /
  `updateAndDrawConfetti` — a `state.<name>` array of particle objects,
  a spawn function, and an update-and-draw function called from
  `renderLoop` guarded by `state.mode === '<mode>'`.
- **Debugging "no face detected"**: check lighting/camera permissions
  first; then confirm the jsDelivr CDN (`MODEL_URL` in `app.js`) is
  reachable, since model weights load from there at runtime.

## Testing checklist after changes

- [ ] `python app.py` boots without errors, `/` returns 200.
- [ ] Camera permission prompt appears only after clicking start.
- [ ] All three states (mock, guilt, threat) trigger with an actual
      face making the corresponding expression.
- [ ] Confetti/tears/skulls clear correctly when switching states (no
      leftover particles from a previous mode).
- [ ] Reduced-motion media query still leaves the app usable (check
      `prefers-reduced-motion` block in `style.css`).
