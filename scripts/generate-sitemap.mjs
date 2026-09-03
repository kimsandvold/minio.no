// Genererer to seksjoner av sitemap.xml fra koden, slik at URL-lista aldri
// kommer ut av synk med det som faktisk finnes:
//   1. byggeguider-artiklene fra guideTopics (src/data/byggeguider.ts)
//   2. designverktøyet fra malregisteret (src/designer/registry.ts)
// Andre URL-er (produkter, planleggere, hub, prosjekter) røres ikke.
//
// Lista brukes videre av scripts/prerender.mjs, som prerenderer nøyaktig de
// rutene som står i sitemap-en.
import { readFile, writeFile } from 'node:fs/promises'
import { transform } from 'esbuild'

const SITE_URL = 'https://minio.no'
const DATA_FILE = 'src/data/byggeguider.ts'
const REGISTRY_FILE = 'src/designer/registry.ts'
const TEMPLATE_DIR = 'src/designer/templates'
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

// 3. Designverktøyet: landingssiden + én side per mal i registeret. Malene
//    importerer three.js og kan ikke lastes i Node, så id-ene leses ut av
//    kildefilene registry.ts importerer (hver mal har nøyaktig én `id:` på
//    toppnivå i objektet).
const registrySource = await readFile(REGISTRY_FILE, 'utf-8')
const templateFiles = [...registrySource.matchAll(/from '\.\/templates\/([\w-]+)'/g)].map((m) => m[1])
const templateIds = []
for (const file of templateFiles) {
  const source = await readFile(`${TEMPLATE_DIR}/${file}.ts`, 'utf-8')
  const id = source.match(/^ {2}id: '([^']+)'/m)?.[1]
  if (id) templateIds.push(id)
  else console.warn(`[sitemap] fant ingen id i ${TEMPLATE_DIR}/${file}.ts – hoppet over`)
}

const designerBlocks = [
  `  <url>
    <loc>${SITE_URL}/designverktoy</loc>
    <lastmod>${fallbackDate}</lastmod>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
  </url>`,
  ...templateIds.map(
    (id) => `  <url>
    <loc>${SITE_URL}/designverktoy/${id}</loc>
    <lastmod>${fallbackDate}</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>`,
  ),
].join('\n')

// 4. Fjern eksisterende artikkel-blokker (enkelt-segment /byggeguider/<slug>)
//    og alle /designverktoy-blokker. Hub (/byggeguider) og
//    /byggeguider/prosjekter/* matcher ikke og bevares.
let sitemap = await readFile(SITEMAP_FILE, 'utf-8')
sitemap = sitemap.replace(
  /[ \t]*<url>\s*<loc>https:\/\/minio\.no\/byggeguider\/[^/<]+<\/loc>[\s\S]*?<\/url>\n/g,
  ''
)
sitemap = sitemap.replace(
  /[ \t]*<url>\s*<loc>https:\/\/minio\.no\/designverktoy(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\n/g,
  ''
)

// 5. Sett inn de genererte blokkene rett før </urlset>.
sitemap = sitemap.replace(/(\n?)<\/urlset>/, `\n${designerBlocks}\n${articleBlocks}\n</urlset>`)

await writeFile(SITEMAP_FILE, sitemap)
console.log(
  `[sitemap] skrev ${templateIds.length + 1} designverktøy-sider og ` +
    `${guideTopics.filter((t) => t.available).length} byggeguider-artikler til ${SITEMAP_FILE}`,
)
