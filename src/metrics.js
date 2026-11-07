import {MAX_OBSERVATION_AGE_MS,RATE,phaseDifference,circularMedian} from './clock.js';
export function freshStates(states,now=performance.now()){return states.filter(s=>s?.alive!==false&&s?.playing&&Number.isFinite(s.receivedAt)&&now-s.receivedAt>=0&&now-s.receivedAt<MAX_OBSERVATION_AGE_MS);}
export function presentationBeat(state,now){return state.beat+Math.max(0,now-state.receivedAt)*(state.rate??RATE);}
/** Manual isolation is excluded from P2P-group health; holdover is a separate observation. */
export function measurePhase(states,now=performance.now(),{includeIsolated=false}={}){
 const fresh=freshStates(states,now).filter(s=>includeIsolated||!s.isolated);if(fresh.length<2)return null;
 const beats=fresh.map(s=>presentationBeat(s,now)),pairs=[];
 for(let i=0;i<fresh.length;i++)for(let j=i+1;j<fresh.length;j++)pairs.push({ids:[fresh[i].id,fresh[j].id],difference:Math.abs(phaseDifference(beats[i],beats[j]))});
 const disagreement=Math.max(...pairs.map(p=>p.difference));return {disagreement,milliseconds:disagreement/RATE,median:circularMedian(beats),count:fresh.length,pairs};
}
