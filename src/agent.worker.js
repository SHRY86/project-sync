import { PrivateOscillator, clamp } from './clock.js';
import { PeerAgent } from './peer-agent.js';
let oscillator,agent,channel,paused=false,epoch=0;
let network={isolated:false,lossProbability:0,latency:0,jitter:0};
onmessage=({data:m})=>{
  if(m.type==='init' && !agent){
    oscillator=new PrivateOscillator(m.id,m.seed??crypto.getRandomValues(new Uint32Array(1))[0]);
    channel=new BroadcastChannel(`project-sync-${m.session}`);
    agent=new PeerAgent(m.id,m.incarnation,packet=>{
      if(network.isolated){agent.dropped++;return;}channel.postMessage(packet);
    });
    channel.onmessage=({data})=>{
      if(!data||data.id===m.id||(data.to!==undefined&&data.to!==m.id))return;
      if(network.isolated||Math.random()<network.lossProbability){agent.dropped++;return;}
      const token=epoch,delay=clamp(network.latency+(Math.random()*2-1)*network.jitter,0,2500);
      setTimeout(()=>{if(token!==epoch||network.isolated){agent.dropped++;return;}agent.receive(data,oscillator.now());},delay);
    };
    setInterval(()=>{
      const state=agent.tick(oscillator.now());
      // Output adapter may extrapolate using receipt age; these are NOT peer timestamps.
      postMessage({...state,rate:paused?0:state.rate*oscillator.ratio,rateError:oscillator.error,profile:oscillator.profile,isolated:network.isolated,localTime:oscillator.value});
    },33);
  }
  if(!agent)return;
  if(m.type==='startCue')agent.originate(oscillator.now());
  if(m.type==='network'){network={...network,...m};if(network.isolated){agent.isolate();epoch++;}}
  if(m.type==='oscillator')oscillator.configure(m.profile,m.scale);
  if(m.type==='pause'||m.type==='resume'){agent.clock.tick(oscillator.now(),[]);paused=m.type==='pause';agent.clock.paused=paused;agent.clock.last=oscillator.now();agent.peers.clear();epoch++;}
  if(m.type==='propose')agent.propose();
};
