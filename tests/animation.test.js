import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {animationTime,sampleAnimation} from '../src/animation.js';
test('VRMA time is seekable, wraps at 64 beats and respects clip duration',()=>{assert.equal(animationTime(64,32),0);assert.equal(animationTime(65,32),.5);assert.equal(animationTime(30,8),7);assert.throws(()=>animationTime(0,0));});
test('actual Three mixer samples identical pose after arbitrary prior seek',()=>{const root=new THREE.Object3D(),track=new THREE.NumberKeyframeTrack('.position[x]',[0,4],[0,4]);const clip=new THREE.AnimationClip('unit test only',4,[track]),mixer=new THREE.AnimationMixer(root);mixer.clipAction(clip).play();sampleAnimation(mixer,3,4);const expected=root.position.x;sampleAnimation(mixer,7,4);sampleAnimation(mixer,3,4);assert.equal(root.position.x,expected);assert.equal(expected,1.5);});
