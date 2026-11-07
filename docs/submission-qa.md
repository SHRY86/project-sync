# Submission quality gate and manual checks

## Executed checks

- `npm test`: 42 passing automated tests. They include private offsets and drift, bounded monotonic coupling, 64-beat circular math, each cue initiator, lost cues/listening join, loss before/after start, latency/jitter, asymmetric paths, long isolation/reconnect, each agent killed/rejoined, retired incarnations, proposal deadlines, runtime asset validation, URL cleanup, deterministic Three.js mixer seeks, median audio selection and lifecycle counters.
- `npm run build`: succeeds. Local Three.js/VRM chunks and documentation are bundled. Vite reports the ~589 kB Three.js chunk-size warning; this is a loading-size advisory, not a runtime/CDN dependency.
- `npm run test:browser` against the production preview: all four scripts passed. Console errors and uncaught page errors are checked, not just build syntax.
- Browser lifecycle: real Worker termination, fresh-incarnation rejoin, canonical fallback when an approval is missing, unanimous encore, pause/resume, repeated restarts and one AudioContext.
- Browser assets: original synthesized WAVs are decoded and actual BufferSources start/stop. Three stems exclude the full mix; killing/rejoining removes/restores only its stem. Full mix remains active after NOVA dies. Invalid duration, invalid VRM and invalid VRMA show labelled fallbacks. This checks output commands/sources, **not listening quality**.
- Browser design: 1280×720, 1440×900 and 390×844 layouts have no horizontal overflow; keyboard transport, guided steps and live graph are exercised. The desktop stage screenshot was visually inspected.
- Runtime/source scan: no absolute clock API or shared epoch exchange in the runtime; literal forbidden-reference grep over source/tests/scripts returns no matches.

Regenerated [model measurements](clock-measurements.md) cover every scenario with max/mean/p95 in beats/ms, including honest unavailable phase metrics when only one peer learned the start. [Browser observations](browser-clock-measurements.md) are receipt-aligned estimates under application/WebGL load, not simultaneous truth. The model's instantaneous output adapter has no browser queueing; its zero/near-zero artifact must not be misrepresented as proof of browser timing precision.

## Not verified here

- Successful import, artistic retargeting, facial behavior and coordinate alignment with a real externally authored VRM/VRMA pair: no such media was supplied. Invalid-media handling and deterministic mixer sampling are tested, but those are not substitutes for positive visual QA.
- Blender Mixamo/MMD → VRMA conversion: the documented add-on exporter exists, but desktop conversion/retargeting was not run.
- Audible mix quality, speaker latency, loop clicks on actual venue hardware or exact lyrical lip-sync: headless playback cannot establish these. Coarse synthetic vowel cues are not lyric alignment.
- Cross-machine behavior, arbitrary asymmetric delay convergence, partition-safe consensus, authentication/Byzantine tolerance or multiple physical audio devices: these are outside the implementation's claims.

## Before submission: manual checklist

- [ ] From a fresh clone run `npm install`, `npm test`, `npm run build`, then `npm run dev`. With empty manifests, confirm labelled synthetic/procedural output and no missing-asset errors.
- [ ] Click Start in venue Chrome; confirm the correct output device, mute/master volume, audible looping and pause/resume/restart without doubled playback.
- [ ] Generate original demo WAVs or load authorized stems. Hear all three; kill each performer separately and verify only its stem fades. Test full-mix median playback after NOVA death.
- [ ] Run the 60-second demo at 1× demo drift: isolate LUNA, wait for growth, add faults, kill/rejoin NOVA, get canonical fallback, restore and visibly converge, then approve encore together.
- [ ] Check that recovery claims match the graph and timer. Do not label a deliberate Restart as reconnection recovery.
- [ ] Load each actual VRM, then its actual VRMA; check face direction, proportions, rest pose, feet, root translation, clip looping and expression conflicts. Keep procedural fallback if conversion fails.
- [ ] Test the actual laptop viewport, browser zoom and projector scaling, plus camera presets and keyboard shortcuts. Reduce display pixel scaling if necessary; renderer ratio remains capped at 2.
- [ ] Keep licences/credits for song, lyrics, bank, avatar, textures and motion. `git status` must contain no bulky/copyrighted media. Prepare the explicit no-audio/WebGL fallback presentation.
