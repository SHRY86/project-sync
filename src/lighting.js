const COLORS=Object.freeze([0x58efe7,0xff39c7,0x9254ff]);
function tint(color,target,amount){let result=0;for(const shift of [0,8,16])result|=Math.round(((color>>shift)&255)*(1-amount)+((target>>shift)&255)*amount)<<shift;return result;}
/** All cue timing and zone decisions run independently inside each performer. */
export function decideLighting(id,beat,pose,section,progress,variation,settings){
 const enabled=settings.lightingEnabled&&settings.active!==false,finished=section==='FINISHED';
 const level=enabled?settings.lightingLevel:0;
 const pulse=finished?0:Math.pow((1+Math.cos(beat*Math.PI*2))/2,2);
 const phrase=finished?0:(1+Math.sin(beat*Math.PI/4+id*.4))/2;
 const closing=Math.max(0,Math.min(1,(progress-.88)/.12));
 const envelope=finished?.13:1-closing*.7;
 const color=variation?0xffd36e:tint(COLORS[id],section==='BELLS'?0xff97e7:section==='CLOSING'?0xd9caff:0xc7ffff,section==='OPENING'?.22:.10);
 const intensity=level*envelope*(.42+.38*pulse+.12*phrase);
 return {
  mode:settings.active===false?'READY':!enabled?'OFF':finished?'CURTAIN':variation?'PEER ENCORE':section,
  enabled,color,intensity,pulse:level?pulse:0,pan:pose.offset,
  // Local coordinates relative to this performer's fixed stage zone.
  target:{x:pose.offset,y:1.15+pose.hop,z:finished?0:.12*Math.sin(beat*Math.PI/8+id)},
  power:intensity*125,glow:intensity*8,
  beamOpacity:finished?0:level*envelope*(.035+.055*pulse),beamWidth:.65+.22*phrase,
  ringScale:1+level*.10*pulse,ringOpacity:level?(.18+intensity*.7):.04,
  floorOpacity:intensity*.20,
  barLevels:Array.from({length:5},(_,i)=>finished?level*.08:level*envelope*(.18+.46*pulse+.25*(1+Math.sin(beat*Math.PI/2+i*.65+id))/2))
 };
}
