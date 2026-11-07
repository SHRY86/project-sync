# Private oscillator measurements

Reproduce: `node scripts/clock-report.mjs`. Seed 123456789; each case runs 180 simulated seconds. Each agent sees only its private, seeded ±350 ms offset oscillator, at −0.3%/+0.4%/−0.15% (realistic case −80/+95/−35 ppm). The test harness alone knows simulation time for measuring truth; it is never sent to peers. Worker ticks are staggered. Broadcasts every ~180 local ms.

Fixed-delay cases use equal latency on both paths. Jitter is uniform ±max(30,0.6×latency), clipped at zero, with 30% receiver loss. Isolation: the named performer from 30–90s (the legacy long-isolation and realistic cases use LUNA). Kill: named peer at 30s, fresh empty peer at 60s (countdown-death case kills the initiator at 1.5s). Blackout: 100% loss from 10s onward, after all start; the before-start blackout case honestly leaves two peers joining and phase disagreement unavailable. Lost cues: cue messages to followers are dropped; they join from running clock messages. Asymmetric case adds 100 ms in one direction. All runs pass five 64-beat loop boundaries. Recovery threshold is .08 beats; single-sample crossing, not a settling guarantee.

Entries are **max · mean · p95**, each **beats / milliseconds**. Truth compares currently running living agents at a common *test-harness* instant, not a shared runtime clock. The app headline excludes manually isolated agents; these tables intentionally include all performers for holdover comparison. The model delivers output states instantly to its observer, so receipt projection matches the piecewise-linear model exactly; its near-zero artifact is not evidence of zero browser queueing delay. Actual browser delivery delay is not measured. These are model measurements, not audio-output alignment.

| Scenario | Actual clock disagreement | All-performer observer | Max estimation artifact (ms) | Reconnect / rejoin (ms) |
|---|---|---|---:|---:|
| 0ms fixed | 0.0285 / 14.24 · 0.0265 / 13.26 · 0.0266 / 13.29 | 0.0285 / 14.24 · 0.0265 / 13.26 · 0.0266 / 13.29 | 0.00 | — |
| 0ms jitter / 30% loss | 0.0512 / 25.60 · 0.0373 / 18.64 · 0.0446 / 22.28 | 0.0512 / 25.60 · 0.0373 / 18.64 · 0.0446 / 22.28 | 0.00 | — |
| 50ms fixed | 0.0292 / 14.61 · 0.0273 / 13.65 · 0.0273 / 13.67 | 0.0292 / 14.61 · 0.0273 / 13.65 · 0.0273 / 13.67 | 0.00 | — |
| 50ms jitter / 30% loss | 0.0685 / 34.26 · 0.0425 / 21.27 · 0.0576 / 28.78 | 0.0685 / 34.26 · 0.0425 / 21.27 · 0.0576 / 28.78 | 0.00 | — |
| 150ms fixed | 0.0307 / 15.35 · 0.0287 / 14.34 · 0.0287 / 14.36 | 0.0307 / 15.35 · 0.0287 / 14.34 · 0.0287 / 14.36 | 0.00 | — |
| 150ms jitter / 30% loss | 0.1047 / 52.33 · 0.0483 / 24.14 · 0.0896 / 44.79 | 0.1047 / 52.33 · 0.0483 / 24.14 · 0.0896 / 44.79 | 0.00 | — |
| 500ms fixed | 0.0354 / 17.70 · 0.0332 / 16.58 · 0.0332 / 16.60 | 0.0354 / 17.70 · 0.0332 / 16.58 · 0.0332 / 16.60 | 0.00 | — |
| 500ms jitter / 30% loss | 0.2669 / 133.46 · 0.1068 / 53.41 · 0.2188 / 109.40 | 0.2669 / 133.46 · 0.1068 / 53.41 · 0.2188 / 109.40 | 0.00 | — |
| 100% loss after start | 2.3958 / 1197.88 · 1.1724 / 586.19 · 2.2733 / 1136.67 | 2.3958 / 1197.88 · 1.1724 / 586.19 · 2.2733 / 1136.67 | 0.00 | — |
| isolate NOVA / reconnect | 0.5434 / 271.68 · 0.1231 / 61.55 · 0.5049 / 252.47 | 0.5434 / 271.68 · 0.1231 / 61.55 · 0.5049 / 252.47 | 0.00 | 2928 |
| isolate ECHO / reconnect | 0.3100 / 154.99 · 0.0746 / 37.28 · 0.2701 / 135.04 | 0.3100 / 154.99 · 0.0746 / 37.28 · 0.2701 / 135.04 | 0.00 | 1740 |
| long isolation / reconnect | 0.7619 / 380.95 · 0.1790 / 89.51 · 0.6370 / 318.51 | 0.7619 / 380.95 · 0.1790 / 89.51 · 0.6370 / 318.51 | 0.00 | 3390 |
| kill / peer-only rejoin | 0.0860 / 43.01 · 0.0439 / 21.94 · 0.0693 / 34.66 | 0.0860 / 43.01 · 0.0439 / 21.94 · 0.0693 / 34.66 | 0.00 | 753 |
| kill LUNA / rejoin | 0.0910 / 45.48 · 0.0392 / 19.58 · 0.0696 / 34.80 | 0.0910 / 45.48 · 0.0392 / 19.58 · 0.0696 / 34.80 | 0.00 | 753 |
| kill ECHO / rejoin | 0.0882 / 44.08 · 0.0432 / 21.60 · 0.0716 / 35.79 | 0.0882 / 44.08 · 0.0432 / 21.60 · 0.0716 / 35.79 | 0.00 | 753 |
| initiator dies during countdown | 0.0287 / 14.36 · 0.0258 / 12.89 · 0.0287 / 14.36 | 0.0287 / 14.36 · 0.0258 / 12.89 · 0.0287 / 14.36 | 0.00 | 390 |
| 100% loss before start cue | unavailable | unavailable | unavailable | — |
| lost start cues / listening join | 0.0287 / 14.36 · 0.0286 / 14.32 · 0.0287 / 14.36 | 0.0287 / 14.36 · 0.0286 / 14.32 · 0.0287 / 14.36 | 0.00 | — |
| realistic ppm / isolation | 0.0316 / 15.80 · 0.0151 / 7.57 · 0.0286 / 14.30 | 0.0316 / 15.80 · 0.0151 / 7.57 · 0.0286 / 14.30 | 0.00 | 24 |
| asymmetric paths | 0.1297 / 64.83 · 0.1294 / 64.70 · 0.1297 / 64.83 | 0.1297 / 64.83 · 0.1294 / 64.70 · 0.1297 / 64.83 | 0.00 | — |

Pairwise timing uses four local ping/pong timestamps and minimum-RTT observations in a rolling 3-second window (newest within 5 ms of the minimum). Under symmetry, offset is estimated; unknown path asymmetry contributes half the forward/reverse delay difference, plus oscillator drift during estimator age. Reported RTT/2 is a conservative uncertainty indicator, not a statistical confidence interval. Jitter and asymmetric queues impose a real error floor. Long blackout produces real growing disagreement, not a bounded common-clock demonstration. No receiver uses the configured simulated latency as timing truth.
