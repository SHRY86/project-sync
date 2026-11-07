import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audioCommands} from '../src/audio-selection.js';
const s=(id,beat,options={})=>({id,beat,audio:{position:(beat%64)*.5},rate:.002,receivedAt:100,playing:true,alive:true,...options});
test('mix is circular-median leaderless, including wrap and NOVA death',()=>{
 const states=[s(0,63.98),s(1,.02),s(2,.04)];let commands=audioCommands(states,['concert-full'],100);
 assert.ok(Math.abs(commands[0].position-.01)<1e-8);states[0].alive=false;commands=audioCommands(states,['concert-full'],100);assert.ok(Math.abs(commands[0].position-.015)<1e-8);assert.deepEqual(commands[0].contributors,[1,2]);
 states[1].alive=false;assert.ok(Math.abs(audioCommands(states,['concert-full'],100)[0].position-.02)<1e-8);
 assert.deepEqual(audioCommands(states,['concert-full'],2000),[]);
});
test('stems follow their own agent only, remove dead and stale parts',()=>{
 const states=[s(0,2),s(1,3),s(2,4,{alive:false})];const commands=audioCommands(states,['nova','luna','echo'],150);assert.deepEqual(commands.map(c=>c.name),['nova','luna']);assert.deepEqual(commands.map(c=>c.contributors),[[0],[1]]);assert.ok(Math.abs(commands[0].position-1.05)<1e-8);
});
test('two-file selection emits exactly two sources from the same median',()=>{const c=audioCommands([s(1,12),s(2,14)],['concert-instrumental','concert-vocals'],100);assert.equal(c.length,2);assert.ok(c.every(x=>x.position===6.5));});
