import { ShowClock, phaseDifference, RATE } from '../../src/clock.js';
const EPOCH = 1700000000000;
export function statistics(values) {
  const sorted=[...values].sort((a,b)=>a-b);
  return {max:Math.max(...values),mean:values.reduce((a,b)=>a+b,0)/values.length,p95:sorted[Math.ceil(sorted.length*.95)-1]};
}
export function simulate({latency=0,jitter=0,loss=0,isolation=false,stress=false,duration=180000,Clock=ShowClock,accept,measure}={}) {
  let seed=123456789;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
  const startAt=EPOCH+600,clocks=[0,1,2].map(id=>new Clock(id,startAt));
  clocks.forEach(c=>c.stress=stress);
  const caches=clocks.map(()=>new Map()), watermarks=clocks.map(()=>new Map());
  const nextTick=[0,11,23],lastTx=[-Infinity,-Infinity,-Infinity],lastBeat=[0,0,0];
  const states=Array(3).fill(null),queue=[],actual=[],rawUI=[],alignedUI=[],artifacts=[];
  let drops=0,reordered=0,recoveryMs=null,maxCorrection=0;
  const isolated=(id,t)=>isolation&&id===1&&t>=30000&&t<90000;
  // Event ordering: network delivery, then independently staggered worker ticks.
  for(let t=0;t<=duration;t++) {
    const now=EPOCH+t;
    for(let i=queue.length-1;i>=0;i--)if(queue[i].at<=t){
      const {to,message:m,from,created}=queue.splice(i,1)[0];
      if(isolated(to,t)||isolated(from,created)){drops++;continue;}
      if(accept){const verdict=accept(m,now,watermarks[to].get(from));if(verdict){drops++;if(verdict==='out-of-order')reordered++;continue;}}
      else if(now-m.sentAt>1200||now<m.sentAt||m.sentAt<=(watermarks[to].get(from)??-Infinity)){drops++;continue;}
      watermarks[to].set(from,m.sampleAt??m.sentAt);caches[to].set(from,m);
    }
    for(let id=0;id<3;id++)if(t===nextTick[id]){
      nextTick[id]+=33;
      for(const [key,p] of caches[id])if(now-(p.sampleAt??p.sentAt)>=1200)caches[id].delete(key);
      if(isolated(id,t))caches[id].clear();
      const beat=clocks[id].tick(now,caches[id],isolated(id,t));
      maxCorrection=Math.max(maxCorrection,Math.abs(clocks[id].correction));
      if(beat<lastBeat[id])throw new Error('Non-monotonic worker');lastBeat[id]=beat;
      states[id]={beat,timestamp:now,playing:now>=startAt,rate:RATE+(clocks[id].driftRate?.()??0),startAt};
      if(t-lastTx[id]>=180){lastTx[id]=t;
        const m={id,type:'clock',beat,sampleAt:now,sentAt:now,playing:now>=startAt,startAt,rate:RATE+(clocks[id].driftRate?.()??0)};
        for(let to=0;to<3;to++)if(to!==id){if(isolated(id,t)||random()<loss){drops++;continue;}const delay=Math.max(0,latency+(random()*2-1)*jitter);queue.push({to,from:id,message:m,at:t+Math.ceil(delay),created:t});}
      }
    }
    if(t>=1000&&t%33===0&&states.every(Boolean)){
      // Pure clock evaluation at exactly now, without applying another correction.
      const truth=clocks.map(c=>c.sampleAt?c.sampleAt(now):c.beat+(now-c.last)*RATE);
      const spread=values=>Math.max(...values.flatMap(a=>values.map(b=>Math.abs(phaseDifference(a,b)))));
      actual.push(spread(truth));rawUI.push(spread(states.map(s=>s.beat)));
      const displayed=measure?measure(states,now).disagreement:spread(states.map(s=>s.beat+(now-s.timestamp)*RATE));
      alignedUI.push(displayed);artifacts.push(Math.abs(displayed-spread(truth)));
      if(isolation&&t>=90000&&recoveryMs===null&&spread(truth)<.08&&caches.every(p=>p.size===2))recoveryMs=t-90000;
    }
  }
  return {latency,jitter,loss,isolation,stress,actual:statistics(actual),rawUI:statistics(rawUI),alignedUI:statistics(alignedUI),artifacts:statistics(artifacts),drops,reordered,recoveryMs,maxCorrection,firstHalf:statistics(actual.slice(0,Math.floor(actual.length/2))),lastHalf:statistics(actual.slice(Math.floor(actual.length/2))),finalCorrections:clocks.map(c=>c.correction)};
}
