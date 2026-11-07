import {performanceSettings} from './performance-settings.js';
import { ShowClock, RATE, circularMean, circularMedian, phaseDifference, MAX_OBSERVATION_AGE_MS } from './clock.js';
import { PeerTime } from './peer-time.js';
import { Coordination } from './coordination.js';
import { decidePerformance, songConfig } from './score.js';
/** The same autonomous peer core runs in each Worker and deterministic network tests. */
export class PeerAgent {
  constructor(id, incarnation, send) {
    Object.assign(this, { id, incarnation, sendRaw: send, clock: new ShowClock(), coordination: new Coordination(id), links: new Map(), peers: new Map(), incarnations: new Map(), retired: new Set(), pending: new Map(), score: songConfig(), performance: performanceSettings(), lastTx: -Infinity, serial: 0, now: 0, cueAt: null, received: 0, dropped: 0 });
  }
  send(message) { this.sendRaw({ ...message, id: this.id, incarnation: this.incarnation }); }
  originate(now, countdown = 3000) { if (!this.clock.running && this.cueAt === null) this.cueAt = now + countdown; }
  link(id) { if (!this.links.has(id)) this.links.set(id, new PeerTime()); return this.links.get(id); }
  receive(m, now) {
    this.now = now;
    if (!m || m.id === this.id || !Number.isInteger(m.id) || m.id < 0 || m.id > 2 || typeof m.incarnation !== 'string' || (m.to !== undefined && m.to !== this.id)) return;
    if (this.retired.has(m.incarnation)) { this.dropped++; return; }
    const previous = this.incarnations.get(m.id);
    if (previous && previous !== m.incarnation) { this.retired.add(previous); this.links.delete(m.id); this.peers.delete(m.id); }
    this.incarnations.set(m.id, m.incarnation);
    const link = this.link(m.id);
    if (m.type === 'ping') this.send({ type: 'pong', to: m.id, nonce: m.nonce, t0: m.t0, t1: now, t2: now });
    else if (m.type === 'pong') {
      const pending = this.pending.get(m.nonce);
      if (pending === undefined || pending !== m.t0 || !link.observe(m.t0,m.t1,m.t2,now)) { this.dropped++; return; }
      // One broadcast ping expects one response from EACH peer.
    } else if (m.type === 'clock') {
      if (!link.accept(m,now)) { this.dropped++; return; }
      this.peers.set(m.id,{...m,receivedAt:now});
    } else if (m.type === 'cue') {
      if (!this.clock.running && this.cueAt === null && link.fresh(now) && Number.isFinite(m.countdown) && Number.isFinite(m.sampleAt) && m.countdown > 0 && m.countdown <= 3500) {
        const age = link.age(m.sampleAt,now);
        if (age >= -20 && age < m.countdown) this.cueAt = now + m.countdown - Math.max(0,age);
        // Late cue: stay joining; running peer clocks provide the catch-up phase.
      }
    } else if (m.type === 'proposal' || m.type === 'ack') {
      if (this.clock.running && link.fresh(now)) this.coordination.receive(m,this.clock.sampleAt(now),out => this.send(out));
    } else { this.dropped++; return; }
    this.received++;
  }
  observations(now) {
    const result=[];
    for (const [id,p] of this.peers) {
      const link=this.links.get(id), age=link?.age(p.sampleAt,now);
      if (!link?.fresh(now) || now-p.receivedAt >= MAX_OBSERVATION_AGE_MS || age === null || age >= MAX_OBSERVATION_AGE_MS) { this.peers.delete(id); continue; }
      if (p.playing) result.push({id,beat:link.project(p,now)});
    }
    return result;
  }
  tick(now) {
    this.now=now;
    const observations=this.observations(now), beats=observations.map(p=>p.beat);
    if (!this.clock.running) {
      if (beats.length) this.clock.join(circularMean(beats, circularMedian(beats)),now);
      else if (this.cueAt !== null && now>=this.cueAt) this.clock.join((now-this.cueAt)*RATE,now);
    }
    const beat=this.clock.tick(now,beats);
    if (now-this.lastTx>=180) {
      this.lastTx=now;const nonce=`${this.incarnation}:${++this.serial}`;this.pending.set(nonce,now);
      for(const [key,t] of this.pending)if(now-t>6500)this.pending.delete(key);
      this.send({type:'ping',nonce,t0:now});
      this.send({type:'clock',beat,sampleAt:now,rate:this.clock.paused?0:RATE+this.clock.adjustment/1000,playing:this.clock.running&&!this.clock.paused});
      if (this.cueAt!==null && !this.clock.running) this.send({type:'cue',sampleAt:now,countdown:this.cueAt-now});
      for(const p of this.coordination.events.values())if(beat<p.target-1){
        if(p.origin===this.id)this.send({type:'proposal',key:p.key,target:p.target,origin:p.origin});
        this.send({type:'ack',key:p.key,target:p.target,origin:p.origin});
      }
    }
    const variation=this.coordination.update(beat),median=circularMedian(beats);
    return {type:'state',id:this.id,beat,...decidePerformance(this.id,beat,variation,this.score,{...this.performance,active:this.clock.running}),playing:this.clock.running&&!this.clock.paused,joining:!this.clock.running,peers:observations.map(p=>p.id),received:this.received,dropped:this.dropped,adjustment:this.clock.adjustment,phaseOffset:median===null?null:phaseDifference(beat,median),proposal:this.coordination.status,delayEstimates:[...this.links].filter(([,l])=>l.fresh(now)).map(([id,l])=>({id,rtt:l.best.rtt,uncertainty:l.best.rtt/2})),rate:RATE+this.clock.adjustment/1000};
  }
  configurePerformance(settings) {this.performance=performanceSettings({...this.performance,...settings});}
  configureSong(config) { this.score=songConfig(config); }
  propose() { if (!this.clock.running) return; const p=this.coordination.propose(this.clock.beat);this.coordination.receive(p,this.clock.beat,m=>this.send(m));this.send(p); }
  isolate() { this.peers.clear(); }
}
