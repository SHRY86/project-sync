import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {phaseDifference} from '../src/clock.js';
import {statistics} from '../tests/helpers/clock-simulation.js';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const results=[];const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 window.clockEvidence={states:Array(3).fill(null)};const Original=window.Worker;
 window.Worker=class extends Original{
  constructor(...args){super(...args);this.addEventListener('message',({data})=>{if(data.type==='state')window.clockEvidence.states[data.id]={...data,receivedAt:performance.now()};});}
  postMessage(m){if(m.type==='init')this.agentId=m.id;super.postMessage(m);}
  terminate(){window.clockEvidence.states[this.agentId]=null;super.terminate();}
 };
});
try{
 for(const latency of [0,50,150,500]){
  await page.goto(process.env.SYNC_TEST_URL||'http://127.0.0.1:5173');await page.selectOption('#initiator','2');await page.locator('#latency').fill(String(latency));await page.locator('#latency').dispatchEvent('input');await page.click('#startButton');
  const samples=await page.evaluate(async()=>{
   const result=[],timer=setInterval(()=>{const now=performance.now(),states=window.clockEvidence.states;if(states.every(s=>s?.playing&&now-s.receivedAt<1800))result.push(states.map(s=>s.beat+(now-s.receivedAt)*s.rate));},50);
   await new Promise(r=>setTimeout(r,7000));clearInterval(timer);return result;
  });
  assert.ok(samples.length>30);const values=samples.map(beats=>Math.max(...beats.flatMap(a=>beats.map(b=>Math.abs(phaseDifference(a,b))))));const stats=statistics(values);assert.ok(stats.max<.5);results.push({latency,stats});console.log(latency,stats);
 }
 assert.deepEqual(errors,[]);
 const method='Actual application Workers and WebGL/UI load, private random-offset oscillators, seven seconds per case, ECHO selected for the one-time start cue. Receipt-aligned observer estimates include unmeasured delivery queueing; they are NOT simultaneous worker truth or physical audio alignment. No source-only test harness or epoch exchange is used.';
 writeFileSync('docs/browser-clock-measurements.json',JSON.stringify({method,results},null,2)+'\n');
 let md=`# Browser private-clock observations\n\n${method}\n\n| Latency | Max beats / ms | Mean beats / ms | p95 beats / ms |\n|---|---|---|---|\n`;
 for(const r of results)md+=`| ${r.latency} ms | ${['max','mean','p95'].map(k=>`${r.stats[k].toFixed(4)} / ${(r.stats[k]*500).toFixed(2)}`).join(' | ')} |\n`;
 writeFileSync('docs/browser-clock-measurements.md',md);console.log('PASS: private-clock application browser latency checks');
}finally{await browser.close();}
