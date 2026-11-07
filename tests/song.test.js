import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PeerAgent} from '../src/peer-agent.js';
import {decidePerformance,songConfig} from '../src/score.js';
import {measurePhase} from '../src/metrics.js';
import {VocalMixer} from '../src/audio.js';
test('each worker owns finite song sections, audio position never wraps after 64 beats',()=>{const a=new PeerAgent(2,'test',()=>{});a.configureSong({durationSeconds:80,title:'Long song'});a.clock.join(63,0);const s=a.tick(1000);assert.ok(s.audio.position>=32);assert.equal(s.finished,false);a.tick(60000);assert.equal(a.tick(90000).finished,true);assert.equal(a.clock.running,true);});
test('16-second tune holds a quiet final pose and no voice after its end',()=>{const score=songConfig({durationSeconds:16});for(let id=0;id<3;id++){const end=decidePerformance(id,32,false,score),later=decidePerformance(id,128,false,score);assert.equal(end.finished,true);assert.equal(end.voice.pitch,0);assert.deepEqual(end.pose,later.pose);assert.equal(end.pose.hop,0);assert.ok(Math.abs(decidePerformance(id,8).pose.hop)<.03);}});
test('headline measures active P2P group; isolated holdover and every pair remain observable',()=>{for(let isolated=0;isolated<3;isolated++){const states=[0,1,2].map(id=>({id,beat:id===isolated?3:2,rate:.002,receivedAt:100,alive:true,playing:true,isolated:id===isolated}));assert.equal(measurePhase(states,100).disagreement,0);const all=measurePhase(states,100,{includeIsolated:true});assert.equal(all.disagreement,1);assert.equal(all.pairs.length,3);}});
test('one-shot source stops naturally and never respawns from stale commands',()=>{
 const audio=new VocalMixer();let starts=0,source;audio.buffers.set('concert-full',{duration:16});
 const param={value:0,setTargetAtTime(){},cancelScheduledValues(){}};
 audio.ctx={currentTime:0,createBufferSource(){source={connect(){},start(){starts++;},playbackRate:param};return source;},createGain(){return {gain:param,connect(){}};}};audio.master={};
 audio.playAsset('concert-full',{position:0,rate:1});assert.equal(source.loop,false);source.onended();audio.playAsset('concert-full',{position:15.9,rate:1});assert.equal(starts,1);audio.reset();audio.playAsset('concert-full',{position:0,rate:1});assert.equal(starts,2);
});
