/** Spectator lifecycle/fault controls only. Timing is never handed to a Worker. */
export class AgentFleet {
  constructor(onState){this.onState=onState;this.workers=Array(3).fill(null);this.states=Array(3).fill(null);this.network={lossProbability:0,latency:0,jitter:0};this.isolated=[false,false,false];this.profile='demo';this.scale=1;this.initiator=0;this.paused=false;this.recoveries=Array(3).fill(null);}
  spawn(id){
    const worker=new Worker(new URL('./agent.worker.js',import.meta.url),{type:'module'});
    this.workers[id]=worker;this.states[id]=null;
    worker.onmessage=({data})=>{if(this.workers[id]!==worker)return;if(data.type==='state'){this.states[id]={...data,receivedAt:performance.now(),alive:true};const recovery=this.recoveries[id];if(recovery&&recovery.elapsed===null){const at=performance.now();if(data.playing&&data.peers.length&&Math.abs(data.phaseOffset??Infinity)<.08){recovery.stableSince??=at;if(at-recovery.stableSince>=1000)recovery.elapsed=at-recovery.started;}else recovery.stableSince=null;}this.onState?.(this.states[id]);}};
    worker.onerror=e=>{this.error=`Agent ${id}: ${e.message}`;};
    worker.postMessage({type:'init',id,session:this.session,seed:crypto.getRandomValues(new Uint32Array(1))[0],incarnation:crypto.randomUUID()});
    worker.postMessage({type:'oscillator',profile:this.profile,scale:this.scale});
    worker.postMessage({type:'network',...this.network,isolated:this.isolated[id]});
  }
  start(){this.stop();this.session=crypto.randomUUID();this.paused=false;this.states.fill(null);this.recoveries.fill(null);for(let id=0;id<3;id++)this.spawn(id);this.workers[this.initiator].postMessage({type:'startCue'});}
  kill(id){
    this.workers[id]?.terminate();this.workers[id]=null;
    if(this.states[id])this.states[id]={...this.states[id],alive:false,playing:false,killed:true,peers:[]};
  }
  rejoin(id){if(!this.session||this.workers[id])return;this.recoveries[id]={started:performance.now(),elapsed:null};this.spawn(id);}
  applyNetwork(){this.workers.forEach((w,id)=>w?.postMessage({type:'network',...this.network,isolated:this.isolated[id]}));}
  applyOscillators(){this.workers.forEach(w=>w?.postMessage({type:'oscillator',profile:this.profile,scale:this.scale}));}
  pause(){this.paused=!this.paused;this.workers.forEach(w=>w?.postMessage({type:this.paused?'pause':'resume'}));}
  propose(id=this.initiator){(this.workers[id]??this.workers.find(Boolean))?.postMessage({type:'propose'});}
  stop(){this.workers.forEach(w=>w?.terminate());this.workers.fill(null);}
}
