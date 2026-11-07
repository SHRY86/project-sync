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

- `score.js`: replicated immutable constants and pure beat-addressable dance, section, vowel, light and audio-position decisions. 64 beats / 32 seconds / 4/4.
- `clock.js`: worker-local `performance.timeOrigin + performance.now()` estimate, retaining the original common monotonic time domain and bounded calibration imperfections. Circular differences wrap at 64 beats. Beat samples carry their exact epoch timestamp; fresh observations expire after 1200 ms. Shared-clock corrections use a .01-beat deadband, ±.01-beat budget and ≤.002 beats/second slew with absolute proportional feedback, never an integrated peer residual. Stress mode separately permits ±.35 beats and ≤.12 beats/second slew, integrating only when a new observation arrives. Output never goes backwards.
- `agent.worker.js`: one independent clock, score, peer cache, proposal state and music command stream per agent; broadcasts every ~180 ms and emits states every ~33 ms.
- `coordination.js`: independently validated proposals and repeated acknowledgements. NOVA can propose a gold lighting encore at a future four-beat bar (at least 12 beats ahead). Each agent requires all three approvals before target−1 beat; otherwise its canonical score continues. Accepted variations last eight beats. Stale, malformed and late proposals are rejected. No restore/resync broadcast exists.
- `agents.js`: initial future start cue, worker lifecycle and spectator fault injection. Pause/resume are explicit spectator transport commands; workers adjust their own paused epoch. Restart destroys the prior workers and creates a fresh session.
- `audio.js`: browser AudioContext output adapter for agent-selected musical positions and synthetic note/vowel commands. It never supplies the show clock.
- `stage.js`: presentation adapter, optional VRM loader and procedural characters. Worker pose/light values drive every performer and zone. Camera movement is decorative, never fed back into agents.
- `ui.js`: controls and observed metrics. Phase differences project asynchronously received states to the same current epoch timestamp at each advertised local rate. Stale samples and mixed paused/running observations show unavailable measurements instead of fabricated disagreement. Recovery measures restore click to <.05 beats disagreement and all peer caches populated. Counters count actual received or intentionally dropped/expired messages, not estimated throughput.

**Network scope:** BroadcastChannel is same-origin, same-computer browser communication. It is not cross-machine networking. Default holdover exploits the common physical monotonic clock; it does not prove indefinite independent-device synchronization. Latency, jitter and loss are simulated on each receiver; isolation blocks incoming and outgoing traffic. Peers continue during partitions.

**Cooperation limitation:** this is a unanimous local approval gate, not atomic commit or consensus. Under asymmetric partitions, agents can possess different sets of approvals and execute different local outcomes. Even unanimous knowledge cannot guarantee everyone else received the last acknowledgement. The UI and demo deliberately make no partition-safe consensus claim. Protocol participants are trusted, not authenticated or Byzantine-resistant.

**Drift stress:** separately enabled synthetic −80/+95/−35 ppm clock rates model modest oscillator error; differences become visible over longer isolation. Drift accumulates while enabled and stops accumulating when disabled. Existing stress corrections slew back toward the shared-mode budget when disabled; they do not jump to zero. Bounded ±.35-beat correction cannot eliminate arbitrary prolonged drift. Restart begins a fresh experiment. This is distinct from the default bounded common-clock demonstration.

## Optional music assets

No music files are included. Supply licensed, aligned, seamless 32-second WAVs under `public/audio/`. Manifest: `public/audio/manifest.json` specifies 120 BPM, 4/4, 64 beats, duration 32 seconds and exact start offset 0.

Selection is exclusive, preventing duplicate full mix + stem playback:

1. All of `nova.wav`, `luna.wav`, `echo.wav`: each agent controls its aligned part.
2. Both `concert-instrumental.wav` and `concert-vocals.wav`: demonstration mix fallback, both following NOVA's playback-position commands.
3. `concert-full.wav`: explicitly labelled full-mix demonstration fallback following NOVA.
4. Missing, invalid or incomplete assets: clearly labelled synthetic vowel arrangement, **not VOCALOID singing**.

A missing counterpart is not guessed or silently mixed into another mode. Export all supplied WAVs at offset zero; mismatched duration (>60 ms from 32 seconds) is rejected. Each source starts with a short output lead accounted for in its initial position. Small position errors use ±2.5% playback-rate recovery; errors ≥180 ms crossfade to the agent's requested position. Decoded loop edges receive a 4 ms fade. One AudioContext is reused across restart; active tracks fade and stop on pause/restart. Controls provide mute and master volume. Playback adaptation is browser-local, not sample-accurate distributed speakers.

## Optional characters

Place licensed VRM files at `public/models/nova.vrm`, `luna.vrm`, `echo.vrm`. None are supplied or fabricated. Missing, invalid or unrecognized models leave the corresponding procedural performer active; status is displayed without blocking controls. Local `@pixiv/three-vrm` handles normalized humanoid bones and VRM0 conversion. Models are scaled by measured height, and joint changes are composed with stored normalized rest rotations; absent bones are skipped safely. Models with unusual rigs may still require artistic retargeting.

Dance includes alternating arms, sway, steps, bounce, chorus raises, torso rotation and finale pose, deterministic at any given agent ID/beat/section. Coarse mouth motion uses synthetic vowel cues even for WAV playback and does **not** match premixed lyrics. A deterministic blink is provided. Exact lyrical phonemes, user timing metadata, VRMA support and model-specific facial-expression blending are not implemented.

## 60-second judges' demonstration

- 0–10s: Start Concert. Identify NOVA, LUNA, ECHO, their independent beats, sections and local lights. Point out whether assets or synthetic/procedural fallbacks are active.
- 10–20s: Isolate LUNA. Show its beat, dance and music continue while its peer cache clears. Explain shared physical-clock holdover.
- 20–30s: Raise loss to 60%, latency to 150 ms and jitter to 80 ms. Point to real receive/drop counters and phase disagreement.
- 30–40s: Restore peers. Watch recovery; no central clock reset is sent.
- 40–50s: Propose colour encore. Watch peer acknowledgements and locally approved future gold lighting. Explain the deadline and canonical fallback under missing approvals.
- 50–60s: Switch camera, pause/resume and explain that only the initial cue/output device/testing controls are centralized. For a separate stress experiment, enable simulated drift, isolate an agent, then reconnect.

## Scope and performance

Three performers, pixel ratio capped at 2, simple geometries and no expensive postprocessing target Apple Silicon Chrome. Front/orbit/cinematic presets are provided. No cross-machine transport, real voicebank synthesis, exact lyrical lip-sync or partition-safe consensus is claimed. Tests cover clock/dance/protocol logic and browser lifecycle with actual Workers. Licensed real assets require additional manual visual/audio QA. The production build may warn about the VRM/Three.js chunk size; this is bundled locally and loaded independently from controls.

Git history is preserved. Bulky audio/model assets, dependencies, build output and browser captures are ignored by default; commit the manifest and source, not copyrighted media.

## Clock diagnosis and reproducible latency measurements

See [clock diagnosis](docs/clock-diagnosis.md), [the full deterministic measurement table](docs/clock-measurements.md), and [actual browser Worker measurements](docs/browser-clock-measurements.md), with [machine-readable model results](docs/clock-measurements.json) and [browser results](docs/browser-clock-measurements.json). Reproduce with `npm test` and `node scripts/clock-report.mjs`.

Each scenario runs 180 simulated seconds with independently staggered worker ticks, a real epoch-sized timestamp, and a fixed random seed. Tests cover 0/50/150/500 ms latency, jitter, 30% and 100% loss, isolation/reconnection, stale/reordered observations, pre-roll, UI alignment, stress switching, and five 64-beat wraparounds. The report gives maximum, mean and p95 disagreement in beats and milliseconds for every scenario and separates the actual clock model from UI estimation artifacts. These are simulation measurements, not measured speaker alignment.

There is no main-thread runtime conductor, but this single-computer demonstration **does depend on a shared physical monotonic reference and an agreed initial epoch**. Each worker independently reads that reference and owns its decisions. It is not proof of synchronization without any common timing infrastructure, nor an independent-device clock synchronization protocol. Unknown clock offsets and asymmetric network delays would require a separate distributed clock-estimation protocol for multiple machines. Browser suspension can still interrupt presentation/audio and timer delivery; stale UI samples are hidden rather than treated as real divergence.
