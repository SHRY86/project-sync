/** Spectator lifecycle/configuration only. No musical timing enters a Worker here. */
export class AgentFleet {
  constructor(onState) {
    this.onState=onState;
    this.workers=Array(3).fill(null);this.states=Array(3).fill(null);
    this.network={lossProbability:0,latency:0,jitter:0};this.isolated=[false,false,false];
    this.profile='demo';this.scale=1;this.initiator=0;this.paused=false;
    this.recoveries=Array(3).fill(null);this.counters=Array.from({length:3},()=>({received:0,dropped:0}));
    this.totalReceived=0;this.totalDropped=0;
  }
  spawn(id) {
    const worker=new Worker(new URL('./agent.worker.js',import.meta.url),{type:'module'});
    this.workers[id]=worker;this.states[id]=null;this.counters[id]={received:0,dropped:0};
    worker.onmessage=({data})=>{
      if(this.workers[id]!==worker||data.type!=='state')return;
      this.totalReceived+=Math.max(0,data.received-this.counters[id].received);
      this.totalDropped+=Math.max(0,data.dropped-this.counters[id].dropped);
      this.counters[id]={received:data.received,dropped:data.dropped};
      this.states[id]={...data,receivedAt:performance.now(),alive:true};
      const recovery=this.recoveries[id];
      if(recovery&&recovery.elapsed===null){
        const at=performance.now();
        if(data.playing&&data.peers.length&&Math.abs(data.phaseOffset??Infinity)<.08){
          recovery.stableSince??=at;
          if(at-recovery.stableSince>=1000)recovery.elapsed=at-recovery.started;
        }else recovery.stableSince=null;
      }
      this.onState?.(this.states[id]);
    };
    worker.onerror=e=>{this.error=`Agent ${id}: ${e.message}`;};
    worker.postMessage({type:'init',id,session:this.session,incarnation:crypto.randomUUID()});
    worker.postMessage({type:'oscillator',profile:this.profile,scale:this.scale});
    worker.postMessage({type:'network',...this.network,isolated:this.isolated[id]});
  }
  start() {
    this.stop();this.session=crypto.randomUUID();this.paused=false;this.error=null;
    this.states.fill(null);this.recoveries.fill(null);this.totalReceived=0;this.totalDropped=0;
    for(let id=0;id<3;id++)this.spawn(id);
    this.workers[this.initiator].postMessage({type:'startCue'});
  }
  kill(id) {
    this.workers[id]?.terminate();this.workers[id]=null;
    if(this.states[id])this.states[id]={...this.states[id],alive:false,playing:false,killed:true,peers:[]};
  }
  rejoin(id) {
    if(!this.session||this.workers[id])return;
    this.recoveries[id]={started:performance.now(),elapsed:null};this.spawn(id);
  }
  applyNetwork(){this.workers.forEach((w,id)=>w?.postMessage({type:'network',...this.network,isolated:this.isolated[id]}));}
  applyOscillators(){this.workers.forEach(w=>w?.postMessage({type:'oscillator',profile:this.profile,scale:this.scale}));}
  pause(){this.paused=!this.paused;this.workers.forEach(w=>w?.postMessage({type:this.paused?'pause':'resume'}));}
  propose(id=this.initiator){
    const available=i=>this.workers[i]&&this.states[i]?.playing;
    const candidate=available(id)?id:this.workers.findIndex((_,i)=>available(i)&&!this.isolated[i]);
    if(candidate>=0)this.workers[candidate].postMessage({type:'propose'});
  }
  stop(){this.workers.forEach(w=>w?.terminate());this.workers.fill(null);}
}
