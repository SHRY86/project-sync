import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{window.lightingEvidence=[];const Original=Worker;window.Worker=class extends Original{constructor(...a){super(...a);this.addEventListener('message',({data})=>{if(data.type==='state')window.lightingEvidence[data.id]=data;});}};});
const setRange=async(id,value)=>{await page.locator(`#${id}`).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);};
try{
 await page.goto(process.env.SYNC_TEST_URL||'http://127.0.0.1:5173');assert.equal(await page.locator('#claims').count(),0);
 await page.click('#startButton');await page.waitForFunction(()=>window.lightingEvidence.length===3&&window.lightingEvidence.every(s=>s.playing&&s.beat>2&&s.light.power>0));
 await page.click('#pauseButton');await page.waitForFunction(()=>window.lightingEvidence.every(s=>!s.playing));
 const before=await page.evaluate(()=>window.lightingEvidence.map(s=>({beat:s.beat,pulse:s.light.pulse,power:s.light.power})));
 await setRange('energy',0);await page.waitForFunction(()=>window.lightingEvidence.every(s=>s.energy===0&&s.pose.armL===0));
 await setRange('energy',3);await page.waitForFunction(()=>window.lightingEvidence.every(s=>s.energy===3));
 const after=await page.evaluate(()=>window.lightingEvidence);after.forEach((s,i)=>{assert.equal(s.beat,before[i].beat);assert.equal(s.light.pulse,before[i].pulse);assert.equal(s.light.target.x,s.pose.offset);});assert.ok(after.some(s=>Math.abs(s.pose.armL)>.3));
 await page.uncheck('#lightingEnabled');await page.waitForFunction(()=>window.lightingEvidence.every(s=>s.light.mode==='OFF'&&s.light.power===0&&s.light.beamOpacity===0));
 await page.check('#lightingEnabled');await setRange('lightingLevel',.3);await page.waitForFunction(()=>window.lightingEvidence.every(s=>s.light.power>0&&s.light.power<=37.5));
 const dim=await page.evaluate(()=>window.lightingEvidence);dim.forEach((s,i)=>assert.ok(Math.abs(s.light.power/before[i].power-.3/.85)<1e-8));
 await setRange('lightingLevel',.85);await setRange('energy',1.8);await page.click('#pauseButton');await page.waitForFunction(()=>window.lightingEvidence.every(s=>s.playing));
 await page.waitForTimeout(400);await page.locator('#stage').scrollIntoViewIfNeeded();await page.screenshot({path:'browser-preview.png',fullPage:true});
 const docs=await page.evaluate(async()=>{const r=await fetch('/docs/claims-vs-evidence.md');return {status:r.status,text:await r.text()};});assert.equal(docs.status,200);assert.ok(docs.text.includes('Not claimed'));assert.deepEqual(errors,[]);
 console.log('PASS: worker-owned character lighting, energy 0–3, frozen pause phase, brightness scaling, on/off, removed website claims panel, bundled technical document and clean WebGL render.');
}finally{await browser.close();}
