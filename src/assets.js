export const AUDIO_NAMES=Object.freeze(['nova','luna','echo','concert-full','concert-instrumental','concert-vocals']);
/** Named stems keep their roles; any other WAV is a single full song. */
export function audioName(filename){if(!/\.wav$/i.test(filename))throw new Error('Choose a WAV file');const name=filename.toLowerCase().replace(/\.wav$/,'');return AUDIO_NAMES.includes(name)?name:'concert-full';}
export function validateDuration(duration){if(!Number.isFinite(duration)||duration<=0)throw new Error('Audio must have a positive, finite duration');}
function aligned(buffers,names){return names.every(n=>buffers.has(n))&&Math.max(...names.map(n=>buffers.get(n).duration))-Math.min(...names.map(n=>buffers.get(n).duration))<=.0600001;}
export function chooseAudioMode(buffers){
 const stems=['nova','luna','echo'],pair=['concert-instrumental','concert-vocals'];
 if(aligned(buffers,stems))return {selection:stems,label:'Per-agent WAV stems · one-shot · local content, singing not verified'};
 if(aligned(buffers,pair))return {selection:pair,label:'Two-file mix · one-shot · living-agent median'};
 if(buffers.has('concert-full'))return {selection:['concert-full'],label:'Full song · one-shot · living-agent median'};
 const mismatch=[stems,pair].some(names=>names.every(n=>buffers.has(n))&&!aligned(buffers,names));
 return {selection:[],label:`Synthetic Frère Jacques guide · not VOCALOID singing · ${mismatch?'stem durations do not match (±60 ms)':'no complete aligned stem set or full song'}`};
}
export function validateFile(file,extension){if(!file.name.toLowerCase().endsWith(extension))throw new Error(`Expected ${extension}`);if(!file.size)throw new Error('File must be nonempty');if(extension!=='.wav'&&file.size>64*1024*1024)throw new Error('Model/animation must be at most 64 MB');}
export async function withObjectURL(file,consume){const url=URL.createObjectURL(file);try{return await consume(url);}finally{URL.revokeObjectURL(url);}}
