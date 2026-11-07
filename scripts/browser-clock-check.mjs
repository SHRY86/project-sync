import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {phaseDifference,RATE} from '../src/clock.js';
import {statistics} from '../tests/helpers/clock-simulation.js';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const results=[];
try {
 await page.goto(process.env.SYNC_TEST_URL || 'http://127.0.0.1:5173');
 for(const config of [0,50,150,500].map(latency=>({latency,jitter:0,lossProbability:0})).concat([{latency:500,jitter:400,lossProbability:.3,isolation:true}])){
  const trace=await page.evaluate(async config=>{
   const {monotonicNow}=await import('/src/clock.js');const {measurePhase}=await import('/src/metrics.js');
   const session=crypto.randomUUID(),start=monotonicNow(),history=[[],[],[]],latest=[null,null,null],samples=[];
   // Start at beat 63 to exercise the 64-beat boundary in every browser case.
   const workers=[0,1,2].map(id=>{
    const w=new Worker('/src/agent.worker.js',{type:'module'});
    w.onmessage=({data})=>{if(data.type==='state'){history[id].push(data);latest[id]=data;}};
    w.postMessage({type:'init',id,session,startAt:start-31500});
    w.postMessage({type:'network',...config,stress:false,isolated:false});return w;
   });
   const observation=setInterval(()=>{const at=monotonicNow(),m=measurePhase(latest,at);if(m)samples.push({at,ui:m.disagreement});},50);
   const timers=config.isolation?[
    setTimeout(()=>workers[1].postMessage({type:'network',isolated:true}),1200),
    setTimeout(()=>workers[1].postMessage({type:'network',isolated:false}),2400)
   ]:[];
   await new Promise(resolve=>setTimeout(resolve,5000));clearInterval(observation);timers.forEach(clearTimeout);workers.forEach(w=>w.terminate());
   return {history,samples};
  },config);
  for(const history of trace.history){assert.ok(history.length>60);assert.ok(history.every((s,i)=>!i||s.beat>=history[i-1].beat));assert.ok(history.every(s=>Math.abs(s.correction)<=.01));assert.ok(history.some(s=>s.beat>64));}
  if(config.isolation){assert.ok(trace.history[1].some(s=>s.isolated&&s.peers.length===0));assert.ok(trace.history.every(h=>!h.at(-1).isolated&&h.at(-1).peers.length===2));}
  const worker=[],ui=[],artifact=[];
  for(const sample of trace.samples){
   const beats=trace.history.map(history=>{
    const index=history.findIndex(s=>s.timestamp>=sample.at);if(index<1)return null;
    const a=history[index-1],b=history[index],dt=b.timestamp-a.timestamp;if(dt>150||dt<=0)return null;
    return a.beat+(b.beat-a.beat)*(sample.at-a.timestamp)/dt;
   });
   if(beats.some(b=>b===null))continue;
   const disagreement=Math.max(...beats.flatMap(a=>beats.map(b=>Math.abs(phaseDifference(a,b)))));
   worker.push(disagreement);ui.push(sample.ui);artifact.push(Math.abs(disagreement-sample.ui));
  }
  assert.ok(worker.length>30);assert.ok(statistics(worker).max<.08);assert.ok(statistics(artifact).max<.005);
  const r={config,worker:statistics(worker),ui:statistics(ui),artifact:statistics(artifact),samples:worker.length};results.push(r);console.log(JSON.stringify(r));
 }
 assert.deepEqual(errors,[]);
 writeFileSync('docs/browser-clock-measurements.json',JSON.stringify({method:'5 seconds/case; three actual module Workers; beat 63 start; actual phase interpolated between bracketing worker state samples at each UI timestamp (gaps >150ms excluded). Unseeded browser delivery/loss, not deterministic or sample-accurate audio measurements.',results},null,2)+'\n');
 const fmt=s=>['max','mean','p95'].map(k=>`${s[k].toFixed(6)} / ${(s[k]/RATE).toFixed(3)}`).join(' · ');
 let markdown='# Actual browser Worker clock measurements\n\nFive seconds per case in headless Chromium. Worker beats are interpolated between bracketing state samples at exactly the UI observation timestamp (gaps above 150 ms excluded). These are interpolated observations, not direct simultaneous reads or sample-accurate audio measurements. Browser loss/jitter is unseeded. Every case starts at beat 63 and crosses 64; the fault case isolates LUNA at 1.2 seconds and restores at 2.4 seconds. No reset is sent.\n\nEach entry is max · mean · p95, with values in beats / milliseconds at 120 BPM.\n\n| Latency / faults | Interpolated worker disagreement | UI estimate | Max artifact (ms) |\n|---|---|---|---:|\n';
 for(const r of results)markdown+=`| ${r.config.latency} ms${r.config.isolation?' + ±400 ms jitter / 30% loss / isolation':''} | ${fmt(r.worker)} | ${fmt(r.ui)} | ${(r.artifact.max/RATE).toFixed(3)} |\n`;
 writeFileSync('docs/browser-clock-measurements.md',markdown);
 console.log('PASS: actual Workers, latency 0/50/150/500, jitter/loss/isolation/reconnect, monotonic beats and wraparound.');
} finally {await browser.close();}
