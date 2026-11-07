import {RATE} from './clock.js';
import {freshStates} from './metrics.js';
const median=values=>{const s=[...values].sort((a,b)=>a-b),i=Math.floor(s.length/2);return s.length%2?s[i]:(s[i-1]+s[i])/2;};
/** Linear song positions; the protocol's 64-beat wrap must never restart a WAV. */
export function audioCommands(states,selection,now=performance.now(),duration=Infinity){
 const live=freshStates(states,now);if(!live.length)return [];
 const position=s=>s.audio.position+Math.max(0,now-s.receivedAt)*s.rate*.5;
 const stems=['nova','luna','echo'];
 const commands=selection.length===3&&selection.every(n=>stems.includes(n))
  ?live.map(s=>({name:stems[s.id],position:position(s),rate:s.rate/RATE,contributors:[s.id]}))
  :selection.map(name=>({name,position:median(live.map(position)),rate:median(live.map(s=>s.rate/RATE)),contributors:live.map(s=>s.id)}));
 return commands.filter(c=>c.position>=0&&c.position<duration);
}
