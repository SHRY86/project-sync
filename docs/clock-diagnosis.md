# Independent timing: what changed and what is proved

The old implementation independently evaluated one shared physical monotonic reference. Bounded phase corrections made it useful as a presentation prototype, but isolation did not exercise genuinely drifting holdover. That clock model and its old measurement tables have been replaced, not renamed.

Each Worker now reads only elapsed changes in its own relative timer. A private seeded offset of up to ±350 ms and default synthetic rate errors (−0.3%, +0.4%, −0.15%) make the local oscillators independent at the algorithm boundary. The selectable realistic profile uses −80/+95/−35 ppm. Underlying hardware is still the same computer; independence and drift are synthesized, not three physical quartz clocks. Rate multipliers are spectator experiment settings.

## Pairwise estimation, no absolute timestamps

Every peer sends ping with local t0. A receiver responds with its local t1/t2. The requester receives at local t3. RTT = (t3−t0)−(t2−t1); remote-minus-local offset = ((t1−t0)+(t2−t3))/2. Peers retain the minimum-RTT sample over 3 seconds, preferring the newest within 5 ms. Pending nonces reject unsolicited replies. Local offsets and send timestamps are never interpreted as an agreed epoch. The simulated delay slider affects delivery only and is not read by the estimator.

For a beat sampled at sender-local s, receiver-local n projects it by age n+estimatedOffset−s. Samples older than 1800 ms, implausibly future samples, duplicates and reordered samples are rejected. Incarnation IDs distinguish fresh Workers; retired incarnation packets cannot replace a new peer. Cache age is also measured locally. RTT/2 is displayed as an uncertainty indicator. This estimator assumes approximate path symmetry: offset error contains half the directional delay difference, plus drift since the sample. It cannot identify arbitrary one-way delay. Jitter, loss and asymmetry therefore impose a measurable error floor.

## Leaderless phase coupling

Each running peer projects fresh observations to its own current local instant and calculates their circular mean over 64 beats. Its own phase error maps directly to a temporary playback-clock speed adjustment (gain .8/s, deadband .01 beats, maximum ±.35 beats/s, acceleration limit .7 beats/s²). No integrated error state, leader election or reference peer exists. The musical phase advances by that bounded positive rate and never moves backwards. A disconnected agent returns toward its oscillator's natural rate and accumulates real phase disagreement. Reconnection converges through the same coupling, without a reset message. A long partition can lose whole-loop identity; phase alignment does not prove agreement on absolute bar count.

## Starting and rejoining

The selected initiator is the one explicitly centralized moment: it gossips a relative 3000 ms countdown. Peers use their pairwise offset estimate to subtract transit age, schedule a local countdown, and re-gossip their own remaining duration. A lost/late cue is not guessed: the peer stays joining until it hears a running peer and has measured its relative timing. It then seeds an initial phase from fresh peer observations. That initial acquisition happens before it is performing. Once running, it never jumps/reset-syncs. A rejoining Worker receives only session/configuration from the main thread, no beat/section/start time. If all running peers die and no cue remains, manual Restart is required.

## Evidence and limits

`npm test` runs the actual peer core under seeded latency, jitter, loss, long isolation, kill/rejoin and lost-cue scenarios, across five loop boundaries. `node scripts/clock-report.mjs` regenerates max/mean/p95 in beats and milliseconds. Test-harness time is used only to evaluate actual model disagreement, never given to agents. Browser measurements separately report receipt-aligned observation estimates; worker-to-main queueing delay is not measured and must not be confused with clock divergence. Metrics never feed back into timing.

BroadcastChannel remains same-origin, same-computer messaging. No cross-machine implementation, partition-safe consensus, authenticated membership, Byzantine tolerance or sample-perfect audio output is claimed. A real multi-machine version would need a transport, bounded/characterized clock and link errors, oscillator-rate estimation, reconnect membership, authenticated messages and calibrated output-device scheduling. The current symmetric RTT estimator cannot guarantee convergence on arbitrary asymmetric links. Encore remains a unanimous local approval gate with canonical fallback; asymmetric partitions may produce different local outcomes.

## Isolation metrics and finite songs

The original test helper accidentally selected only agent ID 1 for isolation. It is now parameterized and covered for all three IDs. Runtime isolation was already symmetric. The fixed demo rates are not symmetric in distance from the remaining pair's mean, so equal-duration isolation does not imply identical error slopes. LUNA is a faster outlier; ECHO's frequency is closer to the other pair's mean.

UI P2P-group disagreement excludes manually isolated agents and explicitly labels that scope. Separate all-performer and pairwise readings preserve holdover drift. Model tables still include isolated agents to quantify that drift. Do not equate that all-performer number with the connected pair's synchronization error. Whole-network loss/latency/jitter, with no manual isolation, includes all living agents in the primary metric.

Decoded song duration is replicated configuration, not a timing authority. Each agent independently decides its sections, playback position, end state and gentle dance from its own clock. Songs and clips no longer wrap at 64 beats; only phase comparison wraps. Music stops at the decoded end, and completed sources cannot restart without an explicit replay/reset. P2P clocks continue after the final pose for network diagnostics. No master was introduced to control the endpoint.
