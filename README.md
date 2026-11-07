# PROJECT SYNC — autonomous virtual-idol concert

Three independent module Web Workers perform a 120 BPM concert using a replicated deterministic score. The main thread renders their decisions and outputs sound; it never generates the continuous show beat. No backend, accounts or cloud services.

## Run on macOS / VS Code

Install a current Node.js LTS (20.19+ or 22.12+). Open this folder in VS Code, then in its integrated terminal:

```sh
npm install
npm run dev
```

Open the localhost URL and press **Start Concert**. Chrome's user gesture unlocks audio. `npm run build` produces a self-contained `dist/` bundle with local Three.js and VRM dependencies. Serve that directory over HTTP; do not open files directly. Internet is required for dependency installation only. `start.command` also launches Vite after dependencies are installed.

```sh
npm test
npm run build
npx playwright install chromium
npm run dev
# in another terminal:
node scripts/browser-check.mjs
node scripts/browser-clock-check.mjs
# If Vite chooses a different port, prefix either command with:
# SYNC_TEST_URL=http://127.0.0.1:5175
```

## Architecture and timing

Each agent now owns a private relative oscillator with seeded offset, default-on synthetic rate error, and leaderless circular phase coupling. Pairwise ping/pong exchanges estimate relative clock offset and transit age; no absolute clock or shared start timestamp is passed to workers. The selected initiator gossips a relative countdown once; peers that miss it join by listening. See [current clock diagnosis](docs/clock-diagnosis.md) and [regenerated measurements](docs/clock-measurements.md) for estimator assumptions, uncertainty and limitations. No partition-safe consensus is claimed.

## Optional music assets

No music files are included. Supply licensed, aligned, seamless 32-second WAVs under `public/audio/`. Manifest: `public/audio/manifest.json` specifies 120 BPM, 4/4, 64 beats, duration 32 seconds and exact start offset 0.

Selection is exclusive, preventing duplicate full mix + stem playback:

1. All of `nova.wav`, `luna.wav`, `echo.wav`: each agent controls its aligned part.
2. Both `concert-instrumental.wav` and `concert-vocals.wav`: demonstration mix fallback, both following the circular median of fresh living agents' playback-position commands.
3. `concert-full.wav`: explicitly labelled full-mix demonstration fallback following the living-agent median.
4. Missing, invalid or incomplete assets: clearly labelled synthetic vowel arrangement, **not VOCALOID singing**.

A missing counterpart is not guessed or silently mixed into another mode. Export all supplied WAVs at offset zero; mismatched duration (>60 ms from 32 seconds) is rejected. Each source starts with a short output lead accounted for in its initial position. Small position errors use ±2.5% playback-rate recovery; errors ≥180 ms crossfade to the agent's requested position. Decoded loop edges receive a 4 ms fade. One AudioContext is reused across restart; active tracks fade and stop on pause/restart. Controls provide mute and master volume. Playback adaptation is browser-local, not sample-accurate distributed speakers.

## Optional characters

Place licensed VRM files at `public/models/nova.vrm`, `luna.vrm`, `echo.vrm`. None are supplied or fabricated. Missing, invalid or unrecognized models leave the corresponding procedural performer active; status is displayed without blocking controls. Local `@pixiv/three-vrm` handles normalized humanoid bones and VRM0 conversion. Models are scaled by measured height, and joint changes are composed with stored normalized rest rotations; absent bones are skipped safely. Models with unusual rigs may still require artistic retargeting.

Dance includes alternating arms, sway, steps, bounce, chorus raises, torso rotation and finale pose, deterministic at any given agent ID/beat/section. Coarse mouth motion uses synthetic vowel cues even for WAV playback and does **not** match premixed lyrics. A deterministic blink is provided. Exact lyrical phonemes, user timing metadata, VRMA support and model-specific facial-expression blending are not implemented.

## 60-second judges' demonstration

- 0–10s: Start Concert. Identify NOVA, LUNA, ECHO, their independent beats, sections and local lights. Point out whether assets or synthetic/procedural fallbacks are active.
- 10–20s: Isolate LUNA. Show its beat, dance and music continue while its peer cache clears. Show private oscillator drift.
- 20–30s: Raise loss to 60%, latency to 150 ms and jitter to 80 ms. Point to real receive/drop counters and phase disagreement.
- 30–40s: Restore peers. Watch recovery; no central clock reset is sent.
- 40–50s: Propose colour encore. Watch peer acknowledgements and locally approved future gold lighting. Explain the deadline and canonical fallback under missing approvals.
- 50–60s: Switch camera, pause/resume and explain that only the initial cue/output device/testing controls are centralized. For a separate stress experiment, enable simulated drift, isolate an agent, then reconnect.

## Scope and performance

Three performers, pixel ratio capped at 2, simple geometries and no expensive postprocessing target Apple Silicon Chrome. Front/orbit/cinematic presets are provided. No cross-machine transport, real voicebank synthesis, exact lyrical lip-sync or partition-safe consensus is claimed. Tests cover clock/dance/protocol logic and browser lifecycle with actual Workers. Licensed real assets require additional manual visual/audio QA. The production build may warn about the VRM/Three.js chunk size; this is bundled locally and loaded independently from controls.

Git history is preserved. Bulky audio/model assets, dependencies, build output and browser captures are ignored by default; commit the manifest and source, not copyrighted media.

## Clock diagnosis and reproducible latency measurements

Run `npm test`, `node scripts/clock-report.mjs` and `node scripts/browser-clock-check.mjs`. See [the diagnosis](docs/clock-diagnosis.md), [deterministic measurements](docs/clock-measurements.md), and [browser observations](docs/browser-clock-measurements.md). The runtime contains no absolute-time synchronization. BroadcastChannel and the underlying hardware are same-computer; oscillator offsets/rates and receiver faults are simulated. Browser UI estimates are receipt-aligned, not measured physical speaker alignment.
