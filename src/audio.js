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
  constructor() { this.ctx = null; this.voices = []; this.enabled = false; }
  async toggle() {
    if (!this.ctx) this.create();
    await this.ctx.resume();
    this.enabled = !this.enabled;
    this.voices.forEach(v => v.output.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, .035));
    return this.enabled;
  }
  create() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    const master = this.ctx.createGain(); master.gain.value = .40; master.connect(this.ctx.destination);
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
    states.forEach((state, id) => {
      if (!state) return;
      const voice = this.voices[id];
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
