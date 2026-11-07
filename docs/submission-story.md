# PROJECT SYNC — why we built it

## Project overview (under 200 characters)

PROJECT SYNC is a peer-to-peer virtual concert where independent performers coordinate music, dance and lighting over unreliable connections, without an ongoing master clock.

## Our story

I'm a Vocaloid fan. What excites me about a virtual concert is the moment a digital performer feels present: the music, the movement, the lights and a room full of fans all sharing the same rhythm. The technology should support that feeling, even when its connections are imperfect.

MIKU EXPO's 2026 Vancouver show took place on April 18 at the Doug Mitchell Thunderbird Sports Centre. Its published schedule listed doors at 7 pm and the show at 8 pm. [Official tour schedule](https://mikuexpo.com/na2026/).

Attendees described long delays getting inside and being seated, including waits exceeding an hour. A community discussion also relayed a claim that Wi-Fi problems had delayed the visual presentation. These are attendee accounts, not a verified organizer explanation of the technical cause. [Reports from the queue](https://www.reddit.com/r/Mikuexpo/comments/1sphgfw/vancouver_expo_delay/), [discussion of the disruption](https://www.reddit.com/r/Mikuexpo/comments/1spfpzi/whats_happening_at_miku_expo_vancouver/).

That situation makes the engineering question feel personal: how much of a show should depend on systems continually receiving instructions from one place? If a connection becomes unreliable, could performers still agree on where they are in the song, make local decisions, and recover together?

PROJECT SYNC turns that question into a concert you can stress-test. NOVA, LUNA and ECHO each run in a separate Worker, with a private drifting oscillator, their own score decisions, choreography, musical commands and lighting zone. They exchange timing observations directly and adjust their pace toward their peers. No performer is the ongoing master clock.

The stage makes that cooperation visible. Each character's light beam, floor ring and bars follow its own beat and movement. The energy slider lets a judge make the dance easier to see without moving the choreography onto the main thread. Add delay, jitter or packet loss to the whole network, then restore communication and watch the peers settle back together. Isolation and kill/rejoin are extra resilience demonstrations, rather than the entire story.

For me, this connects something I love with a real distributed-systems challenge. We are not building a replacement for professional concert infrastructure. We are showing, at a scale we can inspect and test, how independent actors can work toward one performance without waiting for every instruction from a live conductor.

## Why this project makes sense

- **A meaningful common goal:** agree on musical progress so sound, movement and lighting belong to the same performance.
- **Independent decisions:** each agent owns its clock and artistic output. The display and speaker are output adapters, not an ongoing timing authority.
- **Communication resilience:** full-network fault controls expose real message loss and timing uncertainty; recovery uses peer coupling rather than a hidden phase reset.
- **Cooperation beyond replaying a score:** peers propose and approve a future lighting variation, with an honest canonical fallback when approvals are missing.
- **An accessible explanation:** fans understand a dancer and its light falling out of time. Pair readings and a live graph connect that visible effect to the underlying protocol.
- **A personal reason to care:** as a Vocaloid fan, I want to understand and improve the systems behind experiences that matter to the community.
- **A practical hackathon scope:** no backend or account is needed. Browser Workers and BroadcastChannel let us demonstrate the algorithm locally, while clearly labelling synthetic drift, network faults and procedural/synthetic fallbacks.

## What the Vancouver story does not establish

We did not independently verify an organizer/staff statement confirming a Wi-Fi-to-projection/master-clock failure chain, the venue's internal architecture, or the decision process behind delaying the show. The detailed networking explanation should therefore be presented as an unconfirmed account or a hypothetical failure scenario, not an established fact. This prototype has not been shown to prevent that incident.

The personal motivation is genuine; the technical claims should remain limited to the code and tests. See [claims versus evidence](claims-vs-evidence.md) for the complete distinction.
