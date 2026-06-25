// Genererer byggeguider-artiklene i sitemap.xml fra guideTopics, slik at
// URL-lista og datoene (lastmod) har én kilde: src/data/byggeguider.ts.
// Andre URL-er (produkter, planleggere, hub, prosjekter) røres ikke.
import { readFile, writeFile } from 'node:fs/promises'
import { transform } from 'esbuild'

const SITE_URL = 'https://minio.no'
const DATA_FILE = 'src/data/byggeguider.ts'
const SITEMAP_FILE = 'public/sitemap.xml'

// 1. Last guideTopics fra TS-fila (kompiler til JS i minnet – fila har ingen imports).
const tsSource = await readFile(DATA_FILE, 'utf-8')
const { code } = await transform(tsSource, { loader: 'ts', format: 'esm' })
const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const { guideTopics } = await import(dataUrl)

// 2. Bygg <url>-blokker for hver publiserte artikkel.
const fallbackDate = new Date().toISOString().slice(0, 10)
const articleBlocks = guideTopics
  .filter((t) => t.available)
  .map((t) => {
    const lastmod = t.published || fallbackDate
    return `  <url>
    <loc>${SITE_URL}/byggeguider/${t.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
  </url>`
  })
  .join('\n')

// 3. Fjern eksisterende artikkel-blokker (enkelt-segment /byggeguider/<slug>).
//    Hub (/byggeguider) og /byggeguider/prosjekter/* matcher ikke og bevares.
let sitemap = await readFile(SITEMAP_FILE, 'utf-8')
sitemap = sitemap.replace(
  /[ \t]*<url>\s*<loc>https:\/\/minio\.no\/byggeguider\/[^/<]+<\/loc>[\s\S]*?<\/url>\n/g,
  ''
)

// 4. Sett inn de genererte blokkene rett før </urlset>.
sitemap = sitemap.replace(/(\n?)<\/urlset>/, `\n${articleBlocks}\n</urlset>`)

await writeFile(SITEMAP_FILE, sitemap)
console.log(`[sitemap] skrev ${guideTopics.filter((t) => t.available).length} byggeguider-artikler til ${SITEMAP_FILE}`)
