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
      // Statiske sider (spillene i public/) finnes allerede som filer.
      .filter((p) => !p.endsWith('.html'))
    // Unik liste, forsiden først.
    return [...new Set(routes)].sort((a, b) => a.length - b.length)
  } catch (e) {
    console.warn('[prerender] kunne ikke lese sitemap.xml – hopper over:', e.message)
    return []
  }
}

// Liten statisk server med SPA-fallback til index.html.
//
// Fallbacken er det UBERØRTE Vite-skallet, lest inn én gang før noe prerendres.
// Forsiden prerendres først og overskriver dist/index.html; leste vi fila på
// nytt, ville alle andre ruter starte fra forsidens snapshot og arve det den
// la inn i <head> (bl.a. et render-blokkerende Google Fonts-ark med ~30
// graveringsfonter) – og det ville havnet i hver eneste prerendrede side.
function startServer(shell) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = decodeURIComponent((req.url || '/').split('?')[0])
        let filePath = join(distDir, url)
        let ext = extname(filePath)
        let data
        if (!ext) {
          data = shell // SPA-fallback – alltid det rene skallet
          ext = '.html'
        } else {
          data = await readFile(filePath).catch(() => {
            ext = '.html'
            return shell
          })
        }
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

  const shell = await readFile(join(distDir, 'index.html'))
  const server = await startServer(shell)

  // 3D-sidene (three.js/WebGL) får av og til headless Chromium til å henge, og
  // da feiler alle ruter etter den. Vi starter derfor nettleseren på nytt og
  // prøver ruta én gang til når noe går galt.
  const launch = () =>
    puppeteer.launch({ headless: 'new', protocolTimeout: 90000, args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  let browser
  try {
    browser = await launch()
  } catch (e) {
    console.warn('[prerender] kunne ikke starte Chromium – hopper over prerender:', e.message)
    server.close()
    return
  }

  let ok = 0
  const feilet = []
  for (const route of routes) {
    for (let forsok = 1; forsok <= 2; forsok++) {
      let page
      try {
        page = await browser.newPage()
        await snapshot(page, route)
        ok++
        console.log(`[prerender] ✓ ${route}`)
        break
      } catch (e) {
        console.warn(`[prerender] ✗ ${route} (forsøk ${forsok}): ${e.message}`)
        if (forsok === 2) {
          feilet.push(route)
        } else {
          await browser.close().catch(() => {})
          browser = await launch()
          page = undefined
        }
      } finally {
        await page?.close().catch(() => {})
      }
    }
  }

  await browser.close()
  server.close()
  console.log(`[prerender] ferdig – ${ok}/${routes.length} ruter prerendret`)
  if (feilet.length) console.warn(`[prerender] IKKE prerendret: ${feilet.join(', ')}`)
}

async function snapshot(page, route) {
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle2', timeout: 60000 })
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

  // styled-components bruker CSSOM insertRule i produksjon ("speedy mode"),
  // så <style data-styled> står tom i outerHTML. Da lastes den statiske HTML-en
  // helt ustilt (kjempelogo, synlig skip-link, rå login-knapp) til JS-bunten
  // rekker å re-injisere stilene → hvitt blink ved lasting. Skriv reglene
  // tilbake som tekst før snapshot, så prerendret HTML er ferdig stilt.
  await page.evaluate(() => {
    document.querySelectorAll('style[data-styled]').forEach((tag) => {
      const sheet = tag.sheet
      if (!sheet || sheet.cssRules.length === 0) return
      const css = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join('')
      if (tag.textContent !== css) tag.textContent = css
    })
  })

  // Google Fonts-ark som appen legger inn i <head> under kjøring (graverings-/
  // designerfonter) ville blitt render-blokkerende <link>-er i statisk HTML.
  // Fjern dem – komponentene legger dem inn igjen når JS-en tar over.
  await page.evaluate(() => {
    document
      .querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]')
      .forEach((link) => link.remove())
  })

  const html = await page.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML)
  const outDir = route === '/' ? distDir : join(distDir, route)
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'index.html'), html, 'utf-8')
}

main().catch((e) => {
  console.warn('[prerender] uventet feil – hopper over:', e.message)
  process.exit(0)
})
