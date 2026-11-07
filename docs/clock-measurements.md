# Deterministic clock measurements

Reproduce: `node scripts/clock-report.mjs`. Seed 123456789, 180 seconds per case, epoch 1700000000000, 600 ms pre-roll, 33 ms worker ticks staggered by 0/11/23 ms, clock broadcasts every 198 ms. All scenarios cross five 64-beat loop boundaries. Jitter is seeded uniform ±120 ms (0/50/150 ms cases), ±400 ms (500 ms case); stress case uses ±200 ms. Fault combination: 30% independent receiver loss; LUNA isolated from 30–90 seconds, then reconnects without a reset. Recovery is first sample below .08 beats with all peer caches populated; this differs from the UI's stricter .05-beat threshold.

Each metric is **max · mean · p95**, each entry **beats / milliseconds** at 120 BPM. Worker truth evaluates all three local clock functions at exactly the same epoch timestamp, holding each correction between ticks. UI estimates extrapolate asynchronous state samples to that timestamp at advertised rate. Artifact is the absolute difference between the two disagreement measurements. These are deterministic model measurements, not physical audio-output latency or cross-machine measurements.

| Scenario | Actual worker disagreement | Aligned UI estimate | Max UI artifact (ms) | Recovery (ms) |
|---|---|---|---:|---:|
| 0ms fixed | 0.053252 / 26.626 · 0.045287 / 22.643 · 0.049006 / 24.503 | 0.053209 / 26.605 · 0.045283 / 22.641 · 0.049040 / 24.520 | 0.035 | — |
| 0ms + jitter | 0.053418 / 26.709 · 0.045289 / 22.644 · 0.049010 / 24.505 | 0.053375 / 26.688 · 0.045284 / 22.642 · 0.049043 / 24.522 | 0.035 | — |
| 0ms + jitter/loss/isolation | 0.059111 / 29.555 · 0.048399 / 24.199 · 0.058606 / 29.303 | 0.059134 / 29.567 · 0.048394 / 24.197 · 0.058626 / 29.313 | 0.035 | 552 |
| 50ms fixed | 0.053418 / 26.709 · 0.045290 / 22.645 · 0.049007 / 24.504 | 0.053375 / 26.688 · 0.045285 / 22.643 · 0.049039 / 24.520 | 0.035 | — |
| 50ms + jitter | 0.053550 / 26.775 · 0.045290 / 22.645 · 0.049010 / 24.505 | 0.053507 / 26.754 · 0.045286 / 22.643 · 0.049046 / 24.523 | 0.035 | — |
| 50ms + jitter/loss/isolation | 0.059113 / 29.557 · 0.048398 / 24.199 · 0.058606 / 29.303 | 0.059138 / 29.569 · 0.048394 / 24.197 · 0.058630 / 29.315 | 0.035 | 618 |
| 150ms fixed | 0.053814 / 26.907 · 0.045295 / 22.648 · 0.049009 / 24.505 | 0.053771 / 26.886 · 0.045291 / 22.645 · 0.049042 / 24.521 | 0.035 | — |
| 150ms + jitter | 0.053946 / 26.973 · 0.045296 / 22.648 · 0.049013 / 24.507 | 0.053903 / 26.952 · 0.045292 / 22.646 · 0.049045 / 24.523 | 0.035 | — |
| 150ms + jitter/loss/isolation | 0.059148 / 29.574 · 0.048404 / 24.202 · 0.058592 / 29.296 | 0.059160 / 29.580 · 0.048400 / 24.200 · 0.058622 / 29.311 | 0.035 | 717 |
| 500ms fixed | 0.055099 / 27.550 · 0.045319 / 22.660 · 0.049027 / 24.514 | 0.055058 / 27.529 · 0.045315 / 22.657 · 0.049058 / 24.529 | 0.035 | — |
| 500ms + jitter | 0.054832 / 27.416 · 0.045313 / 22.657 · 0.049027 / 24.514 | 0.054793 / 27.396 · 0.045309 / 22.654 · 0.049061 / 24.531 | 0.035 | — |
| 500ms + jitter/loss/isolation | 0.059725 / 29.862 · 0.048419 / 24.209 · 0.058561 / 29.281 | 0.059753 / 29.876 · 0.048414 / 24.207 · 0.058588 / 29.294 | 0.035 | 618 |
| 100% packet loss | 0.059753 / 29.877 · 0.054800 / 27.400 · 0.059683 / 29.841 | 0.059786 / 29.893 · 0.054796 / 27.398 · 0.059715 / 29.858 | 0.035 | — |
| drift stress + faults | 0.036244 / 18.122 · 0.015052 / 7.526 · 0.028178 / 14.089 | 0.036201 / 18.101 · 0.015046 / 7.523 · 0.028213 / 14.107 | 0.035 | 717 |

Raw, unaligned UI samples are also retained in the JSON for comparison. Rejected stale and out-of-order observations are counted as drops. Watermarks remain independent of cache expiry. With 100% loss, agents still advance from their own clocks; no network recovery is expected. Stress uses independently simulated −80/+95/−35 ppm oscillators and a separate bounded correction policy.
