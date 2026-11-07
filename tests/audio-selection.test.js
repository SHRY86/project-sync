import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audioCommands} from '../src/audio-selection.js';
const s=(id,beat,options={})=>({id,beat,audio:{position:beat*.5},rate:.002,receivedAt:100,playing:true,alive:true,...options});
test('one-shot mix uses linear living-agent median, independent of NOVA',()=>{
 const states=[s(0,63.98),s(1,64.02),s(2,64.04)];let commands=audioCommands(states,['concert-full'],100,120);
 assert.ok(Math.abs(commands[0].position-32.01)<1e-8);states[0].alive=false;commands=audioCommands(states,['concert-full'],100,120);assert.ok(Math.abs(commands[0].position-32.015)<1e-8);assert.deepEqual(commands[0].contributors,[1,2]);states[1].alive=false;assert.equal(audioCommands(states,['concert-full'],100,120)[0].position,32.02);assert.deepEqual(audioCommands(states,['concert-full'],2000,120),[]);
});
test('stems follow their own agent only and stop at the configured song end',()=>{const states=[s(0,2),s(1,3),s(2,4,{alive:false})];const c=audioCommands(states,['nova','luna','echo'],150,16);assert.deepEqual(c.map(x=>x.name),['nova','luna']);assert.ok(Math.abs(c[0].position-1.05)<1e-8);assert.deepEqual(audioCommands([s(0,32),s(1,33)],['concert-full'],100,16),[]);});
test('two-file selection emits exactly two sources from the same median',()=>{const c=audioCommands([s(1,12),s(2,14)],['concert-instrumental','concert-vocals'],100);assert.equal(c.length,2);assert.ok(c.every(x=>x.position===6.5));});
