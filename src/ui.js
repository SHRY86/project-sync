import { AGENT_NAMES, AGENT_COLORS } from './score.js';
import { measurePhase } from './metrics.js';
import { PhaseGraph } from './phase-graph.js';
import { DemoGuide } from './demo-guide.js';
const $=id=>document.getElementById(id);
export class ConcertUI {
  constructor(fleet,audio){
    this.fleet=fleet;this.audio=audio;this.recoveryStart=null;this.recovery='—';this.stableSince=null;
    this.graph=new PhaseGraph($('phaseLine'),$('graphScale'));
    $('agents').innerHTML=AGENT_NAMES.map((name,id)=>`<article class="agent-card" style="--agent-color:#${AGENT_COLORS[id].toString(16)}" aria-label="${name} independent agent"><div class="agent-heading"><b>${name}</b><span id="state${id}" class="agent-badge">READY</span></div><div class="beat-row"><strong id="localBeat${id}">—</strong><span id="section${id}">AWAITING CUE</span></div><div id="clock${id}" class="agent-info">Private oscillator · drift ON</div><div id="phase${id}" class="agent-info">Peer phase: awaiting observations</div><div id="peers${id}" class="agent-info">No peer cache yet</div><div id="counts${id}" class="agent-info">RX 0 · dropped 0</div><div id="cue${id}" class="agent-cue">Canonical score</div><div id="join${id}" class="agent-info"></div><div class="agent-actions"><button id="isolate${id}" class="btn" aria-label="Isolate ${name}">Isolate</button><button id="kill${id}" class="btn" aria-label="Kill ${name}">Kill</button></div></article>`).join('');
    $('startButton').onclick=()=>this.start();
    $('audioButton').onclick=async()=>{try{await audio.toggle();}catch(e){this.notice(`Audio unavailable: ${e.message}`);}};
    $('pauseButton').onclick=()=>this.pause();$('restartButton').onclick=()=>this.restart();
    $('volume').oninput=e=>audio.setVolume(Number(e.target.value));$('proposalButton').onclick=()=>fleet.propose();
    for(let id=0;id<3;id++){$(`isolate${id}`).onclick=()=>this.isolate(id,!fleet.isolated[id]);$(`kill${id}`).onclick=()=>this.killOrRejoin(id,!fleet.workers[id]);}
    for(const [control,key,scale] of [['loss','lossProbability',.01],['latency','latency',1],['jitter','jitter',1]])$(control).oninput=e=>this.setNetwork({[key]:Number(e.target.value)*scale});
    $('profile').onchange=e=>{fleet.profile=e.target.value;fleet.applyOscillators();};
    $('initiator').onchange=e=>fleet.initiator=Number(e.target.value);
    $('driftScale').oninput=e=>{fleet.scale=Number(e.target.value);$('driftValue').textContent=`${fleet.scale}×`;fleet.applyOscillators();};
    $('restoreButton').onclick=()=>this.restore();this.guide=new DemoGuide(this);
    document.addEventListener('keydown',e=>{
      if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,[contenteditable]'))return;
      if(e.key===' '&&!e.target.closest('button,a,summary')){e.preventDefault();fleet.workers.some(Boolean)?this.pause():this.start();}
      const actions={m:()=>$('audioButton').click(),r:()=>this.restart(),i:()=>this.isolate(1,!fleet.isolated[1]),k:()=>this.killOrRejoin(0,!fleet.workers[0]),e:()=>fleet.propose(),d:()=>this.guide.toggle(),c:()=>{const camera=$('camera');camera.selectedIndex=(camera.selectedIndex+1)%camera.options.length;camera.dispatchEvent(new Event('change'));}};
      if(actions[e.key.toLowerCase()]){e.preventDefault();actions[e.key.toLowerCase()]();}
      if(e.key==='Escape')$('demoGuide').hidden=true;
    });
    this.refresh();
  }
  notice(message){$('notice').textContent=message;}
  async start(){
    try{await this.audio.enable();this.audio.wasEnabled=true;}catch(e){this.notice(`Sound unavailable; visual concert continues. ${e.message}`);}
    if(!this.fleet.workers.some(Boolean))this.fleet.start();$('welcome').hidden=true;this.refresh();
  }
  restart(){this.audio.reset();this.fleet.start();this.graph.history=[];this.recovery='—';this.refresh();}
  pause(){if(!this.fleet.workers.some(Boolean))return;this.fleet.pause();this.audio.reset();this.refresh();}
  isolate(id,isolated){if(!this.fleet.session)return;this.fleet.isolated[id]=isolated;this.fleet.applyNetwork();if(!isolated)this.beginRecovery();this.refresh();}
  killOrRejoin(id,rejoin){if(!this.fleet.session)return;if(rejoin)this.fleet.rejoin(id);else this.fleet.kill(id);this.refresh();}
  setNetwork(changes){Object.assign(this.fleet.network,changes);for(const [control,key,scale] of [['loss','lossProbability',100],['latency','latency',1],['jitter','jitter',1]]){$(control).value=this.fleet.network[key]*scale;$(`${control}Value`).textContent=String(this.fleet.network[key]*scale);}this.fleet.applyNetwork();}
  beginRecovery(){this.recoveryStart=performance.now();this.stableSince=null;this.recovery='Measuring…';}
  restore(){this.fleet.isolated.fill(false);this.setNetwork({lossProbability:0,latency:0,jitter:0});this.beginRecovery();this.refresh();}
  refresh(){
    const started=!!this.fleet.session;$('pauseButton').textContent=this.fleet.paused?'Resume':'Pause';$('pauseButton').disabled=!started;$('restartButton').disabled=!started;$('proposalButton').disabled=!started;
    for(let id=0;id<3;id++){const killed=started&&!this.fleet.workers[id];$(`kill${id}`).disabled=!started;$(`isolate${id}`).disabled=!started||killed;$(`kill${id}`).textContent=killed?'Rejoin':'Kill';$(`kill${id}`).setAttribute('aria-label',`${killed?'Rejoin':'Kill'} ${AGENT_NAMES[id]}`);$(`isolate${id}`).textContent=this.fleet.isolated[id]?'Reconnect':'Isolate';$(`isolate${id}`).setAttribute('aria-label',`${this.fleet.isolated[id]?'Reconnect':'Isolate'} ${AGENT_NAMES[id]}`);$(`isolate${id}`).classList.toggle('active',this.fleet.isolated[id]);}
  }
  showError(message){$('stageError').hidden=false;$('stageError').textContent=message;}
  update(states){
    const now=performance.now(),measurement=measurePhase(states,now);this.graph.update(now,measurement);
    $('assetStatus').textContent=this.audio.status;$('audioButton').textContent=this.audio.enabled?'Mute':'Enable audio';
    const error=measurement?.disagreement??Infinity;
    $('beatError').textContent=measurement?`${error.toFixed(3)} beats`:'—';$('msError').textContent=measurement?`${measurement.milliseconds.toFixed(1)} ms`:'Awaiting peers';
    const live=states.filter(s=>s?.alive&&s.playing&&now-s.receivedAt<1800);
    if(this.recoveryStart!==null){if(error<.08&&live.length>=2&&live.every(s=>s.peers.length>=live.length-1)){this.stableSince??=now;if(now-this.stableSince>=1000){this.recovery=`${((now-this.recoveryStart)/1000).toFixed(2)} s`;this.recoveryStart=null;}}else this.stableSince=null;}
    $('recovery').textContent=this.recovery;
    $('messagesReceived').textContent=states.reduce((a,s)=>a+(s?.received??0),0);$('packetsDropped').textContent=states.reduce((a,s)=>a+(s?.dropped??0),0);
    const faults=this.fleet.isolated.some(Boolean)||Object.values(this.fleet.network).some(Number);
    $('networkBadge').textContent=!this.fleet.session?'READY / DRIFT ON':this.fleet.paused?'PAUSED':faults?'SIMULATED NETWORK FAULTS':`${this.fleet.workers.filter(Boolean).length} PRIVATE OSCILLATORS`;
    $('networkBadge').classList.toggle('warning',faults);
    const representative=live[0];$('showStatus').textContent=representative?`${AGENT_NAMES[representative.id]} · ${representative.section} · ${representative.proposal}`:this.fleet.session?'Listening for a cue or running peer…':'Press Start Concert. No assets required.';
    for(let id=0;id<3;id++){
      const s=states[id],killed=!!this.fleet.session&&!this.fleet.workers[id],stale=s&&now-s.receivedAt>=1800;
      $(`state${id}`).textContent=killed?'KILLED':stale?'STALE':s?.joining?'JOINING':s?.isolated?'ISOLATED':s?.playing?'PERFORMING':this.fleet.paused?'PAUSED':'READY';
      $(`localBeat${id}`).textContent=s?s.beat.toFixed(2):'—';$(`section${id}`).textContent=s?`${s.section} · light ${s.light.intensity.toFixed(2)}`:'AWAITING CUE';
      $(`clock${id}`).textContent=s?`${s.audio.role} · oscillator ${(s.rateError*100).toFixed(3)}% · coupling ${s.adjustment.toFixed(3)} b/s`:'Independent clock · default drift ON';
      $(`phase${id}`).textContent=s?.phaseOffset!==null&&s?.phaseOffset!==undefined?`Local vs peer median: ${s.phaseOffset.toFixed(3)} b / ${(s.phaseOffset*500).toFixed(1)} ms`:'Local vs peers: unavailable';
      const rtt=s?.delayEstimates?.length?Math.max(...s.delayEstimates.map(p=>p.rtt)):null;
      $(`peers${id}`).textContent=`Fresh peers [${s?.peers.join(', ')??''}]${rtt===null?'':` · RTT ≤ ${rtt.toFixed(0)} ms`}`;
      $(`counts${id}`).textContent=`RX ${s?.received??0} · dropped ${s?.dropped??0}`;$(`cue${id}`).textContent=s?.proposal??'Canonical score';
      const recovery=this.fleet.recoveries[id];$(`join${id}`).textContent=recovery?(recovery.elapsed===null?'Rejoin: acquiring peer phase…':`Rejoin stable: ${(recovery.elapsed/1000).toFixed(2)} s`):'';
    }
    this.refresh();if(this.fleet.error)this.notice(this.fleet.error);
  }
}
