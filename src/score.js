import {decideLighting} from './lighting.js';
import {performanceSettings} from './performance-settings.js';
/** Replicated score/configuration. Each Worker derives decisions from its own beat. */
export const BPM = 120;
// Only the peer phase protocol wraps. Song position and choreography do NOT loop.
export const BEATS_PER_LOOP = 64;
export const DEFAULT_SONG = Object.freeze({durationSeconds:16,title:'Frère Jacques · synthetic guide'});
export const AGENT_NAMES = Object.freeze(['NOVA','LUNA','ECHO']);
export const AGENT_COLORS = Object.freeze([0x42e8df,0xff82c0,0xb2a0ff]);
const notes = [];
function phrase(pitches,durations,repeats=2){for(let r=0;r<repeats;r++)pitches.forEach((pitch,i)=>notes.push(Object.freeze({pitch,duration:durations[i]})));}
phrase([261.63,293.66,329.63,261.63],[1,1,1,1]);
phrase([329.63,349.23,392],[1,1,2]);
phrase([392,440,392,349.23,329.63,261.63],[.5,.5,.5,.5,1,1]);
phrase([261.63,196,261.63],[1,1,2]);
Object.freeze(notes);
export function songConfig(config={}){
  const durationSeconds=config.durationSeconds??DEFAULT_SONG.durationSeconds;
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0)throw new Error('Song duration must be positive and finite');
  return Object.freeze({durationSeconds,title:String(config.title??DEFAULT_SONG.title)});
}
export function sectionAt(beat,config=DEFAULT_SONG){
  const progress=Math.max(0,beat*.5/config.durationSeconds);
  return progress>=1?'FINISHED':progress<.25?'OPENING':progress<.5?'MELODY':progress<.75?'BELLS':'CLOSING';
}
function guideNote(beat){let start=0;for(let i=0;i<notes.length;i++){if(beat<start+notes[i].duration)return {...notes[i],index:i};start+=notes[i].duration;}return {pitch:0,index:notes.length};}
export function decidePerformance(id,beat,variation=false,config=DEFAULT_SONG,settings={}){
  const performance=performanceSettings(settings),energy=performance.energy;
  const section=sectionAt(beat,config),finished=section==='FINISHED';
  const durationBeats=config.durationSeconds*2,progress=Math.min(1,Math.max(0,beat/durationBeats));
  const note=guideNote(beat),slow=beat*Math.PI/4,offset=id*Math.PI*2/3;
  // A quiet round: gentle rocking, small steps, soft bell gestures, then a bow.
  const closing=Math.max(0,Math.min(1,(progress-.92)/.08));
  const motion=finished?0:1-closing;
  const sway=Math.sin(slow+offset),step=Math.sin(slow*.5+offset);
  const bounded=(value,limit)=>Math.max(-limit,Math.min(limit,value))||0;
  const amplitude=motion*energy;
  const pose={
    armL:bounded(amplitude*(.45*Math.sin(slow+offset)-.12),2.2),
    armR:bounded(amplitude*(-.45*Math.sin(slow+offset)-.12),2.2),
    legL:bounded(amplitude*step*.13,.6),legR:bounded(-amplitude*step*.13,.6),
    body:bounded(amplitude*sway*.065,.25),hop:amplitude*.014*(1-Math.cos(slow*2)),
    turn:bounded(amplitude*Math.sin(slow*.5+offset)*.10,.5),offset:bounded(amplitude*step*.12,.45),bow:closing*.16
  };
  return {
    section,finished,songDuration:config.durationSeconds,songTitle:config.title,
    audio:{role:['nova','luna','echo'][id],position:Math.max(0,beat*.5)},
    voice:{pitch:finished?0:note.pitch*(id===0?1:id===1?.75:.5),vowel:['a','o','u'][id],volume:finished?0:[.14,.07,.05][id],noteIndex:note.index},
    energy,
    light:decideLighting(id,beat,pose,section,progress,variation,{...performance,active:settings.active}),
    pose
  };
}
