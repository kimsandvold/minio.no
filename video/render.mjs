// Rendrer en tidsstyrt HTML-animasjon til MP4.
//   node render.mjs vignett.html intro out/vignett-intro.mp4 [fps]
//   node render.mjs vignett.html intro --stills 0.5,1.5,3,4.5   (kontrollbilder)
import puppeteer from 'puppeteer'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [page_, mode = 'intro', out = `out/${mode}.mp4`, fpsArg] = process.argv.slice(2)
const stills = process.argv.includes('--stills') ? process.argv[process.argv.indexOf('--stills') + 1].split(',').map(Number) : null
const FPS = Number(fpsArg) || 60

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
const url = pathToFileURL(resolve(page_)).href + `?render&mode=${mode}`
await page.goto(url, { waitUntil: 'networkidle0' })
await page.evaluate(() => window.ready)
const duration = await page.evaluate(() => window.DURATION)

await mkdir('out', { recursive: true })

if (stills) {
  for (const t of stills) {
    await page.evaluate(t => window.setTime(t), t)
    await page.screenshot({ path: `out/still-${mode}-${t}.png` })
  }
  await browser.close()
  process.exit(0)
}

await mkdir(dirname(out), { recursive: true })
const ff = spawn(ffmpegPath, [
  '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] })

const total = Math.round(duration * FPS)
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.setTime(t), i / FPS)
  const buf = await page.screenshot({ type: 'png' })
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
  if (i % FPS === 0) process.stdout.write(`\r${mode}: ${i}/${total}`)
}
ff.stdin.end()
await new Promise(r => ff.on('close', r))
await browser.close()
console.log(`\n→ ${out}`)
