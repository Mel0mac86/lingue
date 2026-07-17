#!/usr/bin/env node
/**
 * Generates the app's sound effects as small PCM WAV files — no audio
 * assets to license, everything synthesized:
 *   assets/sounds/correct.wav  → bright rising two-note chime
 *   assets/sounds/wrong.wav    → soft low "womp"
 *   assets/sounds/fanfare.wav  → short major-arpeggio fanfare
 *
 *   node scripts/make-sounds.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;

function envelope(i, total, attack = 0.01, release = 0.35) {
  const t = i / total;
  const a = Math.min(1, t / attack);
  const r = t > 1 - release ? (1 - t) / release : 1;
  return a * r;
}

/** notes: [{freq, start(s), dur(s), gain}] → Float samples */
function synth(notes, seconds) {
  const n = Math.round(seconds * RATE);
  const out = new Float64Array(n);
  for (const note of notes) {
    const s0 = Math.round(note.start * RATE);
    const len = Math.round(note.dur * RATE);
    for (let i = 0; i < len && s0 + i < n; i += 1) {
      const t = i / RATE;
      // Sine + a bit of 2nd harmonic for a marimba-like tone.
      const v = (Math.sin(2 * Math.PI * note.freq * t)
        + 0.35 * Math.sin(4 * Math.PI * note.freq * t))
        * envelope(i, len) * (note.gain ?? 0.5);
      out[s0 + i] += v;
    }
  }
  return out;
}

function writeWav(file, samples) {
  const n = samples.length;
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i += 1) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });

// Correct: E5 → G5 quick chime.
writeWav(path.join(dir, 'correct.wav'), synth([
  { freq: 659.25, start: 0, dur: 0.12, gain: 0.45 },
  { freq: 783.99, start: 0.1, dur: 0.28, gain: 0.5 },
], 0.45));

// Wrong: G3 → E3 soft womp.
writeWav(path.join(dir, 'wrong.wav'), synth([
  { freq: 196.0, start: 0, dur: 0.16, gain: 0.5 },
  { freq: 164.81, start: 0.13, dur: 0.3, gain: 0.5 },
], 0.5));

// Fanfare: C-E-G-C major arpeggio + final chord.
writeWav(path.join(dir, 'fanfare.wav'), synth([
  { freq: 523.25, start: 0.0, dur: 0.14, gain: 0.4 },
  { freq: 659.25, start: 0.12, dur: 0.14, gain: 0.4 },
  { freq: 783.99, start: 0.24, dur: 0.14, gain: 0.4 },
  { freq: 1046.5, start: 0.36, dur: 0.42, gain: 0.45 },
  { freq: 523.25, start: 0.42, dur: 0.4, gain: 0.22 },
  { freq: 659.25, start: 0.42, dur: 0.4, gain: 0.22 },
  { freq: 783.99, start: 0.42, dur: 0.4, gain: 0.22 },
], 0.95));

console.log('Sounds written to assets/sounds/');
