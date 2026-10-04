#!/usr/bin/env node
// Zero-dep generator for the rest-over chime: two rising bell notes, ~1.4 s.
// Writes:
//   - public/rest-chime.wav (web build)
//   - android/app/src/main/res/raw/rest_chime.wav (played by RestChimeReceiver;
//     only if the android/ project exists)
// Re-run with `node scripts/gen-chime.mjs` if you change the sound.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const RATE = 44100;
const LENGTH_S = 1.4;
const PEAK = 0.9;
// Bluetooth earbuds that were idle often swallow the first few hundred ms of
// a new stream while the link wakes up, so the bell starts after a short gap.
const LEAD_IN_S = 0.3;

// Notes: [start s, frequency Hz]. C6 then G6 — a rising fifth reads as "go".
const NOTES = [
  [LEAD_IN_S, 1046.5],
  [LEAD_IN_S + 0.16, 1568.0],
];
// Bell-ish partials: [frequency multiple, relative amplitude, decay seconds].
const PARTIALS = [
  [1, 1, 0.32],
  [2, 0.35, 0.18],
  [2.76, 0.12, 0.1],
];
const ATTACK_S = 0.004;

const total = Math.round(RATE * LENGTH_S);
const samples = new Float64Array(total);
for (const [start, freq] of NOTES) {
  const from = Math.round(start * RATE);
  for (let i = from; i < total; i++) {
    const t = (i - from) / RATE;
    const attack = Math.min(1, t / ATTACK_S);
    let v = 0;
    for (const [mult, amp, decay] of PARTIALS) {
      v += amp * Math.exp(-t / decay) * Math.sin(2 * Math.PI * freq * mult * t);
    }
    samples[i] += attack * v;
  }
}

// Fade the last 50 ms so the file never ends on a click.
const fade = Math.round(0.05 * RATE);
for (let i = 0; i < fade; i++) samples[total - 1 - i] *= i / fade;

let max = 0;
for (const s of samples) max = Math.max(max, Math.abs(s));

const data = Buffer.alloc(total * 2);
for (let i = 0; i < total; i++) {
  data.writeInt16LE(Math.round((samples[i] / max) * PEAK * 32767), i * 2);
}

// 16-bit mono PCM WAV.
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28); // byte rate
header.writeUInt16LE(2, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
const wav = Buffer.concat([header, data]);

function write(path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, wav);
  console.log(`wrote ${path} (${wav.length} bytes)`);
}

write(resolve(ROOT, 'public/rest-chime.wav'));
const ANDROID_RES = resolve(ROOT, 'android/app/src/main/res');
if (existsSync(ANDROID_RES)) write(resolve(ANDROID_RES, 'raw/rest_chime.wav'));
