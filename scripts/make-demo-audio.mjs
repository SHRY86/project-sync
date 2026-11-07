import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
/** Original note pattern and simple oscillators; no samples, lyrics or voicebank. */
export function wavBytes(samples,sampleRate=16000){
 const bytes=Buffer.alloc(44+samples.length*2);bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(sampleRate,24);bytes.writeUInt32LE(sampleRate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples.length*2,40);
 for(let i=0;i<samples.length;i++)bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2);return bytes;
}
export function makeDemoAudio(directory){
 const rate=16000,length=rate*32,out=resolve(directory);mkdirSync(out,{recursive:true});
 const midi=[60,64,67,71,69,67,64,62,60,67,72,71,67,64,62,59];
 const parts=[0,1,2].map(id=>Float32Array.from({length},(_,i)=>{
  const t=i/rate,beat=t*2,step=Math.floor(beat),phase=(beat%1)*.5;
  const frequency=440*2**((midi[step%16]+[0,-12,-24][id]-69)/12);
  const env=Math.min(1,phase/.008)*Math.exp(-phase*[6,4,12][id]);
  const tone=Math.sin(2*Math.PI*frequency*t)+.2*Math.sin(4*Math.PI*frequency*t);
  const drum=id===2?Math.sin(2*Math.PI*(55*phase+7*(1-Math.exp(-phase*30))))*Math.exp(-phase*16):0;
  const edge=Math.min(1,t/.004,(32-t)/.004);
  return .15*(tone*env+drum)*edge;
 }));
 for(let id=0;id<3;id++)writeFileSync(`${out}/${['nova','luna','echo'][id]}.wav`,wavBytes(parts[id],rate));
 const full=Float32Array.from({length},(_,i)=>parts.reduce((sum,p)=>sum+p[i],0));writeFileSync(`${out}/concert-full.wav`,wavBytes(full,rate));
 writeFileSync(`${out}/SYNTHETIC-DEMO.txt`,'Original procedurally synthesized PROJECT SYNC test arrangement. 120 BPM, 4/4, 64 beats, 32 seconds, offset zero. Not VOCALOID, singing or licensed samples. Use Load local assets to select the WAVs. Generated from repository source.\n');return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(`Original synthetic demo files: ${makeDemoAudio(process.argv[2]||'.demo-audio')}`);
