# PROJECT SYNC

**Three virtual idols keep a concert together through interrupted communication—without a live conductor.** Each Web Worker owns a private drifting oscillator, section, dance, lights and musical commands. Peers estimate each other's relative timing, exchange observations and couple their phases. The main demo stresses the entire network with latency, jitter and loss, then measures peer-only recovery. Isolation and kill/rejoin remain optional resilience tests. No dancer is an ongoing timing authority.

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
| Presentation · 10% | Guided click sequence, measured results and separate Real / Simulated / Not claimed technical note. |

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
| `lighting.js`, `stage-lighting.js` | Worker-owned beat pulses, character-following spotlight targets, visible beam geometry, floor rings and per-zone bars; renderer applies cue values only. |
| `performance-settings.js` | Replicated dance-energy and lighting settings, retained across restart/rejoin without changing phase. |
| `score.js` | Replicated immutable 120 BPM, 4/4 song configuration with arbitrary finite duration; pure beat-addressable section, pose, lights and music commands. |
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
- **Presentation:** rendering and sound output share a main thread and one physical speaker device. Browser suspension/queueing and hardware audio latency are not eliminated. UI disagreement aligns observations by receipt age, not unknowable Worker-to-main delay; it is an estimate. Counters count received packets and actual injected/rejected events, including transport control packets. A blocked outbound broadcast counts once, not a guessed two-recipient fanout; inbound discards count per delivered packet. Per-agent counters restart on rejoin; aggregate observed counters preserve previous incarnations until show Restart.
- **Models/music:** waveform duration is validated, not tempo, rights, lyrical accuracy or mix quality. Real model retargeting and auditory quality require manual checks with your actual assets.

## Assets: optional, local and explicit

Start with [the beginner asset guide](docs/making-assets.md). It covers GarageBand/BandLab, authorized voice synthesis, VRoid, VRMA conversion caveats, licences and troubleshooting.

For an original **instrumental synthetic demo**, run:

```sh
node scripts/make-demo-audio.mjs
```

Open **Load local assets**, and select `.demo-audio/nova.wav`, `luna.wav` and `echo.wav` together. They are oscillators composed by this script, not singing or licensed samples. Generated media is ignored by Git. Temporary object URLs are revoked after decoding; reloading forgets runtime imports.

WAV selection is exclusive (all sources play once):

1. All three aligned agent stems (`nova.wav`, `luna.wav`, `echo.wav`): each follows its own living agent. A dead agent's part fades out; others continue.
2. Both `concert-instrumental.wav` and `concert-vocals.wav`: both follow the median of fresh living-agent song positions.
3. `concert-full.wav` or any other WAV filename (for example `brother_john.wav`): same linear-median output policy, including when NOVA dies. One remaining agent follows itself.
4. Otherwise: explicit synthetic-vowel fallback, **not VOCALOID singing**. Partial sets are not silently presented as complete stems.

Any decodable WAV with a positive finite duration is accepted; there is no fixed 16/32-second restriction. The supplied `brother_john.wav` is exactly 16 seconds and loads directly without renaming. Files are decoded in memory, so practical size limits depend on the browser/device. Keep aligned stems or instrumental/vocal pairs within 60 ms of one another; mismatched sets fall back explicitly. Dance timing currently assumes 120 BPM / 4/4 and the decoded song duration. All files start at offset zero and play once, with no looping. Playback recovery is capped at ±2.5%; errors ≥180 ms crossfade/reseek. Buffers receive 4 ms edge fades. Mute/master volume and all-dead/paused silence are supported. Real output was exercised headlessly but has not been listened to in this environment.

Static setup: place WAVs in `public/audio/` and declare existing filenames in `public/audio/manifest.json` → `availableFiles`. For models/animations, place `.vrm`/`.vrma` in `public/models/` and declare filenames in its manifest, or assign them at runtime. No actual avatar or dance file is bundled or fabricated. Models must have embedded resources; remote textures/buffers are blocked. Procedural characters/dance remain on load errors.

VRMA time is `agent beat × .5 seconds`, clamped at clip duration; it holds the final pose without looping. The 64-beat wrap is only a clock-protocol phase comparison, never a playback seek. Retiming/retargeting is an authoring task. VRMA parsing integration and mixer sampling are implemented; successful visual QA with a real exported VRM/VRMA pair and the Blender/Mixamo/MMD conversion path remain **unverified**. Coarse vowel mouth cues are not lyrical lip-sync. Animation facial tracks take precedence over procedural expressions.

## Main demo: synchronisation under whole-network stress

Open **Load local assets** and choose `brother_john.wav` before starting. It plays once for 16 seconds. Restart is an explicit new concert/cue; loading another file during a running concert does not secretly reset peer clocks. Use Restart to hear the new file from its beginning.

Use **Demo script** (D) to advance these actions manually:

1. Start Concert and watch all three private clocks acquire the same musical phase. The selected peer only originates the initial relative countdown.
2. Add 150 ms latency, ±60 ms jitter and 30% loss across the whole network. Read each pair's disagreement and the active-group graph.
3. Increase to 500 ms latency, ±200 ms jitter and 50% loss to show estimator uncertainty and visible group stress.
4. Restore communication. No beat reset is sent; peer coupling reconverges. The sustained recovery timer requires <.08 beats for one second.
5. Optionally propose a peer-approved colour variation. Individual isolation and kill/rejoin are secondary card controls.

For the 16-second performance, apply moderate stress early and restore before the ending. The dancers use small rocking steps and bell-like gestures, then bow and stop. The music never loops. P2P clocks continue exchanging afterward so a longer network experiment remains measurable without replaying the song.

### Why isolation looked different for LUNA

The configured synthetic rates differ: NOVA −0.3%, LUNA +0.4%, ECHO −0.15%. LUNA is the fastest outlier; ECHO is much closer to the other pair's average, so short isolation produces less obvious drift. This is not evidence of a LUNA master clock. Tests now exercise isolation of every ID rather than only LUNA.

The headline graph now measures **active non-isolated peers**. A separate all-performer number and all three pair readings retain the deliberately isolated dancer's holdover error. We do not hide that error or change it to make all isolation curves look equal. With 100% network loss but no manual isolation, all peers remain in the headline cohort and disagreement can genuinely grow.

The deterministic report compares all running performers (including isolated ones), at a common test-harness instant. Its recovery is the first .08-beat crossing, not the UI's one-second stability criterion. Browser/UI receipt estimates also include unmeasured delivery queueing.

Keyboard: **Space** start/pause · **M** enable/mute · **R** restart · **I** isolate/reconnect LUNA · **K** kill/rejoin NOVA · **E** encore · **C** camera · **D** guide · **Esc** close guide. Shortcuts are ignored while editing fields.

## Tests and measurements

```sh
npm run quality
npm run report:clock
npx playwright install chromium
npm run dev
# Other terminal; substitute the actual port printed by Vite:
# Run all checks: SYNC_TEST_URL=http://127.0.0.1:5173 npm run test:browser
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-clock-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-assets-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-design-check.mjs
SYNC_TEST_URL=http://127.0.0.1:5173 node scripts/browser-isolation-check.mjs
# Test an actual user-supplied 16-second recording (not committed):
SYNC_TEST_URL=http://127.0.0.1:5173 SYNC_SONG_FILE=/path/to/brother_john.wav node scripts/browser-song-check.mjs
```

[Clock diagnosis](docs/clock-diagnosis.md) · [deterministic max/mean/p95 table](docs/clock-measurements.md) · [model JSON](docs/clock-measurements.json) · [actual Worker observer table](docs/browser-clock-measurements.md) · [browser JSON](docs/browser-clock-measurements.json).

Each seeded model run spans 180 seconds and more than five loops. Cases include 0/50/150/500 ms latency, jitter, 30% loss, 100% loss after start, isolation/reconnect of each performer, NOVA kill/rejoin, lost start cues and asymmetric paths. Only the test harness knows common simulated time, used for measuring model truth. Browser results are receipt-aligned estimates, not simultaneous truth or physical speaker latency.

Browser tests cover real Worker termination/rejoin, fallback vs approved encore, one AudioContext, runtime original WAV playback, exclusive source counts, invalid media fallbacks, keyboard controls and desktop/mobile layout. Valid third-party model/animation files are not available for visual QA. See [presentation outline and fallback plan](docs/pitch-outline.md).

## Judges' Q&A

**“Isn't this still a shared clock?”** The hardware timer is on one machine, but its origins are not compared or shared. Each worker constructs a private offset/rate oscillator, and peer timing relies on measured exchanges. Synthetic independence is explicit; separate physical computers are not implemented.

**“What if NOVA dies?”** The other two clocks/performers continue. In stems, NOVA's part fades out. Mix fallback follows the living-agent median of linear playback positions. An empty rejoined NOVA acquires phase from peers. There is no ongoing NOVA authority.

**“Is this real distributed networking?”** Separate Workers and real asynchronous BroadcastChannel messages are real. The network is same-computer; loss/latency/jitter are controlled simulation, with actual dropped/delivered counts. There is no cross-machine transport.

**“Is consensus guaranteed?”** No. Encore is a unanimous local approval gate with a deadline and fallback. Partitioned agents may have different knowledge. We do not solve atomic commitment or Byzantine agreement.

**“Can this actually sing?”** It can output user-supplied sung WAVs with autonomous playback positions. Without them it produces labelled synthetic vowels, or original generated instrumental demo stems. It is not a VOCALOID voicebank or lyric synthesizer.

## Submission hygiene

Git history is preserved. Each numbered implementation section is committed separately. Dependencies, `dist/`, browser captures and bulky media are ignored. Do not force-add copyrighted media. Retain source/manifest/credits and separately supply only authorized assets. Pixel ratio stays capped at 2 with simple geometry and no expensive postprocessing, targeting Apple Silicon Chrome.

## Submission copy and final presentation

[Project overview (under 200 characters)](docs/project-overview.md) · [Fan motivation, Vancouver context and project justifications](docs/submission-story.md) · [Claims versus evidence](docs/claims-vs-evidence.md).

The UI uses an original poster-inspired magenta/violet/cyan palette, oversized typography and angular labels, inspired by the supplied visual reference; it does not bundle its illustration or copy a Miku logo. Claims/evidence have been removed from the performance page and moved to Markdown.

Use **Dance energy** (0–3×, default 1.8×) to make movement more visible. Each Worker applies bounded amplitudes to its own beat-addressed pose. **Character-synced lighting** and **Light brightness** control replicated settings; every performer still owns its own spotlight, visible beam, floor ring and light-bar cues. Targets follow that character's emitted position. The effect has no strobe mode. Pausing holds cues; the ending settles to curtain lighting, and a killed agent's zone switches off. House/fill lights remain so models stay visible when show lighting is disabled.

Vancouver attendee reports support a delay account, but the detailed Wi-Fi/projection/master-clock cause has not been independently confirmed. The story labels that distinction rather than claiming this prototype would have prevented a real venue incident.
