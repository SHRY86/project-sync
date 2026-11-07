import {PrivateOscillator,phaseDifference,RATE} from '../../src/clock.js';
import {PeerAgent} from '../../src/peer-agent.js';
import {measurePhase} from '../../src/metrics.js';
export function statistics(values){if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);return {max:s.at(-1),mean:s.reduce((a,b)=>a+b,0)/s.length,p95:s[Math.ceil(s.length*.95)-1]};}
export function simulate(config={}){
 const {latency=0,jitter=0,loss=0,duration=180000,isolation=false,kill=false,blackout=false,loseCues=false,profile='demo',asymmetric=false}=config;
 let t=0,seed=123456789,serial=0,drops=0;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const agents=[],oscillators=[],next=[0,11,23],queue=[],states=[null,null,null],previous=[0,0,0],actual=[],ui=[],artifacts=[],isolatedErrors=[];let recoveryMs=null,joinMs=null;
 const isIsolated=(id,at)=>isolation&&id===1&&at>=30000&&at<90000;
 function spawn(id){const birth=t;oscillators[id]=new PrivateOscillator(id,12345+id*5000+serial,()=>t-birth);oscillators[id].configure(profile);agents[id]=new PeerAgent(id,`test-${id}-${serial++}`,m=>{
   for(let to=0;to<3;to++)if(to!==id&&(m.to===undefined||m.to===to)){
    if(!agents[to]||isIsolated(id,t)||isIsolated(to,t)||(blackout&&t>=10000)||(loseCues&&to!==0&&m.type==='cue')||random()<loss){drops++;continue;}
    const delay=Math.max(0,latency+(random()*2-1)*jitter+(asymmetric&&id<to?100:0));queue.push({to,m,at:t+Math.ceil(delay)});
   }
 });next[id]=t;previous[id]=0;}
 for(let id=0;id<3;id++)spawn(id);
 agents[0].originate(oscillators[0].now());
 for(t=0;t<=duration;t++){
  if(kill&&t===30000){agents[0]=null;states[0]=null;}
  if(kill&&t===60000)spawn(0);
  if(isolation&&t===30000)agents[1].isolate();
  for(let i=queue.length-1;i>=0;i--)if(queue[i].at<=t){const {to,m}=queue.splice(i,1)[0];if(!agents[to]||isIsolated(to,t)){drops++;continue;}agents[to].receive(m,oscillators[to].now());}
  for(let id=0;id<3;id++)if(agents[id]&&t>=next[id]){
   next[id]=t+33;const state=agents[id].tick(oscillators[id].now());
   if(state.beat<previous[id])throw new Error('Local show time reversed');previous[id]=state.beat;
   states[id]={...state,receivedAt:t,rate:state.rate*oscillators[id].ratio,alive:true};
  }
  if(t>=5000&&t%33===0){
   const truth=agents.filter(a=>a?.clock.running).map(a=>a.clock.sampleAt(oscillators[a.id].now()));
   if(truth.length<2)continue;
   const spread=Math.max(...truth.flatMap(a=>truth.map(b=>Math.abs(phaseDifference(a,b)))));actual.push(spread);
   const measurement=measurePhase(states,t);if(measurement){ui.push(measurement.disagreement);artifacts.push(Math.abs(spread-measurement.disagreement));}
   if(isolation&&t>=30000&&t<90000)isolatedErrors.push(spread);
   if(isolation&&t>=90000&&recoveryMs===null&&spread<.08)recoveryMs=t-90000;
   if(kill&&t>=60000&&joinMs===null&&agents[0].clock.running&&spread<.08)joinMs=t-60000;
  }
 }
 return {name:config.name,latency,jitter,loss,profile,actual:statistics(actual),ui:statistics(ui),artifact:statistics(artifacts),isolation:statistics(isolatedErrors),recoveryMs,joinMs,drops,running:agents.filter(a=>a?.clock.running).length,finalDisagreement:actual.at(-1),finalBeats:agents.map(a=>a?.clock.beat??null)};
}
