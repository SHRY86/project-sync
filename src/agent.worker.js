import { decidePerformance } from './score.js';
import { ShowClock, monotonicNow, clamp, rejectObservation, observationTime, MAX_OBSERVATION_AGE_MS, RATE } from './clock.js';
import { Coordination } from './coordination.js';
let id, channel, clock, coordination, timer, pausedAt=null, started=false;
let network={isolated:false,lossProbability:0,latency:0,jitter:0,stress:false};
let received=0,dropped=0,lastTx=0,epoch=0;
const peers=new Map();
// Retained after cache expiry: late older samples must never become fresh again.
const clockWatermarks=new Map();
function send(message) {
  if(network.isolated) {dropped+=2;return;}
  channel.postMessage({...message,id,sentAt:monotonicNow()});
}
function deliver(m, token) {
  if(token!==epoch || network.isolated || pausedAt!==null) {dropped++;return;}
  const now=monotonicNow();
  if(now-m.sentAt>1200 || now<m.sentAt) {dropped++;return;}
  if(m.type==='clock') {
    if(rejectObservation(m,now,clockWatermarks.get(m.id))) {dropped++;return;}
    clockWatermarks.set(m.id,observationTime(m));peers.set(m.id,m);
  }
  received++;
  if(m.type!=='clock') coordination.receive(m,clock.beat,send);
}
function tick() {
  const now=monotonicNow();
  for(const [key,p] of peers) if(now-observationTime(p)>=MAX_OBSERVATION_AGE_MS) peers.delete(key);
  const beat=pausedAt===null ? clock.tick(now,peers,network.isolated) : clock.beat;
  if(pausedAt===null && now-lastTx>180) {
    lastTx=now; send({type:'clock',beat,sampleAt:now,playing:now>=clock.startAt,rate:RATE+clock.driftRate()});
    // Repeat proposal and acknowledgements until deadline to tolerate packet loss.
    for(const p of coordination.events.values()) if(beat<p.target-1) {
      if(p.origin===id) send({type:'proposal',key:p.key,target:p.target,origin:id});
      send({type:'ack',key:p.key,target:p.target,origin:p.origin});
    }
  }
  const variation=coordination.update(beat);
  const state=decidePerformance(id,beat,variation);
  postMessage({type:'state',id,beat,...state,timestamp:now,rate:RATE+clock.driftRate(),playing:pausedAt===null && now>=clock.startAt,peers:[...peers.keys()],isolated:network.isolated,received,dropped,correction:clock.correction,proposal:coordination.status});
}
onmessage=({data:m})=>{
  if(m.type==='init' && !started) {
    started=true; id=m.id; clock=new ShowClock(id,m.startAt); coordination=new Coordination(id);
    channel=new BroadcastChannel(`project-sync-${m.session}`);
    channel.onmessage=({data})=>{
      if(!data || !Number.isFinite(data.sentAt) || (data.type==='clock' && !Number.isFinite(data.beat)) || data.id===id || !Number.isInteger(data.id) || data.id<0 || data.id>2) return;
      if(network.isolated || Math.random()<network.lossProbability) {dropped++;return;}
      const delay=clamp(network.latency+(Math.random()*2-1)*network.jitter,0,2000);
      const token=epoch;setTimeout(()=>deliver(data,token),delay);
    };
    timer=setInterval(tick,33);tick();
  }
  if(m.type==='network') {network={...network,...m}; clock.stress=network.stress;if(network.isolated){peers.clear();epoch++;}}
  if(m.type==='pause' && pausedAt===null) {pausedAt=monotonicNow();peers.clear();epoch++;}
  if(m.type==='resume' && pausedAt!==null) {const now=monotonicNow();clock.startAt+=now-pausedAt;clock.last=now;pausedAt=null;peers.clear();}
  if(m.type==='propose' && pausedAt===null) {const p=coordination.propose(clock.beat);coordination.receive(p,clock.beat,send);send(p);}
};
