import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {PeerAgent} from '../src/peer-agent.js';
import {VocalMixer} from '../src/audio.js';
test('runtime has no absolute clock API or cross-realm epoch exchange',()=>{const forbidden=['performance.'+['time','Origin'].join(''),'Date.now(','new Date('];for(const name of readdirSync('src').filter(n=>n.endsWith('.js'))){const source=readFileSync(`src/${name}`,'utf8');for(const term of forbidden)assert.ok(!source.includes(term),`${name}: ${term}`);}});
test('NOVA, LUNA and ECHO can independently originate a relative cue',()=>{for(let id=0;id<3;id++){const a=new PeerAgent(id,'test',()=>{});a.originate(-300,1000);a.tick(699);assert.equal(a.clock.running,false);a.tick(701);assert.equal(a.clock.running,true);}});
test('retired worker incarnation cannot replace a rejoined peer',()=>{const a=new PeerAgent(1,'self',()=>{});const message=incarnation=>({type:'ping',id:0,incarnation,nonce:incarnation,t0:0});a.receive(message('old'),0);a.receive(message('new'),10);a.receive(message('old'),20);assert.equal(a.incarnations.get(0),'new');assert.equal(a.dropped,1);});
test('mute toggles correctly from file-import-enabled output',async()=>{const audio=new VocalMixer();audio.enabled=true;let enables=0;audio.enable=async()=>{enables++;audio.enabled=true;};audio.setVolume=()=>{};assert.equal(await audio.toggle(),false);assert.equal(await audio.toggle(),true);assert.equal(enables,2);});
