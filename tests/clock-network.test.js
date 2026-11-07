import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ShowClock, RATE, SHARED_CORRECTION_LIMIT, rejectObservation, projectBeat, phaseDifference} from '../src/clock.js';
import {measurePhase} from '../src/metrics.js';
import {simulate} from './helpers/clock-simulation.js';
import {clockCases} from './helpers/clock-cases.js';
for (const scenario of clockCases) test(`deterministic network: ${scenario.name}`,()=>{
 const result=simulate({...scenario,accept:rejectObservation,measure:measurePhase});
 const fmt=stats=>['max','mean','p95'].map(k=>`${stats[k].toFixed(6)} beats / ${(stats[k]/RATE).toFixed(3)} ms`).join(', ');
 console.log(`${scenario.name} | worker max/mean/p95: ${fmt(result.actual)} | aligned UI: ${fmt(result.alignedUI)} | UI artifact max: ${(result.artifacts.max/RATE).toFixed(3)} ms`);
 assert.ok(result.actual.max<.08,JSON.stringify(result));
 assert.ok(result.artifacts.max<.0003,JSON.stringify(result.artifacts));
 if(!scenario.stress){assert.ok(result.maxCorrection<=SHARED_CORRECTION_LIMIT);assert.ok(result.lastHalf.mean<result.firstHalf.mean+.01);}
 assert.ok(result.finalCorrections.every(c=>Math.abs(c)<=(scenario.stress ? .35 : SHARED_CORRECTION_LIMIT)));
 if(scenario.isolation)assert.ok(result.recoveryMs!==null&&result.recoveryMs<2000);
 if(scenario.loss===1)assert.ok(result.drops>0);
 if(scenario.jitter>=200 && scenario.loss!==1)assert.ok(result.reordered>0);
 // Every run spans >5 full 64-beat loops with independently staggered worker ticks.
});
test('one sample epoch is used even if serialization/send takes time',()=>{
 const peer={beat:63.9,sampleAt:1000,sentAt:1050,rate:RATE,playing:true};
 assert.equal(rejectObservation(peer,1500),null);
 assert.ok(Math.abs(phaseDifference(projectBeat(peer,1500),64.9))<1e-10);
 assert.equal(rejectObservation({...peer,sampleAt:1600},1500),'stale/epoch');
 assert.equal(rejectObservation({...peer,sentAt:1600},1500),'stale/epoch');
 assert.equal(rejectObservation(peer,2200),'stale/epoch');
 assert.equal(rejectObservation(peer,1500,1100),'out-of-order');
 assert.equal(rejectObservation(peer,1500,1000),'out-of-order');
 assert.equal(rejectObservation({...peer,beat:NaN},1500),'invalid');
});
test('cached delayed samples cannot integrate an absolute correction or move time backwards',()=>{
 const c=new ShowClock(0,0),peer={beat:.8,sampleAt:100,sentAt:100,playing:true};
 let previous=0;
 for(let now=100;now<10000;now+=33){const beat=c.tick(now,new Map([[1,peer]]));assert.ok(beat>=previous);previous=beat;assert.ok(Math.abs(c.correction)<=SHARED_CORRECTION_LIMIT);}
 assert.equal(c.correction,0); // stale packet no longer has any influence
});
test('pre-start zero beats are never projected as running estimates',()=>{
 const c=new ShowClock(0,10000);
 for(let now=9400;now<10000;now+=33)c.tick(now,new Map([[1,{beat:0,sampleAt:now-300,sentAt:now-300,playing:false}]]));
 assert.equal(c.correction,0);assert.equal(c.beat,0);
 c.tick(10010,new Map([[1,{beat:0,sampleAt:9900,sentAt:9900,playing:false}]]));assert.equal(c.correction,0);
});
test('display alignment removes asynchronous-sample artifacts across a loop',()=>{
 const now=1700000032010;
 const states=[0,11,23].map(age=>({beat:64.02-age*RATE,timestamp:now-age,rate:RATE,playing:true}));
 assert.ok(measurePhase(states,now).disagreement<1e-10);
 assert.equal(measurePhase(states,now+1200),null);
 assert.equal(measurePhase(states.map((s,i)=>({...s,playing:i===0})),now),null);
});
test('drift integration accounts for real elapsed time after worker suspension',()=>{
 const c=new ShowClock(1,0);c.stress=true;c.tick(60000,new Map(),true);
 assert.ok(Math.abs(c.drift-60000*RATE*95/1e6)<1e-12);
});
test('leaving stress slews correction without phase jumps or reverse time',()=>{
 const c=new ShowClock(0,0);c.last=1000;c.beat=1.8;c.correction=.2;c.stress=false;
 c.tick(1033,new Map(),true);
 assert.ok(Math.abs(c.correction-.2)<=33*.000002+1e-12);assert.ok(c.beat>=1.8);
});
test('regression: pre-fix cached observation integrates a much larger correction',async()=>{
 const {LegacyClock}=await import('./helpers/legacy-clock.js');
 const fixed=new ShowClock(0,0),legacy=new LegacyClock(0,0);
 const packet={beat:.8,sampleAt:100,sentAt:100,playing:true};
 for(let now=100;now<1100;now+=33){fixed.tick(now,new Map([[1,packet]]));legacy.tick(now,new Map([[1,packet]]));}
 assert.ok(legacy.correction>.08);assert.ok(fixed.correction<=SHARED_CORRECTION_LIMIT);
});
