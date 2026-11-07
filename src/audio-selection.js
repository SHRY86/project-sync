import { RATE, wrapBeat, circularMedian } from './clock.js';
import { freshStates } from './metrics.js';
/** Output-only selection; no result is sent back to a peer or used as a show clock. */
export function audioCommands(states, selection, now = performance.now()) {
  const live = freshStates(states, now);
  if (!live.length) return [];
  const phase = s => s.audio.position / .5 + Math.max(0, now - s.receivedAt) * s.rate;
  const stems = ['nova','luna','echo'];
  if (selection.length === 3 && selection.every(n => stems.includes(n))) {
    return live.map(s => ({name:stems[s.id],position:wrapBeat(phase(s))*.5,rate:s.rate/RATE,contributors:[s.id]}));
  }
  const median = circularMedian(live.map(phase));
  const rates = live.map(s=>s.rate/RATE).sort((a,b)=>a-b);
  const rate=rates[Math.floor(rates.length/2)];
  return selection.map(name=>({name,position:wrapBeat(median)*.5,rate,contributors:live.map(s=>s.id)}));
}
