// Lager en ferdig YouTube Short fra manuset i gravering/manus.ts – én kommando:
//   node lag-short.mjs [jul] [sang]     → out/short-jul.mp4
// Starter Vite, rendrer animasjonen, legger på musikk og stopper Vite igjen.
//
// Musikken er Kevin MacLeod (incompetech.com), CC BY 4.0 – gratis, også på
// YouTube, men han MÅ krediteres i videobeskrivelsen:
//   "<tittel>" Kevin MacLeod (incompetech.com)
//   Licensed under Creative Commons: By Attribution 4.0
//   http://creativecommons.org/licenses/by/4.0/
// Andre julelåter derfra: "Jingle Bells Calm", "Deck the Halls B", "Silent Night".
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'

const short = process.argv[2] || 'jul'
const sang = process.argv[3] || 'Jingle Bells'
const sangfil = `lyd/${sang}.mp3`
if (!existsSync(sangfil)) {
  mkdirSync('lyd', { recursive: true })
  const svar = await fetch(`https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(sang)}.mp3`)
  if (!svar.ok) throw new Error(`Fant ikke «${sang}» hos incompetech.com`)
  writeFileSync(sangfil, Buffer.from(await svar.arrayBuffer()))
}
const PORT = 5199
const url = `http://localhost:${PORT}/video/gravering.html`

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: '..', stdio: 'ignore' })
const stopp = () => vite.kill()
process.on('exit', stopp)

for (let i = 0; ; i++) {
  try {
    if ((await fetch(url)).ok) break
  } catch { /* ikke oppe ennå */ }
  if (i > 60) throw new Error('Vite startet ikke')
  await new Promise((r) => setTimeout(r, 500))
}

const kjor = (...args) => {
  const r = spawnSync('node', args, { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
kjor('render.mjs', url, short, `out/short-${short}-stille.mp4`, '30', '--size', '1080x1920')
kjor('musikk.mjs', `out/short-${short}-stille.mp4`, `out/short-${short}.mp4`, sangfil)
// Bare den ferdige filen skal ligge igjen – ellers er det lett å laste opp versjonen uten lyd.
unlinkSync(`out/short-${short}-stille.mp4`)
stopp()
