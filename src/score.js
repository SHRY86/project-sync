/** Deterministic shared SCORE, replicated at each agent. No conductor at runtime. */
export const BPM = 120;
export const BEATS_PER_LOOP = 32;
export const AGENT_NAMES = ['NOVA', 'LUNA', 'ECHO'];
export const AGENT_COLORS = [0x42e8df, 0xff82c0, 0xb2a0ff];

// Frequencies in equal temperament; 0 means a rest.
const melody = [
  440, 493.88, 523.25, 659.25, 587.33, 523.25, 493.88, 440,
  392, 440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25,
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88,
  440, 493.88, 523.25, 587.33, 523.25, 493.88, 440, 0
];
const vowels = ['a', 'i', 'u', 'e', 'o', 'a', 'i', 'a'];
export function sectionAt(beat) {
  const b = Math.floor(beat) % BEATS_PER_LOOP;
  return b < 8 ? 'INTRO' : b < 16 ? 'VERSE' : b < 24 ? 'CHORUS' : 'FINALE';
}
export function decidePerformance(id, beat) {
  const phase = beat * Math.PI / 2;
  const step = Math.floor(beat) % BEATS_PER_LOOP;
  const section = sectionAt(beat);
  const lead = melody[step];
  // A: melody, B: pitched harmony, C: low sustained backing voice.
  const pitch = id === 0 ? lead : id === 1 ? lead * 0.74915 : (step % 4 === 0 ? 220 : 0);
  const volume = id === 0 ? 0.24 : id === 1 ? 0.12 : 0.10;
  const offset = id === 1 ? Math.PI : id * 0.37;
  return {
    section,
    voice: { pitch, vowel: vowels[(step + id * 2) % vowels.length], volume, noteIndex: step },
    light: {
      intensity: 0.55 + 0.45 * Math.max(0, Math.sin(phase + id * 1.3)),
      pan: Math.sin(phase / 4 + id * 1.7) * 0.7,
      chorus: section === 'CHORUS'
    },
    pose: {
      armL: Math.sin(phase + offset) * 0.9,
      armR: Math.sin(phase + offset + Math.PI) * 0.9,
      legL: Math.sin(phase) * 0.4,
      legR: -Math.sin(phase) * 0.4,
      body: Math.sin(phase / 2 + id) * 0.13,
      hop: Math.max(0, Math.sin(phase * 2)) * (section === 'CHORUS' ? 0.23 : 0.12),
      turn: section === 'CHORUS' ? Math.sin(phase / 4 + id) * 0.3 : Math.sin(phase / 5) * 0.08,
      offset: Math.sin(phase / 3 + id) * 0.12
    }
  };
}
