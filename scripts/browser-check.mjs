import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
  window.observed={states:[],created:0,terminated:0,contexts:0};
  const W=window.Worker;window.Worker=class extends W{constructor(...args){super(...args);window.observed.created++;this.addEventListener('message',e=>{if(e.data.type==='state')window.observed.states[e.data.id]=e.data;});}postMessage(m){if(m.type==='init')this.agentId=m.id;super.postMessage(m);}terminate(){window.observed.terminated++;window.observed.states[this.agentId]=null;super.terminate();}};
  const A=window.AudioContext;window.AudioContext=class extends A{constructor(...a){super(...a);window.observed.contexts++;}};
});
try{
 await page.goto(process.env.SYNC_TEST_URL || 'http://127.0.0.1:5173');await page.click('#startButton');await page.waitForFunction(()=>window.observed.states.filter(Boolean).length===3 && window.observed.states.every(s=>s.beat>2));
 assert.match(await page.textContent('#assetStatus'),/Synthetic/);
 assert.match(await page.textContent('#modelStatus'),/Procedural fallback/);
 assert.equal(await page.locator('canvas').count(),1);
 const before=await page.evaluate(()=>window.observed.states[1].beat);
 await page.click('#isolate1');await page.waitForTimeout(1500);
 assert.ok(await page.evaluate(b=>window.observed.states[1].isolated&&window.observed.states[1].beat>b+2,before));
 await page.locator('#loss').fill('100');await page.locator('#loss').dispatchEvent('input');
 const packets=await page.evaluate(()=>window.observed.states.reduce((a,s)=>a+s.dropped,0));await page.waitForTimeout(500);
 assert.ok(await page.evaluate(n=>window.observed.states.reduce((a,s)=>a+s.dropped,0)>n,packets));
 await page.click('#restoreButton');await page.waitForFunction(()=>window.observed.states.every(s=>s.peers.length===2));
 await page.click('#kill0');await page.waitForTimeout(300);const survivor=await page.evaluate(()=>window.observed.states[1].beat);await page.click('#proposalButton');
 await page.waitForFunction(()=>window.observed.states.slice(1).every(s=>s.proposal.includes('canonical fallback')),null,{timeout:12000});
 assert.ok(await page.evaluate(b=>window.observed.states[1].beat>b+4,survivor));
 await page.click('#kill0');await page.waitForFunction(()=>window.observed.states[0]?.playing&&window.observed.states[0].peers.length===2,null,{timeout:10000});
 await page.click('#proposalButton');await page.waitForFunction(()=>window.observed.states.every(s=>s.proposal.includes('Approved')),null,{timeout:12000});
 assert.ok(await page.evaluate(()=>window.observed.states.every(s=>s.proposal.includes('Approved'))));
 await page.click('#pauseButton');await page.waitForTimeout(200);const paused=await page.evaluate(()=>window.observed.states[0].beat);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.observed.states[0].beat),paused);
 await page.click('#pauseButton');await page.waitForTimeout(500);assert.ok(await page.evaluate(b=>window.observed.states[0].beat>b,paused));
 await page.click('#restartButton');await page.waitForTimeout(1000);await page.click('#restartButton');await page.waitForTimeout(1000);
 assert.deepEqual(await page.evaluate(()=>({created:window.observed.created,terminated:window.observed.terminated,contexts:window.observed.contexts})),{created:10,terminated:7,contexts:1});
 await page.screenshot({path:'browser-preview.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: rendering, missing assets, real workers, isolation, 100% loss, recovery, kill/rejoin, canonical fallback, encore, pause/resume, restart, single AudioContext; no page errors.');
}catch(error){console.log('Lifecycle diagnostic',errors,await page.evaluate(()=>({states:window.observed.states,created:window.observed.created,terminated:window.observed.terminated,notice:document.getElementById('notice').textContent})));throw error;}finally{await browser.close();}
