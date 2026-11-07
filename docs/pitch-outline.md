# PROJECT SYNC: three-minute pitch

## 0:00–0:25 · Slide 1 — “Three performers. No live conductor.”

Show the stage. “A virtual-idol concert is a group goal: stay in rhythm and make collective show choices. Each performer is a separate browser Worker with its own clock, section, dance, lights and musical commands. One browser is the output device, not the show conductor.” Point out the currently active synthetic/procedural or loaded-file labels. Do not call a generated oscillator track VOCALOID singing.

## 0:25–0:55 · Slide 2 — “Private clocks, peer-only timing”

Use a simple diagram: NOVA ↔ LUNA ↔ ECHO, plus NOVA ↔ ECHO; arrows to shared display/audio output, with no return timing arrow. “Each relative timer has a private seeded offset and default synthetic rate error. Four-timestamp ping/pong estimates relative offset/delay. Circular phase error changes speed within bounded limits, never jumps a performing clock backwards. No leader is elected.” Acknowledge the selected peer's one-time relative countdown as the explicit centralized start moment.

## 0:55–1:55 · Slide 3 — Live failure story (60 seconds)

Use **Demo script**, advance manually, and keep the graph visible. Exact click path:

1. Choose initiator, **Start Concert**. Wait ~3 seconds for the relative cue.
2. **LUNA → Isolate**. Wait 8–10 seconds: its beat/audio/dance continue while disagreement grows.
3. Scroll the right panel if needed: **loss 30%, latency 150 ms, jitter 60 ms**. Show receive/drop counters and RTT.
4. **NOVA → Kill**. Point out the other Workers still move and output sound. **NOVA → Rejoin**. No phase is passed from the main thread.
5. **Propose encore** with LUNA still isolated. Wait for canonical fallback after the local deadline.
6. **Restore communication**. No clock reset: watch the curve fall and a sustained recovery time appear.
7. **Propose encore** again. All three can approve the future gold-light variation. Show its locally decided state; do not claim atomic consensus.

If a result takes longer due to jitter, pause narration and point to the live estimates. Do not announce convergence before the display shows it. Rejoin acquisition and full-group reconnection are different measurements. The guided panel describes each action but does not auto-resync anything.

## 1:55–2:30 · Slide 4 — “Claims backed by evidence”

Open **Evidence**. Real: independent Worker state and artistic decisions, real asynchronous messages and counted drops, actual terminate/rejoin, peer coupling and approval protocol. Simulated: oscillator error and same-computer receiver faults. Not claimed: cross-machine networking, symmetric-path guarantees, partition-safe consensus, authentication, exact lyrical lip-sync or distributed-speaker sample alignment.

Use `docs/clock-measurements.md` for seeded model max/mean/p95. Model truth is known only by the test harness; browser observation tables include unmeasured queueing delay. Example measured case: 60-second isolation at demo drift reached about .76 beats and crossed below .08 beats ~3.39 seconds after reconnect in the checked seed. Read the regenerated table before presenting; use its numbers, not an assumed live result.

## 2:30–3:00 · Slide 5 — “Why we're excited / what's next”

“Distributed resilience becomes something you can see, hear and test. Our group continues through missing instructions, with explicit limits.” Map back to common goal/independent decisions/resilience. Next steps: genuine cross-machine transport, better rate/asymmetry estimation, membership/authentication, calibrated physical outputs, and licensed singer/model/motion assets. Invite a judge to kill any performer.

## Venue fallback plan

- **Before presenting:** `npm install`, `npm test`, regenerate reports, build and launch the production preview. Test on the actual Chrome/output device. Download all dependencies beforehand; no runtime CDN is needed. Prepare authorized files or the original synthetic stems generated from source. Keep a clean second tab as backup.
- **Audio blocked:** press Enable Audio from a click, check tab/OS mute and output device, raise master volume. If still unavailable, keep the visual/graph demonstration and explicitly say audio output is unavailable on this device. Do not claim to hear/verify sound that is absent.
- **WebGL fails:** controls and Workers still run. Use cards, phase graph and counters to show isolation/kill/rejoin. Explain that only the renderer is unavailable; skip claims about visible dance/lighting. A captured screenshot can illustrate the stage, clearly labelled as a prior capture rather than live evidence.
- **VRM/VRMA fails:** use the named procedural fallback shown by the loader report. Do not troubleshoot conversion on stage; show the guide's unverified conversion caveat.
- **Convergence slow:** restore communication, select the normal demo profile at 1× and wait. Restart only if deliberately starting a new experiment; label it as a reset/new cue, never as proof of reconnection recovery.
- **All Workers killed:** press Restart for a new session/cue. Empty peers cannot invent the elapsed state of an extinct show.
- **Internet unavailable:** run the already-built local bundle with installed dependencies. If setup was never installed, use a prepared machine; do not promise npm can install offline.
