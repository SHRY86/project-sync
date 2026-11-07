import { AGENT_NAMES } from './score.js';
import { monotonicNow } from './clock.js';
import { measurePhase } from './metrics.js';
const $=id=>document.getElementById(id);
export class ConcertUI {
  constructor(fleet,audio){
    this.fleet=fleet;this.audio=audio;this.recoveryStart=null;this.recovery='—';
    $('startButton').onclick=async()=>{try{await audio.enable();audio.wasEnabled=true;if(!fleet.workers.length)fleet.start();}catch(e){this.showError(e.message);}};
    $('audioButton').onclick=async()=>{try{await audio.toggle();}catch(e){this.showError(e.message);}};
    $('pauseButton').onclick=()=>{fleet.pause();audio.reset();$('pauseButton').textContent=fleet.paused?'Resume':'Pause';};
    $('restartButton').onclick=()=>{audio.reset();fleet.start();$('pauseButton').textContent='Pause';};
    $('volume').oninput=e=>audio.setVolume(Number(e.target.value));
    $('proposalButton').onclick=()=>fleet.propose();
    for(let id=0;id<3;id++)$(`isolate${id}`).onclick=()=>{fleet.isolated[id]=!fleet.isolated[id];fleet.applyNetwork();this.refresh();};
    for(const [control,key,scale] of [['loss','lossProbability',.01],['latency','latency',1],['jitter','jitter',1]])$(control).oninput=e=>{fleet.network[key]=Number(e.target.value)*scale;$(`${control}Value`).textContent=e.target.value;fleet.applyNetwork();};
    $('stress').onchange=e=>{fleet.network.stress=e.target.checked;fleet.applyNetwork();};
    $('restoreButton').onclick=()=>{fleet.isolated.fill(false);fleet.network.lossProbability=0;fleet.network.latency=0;fleet.network.jitter=0;for(const key of ['loss','latency','jitter']){$(key).value=0;$(`${key}Value`).textContent='0';}fleet.applyNetwork();this.recoveryStart=performance.now();this.recovery='Measuring…';this.refresh();};
    this.refresh();
  }
  refresh(){for(let id=0;id<3;id++)$(`isolate${id}`).textContent=`${this.fleet.isolated[id]?'Reconnect':'Isolate'} ${AGENT_NAMES[id]}`;}
  showError(message){$('stageError').hidden=false;$('stageError').textContent=message;}
  update(states){
    $('assetStatus').textContent=this.audio.status;
    $('audioButton').textContent=this.audio.enabled?'Mute':'Enable audio';
    if(states.some(s=>!s))return;
    const measurement=measurePhase(states,monotonicNow());
    const error=measurement?.disagreement??Infinity;
    $('beatError').textContent=measurement?`${error.toFixed(3)} beats`:'Waiting / stale';
    $('msError').textContent=measurement?`${measurement.milliseconds.toFixed(1)} ms`:'—';
    if(this.recoveryStart!==null && error<.05 && states.every(s=>s.peers.length===2)){this.recovery=`${((performance.now()-this.recoveryStart)/1000).toFixed(2)} s`;this.recoveryStart=null;}
    $('recovery').textContent=this.recovery;
    $('messagesReceived').textContent=states.reduce((a,s)=>a+s.received,0);$('packetsDropped').textContent=states.reduce((a,s)=>a+s.dropped,0);
    $('networkBadge').textContent=this.fleet.paused?'PAUSED':this.fleet.isolated.some(Boolean)?'PARTITION SIMULATED':'LOCAL PEER NETWORK';
    $('showStatus').textContent=`${states[0].section} · ${states[0].proposal}`;
    $('agents').replaceChildren(...states.map((s,id)=>{const row=document.createElement('div');row.className='agent';const text=document.createElement('div');text.className='agent-detail';const title=document.createElement('b');title.textContent=`${AGENT_NAMES[id]} · ${s.isolated?'ISOLATED':'CONNECTED'} · beat ${s.beat.toFixed(2)}`;const info=document.createElement('small');info.textContent=`${s.section} · audio ${s.audio.role} · light ${s.light.intensity.toFixed(2)} · peers [${s.peers.join(',')}] · RX ${s.received} / dropped ${s.dropped} · correction ${(s.correction*500).toFixed(1)} ms`;const proposal=document.createElement('small');proposal.textContent=s.proposal;text.append(title,info,proposal);row.append(text);return row;}));
    if(this.fleet.error)$('showStatus').textContent=this.fleet.error;
  }
}
