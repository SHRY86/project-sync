import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(process.env.SYNC_TEST_URL||'http://127.0.0.1:5173');await page.click('#startButton');await page.waitForFunction(()=>document.getElementById('state0').textContent==='PERFORMING');
 for(const [width,height] of [[1280,720],[1440,900],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.agent-card').count(),3);assert.ok((await page.locator('canvas').boundingBox()).height>=250);
  if(width===1280)await page.screenshot({path:'browser-preview.png',fullPage:true});
 }
 await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>document.activeElement.blur());await page.keyboard.press('Space');assert.equal(await page.textContent('#pauseButton'),'Resume');await page.keyboard.press('Space');assert.equal(await page.textContent('#pauseButton'),'Pause');
 await page.keyboard.press('d');assert.ok(await page.locator('#demoGuide').isVisible());await page.click('#nextDemo');await page.click('#nextDemo');await page.waitForFunction(()=>document.getElementById('state1').textContent==='ISOLATED');await page.keyboard.press('Escape');assert.ok(await page.locator('#demoGuide').isHidden());
 assert.ok((await page.getAttribute('#phaseLine','d')).length>0);assert.deepEqual(errors,[]);console.log('PASS: 1280×720, 1440×900, mobile layout, graph, guided demo and keyboard transport.');
}finally{await browser.close();}
