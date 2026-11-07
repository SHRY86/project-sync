import { MAX_OBSERVATION_AGE_MS, RATE, phaseDifference, circularMedian } from './clock.js';
export function freshStates(states,now=performance.now()) { return states.filter(s=>s?.alive!==false&&s?.playing&&Number.isFinite(s.receivedAt)&&now-s.receivedAt>=0&&now-s.receivedAt<MAX_OBSERVATION_AGE_MS); }
export function presentationBeat(state,now) { return state.beat+Math.max(0,now-state.receivedAt)*(state.rate??RATE); }
/** Receipt-aligned display estimate; worker-to-main queueing delay is unknown. */
export function measurePhase(states,now=performance.now()) {
  const fresh=freshStates(states,now);if(fresh.length<2)return null;
  const beats=fresh.map(s=>presentationBeat(s,now));
  const disagreement=Math.max(...beats.flatMap(a=>beats.map(b=>Math.abs(phaseDifference(a,b)))));
  return {disagreement,milliseconds:disagreement/RATE,median:circularMedian(beats),count:fresh.length};
}
