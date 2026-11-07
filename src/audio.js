import { audioCommands } from './audio-selection.js';
import { freshStates } from './metrics.js';
/**
 * Local audio mixer / sound output. AGENTS choose pitch, vowel and gain.
 * A browser Web Worker cannot directly use the Web Audio output device, so
 * the display process renders the audio states decided by each peer.
 * This is distributed MUSIC LOGIC, not decentralized physical speakers.
 */
const FORMANTS = {
  a: [800, 1150, 2900], e: [530, 1850, 2500],
  i: [300, 2200, 3000], o: [500, 900, 2600], u: [350, 800, 2200]
};
export class VocalMixer {
  constructor() { this.ctx = null; this.voices = []; this.enabled = false; this.buffers=new Map();this.tracks=new Map();this.status='Synthetic vowel arrangement · no VOCALOID assets';this.volume=.4;this.generation=0; }
  async loadAssets() {
    await Promise.all(['nova','luna','echo','concert-full','concert-instrumental','concert-vocals'].map(async name=>{
      try { const r=await fetch(`/audio/${name}.wav`);if(!r.ok) return;const b=await this.ctx.decodeAudioData(await r.arrayBuffer());if(Math.abs(b.duration-32)>.06) throw new Error('Expected exactly 32 seconds');const fade=Math.floor(b.sampleRate*.004);for(let c=0;c<b.numberOfChannels;c++){const samples=b.getChannelData(c);for(let i=0;i<fade;i++){samples[i]*=i/fade;samples[samples.length-1-i]*=i/fade;}}this.buffers.set(name,b); }
      catch(e){console.info(`Audio ${name}: ${e.message}`);}
    }));
    this.selection=['nova','luna','echo'].every(n=>this.buffers.has(n)) ? ['nova','luna','echo'] : ['concert-instrumental','concert-vocals'].every(n=>this.buffers.has(n)) ? ['concert-instrumental','concert-vocals'] : this.buffers.has('concert-full') ? ['concert-full'] : [];
    this.status=this.selection.length===3 ? 'Aligned per-agent stems' : this.selection.length ? 'Demonstration mix fallback · median of fresh living agents' : 'Synthetic vowel arrangement · not VOCALOID singing';
  }
  async enable() { if(!this.ctx) {this.create();await this.ctx.resume();await this.loadAssets();}await this.ctx.resume();this.enabled=true; }
  setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(this.enabled?value:0,this.ctx.currentTime,.03);}
  reset(){this.generation++;for(const t of this.tracks.values())this.fadeStop(t);this.tracks.clear();this.voices.forEach(v=>{v.lastNote=-1;v.noteGain.gain.setTargetAtTime(0,this.ctx.currentTime,.01);});}
  fadeStop(t){const now=this.ctx.currentTime;t.gain.gain.cancelScheduledValues(now);t.gain.gain.setTargetAtTime(0,now,.015);try{t.source.stop(now+.08);}catch{}}
  playAsset(name,command){
    const now=this.ctx.currentTime,desired=command.position%32;
    let t=this.tracks.get(name);
    if(t){const actual=(t.position+(now-t.at)*t.rate)%32;const error=((desired-actual+48)%32)-16;
      if(Math.abs(error)<.18){const rate=1+Math.max(-.025,Math.min(.025,(command.rate-1)+error*.15));t.position=actual;t.at=now;t.rate=rate;t.source.playbackRate.setTargetAtTime(rate,now,.1);return;}
      this.fadeStop(t);
    }
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers.get(name);source.loop=true;source.loopStart=0;source.loopEnd=32;source.connect(gain);gain.connect(this.master);gain.gain.value=0;gain.gain.setTargetAtTime(1,now+.025,.02);
    // Decoded buffers receive a 4 ms edge fade to suppress loop discontinuities.
    source.start(now+.025,(desired+.025)%32);this.tracks.set(name,{source,gain,position:(desired+.025)%32,at:now+.025,rate:1});
  }
  async toggle() {
    if (!this.ctx) this.create();
    await this.enable();
    this.enabled = !this.wasEnabled; this.wasEnabled=this.enabled; this.setVolume(this.volume);
    this.voices.forEach(v => v.output.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, .035));
    return this.enabled;
  }
  create() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    const master = this.ctx.createGain(); this.master=master; master.gain.value = this.volume; master.connect(this.ctx.destination);
    for (let id = 0; id < 3; id++) {
      const output = this.ctx.createGain(); output.gain.value = 0; output.connect(master);
      const noteGain = this.ctx.createGain(); noteGain.gain.value = 0; noteGain.connect(output);
      const saw = this.ctx.createOscillator(); saw.type = 'sawtooth'; saw.frequency.value = 220;
      // Parallel resonances imitate sung vowel shapes. Intentionally stylized.
      const bands = FORMANTS.a.map((freq, index) => {
        const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = index === 0 ? 3 : 5;
        const gain = this.ctx.createGain(); gain.gain.value = index === 0 ? .58 : .3;
        saw.connect(filter); filter.connect(gain); gain.connect(noteGain);
        return filter;
      });
      saw.start();
      this.voices.push({ saw, bands, noteGain, output, lastNote: -1 });
    }
  }
  update(states) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    this.setVolume(this.volume);
    const fresh = freshStates(states,performance.now());
    const liveIds = new Set(fresh.map(s=>s.id));
    const commands=audioCommands(states,this.selection||[]);
    const activeNames=new Set(commands.map(c=>c.name));
    for(const [name,track] of this.tracks)if(!activeNames.has(name)){this.fadeStop(track);this.tracks.delete(name);}
    this.commands=commands;
    for(const command of commands)this.playAsset(command.name,command);
    states.forEach((state, id) => {
      if (!state) {this.voices[id].output.gain.setTargetAtTime(0,time,.02);return;}
      const voice = this.voices[id];
      voice.output.gain.setTargetAtTime(this.enabled && !this.selection?.length && liveIds.has(id) ? 1 : 0,time,.03);
      const { pitch, vowel, volume, noteIndex } = state.voice;
      voice.saw.frequency.setTargetAtTime(Math.max(40, pitch || 220), time, .025);
      const formants = FORMANTS[vowel] || FORMANTS.a;
      voice.bands.forEach((band, i) => band.frequency.setTargetAtTime(formants[i], time, .04));
      // Re-articulate the note every beat even when the pitch repeats.
      if (voice.lastNote !== noteIndex) {
        voice.lastNote = noteIndex;
        voice.noteGain.gain.cancelScheduledValues(time);
        voice.noteGain.gain.setTargetAtTime(0, time, .012);
        voice.noteGain.gain.setTargetAtTime(pitch ? volume : 0, time + .045, .065);
      }
    });
  }
}
