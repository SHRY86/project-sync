import {chromium} from '@playwright/test';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {wavBytes} from './make-demo-audio.mjs';
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 window.songEvidence={states:[],starts:0,active:0,loops:[]};const W=Worker;
 window.Worker=class extends W{constructor(...a){super(...a);this.addEventListener('message',({data})=>{if(data.type==='state')window.songEvidence.states[data.id]=data;});}};
 const A=AudioContext;window.AudioContext=class extends A{constructor(...a){super(...a);const create=this.createBufferSource.bind(this);this.createBufferSource=()=>{const s=create(),start=s.start.bind(s);s.start=(...args)=>{window.songEvidence.starts++;window.songEvidence.active++;window.songEvidence.loops.push(s.loop);start(...args);};s.addEventListener('ended',()=>window.songEvidence.active--);return s;};}};
});
try{
 const url=process.env.SYNC_TEST_URL||'http://127.0.0.1:5173';await page.goto(url);await page.locator('#assetDetails').evaluate(e=>e.open=true);
 let song=process.env.SYNC_SONG_FILE;if(!song){const dir=mkdtempSync(join(tmpdir(),'sync-song-fixture-'));song=join(dir,'synthetic-test-16s.wav');writeFileSync(song,wavBytes(Float32Array.from({length:16000*16},(_,i)=>Math.sin(i/16000*440*Math.PI*2)*.02)));}
 await page.setInputFiles('#audioFiles',song);
 await page.waitForFunction(()=>document.getElementById('assetStatus').textContent.includes('16.00 s'));
 await page.click('#startButton');await page.waitForFunction(()=>window.songEvidence.active>0);
 await page.waitForFunction(()=>window.songEvidence.states.filter(Boolean).length===3&&window.songEvidence.states.every(s=>s.finished),null,{timeout:24000});
 await page.waitForFunction(()=>window.songEvidence.active===0);const count=await page.evaluate(()=>window.songEvidence.starts);
 await page.waitForTimeout(2200);assert.equal(await page.evaluate(()=>window.songEvidence.starts),count);assert.ok(await page.evaluate(()=>window.songEvidence.loops.every(loop=>loop===false)));assert.ok(await page.evaluate(()=>window.songEvidence.states.every(s=>s.beat>34&&s.pose.hop===0&&s.playing)));
 assert.match(await page.textContent('#showStatus'),/Song finished/);
 // A longer file crosses the old 32-second/64-beat boundary using linear commands.
 const tmp=mkdtempSync(join(tmpdir(),'sync-long-song-')),file=join(tmp,'arbitrary-title.wav');writeFileSync(file,wavBytes(new Float32Array(16000*40)));
 await page.setInputFiles('#audioFiles',file);await page.waitForFunction(()=>document.getElementById('assetStatus').textContent.includes('40.00 s'));assert.deepEqual(errors,[]);
 console.log('PASS: 16 s supplied/test WAV accepted without renaming, plays once, stops without respawn, clocks remain P2P-active, final pose holds; arbitrary-name 40 s WAV accepted.');
}finally{await browser.close();}
