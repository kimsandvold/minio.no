import { designerSymbols } from '../../../data/designerSymbols'
import { produkt, type Valg } from '../../../data/gravering'
import { graveringGeometri, motivFelt, type Primitiv } from './graveringGeometri'
import { byggMotiv, type MotivElement } from './graveringMotiv'

/**
 * Produksjonsfila: graveringen som ren vektor-SVG, klar for graveringsmaskinen.
 *
 * To regler styrer alt her:
 *
 * 1. INGEN SKRIFTAVHENGIGHET. All tekst gjøres om til kurver med opentype.js
 *    mot TTF-filene i `public/fonts/gravering/`. Fila ser derfor lik ut uansett
 *    hvilken maskin eller programvare den åpnes i.
 * 2. INGEN STREKTYKKELSE I GRAVERINGEN. Maskinprogramvare (LightBurn og
 *    liknende) importerer gjerne streker som nullbreddebaner og mister
 *    `stroke-width`. Hårstreker og ringer tegnes derfor som fylte flater.
 *
 * Omrisset av produktet ligger i en EGEN, RØD gruppe med hårtynn strek. Den er
 * der for å skalere og plassere motivet på emnet, og skal slettes før du
 * graverer. Fargen er valgt med vilje: maskinprogramvare (LightBurn og
 * liknende) grupperer importerte baner etter farge, så omrisset havner på sitt
 * eget lag og kan slås av eller slettes med ett klikk – uten å røre motivet.
 * Gruppene er dessuten merket som Inkscape-lag, så de får navn der også.
 */

/** Rød = referanse som skal bort. Sort = det som faktisk graveres. */
const REFERANSEFARGE = '#ff0000'
/** Hårstrek: tynn nok til å ikke forveksles med motivet. */
const REFERANSESTREK = 0.15

const INKSCAPE = 'xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"'

/** Åpner en navngitt lag-gruppe som både Inkscape og LightBurn forstår. */
function lag(id: string, navn: string, attributter: string): string {
  return `  <g id="${id}" inkscape:groupmode="layer" inkscape:label="${navn}" ${attributter}>`
}

/**
 * Pregekjevla graveres speilvendt. Kjevla ruller over deigen, og avtrykket blir
 * et speilbilde av overflaten om kjevlas egen akse – altså speilvendt på tvers
 * av rulleretningen, som i utbrettet er loddrett. Derfor snus
 * graveringsgruppen med `scale(1, -1)` i kjevlefila, og bare der.
 *
 * Kjør alltid en prøve i papp eller deig før den første kjevla: feil vei her
 * koster et emne.
 */
const SPEILVEND_KJEVLE = true

/** TTF-ene som ligger i public/fonts/gravering/, per skriftfamilie. */
const FONTFILER: Record<string, string> = {
  Montserrat: 'montserrat.ttf',
  'Playfair Display': 'playfair-display.ttf',
  'Cormorant Garamond': 'cormorant-garamond.ttf',
  Lora: 'lora.ttf',
  'Bebas Neue': 'bebas-neue.ttf',
  'Dancing Script': 'dancing-script.ttf',
  'Great Vibes': 'great-vibes.ttf',
  'Permanent Marker': 'permanent-marker.ttf',
}

const RESERVE = 'Montserrat'

type Font = import('opentype.js').Font
type Glyph = import('opentype.js').Glyph

const lastet = new Map<string, Promise<Font>>()

/** Laster og tolker TTF-en. Hver skrift hentes bare én gang per økt. */
function hentFont(familie: string): Promise<Font> {
  const fil = FONTFILER[familie] ?? FONTFILER[RESERVE]
  const eksisterende = lastet.get(fil)
  if (eksisterende) return eksisterende

  const jobb = (async () => {
    const [{ parse }, svar] = await Promise.all([import('opentype.js'), fetch(`/fonts/gravering/${fil}`)])
    if (!svar.ok) throw new Error(`Fant ikke skriften ${fil} (${svar.status})`)
    return parse(await svar.arrayBuffer())
  })().catch((feil) => {
    // Hellere riktig motiv i reserveskriften enn ingen fil. Reserven lastes
    // bare hvis det var en annen skrift som feilet, ellers kaster vi videre.
    console.error(`Kunne ikke laste ${fil}`, feil)
    lastet.delete(fil)
    if (fil === FONTFILER[RESERVE]) throw feil
    return hentFont(RESERVE)
  })

  lastet.set(fil, jobb)
  return jobb
}

const rund = (n: number) => Number(n.toFixed(3))

/**
 * Tegnene slått opp ett for ett.
 *
 * Bevisst `charToGlyph` og ikke `stringToGlyphs`: sistnevnte kjører GSUB-
 * tabellen, og opentype.js kaster på oppslagstyper den ikke støtter (flere av
 * skriveskriftene våre har slike). Vi trenger uansett glyfene enkeltvis for å
 * legge inn sperring, og mister bare ligaturer – som ikke hører hjemme i en
 * gravering likevel.
 */
function glyfer(font: Font, tekst: string): Glyph[] {
  return [...tekst].map((tegn) => font.charToGlyph(tegn))
}

/** Knipet mellom to glyfer i mm. Skrifter uten kerningtabell gir 0. */
function kniping(font: Font, forrige: Glyph | undefined, glyf: Glyph, px: number): number {
  if (!forrige) return 0
  try {
    return (font.getKerningValue(forrige, glyf) / font.unitsPerEm) * px
  } catch {
    return 0
  }
}

/** Bredden på en tekst i mm, med sperring, målt i selve skriften. */
function tekstbredde(font: Font, tekst: string, px: number, sperring = 0): number {
  const liste = glyfer(font, tekst)
  let bredde = 0
  liste.forEach((g, i) => {
    bredde += ((g.advanceWidth ?? 0) / font.unitsPerEm) * px + kniping(font, liste[i - 1], g, px)
  })
  return bredde + sperring * Math.max(0, liste.length - 1)
}

/**
 * Én glyf som path-data, skalert og plassert for hånd.
 *
 * Vi bruker bevisst IKKE `glyph.getPath().toPathData()`: den gir NaN-verdier i
 * kontrollpunktene når flere glyfer tegnes etter hverandre (opentype.js 2.0),
 * og en bane med NaN slutter å tegne akkurat der – i praksis forsvant alt
 * utenom de første bokstavene i produksjonsfila. Glyfens egne kommandoer er
 * rene, så vi regner om koordinatene selv: fontenheter → millimeter, og y
 * snus, siden fonten har y oppover og SVG har y nedover.
 */
function glyfTilPath(font: Font, glyf: Glyph, x: number, grunnlinje: number, px: number): string {
  const skala = px / font.unitsPerEm
  const X = (v: number | undefined) => rund(x + (v ?? 0) * skala)
  const Y = (v: number | undefined) => rund(grunnlinje - (v ?? 0) * skala)

  const biter: string[] = []
  for (const k of glyf.path?.commands ?? []) {
    if (k.type === 'M') biter.push(`M${X(k.x)} ${Y(k.y)}`)
    else if (k.type === 'L') biter.push(`L${X(k.x)} ${Y(k.y)}`)
    else if (k.type === 'Q') biter.push(`Q${X(k.x1)} ${Y(k.y1)} ${X(k.x)} ${Y(k.y)}`)
    else if (k.type === 'C') biter.push(`C${X(k.x1)} ${Y(k.y1)} ${X(k.x2)} ${Y(k.y2)} ${X(k.x)} ${Y(k.y)}`)
    else if (k.type === 'Z') biter.push('Z')
  }

  const d = biter.join(' ')
  // Siste skanse: en ugyldig bane ville stoppet tegningen midt i et ord.
  if (d.includes('NaN')) {
    console.error('Hoppet over en glyf med ugyldige koordinater', { tegn: d.slice(0, 40) })
    return ''
  }
  return d
}

/** Teksten som kurver. Sperringen legges inn mellom glyfene, ikke etter den siste. */
function tekstTilKurver(font: Font, el: Extract<MotivElement, { slag: 'tekst' }>): string {
  const bredde = tekstbredde(font, el.tekst, el.px, el.sperring)
  let x = el.anker === 'start' ? el.x : el.anker === 'end' ? el.x - bredde : el.x - bredde / 2

  const biter: string[] = []
  const liste = glyfer(font, el.tekst)
  liste.forEach((glyf, i) => {
    x += kniping(font, liste[i - 1], glyf, el.px)
    const d = glyfTilPath(font, glyf, x, el.y, el.px)
    if (d) biter.push(d)
    x += ((glyf.advanceWidth ?? 0) / font.unitsPerEm) * el.px + el.sperring
  })
  return biter.join(' ')
}

/** Avrundet firkant som path – brukes til omriss og saftrille. */
function firkant(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  return [
    `M ${rund(x + radius)} ${rund(y)}`,
    `H ${rund(x + w - radius)}`,
    `A ${rund(radius)} ${rund(radius)} 0 0 1 ${rund(x + w)} ${rund(y + radius)}`,
    `V ${rund(y + h - radius)}`,
    `A ${rund(radius)} ${rund(radius)} 0 0 1 ${rund(x + w - radius)} ${rund(y + h)}`,
    `H ${rund(x + radius)}`,
    `A ${rund(radius)} ${rund(radius)} 0 0 1 ${rund(x)} ${rund(y + h - radius)}`,
    `V ${rund(y + radius)}`,
    `A ${rund(radius)} ${rund(radius)} 0 0 1 ${rund(x + radius)} ${rund(y)}`,
    'Z',
  ].join(' ')
}

function sirkel(cx: number, cy: number, r: number): string {
  return [
    `M ${rund(cx - r)} ${rund(cy)}`,
    `a ${rund(r)} ${rund(r)} 0 1 0 ${rund(r * 2)} 0`,
    `a ${rund(r)} ${rund(r)} 0 1 0 ${rund(-r * 2)} 0`,
    'Z',
  ].join(' ')
}

function primitivTilPath(p: Primitiv): string {
  if (p.form === 'rect') return firkant(p.x, p.y, p.w, p.h, p.r)
  if (p.form === 'circle') return sirkel(p.cx, p.cy, p.r)
  return p.d
}

/**
 * Motivet som fylte kurver. Streker blir til smale firkanter og ringer til
 * ringflater, slik at tykkelsen ligger i geometrien og ikke i `stroke-width`.
 */
function motivTilPaths(font: Font, motiv: MotivElement[]): { fylt: string[]; strek: string[] } {
  const fylt: string[] = []
  const strek: string[] = []

  for (const el of motiv) {
    if (el.slag === 'tekst') {
      const d = tekstTilKurver(font, el)
      if (d) fylt.push(d)
    } else if (el.slag === 'strek') {
      const halv = el.bredde / 2
      fylt.push(firkant(el.x1, el.y1 - halv, el.x2 - el.x1, el.bredde, halv))
    } else if (el.slag === 'ring') {
      // Ringflate: ytre og indre sirkel i samme path, med evenodd-fyll.
      fylt.push(`${sirkel(el.cx, el.cy, el.r + el.bredde / 2)} ${sirkel(el.cx, el.cy, el.r - el.bredde / 2)}`)
    } else {
      // Symbolene er tegnet i et 100 × 100-rutenett. De er fylte former, men
      // de rene strektegningene (sol, snøfnugg) trenger streken for å vises.
      const skala = el.storrelse / 100
      strek.push(
        `<g transform="translate(${rund(el.x)} ${rund(el.y)}) scale(${rund(skala)})">` +
          `<path d="${el.path}" stroke-width="${rund(4)}" />` +
          '</g>',
      )
    }
  }

  return { fylt, strek }
}

/**
 * Symbolene legges INNE i graveringslaget. De trenger sine egne attributter –
 * rene strektegninger (sol, snøfnugg) forsvinner uten strek – men de hører til
 * samme gravering, og et mønster uten tekst ville ellers etterlatt et tomt
 * «gravering»-lag og alt innholdet i et annet.
 */
function symbolgruppe(strek: string[]): string[] {
  if (!strek.length) return []
  return [
    '    <!-- Symbolene beholder strek, så rene strektegninger ikke forsvinner. -->',
    '    <g id="symbol" stroke="#000000" stroke-linecap="round" stroke-linejoin="round">',
    ...strek.map((s) => `  ${s}`),
    '    </g>',
  ]
}

const esc = (s: string) => s.replace(/[<>&]/g, (t) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[t] ?? t)

export interface GraveringSvg {
  svg: string
  filnavn: string
}

/**
 * Bygger produksjonsfila for et valg. Layouten regnes ut med skriftens egne
 * mål, så kurvene står nøyaktig der de skal i forhold til hverandre.
 */
export async function byggGraveringSvg(valg: Valg): Promise<GraveringSvg> {
  const p = produkt(valg.produkt)
  const variant = p.varianter.find((v) => v.id === valg.variant) ?? p.varianter[0]
  const flate = p.flater.find((f) => f.id === valg.flate) ?? p.flater[0]
  const geo = graveringGeometri(p.form, variant.bredde, variant.hoyde)
  const symbol = valg.symbol ? designerSymbols.find((s) => s.id === valg.symbol) : undefined

  const font = await hentFont(valg.font)

  // Rullende produkter graveres i det utbrettede sylinderplanet: lengden langs
  // kjevla, omkretsen rundt. Mønsteret må gå opp der utbrettet lukkes.
  const felt = motivFelt(geo, valg.oppsett)

  const motiv = byggMotiv({
    felt,
    linjer: valg.linjer.slice(0, p.maksLinjer),
    symbolPath: symbol?.path ?? null,
    oppsett: valg.oppsett,
    juster: valg.juster,
    loddrett: valg.loddrett,
    synlig: geo.wrap?.diameter,
    maal: (tekst, px) => tekstbredde(font, tekst, px),
  })

  const { fylt, strek } = motivTilPaths(font, motiv)

  const tekstlinjer = valg.linjer.slice(0, p.maksLinjer).filter((l) => l.trim())
  const beskrivelse = [
    `${p.navn} – ${geo.maal}`,
    flate.navn,
    `Skrift: ${valg.font} (konvertert til kurver)`,
    tekstlinjer.length ? `Tekst: ${tekstlinjer.join(' / ')}` : 'Uten tekst',
    'Rødt omriss = emnets mål, til skalering – slettes før gravering. Sort = graveringen',
  ].join(' · ')

  if (geo.wrap) {
    // Kjevlefila: flaten brettet ut, klar for roterende akse.
    const { lengde, omkrets, diameter } = geo.wrap
    const speil = SPEILVEND_KJEVLE ? ` transform="translate(0 ${rund(omkrets)}) scale(1 -1)"` : ''
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" ${INKSCAPE} viewBox="0 0 ${rund(lengde)} ${rund(omkrets)}" width="${rund(lengde)}mm" height="${rund(omkrets)}mm">`,
      `  <title>${esc(`Gravering – ${p.navn}`)}</title>`,
      `  <desc>${esc(
        `${beskrivelse}. Utbrettet trykkflate: ${rund(lengde)} mm langs kjevla (X) × ${rund(omkrets)} mm omkrets (Y), Ø ${diameter} mm. ` +
          (SPEILVEND_KJEVLE
            ? 'Motivet er speilvendt om kjevlas akse, slik at avtrykket i deigen leses riktig vei. Prøv i papp eller deig før første emne.'
            : 'Motivet er IKKE speilvendt – det graveres slik det står på kjevla.'),
      )}</desc>`,
      '  <!-- RØD = trykkflaten utbrettet, til skalering og oppsett på roterende',
      '       akse. Slett dette laget før du graverer. -->',
      lag('omriss', 'Omriss – slett etter skalering', `fill="none" stroke="${REFERANSEFARGE}" stroke-width="${REFERANSESTREK}"`),
      `    <path d="${firkant(0, 0, lengde, omkrets, 0)}" />`,
      '  </g>',
      '  <!-- SORT = selve graveringen. Tekst er kurver; ingen skrift kreves. -->',
      lag('gravering', 'Gravering', `fill="#000000" fill-rule="evenodd" stroke="none"${speil}`),
      ...fylt.map((d) => `    <path d="${d}" />`),
      ...symbolgruppe(strek),
      '  </g>',
      '</svg>',
      '',
    ].join('\n')
    return { svg, filnavn: graveringFilnavn(valg) }
  }

  const omriss = [
    ...geo.primitiver.map(primitivTilPath),
    ...(geo.rille
      ? [
          // Høyde 0 = rett strek (stålringen på flaska), ellers en ramme
          // (saftrillen på fjøla).
          geo.rille.h === 0
            ? `M ${rund(geo.rille.x)} ${rund(geo.rille.y)} H ${rund(geo.rille.x + geo.rille.w)}`
            : firkant(geo.rille.x, geo.rille.y, geo.rille.w, geo.rille.h, geo.rille.r),
        ]
      : []),
    ...(geo.hull ? [sirkel(geo.hull.cx, geo.hull.cy, geo.hull.r)] : []),
  ]

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" ${INKSCAPE} viewBox="0 0 ${geo.bredde} ${geo.hoyde}" width="${geo.bredde}mm" height="${geo.hoyde}mm">`,
    `  <title>${esc(`Gravering – ${p.navn}`)}</title>`,
    `  <desc>${esc(beskrivelse)}</desc>`,
    '  <!-- RØD = emnets ytterkant (og saftrillen), i nøyaktige millimeter. Skaler',
    '       motivet etter denne, og slett så hele laget før du graverer. -->',
    lag('omriss', 'Omriss – slett etter skalering', `fill="none" stroke="${REFERANSEFARGE}" stroke-width="${REFERANSESTREK}"`),
    ...omriss.map((d) => `    <path d="${d}" />`),
    '  </g>',
    '  <!-- SORT = selve graveringen. Tekst er kurver; ingen skrift kreves. -->',
    lag('gravering', 'Gravering', 'fill="#000000" fill-rule="evenodd" stroke="none"'),
    ...fylt.map((d) => `    <path d="${d}" />`),
    ...symbolgruppe(strek),
    '  </g>',
    '</svg>',
    '',
  ].join('\n')

  return { svg, filnavn: graveringFilnavn(valg) }
}

/** Filnavn uten mappe: «gravering-skjaerefjol-familien-berg.svg». */
export function graveringFilnavn(valg: Valg): string {
  const p = produkt(valg.produkt)
  const forste = valg.linjer.find((l) => l.trim()) ?? ''
  const reint = (t: string) =>
    t
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'oe')
      .replace(/å/g, 'aa')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  return ['gravering', reint(p.navn), reint(forste)].filter(Boolean).join('-') + '.svg'
}

/** Laster SVG-en ned i nettleseren. */
export function lastNedSvg({ svg, filnavn }: GraveringSvg): void {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filnavn
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
