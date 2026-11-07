# PROJECT SYNC

**Three virtual idols keep a concert together through interrupted communication—without a live conductor.** Each Web Worker owns a private drifting oscillator, section, dance, lights and musical commands. Peers estimate each other's relative timing, exchange observations and couple their phases. The main demo stresses the entire network with latency, jitter and loss, then measures peer-only recovery. Isolation and kill/rejoin remain optional resilience tests. No dancer is an ongoing timing authority.

This is a local-browser distributed-systems demonstration, not a finished singing product. Without your assets it shows procedural idols and **synthetic vowel tones, not VOCALOID singing**. Original instrumental demo WAVs can be generated from source.


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
