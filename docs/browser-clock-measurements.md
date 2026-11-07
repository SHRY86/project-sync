# Actual browser Worker clock measurements

Five seconds per case in headless Chromium. Worker beats are interpolated between bracketing state samples at exactly the UI observation timestamp (gaps above 150 ms excluded). These are interpolated observations, not direct simultaneous reads or sample-accurate audio measurements. Browser loss/jitter is unseeded. Every case starts at beat 63 and crosses 64; the fault case isolates LUNA at 1.2 seconds and restores at 2.4 seconds. No reset is sent.

Each entry is max · mean · p95, with values in beats / milliseconds at 120 BPM.

| Latency / faults | Interpolated worker disagreement | UI estimate | Max artifact (ms) |
|---|---|---|---:|
| 0 ms | 0.047614 / 23.807 · 0.045230 / 22.615 · 0.046544 / 23.272 | 0.047730 / 23.865 · 0.045242 / 22.621 · 0.046644 / 23.322 | 0.080 |
| 50 ms | 0.049767 / 24.883 · 0.045579 / 22.790 · 0.048651 / 24.326 | 0.049804 / 24.902 · 0.045586 / 22.793 · 0.048748 / 24.374 | 0.093 |
| 150 ms | 0.049766 / 24.883 · 0.045752 / 22.876 · 0.048991 / 24.496 | 0.049836 / 24.918 · 0.045768 / 22.884 · 0.049186 / 24.593 | 0.098 |
| 500 ms | 0.049666 / 24.833 · 0.046504 / 23.252 · 0.049269 / 24.635 | 0.049681 / 24.841 · 0.046525 / 23.263 · 0.049315 / 24.657 | 0.059 |
| 500 ms + ±400 ms jitter / 30% loss / isolation | 0.052743 / 26.372 · 0.049357 / 24.679 · 0.052484 / 26.242 | 0.052705 / 26.353 · 0.049370 / 24.685 · 0.052543 / 26.271 | 0.097 |
