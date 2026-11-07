import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PeerTime} from '../src/peer-time.js';
import {simulate} from './helpers/clock-simulation.js';
import {clockCases} from './helpers/clock-cases.js';
for(const scenario of clockCases)test(`private clocks: ${scenario.name}`,()=>{
 const r=simulate(scenario);console.log(`${scenario.name}: ${JSON.stringify(r.actual)}, final ${r.finalDisagreement}, recovery ${r.recoveryMs}, join ${r.joinMs}`);
 assert.equal(r.running,3);assert.ok(r.actual.max<(scenario.blackout?4:2));assert.ok(r.finalBeats.every(b=>b>320));
 if(!scenario.blackout){assert.ok(r.finalDisagreement<.5);}
 if(scenario.isolation&&scenario.profile!=='realistic'){assert.ok(r.isolation.max>.3);assert.ok(r.recoveryMs!==null&&r.recoveryMs<30000);}
 if(scenario.kill)assert.ok(r.joinMs!==null&&r.joinMs<10000);
 if(scenario.blackout)assert.ok(r.finalDisagreement>1);
});
test('four local timestamps estimate offset without shared origins',()=>{const p=new PeerTime();assert.ok(p.observe(100,650,650,200));assert.equal(p.best.offset,500);assert.equal(p.best.rtt,100);const m={beat:64,sampleAt:700,rate:.002};assert.ok(p.accept(m,250));assert.ok(Math.abs(p.project(m,250)-64.1)<1e-8);assert.equal(p.accept(m,251),false);assert.equal(p.accept({...m,sampleAt:100},5000),false);});
