// Pre-fix clock snapshot, retained ONLY to reproduce the regression in tests.
import { BPM, BEATS_PER_LOOP } from '../../src/score.js';
export const RATE = BPM / 60000;
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const monotonicNow = () => performance.timeOrigin + performance.now();
export function phaseDifference(a, b) {
  return ((a - b + BEATS_PER_LOOP / 2) % BEATS_PER_LOOP + BEATS_PER_LOOP) % BEATS_PER_LOOP - BEATS_PER_LOOP / 2;
}
/** Shared physical monotonic clock, bounded imperfections; optional synthetic ppm drift. */
export class LegacyClock {
  constructor(id, startAt) { Object.assign(this, {id, startAt, correction:0, beat:0, last:startAt, drift:0, stress:false}); }
  sampleAt(now) {
    if(now<this.startAt)return 0;
    const elapsed=now-this.startAt;
    const base=elapsed*RATE+this.drift+3*([-.006,.010,-.008][this.id]+.002*Math.sin(elapsed/1900+this.id));
    return Math.max(this.beat,base+this.correction,0);
  }
  tick(now, peers, isolated = false) {
    const dt = clamp(now - this.last, 0, 250); this.last = now;
    this.drift += this.stress ? dt * RATE * [-80, 95, -35][this.id] / 1e6 : 0;
    const elapsed = Math.max(0, now - this.startAt);
    const local = elapsed * RATE + this.drift + 3 * ([-.006,.010,-.008][this.id] + .002 * Math.sin(elapsed/1900+this.id));
    const fresh = isolated ? [] : [...peers.values()].filter(p => now-p.sentAt >= 0 && now-p.sentAt < 1200);
    const error = fresh.length ? fresh.reduce((s,p)=>s+phaseDifference(p.beat+(now-p.sentAt)*RATE,local+this.correction),0)/fresh.length : 0;
    const target = fresh.length ? clamp(this.correction + error * .15, -.35,.35) : this.correction * .995;
    this.correction += clamp(target-this.correction, -dt*.00012,dt*.00012);
    this.beat = now < this.startAt ? 0 : Math.max(this.beat,local+this.correction,0);
    return this.beat;
  }
}
