import { BPM, BEATS_PER_LOOP, decidePerformance } from './score.js';

// One instance of this module runs inside EACH independent Web Worker.
// The main thread never calculates beats, notes, light cues or choreography.
const BEATS_PER_MS = BPM / 60_000;
const calibration = [-0.006, 0.010, -0.008];
let id, channel, startAt, session, timer;
let isolated = false, lossProbability = 0, clockNoise = 3;
let correction = 0, lastTx = 0, received = 0, dropped = 0;
const peers = new Map();
const now = () => performance.timeOrigin + performance.now();
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
function beatDifference(a, b) {
  let d = (a - b) % BEATS_PER_LOOP;
  if (d > BEATS_PER_LOOP / 2) d -= BEATS_PER_LOOP;
  if (d < -BEATS_PER_LOOP / 2) d += BEATS_PER_LOOP;
  return d;
}
function initialize(message) {
  id = message.id;
  session = message.session;
  startAt = message.startAt;
  clockNoise = message.clockNoise;
  channel = new BroadcastChannel(`project-sync-${session}`);
  channel.onmessage = (event) => {
    const message = event.data;
    if (message?.type !== 'clock' || message.id === id) return;
    if (isolated || Math.random() < lossProbability) { dropped++; return; }
    received++;
    // Timestamp is in a shared monotonic time domain ONLY because all workers
    // run on the same machine. This is not an Internet clock protocol.
    peers.set(message.id, { beat: message.beat, sentAt: message.sentAt, seenAt: now() });
  };
  timer = setInterval(tick, 33);
  tick();
}
function tick() {
  const timestamp = now();
  const elapsed = Math.max(0, timestamp - startAt);
  const baseBeat = elapsed * BEATS_PER_MS;
  // Deliberately bounded phase imperfections: disconnects cannot accumulate
  // arbitrary drift in this single-machine demo.
  const local = baseBeat + clockNoise * (calibration[id] + 0.002 * Math.sin(elapsed / 1900 + id));
  let errorSum = 0, activePeers = 0;
  for (const [peerId, peer] of peers) {
    if (timestamp - peer.seenAt > 1200) { peers.delete(peerId); continue; }
    const predicted = peer.beat + (timestamp - peer.sentAt) * BEATS_PER_MS;
    errorSum += beatDifference(predicted, local + correction);
    activePeers++;
  }
  // Each agent independently approaches the mean of fresh peer observations.
  correction *= 0.984;
  if (activePeers) correction += clamp((errorSum / activePeers) * 0.035, -0.004, 0.004);
  correction = clamp(correction, -0.10, 0.10);
  const beat = Math.max(0, local + correction);
  if (timestamp - lastTx >= 180) {
    lastTx = timestamp;
    if (!isolated && Math.random() >= lossProbability) {
      channel.postMessage({ type: 'clock', id, beat, sentAt: timestamp });
    } else {
      dropped += 2;
    }
  }
  // ALL artistic decisions take place HERE, not in the renderer.
  const performanceState = decidePerformance(id, beat);
  postMessage({ type: 'state', id, beat, ...performanceState, peers: activePeers,
    isolated, received, dropped, timestamp });
}
onmessage = ({ data }) => {
  if (data.type === 'init') initialize(data);
  if (data.type === 'network') {
    if (typeof data.isolated === 'boolean') {
      isolated = data.isolated;
      if (isolated) peers.clear();
    }
    if (typeof data.lossProbability === 'number') lossProbability = data.lossProbability;
    if (typeof data.clockNoise === 'number') clockNoise = data.clockNoise;
  }
};
