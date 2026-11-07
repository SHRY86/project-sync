import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseAudioMode,validateDuration,audioName,validateFile,withObjectURL} from '../src/assets.js';
test('exclusive audio modes prefer complete stems, then two-file, then full, then synthetic',()=>{
 for(const [names,want] of [[['nova','luna','echo','concert-full'],['nova','luna','echo']],[['concert-full','concert-instrumental','concert-vocals'],['concert-instrumental','concert-vocals']],[['nova','concert-full'],['concert-full']],[['nova'],[]],[[],[]]])assert.deepEqual(chooseAudioMode(new Map(names.map(n=>[n,{}]))).selection,want);
 assert.match(chooseAudioMode(new Map()).label,/not VOCALOID/);
});
test('asset names, exact duration boundaries and size validated',()=>{assert.equal(audioName('NOVA.wav'),'nova');assert.throws(()=>audioName('unknown.wav'));for(const t of [31.94,32,32.06])validateDuration(t);for(const t of [NaN,31.93,32.07])assert.throws(()=>validateDuration(t));assert.throws(()=>validateFile({name:'avatar.vrm',size:0},'.vrm'));});
test('object URLs revoked on success and parsing failure',async()=>{const create=URL.createObjectURL,revoke=URL.revokeObjectURL;let freed=0;URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>freed++;try{await withObjectURL({},async()=>true);await assert.rejects(()=>withObjectURL({},async()=>{throw new Error('invalid');}));assert.equal(freed,2);}finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;}});
