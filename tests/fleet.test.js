import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AgentFleet} from '../src/agents.js';
test('kill terminates one worker; rejoin sends configuration only, no phase or epoch',()=>{
 const original=globalThis.Worker,created=[];
 globalThis.Worker=class{constructor(){this.messages=[];created.push(this);}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 try{const fleet=new AgentFleet();fleet.start();const survivors=[fleet.workers[1],fleet.workers[2]];fleet.kill(0);assert.ok(created[0].terminated);assert.deepEqual(fleet.workers.slice(1),survivors);fleet.rejoin(0);const init=created[3].messages.find(m=>m.type==='init');assert.deepEqual(Object.keys(init).sort(),['id','incarnation','session','type']);assert.equal(created[3].messages.some(m=>m.type==='startCue'),false);fleet.stop();assert.ok(created.every(w=>w.terminated));}finally{globalThis.Worker=original;}
});
test('observed totals survive kill/rejoin while incarnation counters reset',()=>{
 const original=globalThis.Worker;globalThis.Worker=class{postMessage(){}terminate(){}};
 try{const f=new AgentFleet();f.start();const state={type:'state',id:0,received:10,dropped:3,playing:false,peers:[]};f.workers[0].onmessage({data:state});f.workers[0].onmessage({data:{...state,received:12,dropped:4}});f.kill(0);f.rejoin(0);f.workers[0].onmessage({data:{...state,received:2,dropped:1}});assert.equal(f.totalReceived,14);assert.equal(f.totalDropped,5);f.stop();}finally{globalThis.Worker=original;}
});
test('proposal during rejoin routes to a performing peer',()=>{const f=new AgentFleet(),sent=[];f.workers=[{postMessage:()=>sent.push(0)},{postMessage:()=>sent.push(1)},null];f.states=[null,{playing:true},null];f.propose(0);assert.deepEqual(sent,[1]);});
test('rejoined worker inherits energy/light configuration without receiving clock state',()=>{
 const original=globalThis.Worker;globalThis.Worker=class{constructor(){this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){}};
 try{const f=new AgentFleet();f.configurePerformance({energy:2.7,lightingLevel:.4,lightingEnabled:false});f.start();f.kill(2);f.rejoin(2);const settings=f.workers[2].messages.find(m=>m.type==='performance').settings;assert.equal(settings.energy,2.7);assert.equal(settings.lightingLevel,.4);assert.equal(settings.lightingEnabled,false);assert.equal(Object.hasOwn(settings,'beat'),false);f.stop();}finally{globalThis.Worker=original;}
});
