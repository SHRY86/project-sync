import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true}),page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.peers=[];const W=Worker;window.Worker=class extends W{constructor(...a){super(...a);this.addEventListener('message',({data})=>{if(data.type==='state')window.peers[data.id]=data;});}};});
try{
 for(const id of [0,1,2]){
  await page.goto(process.env.SYNC_TEST_URL||'http://127.0.0.1:5173');await page.click('#startButton');await page.waitForFunction(()=>window.peers.length===3&&window.peers.every(s=>s?.peers.length===2));
  await page.click(`#isolate${id}`);await page.waitForFunction(id=>window.peers[id]?.isolated&&window.peers[id].peers.length===0,id);
  await page.waitForTimeout(7000);
  assert.ok(await page.evaluate(id=>window.peers.filter(s=>s.id!==id).every(s=>s.peers.length===1),id));
  const group=Number((await page.textContent('#beatError')).split(' ')[0]);assert.ok(group<.12,`id ${id}: group ${group}`);
  const all=await page.textContent('#holdoverError');console.log(`Isolate ${id}: group ${group.toFixed(3)} beats; ${all}`);assert.ok((await page.textContent('#pairErrors')).includes('NOVA ↔ LUNA'));
  await page.click('#restoreButton');await page.waitForFunction(()=>window.peers.every(s=>s.peers.length===2));
 }
 assert.deepEqual(errors,[]);console.log('PASS: actual symmetric isolation controls for NOVA, LUNA and ECHO; active-peer graph separated from holdover; peer-only reconnection.');
}finally{await browser.close();}
