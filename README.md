# PROJECT SYNC

**Three virtual idols keep a concert together through interrupted communication—without a live conductor.** Each Web Worker owns a private drifting oscillator, section, dance, lights and musical commands. Peers estimate each other's relative timing, exchange observations and couple their phases. Isolate a performer to see actual holdover drift; reconnect it to watch recovery. Kill NOVA: the other performers continue, and a fresh NOVA learns the show from peer messages.

This is a local-browser distributed-systems demonstration, not a finished singing product. Without your assets it shows procedural idols and **synthetic vowel tones, not VOCALOID singing**. Original instrumental demo WAVs can be generated from source.

## Why this fits the judging criteria

| Criterion | Demonstration |
|---|---|
| Common goal · 20% | Maintain one concert rhythm and cooperate on a future colour encore. |
| Independent decisions · 20% | Each separate Worker owns clock, score, choreography, zone lighting and musical part. |
| Resilience · 20% | Free-running holdover, loss/jitter/latency, actual worker termination and peer-only rejoin. |
| Excitement · 10% | Virtual-idol performance makes distributed coordination visible and audible. |
| Technical execution · 15% | Four-timestamp relative timing, bounded circular phase coupling, tested local asset loaders and deterministic animation sampling. |
| Design · 5% | First-run guide, named agent cards, live disagreement graph, keyboard controls and responsive layout. |
| Presentation · 10% | Guided click sequence, measured results and in-app Real / Simulated / Not claimed panel. |

## Quick start: macOS / VS Code

Use Node.js **22.12 or newer** and current Chrome. Open the repository folder in VS Code, then its integrated terminal:

```sh
npm install
npm run dev
```

Open the printed localhost URL. Press **Start Concert** to unlock browser audio and ask the selected peer to originate a one-time relative countdown. Nothing is uploaded. There is no backend, account or cloud dependency. The server serves static files/modules; peers communicate only over BroadcastChannel. `start.command` launches the same development server after installation.

```sh
npm test
node scripts/clock-report.mjs
npm run build
npm run preview
```

The production bundle includes local Three.js/VRM dependencies and works without a CDN after installation. Serve `dist/` over HTTP; do not open `index.html` directly. Empty asset manifests make fresh-clone fallback operation intentional, with no speculative missing-media requests.

## Architecture

| Module | Ownership |
|---|---|
| `clock.js` | Private seeded oscillator from relative timer deltas; pure circular mean/median; monotonic proportional phase coupling. |
| `peer-time.js` | Four local ping/pong timestamps estimate relative offset/RTT; 3-second minimum-RTT window. No absolute epoch is compared. |
| `peer-agent.js` | Autonomous agent core: peer caches, local countdown, late join, own score decisions and peer proposals. Shared by Workers and deterministic tests. |
| `agent.worker.js` | One private oscillator/core per Worker; BroadcastChannel and receiver fault injection. |
| `coordination.js` | Unanimous local proposal/ack gate, approval deadline and canonical fallback. |
| `score.js` | Replicated immutable 120 BPM, 4/4, 64-beat score; pure beat-addressable section, pose, lights and music commands. |
| `agents.js` | Spectator lifecycle/configuration. Kill terminates one Worker; rejoin sends ID/session/seed/configuration only, never phase or section. |
| `audio-selection.js`, `audio.js` | Output-only stem commands or living-agent median mix, one reusable AudioContext, bounded rate recovery/fades. Nothing is fed back as a clock authority. |
| `stage.js`, `animation.js` | Apply agent poses/lights; optional VRM; sample VRMA from that agent's beat, not renderer time. |
| `ui.js`, `metrics.js`, `phase-graph.js` | Spectator controls, real counters, receipt-aligned estimates and read-only history. |
| `assets.js`, `asset-ui.js` | Local WAV validation and object-URL imports, optional VRM/VRMA assignment. |

Each oscillator starts with a seeded offset up to ±350 ms. Default **demo** rate errors are −0.3%/+0.4%/−0.15%, scaled independently by the common experiment setting; **realistic** mode uses −80/+95/−35 ppm. Switching profile preserves oscillator continuity. An ideal-rate option retains private offsets but disables synthetic frequency error.

The selected peer's relative 3000 ms countdown is the **one explicit centralized timing moment**. Peers convert transit age using pairwise estimates and re-gossip their own remaining countdown. A peer that misses the cue waits for a running peer and measured link, then initializes its own phase. Running peers never reset phase on reconnect. No agent is elected as the ongoing clock authority.

## Timing assumptions and honest limits

- **No shared epoch in the algorithm.** Each Worker sees only relative changes in its own timer. Underlying hardware is still one machine; clock offsets/rate errors are synthetic. This is algorithmic independence, not three independently measured physical oscillators.
- **Estimator uncertainty:** ping/pong estimates clock offset assuming roughly symmetric paths. Half the directional delay difference and drift since the estimate contribute error. RTT/2 is an uncertainty indicator, not a guarantee. Jitter/asymmetry impose a real phase-error floor. The delay slider is never used as estimator truth.
- **Bounded coupling:** circular phase error maps directly to temporary speed, with .01-beat deadband, .8/s gain, ±.35 beats/s limit and .7 beats/s² slew. There is no integral residual and no backwards show-time movement. Isolation genuinely free-runs; sufficiently long partitions can lose absolute loop/bar identity.
- **Peer scope:** BroadcastChannel is same-origin/same-computer, not cross-machine networking. A multi-machine version needs a transport, clock-rate estimation, membership/security and calibrated output-device scheduling. This implementation does not prove Internet convergence.
- **Kill/rejoin:** any single death leaves the others running. A fresh peer acquires initial phase before performing; it does not jump a running clock. If every performer dies, empty peers have no show to learn: use Restart for a new cue/session.
- **Encore is not consensus:** all three approvals must be locally present before target−1 beat. A missing/killed peer yields canonical fallback for a new proposal. Existing approvals cannot establish everyone else's knowledge; asymmetric partitions can produce different decisions. No authentication or Byzantine tolerance is implemented.
- **Presentation:** rendering and sound output share a main thread and one physical speaker device. Browser suspension/queueing and hardware audio latency are not eliminated. UI disagreement aligns observations by receipt age, not unknowable Worker-to-main delay; it is an estimate. Counters count received packets and actual injected/rejected events, including transport control packets. Counters belong to each worker incarnation and restart on rejoin.
- **Models/music:** waveform duration is validated, not tempo, rights, lyrical accuracy or mix quality. Real model retargeting and auditory quality require manual checks with your actual assets.

## Assets: optional, local and explicit

Start with [the beginner asset guide](docs/making-assets.md). It covers GarageBand/BandLab, authorized voice synthesis, VRoid, VRMA conversion caveats, licences and troubleshooting.

For an original **instrumental synthetic demo**, run:

```sh
node scripts/make-demo-audio.mjs
```

Open **Load local assets**, and select `.demo-audio/nova.wav`, `luna.wav` and `echo.wav` together. They are oscillators composed by this script, not singing or licensed samples. Generated media is ignored by Git. Temporary object URLs are revoked after decoding; reloading forgets runtime imports.

WAV selection is exclusive:

1. All three aligned agent stems (`nova.wav`, `luna.wav`, `echo.wav`): each follows its own living agent. A dead agent's part fades out; others continue.
2. Both `concert-instrumental.wav` and `concert-vocals.wav`: both follow the circular median of fresh living-agent commands.
3. `concert-full.wav`: same median output policy, including when NOVA dies. One remaining agent follows itself.
4. Otherwise: explicit synthetic-vowel fallback, **not VOCALOID singing**. Partial sets are not silently presented as complete stems.

All WAVs must be 32 s ±60 ms, 120 BPM, 4/4, 64 beats, offset zero. Playback recovery is capped at ±2.5%; errors ≥180 ms crossfade/reseek. Buffers receive 4 ms loop-edge fades. Mute/master volume and all-dead/paused silence are supported. Real output was exercised headlessly but has not been listened to in this environment.

Static setup: place WAVs in `public/audio/` and declare existing filenames in `public/audio/manifest.json` → `availableFiles`. For models/animations, place `.vrm`/`.vrma` in `public/models/` and declare filenames in its manifest, or assign them at runtime. No actual avatar or dance file is bundled or fabricated. Models must have embedded resources; remote textures/buffers are blocked. Procedural characters/dance remain on load errors.

VRMA time is `(agent beat modulo 64) × .5 seconds`, then wraps at clip duration. Retiming/retargeting is an authoring task. VRMA parsing integration and mixer sampling are implemented; successful visual QA with a real exported VRM/VRMA pair and the Blender/Mixamo/MMD conversion path remain **unverified**. Coarse vowel mouth cues are not lyrical lip-sync. Animation facial tracks take precedence over procedural expressions.

## 60-second judges' demo

Use **Demo script** (D) for captions and manual Next buttons. No automated hidden clock commands are involved.

| Time | Exact action | What to say/show |
|---|---|---|
| 0–8s | Choose initiator → Start Concert | “One relative countdown, then three private clocks. These are labelled procedural/synthetic fallbacks unless we load files.” |
| 8–18s | LUNA → Isolate | “It keeps performing on its own drifting oscillator. Watch the graph grow.” |
| 18–24s | Loss 30%, latency 150 ms, jitter 60 ms | “The estimator measures exchanges; it does not know these slider values. Drops are counted.” |
| 24–31s | NOVA → Kill, wait, then Rejoin | “A real Worker died. A fresh one gets no phase from the main thread; ECHO is still running.” |
| 31–40s | Propose encore while LUNA is isolated | “No third approval: canonical fallback, not claimed consensus.” |
| 40–50s | Restore communication | “No reset message. Peer-only coupling reconverges; the graph and sustained recovery timer show it.” |
| 50–60s | Propose encore again → Evidence | “Together they can approve a future gold variation. Real algorithms; simulated oscillators/network; no cross-machine or consensus claim.” |

Recovery depends on delay, loss, drift scale and estimator error, so wait for visible results rather than rushing a caption. The UI's recovery criterion is <.08 beats for one second. Deterministic report recovery is the first <.08-beat crossing, explicitly labelled; these numbers should not be conflated.

Keyboard: **Space** start/pause · **M** enable/mute · **R** restart · **I** isolate/reconnect LUNA · **K** kill/rejoin NOVA · **E** encore · **C** camera · **D** guide · **Esc** close guide. Shortcuts are ignored while editing fields.

## Tests and measurements

```sh
npm test
node scripts/clock-report.mjs
npm run build
npx playwright install chromium
npm run dev
# Other terminal; substitute the actual port printed by Vite:
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-clock-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-assets-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-design-check.mjs
```

[Clock diagnosis](docs/clock-diagnosis.md) · [deterministic max/mean/p95 table](docs/clock-measurements.md) · [model JSON](docs/clock-measurements.json) · [actual Worker observer table](docs/browser-clock-measurements.md) · [browser JSON](docs/browser-clock-measurements.json).

Each seeded model run spans 180 seconds and more than five loops. Cases include 0/50/150/500 ms latency, jitter, 30% loss, 100% loss after start, long isolation/reconnect, NOVA kill/rejoin, lost start cues and asymmetric paths. Only the test harness knows common simulated time, used for measuring model truth. Browser results are receipt-aligned estimates, not simultaneous truth or physical speaker latency.

Browser tests cover real Worker termination/rejoin, fallback vs approved encore, one AudioContext, runtime original WAV playback, exclusive source counts, invalid media fallbacks, keyboard controls and desktop/mobile layout. Valid third-party model/animation files are not available for visual QA. See [presentation outline and fallback plan](docs/pitch-outline.md).

## Judges' Q&A

**“Isn't this still a shared clock?”** The hardware timer is on one machine, but its origins are not compared or shared. Each worker constructs a private offset/rate oscillator, and peer timing relies on measured exchanges. Synthetic independence is explicit; separate physical computers are not implemented.

**“What if NOVA dies?”** The other two clocks/performers continue. In stems, NOVA's part fades out. Mix fallback follows the living-agent median. An empty rejoined NOVA acquires phase from peers. There is no ongoing NOVA authority.

**“Is this real distributed networking?”** Separate Workers and real asynchronous BroadcastChannel messages are real. The network is same-computer; loss/latency/jitter are controlled simulation, with actual dropped/delivered counts. There is no cross-machine transport.

**“Is consensus guaranteed?”** No. Encore is a unanimous local approval gate with a deadline and fallback. Partitioned agents may have different knowledge. We do not solve atomic commitment or Byzantine agreement.

**“Can this actually sing?”** It can output user-supplied sung WAVs with autonomous playback positions. Without them it produces labelled synthetic vowels, or original generated instrumental demo stems. It is not a VOCALOID voicebank or lyric synthesizer.

## Submission hygiene

Git history is preserved. Each numbered implementation section is committed separately. Dependencies, `dist/`, browser captures and bulky media are ignored. Do not force-add copyrighted media. Retain source/manifest/credits and separately supply only authorized assets. Pixel ratio stays capped at 2 with simple geometry and no expensive postprocessing, targeting Apple Silicon Chrome.
