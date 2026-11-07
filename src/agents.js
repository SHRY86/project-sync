/** Lifecycle and spectator fault injection only. No continuous clock decisions. */
export class AgentFleet {
  constructor(onState) { this.onState=onState;this.workers=[];this.states=Array(3).fill(null);this.network={lossProbability:0,latency:0,jitter:0,stress:false};this.isolated=[false,false,false];this.paused=false; }
  start() {
    this.stop();this.states.fill(null);this.paused=false;
    const session=crypto.randomUUID(),startAt=performance.timeOrigin+performance.now()+600;
    for(let id=0;id<3;id++) {
      const w=new Worker(new URL('./agent.worker.js',import.meta.url),{type:'module'});
      w.onmessage=({data})=>{if(data.type==='state'){this.states[id]=data;this.onState?.(data);}};
      w.onerror=e=>{this.error=`Agent ${id}: ${e.message}`;};
      w.postMessage({type:'init',id,session,startAt});this.workers.push(w);
    }
    this.applyNetwork();
  }
  applyNetwork(){this.workers.forEach((w,id)=>w.postMessage({type:'network',...this.network,isolated:this.isolated[id]}));}
  pause(){this.paused=!this.paused;this.workers.forEach(w=>w.postMessage({type:this.paused?'pause':'resume'}));}
  propose(){this.workers[0]?.postMessage({type:'propose'});}
  stop(){this.workers.forEach(w=>w.terminate());this.workers=[];}
}
