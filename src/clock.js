import { BPM, BEATS_PER_LOOP } from './score.js';
export const RATE = BPM / 60000;
export const MAX_OBSERVATION_AGE_MS = 1200;
export const SHARED_CORRECTION_LIMIT = .01;
export const PHASE_DEADBAND = .01;
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
// All windows/workers use the same epoch; performance.now() alone is realm-relative.
export const monotonicNow = () => performance.timeOrigin + performance.now();
export function phaseDifference(a, b) {
  return ((a - b + BEATS_PER_LOOP / 2) % BEATS_PER_LOOP + BEATS_PER_LOOP) % BEATS_PER_LOOP - BEATS_PER_LOOP / 2;
}
export const observationTime = observation => observation.sampleAt ?? observation.sentAt;
/** Return a rejection reason; watermarks must survive peer-cache expiry. */
export function rejectObservation(message, now, lastSampleAt = -Infinity) {
  const at = observationTime(message);
  if (!Number.isFinite(message.beat) || !Number.isFinite(at) || !Number.isFinite(message.sentAt)) return 'invalid';
  if (at > message.sentAt || message.sentAt > now || now - at >= MAX_OBSERVATION_AGE_MS) return 'stale/epoch';
  if (at <= lastSampleAt) return 'out-of-order';
  if (message.rate !== undefined && (!Number.isFinite(message.rate) || Math.abs(message.rate - RATE) > RATE * .1)) return 'invalid-rate';
  return null;
}
export function projectBeat(observation, timestamp) {
  if (observation.playing === false) return observation.beat;
  return observation.beat + (timestamp - (observation.timestamp ?? observationTime(observation))) * (observation.rate ?? RATE);
}
const calibration = Object.freeze([-.006, .010, -.008]);
const driftPpm = Object.freeze([-80, 95, -35]);
const deadband = error => Math.sign(error) * Math.max(0, Math.abs(error) - PHASE_DEADBAND);

/** Each worker independently evaluates the common physical clock, not a conductor. */
export class ShowClock {
  constructor(id, startAt) {
    Object.assign(this, { id, startAt, correction: 0, beat: 0, last: startAt, drift: 0, stress: false, stressTarget: 0, lastStressSampleAt: -Infinity });
  }
  driftRate() { return this.stress ? RATE * driftPpm[this.id] / 1e6 : 0; }
  baseAt(now) {
    const elapsed = Math.max(0, now - this.startAt);
    return elapsed * RATE + this.drift + 3 * (calibration[this.id] + .002 * Math.sin(elapsed / 1900 + this.id));
  }
  sampleAt(now) {
    if (now < this.startAt) return 0;
    return Math.max(this.beat, this.baseAt(now) + Math.max(0, now - this.last) * this.driftRate() + this.correction, 0);
  }
  tick(now, peers, isolated = false) {
    if (!Number.isFinite(now) || now < this.last && now >= this.startAt) return this.beat;
    const elapsedMs = Math.max(0, now - Math.max(this.last, this.startAt));
    this.drift += elapsedMs * this.driftRate();
    this.last = now;
    if (now < this.startAt) return this.beat = 0;
    const local = this.baseAt(now);
    const errors = [];
    if (!isolated) for (const peer of peers.values()) {
      if (rejectObservation(peer, now) || peer.playing === false) continue;
      // Both sides evaluated at exactly 'now', with sample epoch preserved in transit.
      errors.push(phaseDifference(projectBeat(peer, now), local + this.correction));
    }
    const error = errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
    const dt = Math.min(elapsedMs, 250); // Limit correction steps after a suspended tab.
    const limit = this.stress ? .35 : SHARED_CORRECTION_LIMIT;
    // Shared mode is absolute, attenuated proportional feedback anchored to baseAt.
    // It NEVER adds error to the previous correction. Re-reading a cached packet
    // cannot integrate the same delayed phase residual indefinitely.
    const newestSampleAt = Math.max(-Infinity, ...[...peers.values()].map(observationTime));
    if (this.stress && errors.length && newestSampleAt > this.lastStressSampleAt) {
      // Stress mode may integrate oscillator error, but only once per new sample.
      this.lastStressSampleAt = newestSampleAt;
      this.stressTarget = clamp(this.correction + deadband(error) * .15, -limit, limit);
    }
    const target = this.stress
      ? (errors.length ? this.stressTarget : this.correction)
      : (errors.length ? clamp(deadband(error) * .2, -limit, limit) : 0);
    const slewPerMs = this.stress ? .00012 : .000002;
    this.correction += clamp(target - this.correction, -dt * slewPerMs, dt * slewPerMs);
    // On leaving stress mode, slew any existing larger correction back to the
    // shared-mode budget; do not jump the phase when the toggle changes.
    this.beat = Math.max(this.beat, local + this.correction, 0);
    return this.beat;
  }
}
