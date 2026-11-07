import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AgentFleet} from '../src/agents.js';
test('kill terminates one worker; rejoin sends configuration only, no phase or epoch',()=>{
 const original=globalThis.Worker,created=[];
 globalThis.Worker=class{constructor(){this.messages=[];created.push(this);}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 try{const fleet=new AgentFleet();fleet.start();const survivors=[fleet.workers[1],fleet.workers[2]];fleet.kill(0);assert.ok(created[0].terminated);assert.deepEqual(fleet.workers.slice(1),survivors);fleet.rejoin(0);const init=created[3].messages.find(m=>m.type==='init');assert.deepEqual(Object.keys(init).sort(),['id','incarnation','seed','session','type']);assert.equal(created[3].messages.some(m=>m.type==='startCue'),false);fleet.stop();assert.ok(created.every(w=>w.terminated));}finally{globalThis.Worker=original;}
});
