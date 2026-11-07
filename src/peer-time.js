import { MAX_OBSERVATION_AGE_MS, RATE, clamp } from './clock.js';
/** NTP-style four timestamps, all local to their sender. No shared time origin. */
export class PeerTime {
  constructor() { this.samples = []; this.watermark = -Infinity; }
  observe(t0, t1, t2, t3) {
    if (![t0,t1,t2,t3].every(Number.isFinite) || t3 < t0 || t2 < t1) return false;
    const rtt = (t3 - t0) - (t2 - t1);
    if (rtt < -2 || rtt > 6000) return false;
    this.samples.push({ at: t3, rtt: Math.max(0, rtt), offset: ((t1 - t0) + (t2 - t3)) / 2 });
    this.samples = this.samples.filter(s => t3 - s.at < 3000).slice(-30);
    // Minimum RTT in a short rolling window limits queueing bias; does not remove asymmetry.
    const minimum = Math.min(...this.samples.map(s => s.rtt));
    this.best = this.samples.filter(s => s.rtt <= minimum + 5).at(-1);
    return true;
  }
  age(sampleAt, now) { return this.best ? now + this.best.offset - sampleAt : null; }
  fresh(now) { return this.best && now - this.best.at < 8000; }
  accept(message, now) {
    if (!this.fresh(now) || !Number.isFinite(message.beat) || !Number.isFinite(message.sampleAt) || !Number.isFinite(message.rate) || message.rate < .001 || message.rate > .003) return false;
    const age = this.age(message.sampleAt, now);
    if (message.sampleAt <= this.watermark || age < -this.best.rtt / 2 - 20 || age >= MAX_OBSERVATION_AGE_MS) return false;
    this.watermark = message.sampleAt;
    return true;
  }
  project(message, now) { return message.beat + clamp(this.age(message.sampleAt, now) ?? 0, 0, MAX_OBSERVATION_AGE_MS) * (message.rate ?? RATE); }
}
