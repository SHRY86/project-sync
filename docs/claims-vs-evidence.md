# PROJECT SYNC — claims versus evidence

This technical note lives outside the concert interface so the performance remains the focus.

| Real in this implementation | Evidence |
|---|---|
| Three independent module Web Workers | `src/agents.js` creates actual Workers; lifecycle browser tests count creation/termination. |
| Private oscillator state and peer-only phase coupling | Each `PeerAgent` owns a `ShowClock`; `peer-time.js` estimates relative offset/delay through ping/pong. No shared epoch or ongoing reference peer is passed in. |
| Agent-owned music, dance, section and lighting cues | `score.js` and `lighting.js` execute inside each Worker using that agent's beat. The stage applies emitted poses, spotlight targets, beam opacity, floor rings and bar levels. |
| Energy and light controls are replicated configuration | The UI sends settings, not frames or beats. Workers independently recompute their own bounded poses/cues; late/rejoined workers receive current settings. |
| Actual asynchronous messages and observed counters | BroadcastChannel callbacks and blocked/discarded messages increment counters. Blocked broadcasts count once; receiver discards count per received packet. |
| Real kill/rejoin and peer-only initial acquisition | Kill calls `Worker.terminate()`. A fresh peer receives configuration, not elapsed phase, and learns from live peers. |
| One-shot local audio assets | Supplied/fixture WAV browser tests inspect real BufferSources, disabled looping and no restart after completion. Stems follow their own agents; shared mix follows living-agent median commands. |
| Future peer cooperation with a deadline | `coordination.js` requires all three locally known approvals; missing approval uses canonical fallback. |

## Simulated

- Oscillator offsets and frequency errors are synthesized from private relative timer deltas. The underlying physical machine is shared.
- Latency, jitter, loss and isolation are injected on browser message delivery. The counters measure actual injected/rejected events, not Internet conditions.
- BroadcastChannel stands in for a network. It is same-origin and same-computer.
- The default characters are procedural; the fallback guide is synthetic vowel sound, not a VOCALOID voicebank. User-supplied WAV content is not automatically verified as singing.
- Visible light beams are inexpensive transparent geometry accompanying actual Three.js lights, not volumetric light scattering or physical stage hardware.

## Not claimed

Cross-machine networking/synchronization, arbitrary-delay convergence, partition-safe consensus, authentication, Byzantine tolerance, sample-accurate distributed speakers, exact lyrical lip-sync, real VOCALOID synthesis, or production venue readiness.

A selected peer originates one explicit relative countdown. That is the centralized start moment; it is not an ongoing clock authority. Under asymmetric partitions, unanimous local approval knowledge may differ. We do not claim to have solved atomic commitment.

## How to check

```sh
npm run quality
npm run report:clock
# With the production preview or dev server running:
SYNC_TEST_URL=http://127.0.0.1:4182 npm run test:browser
```

See [clock diagnosis](clock-diagnosis.md), [model measurements](clock-measurements.md), [browser observations](browser-clock-measurements.md), and [submission QA](submission-qa.md). The model's truth is known only to its test harness. UI/browser measurements use receipt-aligned estimates, with unmeasured Worker-to-main queueing delay. The main graph excludes manually isolated agents; the all-performer number retains their holdover drift.

The 2026 Vancouver anecdote and its sourcing limits are documented in [the project story](submission-story.md); it is motivation, not evidence that this prototype fixes a particular real venue failure.
