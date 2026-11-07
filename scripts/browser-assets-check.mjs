import {chromium} from '@playwright/test';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {makeDemoAudio,wavBytes} from './make-demo-audio.mjs';
const directory=makeDemoAudio(mkdtempSync(join(tmpdir(),'sync-original-audio-')));
writeFileSync(join(directory,'invalid.vrm'),'Not a VRM file');writeFileSync(join(directory,'invalid.vrma'),'Not a VRMA file');
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.audioEvidence={contexts:0,active:0,started:0};const Original=window.AudioContext;
 window.AudioContext=class extends Original{constructor(...args){super(...args);window.audioEvidence.contexts++;const create=this.createBufferSource.bind(this);this.createBufferSource=()=>{const s=create(),start=s.start.bind(s);s.start=(...a)=>{window.audioEvidence.active++;window.audioEvidence.started++;return start(...a);};s.addEventListener('ended',()=>window.audioEvidence.active--);return s;};}};
});
try{
 const url=process.env.SYNC_TEST_URL||'http://127.0.0.1:5173';await page.goto(url);await page.click('#startButton');
 await page.setInputFiles('#audioFiles',['nova','luna','echo','concert-full'].map(n=>join(directory,`${n}.wav`)));
 await page.waitForFunction(()=>document.getElementById('assetStatus').textContent.includes('Per-agent WAV stems'));
 await page.waitForFunction(()=>window.audioEvidence.active===3,null,{timeout:12000});assert.equal(await page.evaluate(()=>window.audioEvidence.contexts),1);
 await page.click('#kill0');await page.waitForFunction(()=>window.audioEvidence.active===2);
 await page.click('#kill0');await page.waitForFunction(()=>window.audioEvidence.active===3,null,{timeout:10000});
 await page.setInputFiles('#modelFile',join(directory,'invalid.vrm'));await page.waitForFunction(()=>document.getElementById('importReport').textContent.includes('Procedural fallback'));
 await page.setInputFiles('#animationFile',join(directory,'invalid.vrma'));await page.waitForFunction(()=>document.getElementById('importReport').textContent.includes('Procedural dance'));
 await page.reload();await page.click('#startButton');await page.setInputFiles('#audioFiles',join(directory,'concert-full.wav'));await page.waitForFunction(()=>window.audioEvidence.active===1);
 await page.click('#kill0');await page.waitForTimeout(600);assert.ok(await page.evaluate(()=>window.audioEvidence.active>=1));assert.match(await page.textContent('#assetStatus'),/median/);
 writeFileSync(join(directory,'concert-full.wav'),wavBytes(new Float32Array(16000)));
 await page.setInputFiles('#audioFiles',join(directory,'concert-full.wav'));await page.waitForFunction(()=>document.getElementById('importReport').textContent.includes('rejected'));
 await page.waitForFunction(()=>document.getElementById('assetStatus').textContent.includes('not VOCALOID'));
 assert.deepEqual(errors,[]);console.log('PASS: runtime original WAVs, exclusive stems, real buffer playback, dead/rejoined stem lifecycle, living-agent mix after NOVA death, invalid duration/VRM/VRMA fallbacks; valid external VRM/VRMA files unavailable.');
}catch(error){console.log('Browser asset diagnostic',errors,await page.evaluate(()=>({evidence:window.audioEvidence,status:document.getElementById('assetStatus').textContent,agents:document.getElementById('agents').textContent,report:document.getElementById('importReport').textContent})));throw error;}finally{await browser.close();}
