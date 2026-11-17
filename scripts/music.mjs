// Renders the Nursery tunes playlist (src/music.js) into public/music/: each
// tune is written out here as notes, played by a soft music-box sound made in
// this script, and saved as a mono AAC file of about 64 kbps.
//
//   npm run music              make whatever is missing
//   npm run music -- --force   make everything again
//
// The melodies are all in the public domain, and these recordings are made
// here, so they are ours to publish (CC0, in public/NOTICE.txt). Nothing is
// downloaded. Needs ffmpeg.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT = fileURLToPath(new URL('../public/music/', import.meta.url))
const force = process.argv.includes('--force')
const RATE = 44100

// A tune: `bpm`, then `notes` as "C4:1 D4:0.5 -:1" (pitch and beats; "-" is
// a rest) and `chords` as one chord name per `per` beats ("C F G").
const TUNES = {
  twinkle: {
    bpm: 72, per: 2,
    notes: 'C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2',
    chords: 'C C F C F C G C C F C G C F C G C C F C F C G C'
  },
  mary: {
    bpm: 80, per: 4,
    notes: 'E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:2 D4:1 D4:1 D4:2 E4:1 G4:1 G4:2 E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:1 E4:1 D4:1 D4:1 E4:1 D4:1 C4:4',
    chords: 'C C G C C C G C'
  },
  row: {
    bpm: 66, per: 3, beat: 0.5,
    notes: 'C4:3 C4:3 C4:2 D4:1 E4:3 E4:2 D4:1 E4:2 F4:1 G4:6 C5:1 C5:1 C5:1 G4:1 G4:1 G4:1 E4:1 E4:1 E4:1 C4:1 C4:1 C4:1 G4:2 F4:1 E4:2 D4:1 C4:6',
    chords: 'C C C C C C C C C C C C G G C C'
  },
  frere: {
    bpm: 76, per: 4,
    notes: 'C4:1 D4:1 E4:1 C4:1 C4:1 D4:1 E4:1 C4:1 E4:1 F4:1 G4:2 E4:1 F4:1 G4:2 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 C4:1 G3:1 C4:2 C4:1 G3:1 C4:2',
    chords: 'C C C C C C C C'
  },
  london: {
    bpm: 80, per: 4,
    notes: 'G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:1 E4:1 F4:2 E4:1 F4:1 G4:2 G4:1.5 A4:0.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:2 G4:2 E4:1 C4:3',
    chords: 'C C G C C C G C'
  },
  macdonald: {
    bpm: 84, per: 2,
    notes: 'C4:1 C4:1 C4:1 G3:1 A3:1 A3:1 G3:2 E4:1 E4:1 D4:1 D4:1 C4:3 G3:1 C4:1 C4:1 C4:1 G3:1 A3:1 A3:1 G3:2 E4:1 E4:1 D4:1 D4:1 C4:4',
    chords: 'C C F C C G C C C C F C C G C C'
  },
  buns: {
    bpm: 72, per: 4,
    notes: 'E4:1 D4:1 C4:2 E4:1 D4:1 C4:2 C4:0.5 C4:0.5 C4:0.5 C4:0.5 D4:0.5 D4:0.5 D4:0.5 D4:0.5 E4:1 D4:1 C4:2',
    chords: 'C C G C'
  },
  clair: {
    bpm: 72, per: 4,
    notes: 'C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4 C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4 D4:1 D4:1 D4:1 D4:1 A3:2 A3:2 D4:1 C4:1 B3:1 A3:1 G3:4 C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4',
    chords: 'C C C C C C C C G Dm G G C C C C'
  },
  joy: {
    bpm: 76, per: 4,
    notes: 'E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2',
    chords: 'C G C G C G C G'
  }
}

const CHORDS = { C: ['C3', 'E3', 'G3'], F: ['F2', 'A2', 'C3'], G: ['G2', 'B2', 'D3'], Dm: ['D3', 'F3', 'A3'] }
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const hz = (n) => 440 * 2 ** ((SEMI[n[0]] + (+n.at(-1) + 1) * 12 - 69) / 12)

// A soft music box: a sine with a little of its second and third
// harmonics, a quick start and a long, gentle fade.
function tone(buf, at, f, len, amp) {
  const start = Math.round(at * RATE)
  const n = Math.min(Math.round(len * RATE), buf.length - start)
  for (let i = 0; i < n; i++) {
    const t = i / RATE
    const env = Math.min(1, t / 0.012) * Math.exp(-t * 2.2)
    const w = 2 * Math.PI * f * t
    buf[start + i] += amp * env * (Math.sin(w) + 0.18 * Math.sin(2 * w) + 0.05 * Math.sin(3 * w))
  }
}
// The chord underneath: low, slow to arrive and quiet.
function pad(buf, at, notes, len, amp) {
  const start = Math.round(at * RATE)
  const n = Math.min(Math.round(len * RATE), buf.length - start)
  for (const note of notes) {
    const f = hz(note)
    for (let i = 0; i < n; i++) {
      const t = i / RATE
      const env = Math.min(1, t / 0.25) * Math.min(1, (len - t) / 0.4) * Math.exp(-t * 0.35)
      buf[start + i] += amp * env * Math.sin(2 * Math.PI * f * t)
    }
  }
}

// The tune twice (the second time an octave higher, more softly), then its
// last chord held.
function render({ bpm, per, beat = 1, notes, chords }) {
  const sec = (60 / bpm) * beat
  const ns = notes.split(' ').map((x) => x.split(':')).map(([p, b]) => [p, +b])
  const beats = ns.reduce((a, [, b]) => a + b, 0)
  const cs = chords.split(' ')
  const once = beats * sec
  const total = 1 + once * 2 + 4
  const buf = new Float32Array(Math.ceil(total * RATE))
  for (let round = 0; round < 2; round++) {
    const t0 = 1 + round * once
    let at = t0
    for (const [p, b] of ns) {
      if (p !== '-') tone(buf, at, hz(p) * (round ? 2 : 1), Math.max(b * sec, 1.2) + 1.5, round ? 0.16 : 0.22)
      at += b * sec
    }
    cs.forEach((c, i) => pad(buf, t0 + i * per * sec, CHORDS[c], per * sec + 0.3, 0.035))
  }
  pad(buf, 1 + once * 2, CHORDS[cs.at(-1)], 3.5, 0.035)
  return buf
}

function wav(buf) {
  const peak = buf.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1
  const out = Buffer.alloc(44 + buf.length * 2)
  out.write('RIFF', 0); out.writeUInt32LE(36 + buf.length * 2, 4); out.write('WAVEfmt ', 8)
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(RATE, 24)
  out.writeUInt32LE(RATE * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36)
  out.writeUInt32LE(buf.length * 2, 40)
  buf.forEach((x, i) => out.writeInt16LE(Math.round((x / peak) * 0.9 * 32767), 44 + i * 2))
  return out
}

mkdirSync(OUT, { recursive: true })
const tmp = join(tmpdir(), 'looksee-music')
mkdirSync(tmp, { recursive: true })
let made = 0
for (const [name, tune] of Object.entries(TUNES)) {
  const out = join(OUT, `${name}.m4a`)
  if (!force && existsSync(out)) continue
  const w = join(tmp, `${name}.wav`)
  writeFileSync(w, wav(render(tune)))
  // A little room around the notes, then one loudness for every tune.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', w, '-af', 'aecho=0.8:0.6:70|140:0.25|0.15,loudnorm=I=-23:TP=-3:LRA=11',
    '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', out])
  rmSync(w)
  made++
}
console.log(`${Object.keys(TUNES).length} tunes in public/music/ (${made} made now).`)
