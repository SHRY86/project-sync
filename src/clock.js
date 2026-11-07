import { BPM, BEATS_PER_LOOP } from './score.js';
export const RATE = BPM / 60000;
export const MAX_OBSERVATION_AGE_MS = 1800;
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const wrapBeat = b => ((b % BEATS_PER_LOOP) + BEATS_PER_LOOP) % BEATS_PER_LOOP;
export const phaseDifference = (a, b) => wrapBeat(a - b + BEATS_PER_LOOP / 2) - BEATS_PER_LOOP / 2;
export const PROFILES = Object.freeze({ demo: Object.freeze([-.003, .004, -.0015]), realistic: Object.freeze([-.000080, .000095, -.000035]), ideal: Object.freeze([0, 0, 0]) });
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}
/** Only the elapsed change of this realm's relative clock is read. No epoch. */
export class PrivateOscillator {
  constructor(id, seed, read = () => performance.now()) {
    this.read = read; this.lastRaw = read(); this.value = (seededRandom(seed)() * 2 - 1) * 350;
    this.id = id; this.profile = 'demo'; this.scale = 1;
  }
  get error() { return PROFILES[this.profile][this.id] * this.scale; }
  get ratio() { return 1 + this.error; }
  now() { const raw = this.read(); this.value += Math.max(0, raw - this.lastRaw) * this.ratio; this.lastRaw = raw; return this.value; }
  configure(profile, scale = 1) { this.now(); this.profile = Object.hasOwn(PROFILES, profile) ? profile : 'demo'; this.scale = clamp(scale, 0, 5); }
}
export function circularMean(beats, anchor = 0) {
  if (!beats.length) return anchor;
  const angles = beats.map(b => b * Math.PI * 2 / BEATS_PER_LOOP);
  const x = angles.reduce((s, a) => s + Math.cos(a), 0), y = angles.reduce((s, a) => s + Math.sin(a), 0);
  if (Math.hypot(x, y) < 1e-6) return anchor; // No preferred direction at an antipodal tie.
  return anchor + phaseDifference(Math.atan2(y, x) * BEATS_PER_LOOP / (Math.PI * 2), anchor);
}
export function circularMedian(beats) {
  if (!beats.length) return null;
  // A circular medoid supplies a wrap-safe anchor, not an elected clock authority.
  const anchor = beats.reduce((best, b) => beats.reduce((s, a) => s + Math.abs(phaseDifference(a, b)), 0) < beats.reduce((s, a) => s + Math.abs(phaseDifference(a, best)), 0) ? b : best, beats[0]);
  const lifted = beats.map(b => anchor + phaseDifference(b, anchor)).sort((a, b) => a - b);
  const middle = Math.floor(lifted.length / 2);
  return lifted.length % 2 ? lifted[middle] : (lifted[middle - 1] + lifted[middle]) / 2;
}
/** Leaderless proportional phase coupling; the residual is NEVER integrated. */
export class ShowClock {
  constructor() { this.beat = 0; this.last = null; this.running = false; this.paused = false; this.adjustment = 0; this.phaseError = 0; }
  join(beat, now) { if (this.running) return; this.beat = Math.max(0, beat); this.last = now; this.running = true; }
  sampleAt(now) { return this.beat + (this.running && !this.paused ? Math.max(0, now - this.last) * (RATE + this.adjustment / 1000) : 0); }
  tick(now, peerBeats = []) {
    if (!this.running) { this.last = now; return this.beat; }
    const dt = Math.max(0, now - this.last); this.beat = this.sampleAt(now); this.last = now;
    if (this.paused) { this.adjustment = 0; return this.beat; }
    this.phaseError = peerBeats.length ? phaseDifference(circularMean(peerBeats, this.beat), this.beat) : 0;
    const residual = Math.sign(this.phaseError) * Math.max(0, Math.abs(this.phaseError) - .01);
    // .8 / second proportional gain; ±.35 beats/sec speed change, .7 beats/sec² slew.
    const target = clamp(residual * .8, -.35, .35);
    this.adjustment += clamp(target - this.adjustment, -Math.min(dt, 250) * .0007, Math.min(dt, 250) * .0007);
    return this.beat;
  }
}
