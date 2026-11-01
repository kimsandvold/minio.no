// Syntetiserer lyd til vignetten (marimba-aktige "trelyder") og legger den på videoen.
//   node sound.mjs intro   → out/vignett-intro.mp4
//   node sound.mjs outro   → out/vignett-outro.mp4
import ffmpegPath from 'ffmpeg-static'
import { spawnSync } from 'node:child_process'

const mode = process.argv[2] || 'intro'
const DURATION = mode === 'outro' ? 7 : 6

// Marimba: grunntone + ~4x overtone som dør raskt ut
const note = (t0, f, amp, decay = 5) => {
  const dt = `(t-${t0})`
  return `gte(t,${t0})*${amp}*(sin(2*PI*${f}*${dt})*exp(-${decay}*${dt})` +
    `+0.35*sin(2*PI*${f * 3.93}*${dt})*exp(-${decay * 5}*${dt})` +
    `+0.12*sin(2*PI*${f * 10.1}*${dt})*exp(-${decay * 14}*${dt}))`
}
// Kort treklikk for tommestokk-merkene
const tick = (t0, amp) => `gte(t,${t0})*${amp}*sin(2*PI*2400*(t-${t0}))*exp(-260*(t-${t0}))`

const parts = [
  note(1.38, 196.0, 0.34, 4),     // G3 – rammen lukkes
  note(1.95, 293.66, 0.22, 5),    // D4 – ordmerket
]
// Merkene på tommestokken (hvert 5.), synk med animasjonen (2.55s → 3.45s, easeInOut)
const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
const invEase = y => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; easeInOut(m) < y ? lo = m : hi = m } return lo }
for (let i = 0; i <= 8; i++) parts.push(tick((2.55 + 0.9 * invEase(i / 8)).toFixed(3), i % 2 ? 0.05 : 0.08))
// Akkord under taglinen (G-dur, myk)
parts.push(note(3.22, 392.0, 0.13, 1.6), note(3.25, 493.88, 0.10, 1.6), note(3.28, 587.33, 0.10, 1.5), note(3.22, 98.0, 0.16, 1.2))

const expr = parts.join('+')
const fadeOut = mode === 'intro' ? `,afade=t=out:st=5.2:d=0.8` : `,afade=t=out:st=${DURATION - 1.2}:d=1.2`

const r = spawnSync(ffmpegPath, [
  '-y',
  '-i', `out/vignett-${mode}-silent.mp4`,
  '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=48000:d=${DURATION}`,
  '-filter_complex',
  // Litt rom (ekko) og stereo-bredde, så det ikke låter tørt
  `[1:a]aecho=0.8:0.6:60|110:0.25|0.15,highpass=f=60,lowpass=f=9000${fadeOut},pan=stereo|c0=c0|c1=c0,volume=0.9,alimiter=limit=0.7:level=false[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
  `out/vignett-${mode}.mp4`,
], { stdio: ['ignore', 'ignore', 'pipe'] })
if (r.status !== 0) { console.error(r.stderr.toString().slice(-2000)); process.exit(1) }
console.log(`→ out/vignett-${mode}.mp4`)
