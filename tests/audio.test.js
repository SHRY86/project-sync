import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseAudioMode,validateDuration,audioName,validateFile,withObjectURL} from '../src/assets.js';
test('exclusive audio modes prefer complete stems, then two-file, then full, then synthetic',()=>{
 for(const [names,want] of [[['nova','luna','echo','concert-full'],['nova','luna','echo']],[['concert-full','concert-instrumental','concert-vocals'],['concert-instrumental','concert-vocals']],[['nova','concert-full'],['concert-full']],[['nova'],[]],[[],[]]])assert.deepEqual(chooseAudioMode(new Map(names.map(n=>[n,{duration:16}]))).selection,want);
 assert.match(chooseAudioMode(new Map()).label,/not VOCALOID/);
});
test('arbitrary WAV names and any finite positive song duration are accepted',()=>{assert.equal(audioName('NOVA.wav'),'nova');assert.equal(audioName('brother_john.wav'),'concert-full');assert.throws(()=>audioName('song.mp3'));for(const t of [.1,1,16,31.93,32.07,65,600])validateDuration(t);for(const t of [NaN,0,-1,Infinity])assert.throws(()=>validateDuration(t));assert.throws(()=>validateFile({name:'avatar.vrm',size:0},'.vrm'));});
test('misaligned stem lengths report mismatch rather than playing incompatible parts',()=>{const b=new Map([['nova',{duration:16}],['luna',{duration:20}],['echo',{duration:16}]]);assert.deepEqual(chooseAudioMode(b).selection,[]);assert.match(chooseAudioMode(b).label,/do not match/);b.set('concert-full',{duration:16});assert.deepEqual(chooseAudioMode(b).selection,['concert-full']);});
test('object URLs revoked on success and parsing failure',async()=>{const create=URL.createObjectURL,revoke=URL.revokeObjectURL;let freed=0;URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>freed++;try{await withObjectURL({},async()=>true);await assert.rejects(()=>withObjectURL({},async()=>{throw new Error('invalid');}));assert.equal(freed,2);}finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;}});
