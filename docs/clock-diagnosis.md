# Clock diagnosis

The inspected implementation, rather than the previous README, is the basis for this diagnosis. The pre-fix algorithm is retained in `tests/helpers/legacy-clock.js` solely as a reproducible test fixture.

## What was wrong

`ShowClock.tick` previously set `target = correction + meanPeerError * .15` every ~33 ms. It repeatedly integrated the same cached observation until another broadcast arrived (~198 ms). Those observations already included other agents' corrections. Latency therefore inserted lag into a coupled integral feedback loop with no absolute anchor or deadband. A consistent timestamp bias could move every agent's correction away from the physical reference, even when their pairwise phase agreement looked good. The ±.35-beat clamp bounded the damage; it did not make that correction justified.

`agent.worker.js` sampled a beat at the beginning of a tick but `send()` assigned a new `sentAt` after the calculation. Beat and timestamp did not describe exactly the same instant. This small handler-time bias could repeatedly enter that integrator. Startup was worse: pre-roll beat zero was broadcast without a playing flag, then extrapolated as though the show had been running during delivery. Delayed pre-start samples could push the feedback loop before playback began.

Out-of-order clocks were ignored only while a newer observation remained in the peer cache, and were counted as received. Expiry or isolation cleared that ordering history. There is now a separate per-peer sample watermark which survives cache eviction, and rejected samples increment dropped rather than received.

The original UI already extrapolated state samples to the latest state timestamp, so it would be incorrect to blame it for simply displaying unaligned raw beats. However, it had no stale-state or mixed pause/run guard, used a hard-coded nominal tempo even in stress mode, and could keep extrapolating a stopped worker. The new measurement function explicitly projects all observations to one current epoch timestamp, uses advertised rates, and returns unavailable for stale, future or mixed running/paused samples. Linear extrapolation remains an estimate because small correction/calibration changes between updates are not transmitted as a full curve.

## What was actually reproduced

A deterministic 180-second baseline run with fixed latency and the pre-fix clock reproduced a latency-sensitive startup transient (0.062189 beats / 31.094 ms maximum at 500 ms versus 0.002444 beats / 1.222 ms at zero latency). It also produced corrections up to ~0.10 beats in otherwise healthy fixed-latency runs, well above the tiny common-clock imperfections they were supposed to mitigate. It did **not** reproduce indefinite continuously increasing pairwise disagreement: the existing correction clamp prevents unbounded growth. No claim is made that latency alone explains an indefinite increase observed in another runtime; stale display samples, stress-mode history, transport pauses or another code version must be distinguished using captured timestamps.

The fixed shared-clock policy deliberately prioritizes the physical reference over pursuing zero pairwise disagreement through peer integration. Its retained artificial calibration offsets therefore leave roughly 20–30 ms disagreement, rather than hiding those offsets with large learned corrections. The result is a stable, small absolute correction budget instead of a claim of sample-perfect audio synchronization.

## Fix

- Each clock packet contains its exact `sampleAt`, unchanged in transit; `sentAt` is transport metadata. The optional fields extend the existing clock packet and leave proposal/ack messages and session channels intact.
- All clocks and state observations use `performance.timeOrigin + performance.now()`; realm-relative `performance.now()` is never compared between workers.
- Compare projected peer beats and the local estimate at the exact same `now`, with circular 64-beat phase differences.
- Reject invalid/future epochs, observations ≥1200 ms old, and duplicate/out-of-order samples; retain ordering watermarks independently of cache lifetime.
- Exclude pre-start observations. Workers still progress independently during isolation, and reconnection does not reset any clock.
- Shared mode: proportional target `0.2 × deadband(peer error)` anchored to the local physical-clock estimate, capped at ±.01 beats (5 ms). Deadband .01 beats; slew ≤.002 beats/sec. Cached samples cannot accumulate an integral correction. Missing peers smoothly return the correction toward zero.
- Stress mode: realistic synthetic −80/+95/−35 ppm rates and a separate bounded integrator, applied only for a new peer sample. Real elapsed time, not a capped tick duration, accumulates oscillator drift. Corrections remain bounded; correction steps after suspension are slew-limited. Turning stress off slews existing corrections back rather than jumping phase.
- Monotonic beat output is retained. UI measurement is read-only and cannot control workers.

## Evidence and limits

`npm test` covers delayed-sample replay, serialization/sample-time mismatch, cache ordering/expiry, pre-roll, loss/isolation, monotonic progression, suspension, stress switching and wraparound. `node scripts/clock-report.mjs` writes all max/mean/p95 results and separately records raw asynchronous samples, aligned UI estimates and actual common-timestamp clock-model disagreement. Network scenarios are seeded simulations, not real multiple-machine measurements.

BroadcastChannel is same-origin/same-computer. The physical reference is shared infrastructure, although each worker evaluates its own clock and performance without a live central conductor. This design cannot estimate an unknown remote epoch or prove synchronization over asymmetric inter-machine links. It also does not provide partition-safe event consensus or sample-accurate speaker synchronization. Existing peer approval/fallback behavior remains unchanged.
