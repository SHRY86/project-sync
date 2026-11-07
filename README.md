# PROJECT SYNC 2.0 — decentralised virtual concert

A hackathon-ready 3D performance with **three independent browser Web Workers**. Each chooses its own choreography, spotlight cues, vocal melody and show timing. Peer workers exchange beat estimates using `BroadcastChannel`. A central display renders their decisions but does not conduct the show.

## Quick start on macOS

1. Install [Visual Studio Code](https://code.visualstudio.com/) and open this entire folder with **File → Open Folder**.
2. Open **Terminal → New Terminal** in VS Code.
3. Run `python3 -m http.server 8765` (Python 3 must be installed; `python3 --version` checks). Alternatively, install the **Live Server** VS Code extension and click *Go Live*.
4. Visit **http://localhost:8765** (or the address shown by Live Server).
5. Press **Enable synthesized vocals** to allow browser audio. Click *Isolate LUNA*, then *Restore connections*.

You can also double-click `start.command` on macOS. If Gatekeeper blocks it, use the VS Code terminal instead. You **must** use a local server rather than opening `index.html` as a `file://` URL, because the project uses JavaScript module workers.

**Internet requirement:** Three.js is imported from jsDelivr CDN at runtime. All other logic and assets are local. Offline rendering needs a locally installed/vendored copy of Three.js.

## Source map

- `index.html` — accessible page structure
- `src/styles.css` — styling
- `src/main.js` — startup and rendering loop
- `src/score.js` — replicated choreography, note and lighting rules
- `src/agent.worker.js` — autonomous agents, clocks, P2P network, artistic decisions
- `src/agents.js` — starts agents and injects simulated communication failures
- `src/stage.js` — Three.js visualisation only; executes agent lighting/dance states
- `src/audio.js` — Web Audio vowel-tone synthesis; executes agents' voice states
- `src/ui.js` — buttons, metrics and network status

## Git setup (run inside the project folder)

```sh
git init
git branch -M main
git add .
git commit -m "Initial decentralized concert prototype"
```

To use a GitHub remote, create an **empty** repo in GitHub (do not add a README there) and then run:

```sh
git remote add origin https://github.com/YOUR-USERNAME/project-sync.git
git push -u origin main
```

You will need to authenticate with GitHub (browser / credential manager or SSH). The project does **not** come with a `.git` folder or an invented remote URL. For a team, one person creates the remote and pushes, and teammates use `git clone <repository-url>`.

## Behaviour and limitations (important for judging)

- **No live conductor:** After the one-time start cue, each worker calculates beats, voice notes, light effects and poses by itself.
- **Peer traffic:** Agents broadcast current beat and timestamps on the shared `BroadcastChannel` (same-origin, **same-device** simulation). They adjust their beat correction when messages arrive.
- **Resilience:** Isolation and packet-loss controls drop peer messages, but local show decisions continue using replicated score and clocks.
- **Stable holdover:** The agents share the same physical monotonic clock, with bounded synthetic offsets. Therefore drift doesn't increase forever. This **does not** prove indefinite synchronization across genuinely separate computers.
- **Music:** The demo generates simple **synthesized vowel-like singing tones**, not human-quality lyric singing or an actual Vocaloid voicebank. The **melody and vowel decisions are decentralised**, but all voices are mixed to the same physical audio device by the browser main thread.
- **Lighting:** Agent worker decides spotlight intensity, pan and section; renderer merely applies those values.
- **Fault controls:** The UI is deliberately a central fault injector and initial setup tool, not a live choreography controller.

## Where to extend next

- Add a real prerecorded vocal WAV, with **each agent independently deciding when/how its local stem plays**.
- Replace 3D procedural figures with licensed VRM models via `@pixiv/three-vrm`.
- Run agents on distinct browsers or machines with WebSocket/WebRTC signaling and proper clock synchronization. BroadcastChannel alone is not cross-device networking.
- Add tests asserting each worker continues outputting state after isolation, and measure recovery threshold and convergence.
