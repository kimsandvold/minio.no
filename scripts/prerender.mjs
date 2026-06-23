// Prerender alle offentlige ruter etter `vite build`.
//
// SPA-en rendres klient-side (createRoot().render), så søkemotorer og delings-
// roboter som ikke kjører JS ser bare det tomme skallet. Her tar vi et øyeblikks-
// bilde av ferdig rendret DOM (inkl. <title>, meta, canonical, OG/Twitter og
// JSON-LD satt av useSEO) i en headless Chromium, og skriver det som statisk HTML
// per rute:
//   dist/index.html                       (forsiden)
//   dist/planleggere/carport/index.html   osv.
//
// Rutene leses fra dist/sitemap.xml, så lista holder seg i synk med sitemap-en.
// Vanlige besøkende får fortsatt hele SPA-en, som overtar (re-render) ved lasting.
//
// Feiler trinnet (f.eks. uten nettverk for å hente Chromium), logges en advarsel
// og bygget fortsetter – da faller man tilbake til ren SPA-servering.

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const PORT = 4178
const SITE_URL = 'https://minio.no'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
}

// Hent rutelista fra sitemap.xml så den holder seg i synk.
async function readRoutes() {
  try {
    const xml = await readFile(join(distDir, 'sitemap.xml'), 'utf-8')
    const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1])
    const routes = locs
      .filter((u) => u.startsWith(SITE_URL))
      .map((u) => new URL(u).pathname)
    // Unik liste, forsiden først.
    return [...new Set(routes)].sort((a, b) => a.length - b.length)
  } catch (e) {
    console.warn('[prerender] kunne ikke lese sitemap.xml – hopper over:', e.message)
    return []
  }
}

// Liten statisk server med SPA-fallback til index.html.
function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        let filePath = join(distDir, url)
        let ext = extname(filePath)
        if (!ext) {
          filePath = join(distDir, 'index.html') // SPA-fallback
          ext = '.html'
        }
        const data = await readFile(filePath).catch(async () => {
          ext = '.html'
          return readFile(join(distDir, 'index.html'))
        })
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        res.writeHead(500)
        res.end('error')
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function main() {
  const routes = await readRoutes()
  if (routes.length === 0) return

  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch (e) {
    console.warn('[prerender] puppeteer ikke tilgjengelig – hopper over prerender:', e.message)
    return
  }

  const server = await startServer()
  const base = `http://localhost:${PORT}`

  let browser
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  } catch (e) {
    console.warn('[prerender] kunne ikke starte Chromium – hopper over prerender:', e.message)
    server.close()
    return
  }

  let ok = 0
  for (const route of routes) {
    const page = await browser.newPage()
    try {
      await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 60000 })
      // Bekreft at useSEO har kjørt for nettopp DENNE ruta: canonical-pathname
      // skal matche, og appen skal ha rendret innhold i #root.
      await page
        .waitForFunction(
          (expected) => {
            const root = document.querySelector('#root')
            const canonical = document.querySelector('link[rel="canonical"]')
            if (!root || root.children.length === 0 || !canonical) return false
            try {
              return new URL(canonical.href).pathname === expected
            } catch {
              return false
            }
          },
          { timeout: 15000 },
          route,
        )
        .catch(() => {})
      // Liten margin så resten av JSON-LD/meta rekker å settes.
      await new Promise((r) => setTimeout(r, 300))

      const html = await page.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML)
      const outDir = route === '/' ? distDir : join(distDir, route)
      await mkdir(outDir, { recursive: true })
      await writeFile(join(outDir, 'index.html'), html, 'utf-8')
      ok++
      console.log(`[prerender] ✓ ${route}`)
    } catch (e) {
      console.warn(`[prerender] ✗ ${route}: ${e.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  server.close()
  console.log(`[prerender] ferdig – ${ok}/${routes.length} ruter prerendret`)
}

main().catch((e) => {
  console.warn('[prerender] uventet feil – hopper over:', e.message)
  process.exit(0)
})
