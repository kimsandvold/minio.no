// Sjekker at en deploy er komplett.
//
// Bakgrunnen: 27.11.2026 lå minio.no nede uten å se nede ut. index.html var
// lastet opp, men JS-filene i /assets/ var ikke med. Apache sendte da
// SPA-fallbacken – index.html, status 200 – som svar på forespørselen etter
// JavaScript. Nettleseren avviste HTML der den ba om en modul, main.tsx kjørte
// aldri, og alle de 106 prerendrede sidene ble stående som døde skjermbilder:
// de SÅ riktige ut, men ingenting virket. Det eneste synlige symptomet var at
// /admin, den ene ruta som ikke er prerendret, viste forsiden.
//
//   node scripts/sjekk-deploy.mjs                 # sjekk dist/ før opplasting
//   node scripts/sjekk-deploy.mjs https://minio.no  # sjekk serveren etterpå
//
// Avslutter med kode 1 hvis noe mangler, så den kan brukes i et skript.

import { readdir, readFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const DIST = resolve(process.cwd(), 'dist')
const base = process.argv[2]?.replace(/\/$/, '')

/** Alle .html-filer i dist/, rekursivt. */
async function htmlFiler(katalog) {
  const funnet = []
  for (const e of await readdir(katalog, { withFileTypes: true })) {
    const sti = join(katalog, e.name)
    if (e.isDirectory()) funnet.push(...(await htmlFiler(sti)))
    else if (e.name.endsWith('.html')) funnet.push(sti)
  }
  return funnet
}

/**
 * Alle /assets/-referanser i HTML-en.
 *
 * Dekker src=, href= og Vites modulforhåndslasting (som bare står som en
 * streng i en __vite__mapDeps-liste, ikke som et attributt).
 */
function referanser(html) {
  return new Set([...html.matchAll(/["'(]([^"'()]*\/assets\/[^"'()]+?)["')]/g)].map((m) => m[1]))
}

const sider = await htmlFiler(DIST)
const alle = new Set()
for (const fil of sider) for (const r of referanser(await readFile(fil, 'utf8'))) alle.add(r)

console.log(`${sider.length} HTML-sider · ${alle.size} unike /assets/-referanser`)

const mangler = []

if (base) {
  // Mot serveren: status 200 er ikke nok. Fallbacken svarer også 200 – det er
  // nettopp det som gjorde feilen usynlig – så innholdstypen må sjekkes.
  await Promise.all(
    [...alle].map(async (ref) => {
      const url = base + (ref.startsWith('/') ? ref : '/' + ref)
      try {
        const r = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
        const type = r.headers.get('content-type') ?? ''
        const venta = ref.endsWith('.css') ? 'css' : 'javascript'
        if (!r.ok) mangler.push(`${ref} → HTTP ${r.status}`)
        else if (ref.endsWith('.js') && !type.includes('javascript'))
          mangler.push(`${ref} → ${type} (ventet ${venta}) – SPA-fallback, fila mangler`)
        else if (ref.endsWith('.css') && !type.includes('css'))
          mangler.push(`${ref} → ${type} (ventet ${venta})`)
      } catch (f) {
        mangler.push(`${ref} → ${f.message}`)
      }
    }),
  )
} else {
  for (const ref of alle) {
    try {
      await access(join(DIST, ref.replace(/^\//, '')))
    } catch {
      mangler.push(`${ref} → finnes ikke i dist/`)
    }
  }
}

if (mangler.length === 0) {
  console.log(base ? `✓ Alt svarer riktig fra ${base}` : '✓ Alle refererte filer finnes i dist/')
} else {
  console.error(`\n✗ ${mangler.length} problem:`)
  for (const m of mangler.slice(0, 25)) console.error('  ' + m)
  if (mangler.length > 25) console.error(`  … og ${mangler.length - 25} til`)
  process.exitCode = 1
}
