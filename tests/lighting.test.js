import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {decidePerformance,songConfig} from '../src/score.js';
import {PeerAgent} from '../src/peer-agent.js';
import {StageLighting} from '../src/stage-lighting.js';
import {performanceSettings} from '../src/performance-settings.js';
import {readFileSync} from 'node:fs';
test('each light pulse follows its own worker beat, target follows its own pose',()=>{
 for(let id=0;id<3;id++){
  const on=decidePerformance(id,4),offBeat=decidePerformance(id,4.5);
  assert.ok(on.light.pulse>offBeat.light.pulse);assert.equal(on.light.target.x,on.pose.offset);
  assert.deepEqual(decidePerformance(id,4),on);assert.equal(on.light.barLevels.length,5);
 }
 assert.notEqual(decidePerformance(0,4).light.color,decidePerformance(1,4).light.color);
});
test('energy changes bounded worker poses without changing beat or cue phase',()=>{
 const a=new PeerAgent(1,'test',()=>{});a.clock.join(5,0);a.clock.paused=true;
 a.configurePerformance({energy:0});const still=a.tick(100);a.configurePerformance({energy:3});const active=a.tick(100);
 assert.equal(active.beat,still.beat);assert.equal(active.light.pulse,still.light.pulse);assert.ok(Math.abs(active.pose.armL)>Math.abs(still.pose.armL));
 for(let id=0;id<3;id++)for(let beat=0;beat<=32;beat+=.125){const p=decidePerformance(id,beat,false,songConfig(),{energy:3}).pose;assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.armL)<=2.2&&Math.abs(p.legL)<=.6&&p.hop<=.08400001);}
});
test('disabled, ready and finished light states are explicit and do not flash',()=>{
 const off=decidePerformance(0,4,false,songConfig(),{lightingEnabled:false}).light;assert.equal(off.power,0);assert.equal(off.beamOpacity,0);assert.ok(off.barLevels.every(x=>x===0));
 const a=new PeerAgent(0,'new',()=>{});assert.equal(a.tick(0).light.mode,'READY');assert.equal(a.tick(33).light.power,0);
 const end=decidePerformance(2,32).light;assert.equal(end.mode,'CURTAIN');assert.equal(end.pulse,0);assert.equal(end.beamOpacity,0);assert.deepEqual(end,decidePerformance(2,200).light);
});
test('renderer maps emitted zone commands exactly and extinguishes killed zones',()=>{
 const scene=new THREE.Scene(),adapter=new StageLighting(scene),state=decidePerformance(2,6);
 adapter.apply(2,state.light);const z=adapter.zones[2];assert.equal(z.spot.intensity,state.light.power);assert.equal(z.spot.target.position.x,3.5+state.pose.offset);assert.equal(z.beam.material.opacity,state.light.beamOpacity);assert.ok(z.beam.visible);
 adapter.apply(2,null);assert.equal(z.spot.intensity,0);assert.equal(z.beam.visible,false);assert.ok(z.bars.every(b=>b.material.emissiveIntensity===0));
});
test('performance settings validate and overview stays under 200 characters',()=>{assert.equal(performanceSettings({energy:100}).energy,3);assert.equal(performanceSettings({lightingLevel:-5}).lightingLevel,0);assert.ok(readFileSync('docs/project-overview.md','utf8').trim().length<=200);});
