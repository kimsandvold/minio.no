// Legger musikk på en video.
//   node musikk.mjs inn.mp4 ut.mp4 sang.mp3   → bruker låten (fra start, tones ut)
//   node musikk.mjs inn.mp4 ut.mp4            → syntetiserer «Stille natt» (Gruber
//     1818, fri for rettigheter) på marimba, samme klang som vignetten (sound.mjs)
import ffmpegPath from 'ffmpeg-static'
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [inn, ut, sang] = process.argv.slice(2)
const varighet = Number(
  /Duration: (\d+):(\d+):([\d.]+)/
    .exec(spawnSync(ffmpegPath, ['-i', inn]).stderr.toString())
    .slice(1)
    .reduce((s, v, i) => s + Number(v) * [3600, 60, 1][i], 0),
)

const RATE = 48000
let lydfil = sang
const ATTENDEL = 0.245 // sekunder per åttendedel
const START = 0.3

const hz = (n) => {
  const [, navn, okt] = /^([A-G]#?)(\d)$/.exec(n)
  const i = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(navn)
  return 440 * Math.pow(2, (i + (Number(okt) + 1) * 12 - 69) / 12)
}

// Melodi i C-dur, [tone, åttendedeler]. Første vers, forkortet til to fraser
// og slutten («sov i himmelsk ro»), så det går opp i ~25 sekunder.
const melodi = [
  ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6],
  ['G4', 3], ['A4', 1], ['G4', 2], ['E4', 6],
  ['D5', 4], ['D5', 2], ['B4', 6],
  ['C5', 4], ['C5', 2], ['G4', 6],
  ['D5', 4], ['D5', 2], ['F5', 3], ['D5', 1], ['B4', 2],
  ['C5', 6], ['E5', 6],
  ['C5', 3], ['G4', 1], ['E4', 2], ['G4', 3], ['F4', 1], ['D4', 2],
  ['C4', 12],
]
// Én akkord per takt (6 åttendedeler)
const akkorder = ['C', 'C', 'C', 'C', 'G', 'G', 'C', 'C', 'G', 'G7', 'C', 'C', 'C', 'G7', 'C', 'C']
const AKKORD = { C: ['C3', 'G3', 'E4'], G: ['G2', 'D3', 'B3'], G7: ['G2', 'F3', 'B3'] }

if (!lydfil) lydfil = syntetiser()

function syntetiser() {
const lyd = new Float32Array(Math.ceil(varighet * RATE))
const marimba = (t0, f, amp, decay) => {
  const fra = Math.floor(t0 * RATE)
  const lengde = Math.min(lyd.length - fra, Math.floor((6 / decay) * RATE))
  for (let i = 0; i < lengde; i++) {
    const t = i / RATE
    lyd[fra + i] +=
      amp *
      (Math.sin(2 * Math.PI * f * t) * Math.exp(-decay * t) +
        0.35 * Math.sin(2 * Math.PI * f * 3.93 * t) * Math.exp(-decay * 5 * t) +
        0.12 * Math.sin(2 * Math.PI * f * 10.1 * t) * Math.exp(-decay * 14 * t)) *
      Math.min(1, t * 400)
  }
}

let pos = 0
for (const [tone, lengde] of melodi) {
  const t0 = START + pos * ATTENDEL
  marimba(t0, hz(tone), 0.3, lengde >= 6 ? 1.6 : 3)
  // Lange toner slås an igjen svakt, som en marimbaspiller ville gjort
  if (lengde >= 6) marimba(t0 + ATTENDEL * 3, hz(tone), 0.12, 2.2)
  pos += lengde
}
akkorder.forEach((a, takt) => {
  const t0 = START + takt * 6 * ATTENDEL
  AKKORD[a].forEach((tone, i) => marimba(t0 + i * 0.03, hz(tone), i === 0 ? 0.16 : 0.08, 1.4))
  marimba(t0 + 3 * ATTENDEL, hz(AKKORD[a][1]), 0.05, 2)
})

const pcm = Buffer.alloc(lyd.length * 2)
lyd.forEach((v, i) => pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * 0.8)) * 32767), i * 2))
const header = Buffer.alloc(44)
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8)
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34)
header.write('data', 36); header.writeUInt32LE(pcm.length, 40)
const wav = join(mkdtempSync(join(tmpdir(), 'minio-')), 'musikk.wav')
writeFileSync(wav, Buffer.concat([header, pcm]))
return wav
}

const r = spawnSync(ffmpegPath, [
  '-y', '-i', inn, '-i', lydfil,
  '-filter_complex',
  sang
    // Ferdig mikset låt: bare tilpass lengden og lydnivået (YouTube spiller av på ca. -14 LUFS)
    ? `[1:a]atrim=0:${varighet},afade=t=in:d=0.3,afade=t=out:st=${(varighet - 1.8).toFixed(2)}:d=1.8,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=stereo[a]`
    : `[1:a]aecho=0.8:0.6:70|130:0.28|0.16,highpass=f=60,lowpass=f=9000,afade=t=out:st=${(varighet - 1.5).toFixed(2)}:d=1.5,pan=stereo|c0=c0|c1=c0,volume=2.2,alimiter=limit=0.85:level=false[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', ut,
], { stdio: ['ignore', 'ignore', 'pipe'] })
if (r.status !== 0) { console.error(r.stderr.toString().slice(-2000)); process.exit(1) }
console.log(`→ ${ut}`)
