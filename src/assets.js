export const AUDIO_NAMES=Object.freeze(['nova','luna','echo','concert-full','concert-instrumental','concert-vocals']);
export function audioName(filename){const name=filename.toLowerCase().replace(/\.wav$/,'');if(!/\.wav$/i.test(filename)||!AUDIO_NAMES.includes(name))throw new Error('Use nova.wav, luna.wav, echo.wav, concert-full.wav, concert-instrumental.wav or concert-vocals.wav');return name;}
export function validateDuration(duration){if(!Number.isFinite(duration)||Math.abs(duration-32)>.0600001)throw new Error(`Expected 32 s ±60 ms; got ${Number(duration).toFixed(3)} s`);}
export function chooseAudioMode(buffers){
 if(['nova','luna','echo'].every(n=>buffers.has(n)))return {selection:['nova','luna','echo'],label:'Per-agent WAV stems · local content, singing not verified'};
 if(['concert-instrumental','concert-vocals'].every(n=>buffers.has(n)))return {selection:['concert-instrumental','concert-vocals'],label:'Two-file mix fallback · living-agent median'};
 if(buffers.has('concert-full'))return {selection:['concert-full'],label:'Full-mix fallback · living-agent median'};
 const missing=['nova','luna','echo'].filter(n=>!buffers.has(n));
 return {selection:[],label:`Synthetic vowel arrangement · not VOCALOID singing · missing complete stem set (${missing.join(', ')}) or mix`};
}
export function validateFile(file,extension){if(!file.name.toLowerCase().endsWith(extension))throw new Error(`Expected ${extension}`);if(!file.size||file.size>64*1024*1024)throw new Error('File must be nonempty and at most 64 MB');}
/** Revoke after the consumer has decoded/parsed its own copy. */
export async function withObjectURL(file,consume){const url=URL.createObjectURL(file);try{return await consume(url);}finally{URL.revokeObjectURL(url);}}
