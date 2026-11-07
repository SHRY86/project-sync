import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VocalMixer} from '../src/audio.js';
test('asset selection is exclusive, prefers aligned parts, tolerates missing and rejects wrong duration',async()=>{
 const original=globalThis.fetch;
 try{
  for(const [available,expected] of [
   [['nova','luna','echo','concert-full','concert-instrumental','concert-vocals'],['nova','luna','echo']],
   [['concert-full','concert-instrumental','concert-vocals'],['concert-instrumental','concert-vocals']],
   [['nova','concert-full'],['concert-full']],
   [[],[]],
   [['bad:concert-full'],[]]
  ]){
   globalThis.fetch=async url=>{const name=url.split('/').pop().replace('.wav','');return {ok:available.includes(name)||available.includes(`bad:${name}`),arrayBuffer:async()=>({duration:available.includes(`bad:${name}`)?12:32})};};
   const mixer=new VocalMixer();mixer.ctx={decodeAudioData:async({duration})=>({duration,sampleRate:1000,numberOfChannels:1,getChannelData:()=>new Float32Array(32000).fill(.2)})};
   await mixer.loadAssets();assert.deepEqual(mixer.selection,expected);
   if(!expected.length)assert.match(mixer.status,/Synthetic/);
  }
 }finally{globalThis.fetch=original;}
});
