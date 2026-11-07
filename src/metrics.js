import { MAX_OBSERVATION_AGE_MS, RATE, phaseDifference, projectBeat } from './clock.js';
/** Display estimate only: never feeds back into worker timing. */
export function measurePhase(states, now) {
  if (states.length !== 3 || states.some(s => !s || !Number.isFinite(s.beat) || !Number.isFinite(s.timestamp) || now < s.timestamp || now - s.timestamp >= MAX_OBSERVATION_AGE_MS)) return null;
  // Mixed pause/start observations do not describe the same running transport.
  if (states.some(s => s.playing !== states[0].playing)) return null;
  const beats = states.map(s => projectBeat(s, now));
  const disagreement = Math.max(...beats.flatMap(a => beats.map(b => Math.abs(phaseDifference(a, b)))));
  return { timestamp: now, disagreement, milliseconds: disagreement / RATE, ages: states.map(s => now - s.timestamp) };
}
