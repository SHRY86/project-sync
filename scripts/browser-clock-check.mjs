import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {phaseDifference} from '../src/clock.js';
import {statistics} from '../tests/helpers/clock-simulation.js';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.SYNC_TEST_URL||'http://127.0.0.1:5173');
 for(const latency of [0,50,150,500]){
  const samples=await page.evaluate(async latency=>{
   const workers=[],states=[null,null,null],samples=[],session=crypto.randomUUID();
   for(let id=0;id<3;id++){
    const w=new Worker('/src/agent.worker.js',{type:'module'});w.onmessage=({data})=>{if(data.type==='state')states[id]={...data,receivedAt:performance.now()};};
    w.postMessage({type:'init',id,session,seed:12345+id*5000,incarnation:crypto.randomUUID()});w.postMessage({type:'network',latency,lossProbability:0,jitter:0});workers.push(w);
   }
   workers[2].postMessage({type:'startCue'});
   const timer=setInterval(()=>{if(states.every(s=>s?.playing))samples.push(states.map(s=>s.beat+(performance.now()-s.receivedAt)*s.rate));},50);
   await new Promise(r=>setTimeout(r,7000));clearInterval(timer);workers.forEach(w=>w.terminate());return samples;
  },latency);
  assert.ok(samples.length>30);const values=samples.map(beats=>Math.max(...beats.flatMap(a=>beats.map(b=>Math.abs(phaseDifference(a,b))))));const stats=statistics(values);assert.ok(stats.max<1);results.push({latency,stats});console.log(latency,stats);
 }
 assert.deepEqual(errors,[]);
 const method='Actual Workers, private oscillators; seven seconds per case, selected ECHO start cue, no timestamp comparison across realms. Receipt-aligned observer estimates include unmeasured delivery queueing and are NOT simultaneous worker truth or sample-accurate audio measurements.';
 writeFileSync('docs/browser-clock-measurements.json',JSON.stringify({method,results},null,2)+'\n');
 let md=`# Browser private-clock observations\n\n${method}\n\n| Latency | Max beats / ms | Mean beats / ms | p95 beats / ms |\n|---|---|---|---|\n`;
 for(const r of results)md+=`| ${r.latency} ms | ${['max','mean','p95'].map(k=>`${r.stats[k].toFixed(4)} / ${(r.stats[k]*500).toFixed(2)}`).join(' | ')} |\n`;
 writeFileSync('docs/browser-clock-measurements.md',md);console.log('PASS: private-clock browser latency checks');
}finally{await browser.close();}
