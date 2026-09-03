import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { KV_BJELKE_PRIS, antallCC, byggPulttak, byggSaltak, byggValmtak, gradBjelke, maksGulvSpenn, settSplitt, takBomFromBuild } from '../konstruksjon'

/**
 * Postkassestativ – bygges opp på nytt, steg for steg. STEG 1: GULV.
 *
 * Kun gulvet er med nå: bjelkelag i 48×98 (C24, c/c ≤ 600 mm) på nedgravde
 * betongklosser, med terrassebord-dekke oppå (21×98 eller 28×120). Vegger, tak,
 * postkasser osv. bygges på senere.
 */

export interface SoppelbodConfig {
  bredde: number // cm (x)
  dybde: number // cm (z)
  hoyde: number // cm (y) – vegghøyde
  gulvbord: string // '21x98' | '28x120'
  kledningsbord: string // '19x148' | '19x98' | 'lekt'
  taktype: string // 'pulttak' | 'valmtak' | 'saltak'
  takvinkel: number // grader
  takutstikk: number // cm takutstikk
  takretning: string // pulttak: bak|front|venstre|hoyre
  moneretning: string // saltak: bredde|dybde
  takpapp: boolean // tekking oppå den faste kryssfineren
  bakvegapning: boolean // full-bredde åpning i bakveggen
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}


const SVINN = 1.1
const cm = (v: number) => v / 100
const scale = 0.01

// Bjelkelag (norsk standard): 48×98 C24, c/c ≤ 600 mm.
const JH = 0.098 // bjelkehøyde
const JW = 0.048 // bjelketykkelse
const PAD_H = 0.08 // synlig høyde betongkloss
const DEKKE_GAP = 0.005 // sprekk mellom terrassebord

// Veggramme (stenderverk): 48×98 C24. Hjørnene er doble (to 48×98 i L-form).
const ST = 0.098 // stender-dybde (inn i veggen)
const SW = 0.048 // stender-tykkelse (langs veggen)
const STUD_PROFIL = '48 × 98 mm'
const CC = 0.6 // senteravstand stendere

// Terrassebord-alternativer for gulvdekket.
function boardSpec(id: string) {
  return id === '21x98'
    ? { t: 0.021, w: 0.098, profil: '21 × 98 mm', pris: 'bord-21x98' }
    : { t: 0.028, w: 0.12, profil: '28 × 120 mm', pris: 'terrassebord-28x120' }
}

// ── Utvendig kledning (stående bordkledning) ──────────────────────────────
function kledningSpec(id: string) {
  if (id === '19x98') return { t: 0.019, w: 0.098, profil: '19 × 98 mm', pris: 'bord-19x98' }
  if (id === 'lekt') return { t: 0.023, w: 0.048, profil: 'Lekt 23 × 48 mm', pris: 'lekt-23x48' }
  return { t: 0.019, w: 0.148, profil: '19 × 148 mm', pris: 'bord-19x148' }
}

// Takets underkant (bæreplan / sperre-underkant) over et punkt (x,z) i veggflukten.
// Kledningen går opp hit – dvs. dekker toppdrageren og møter takets underside –
// men aldri høyere, så bordene ikke stikker gjennom takplata. Sperre-ender dekkes
// av fascia/vindski (bygges av takfunksjonene).
function takUnderkant(c: SoppelbodConfig, x: number, z: number, w: number, d: number, topY: number): number {
  const rad = (c.takvinkel * Math.PI) / 180
  if (c.taktype === 'pulttak') {
    let ddp: number, s: number
    if (c.takretning === 'venstre') { ddp = w; s = x }
    else if (c.takretning === 'hoyre') { ddp = w; s = -x }
    else if (c.takretning === 'front') { ddp = d; s = -z }
    else { ddp = d; s = z } // 'bak'
    return topY + ddp * Math.tan(rad) * ((s + ddp / 2) / ddp)
  }
  if (c.taktype === 'saltak') {
    const along = c.moneretning === 'dybde' ? w : d
    const p = c.moneretning === 'dybde' ? x : z
    const halfD = along / 2
    const rise = halfD * Math.tan(rad)
    return topY + rise - (halfD > 1e-6 ? (rise / halfD) * Math.abs(p) : 0)
  }
  return topY // valmtak
}

interface CladBoard { x: number; y: number; z: number; dx: number; dz: number; h: number }

const KLED_JAMB = 0.12 // bredde på kledde jamber ved siden av front-åpningen

// Kledningsbord: side- + bakvegg fra bjelkelaget opp til taket, og fronttopp fra
// toppdrageren opp til taket (fronten står ellers åpen). Hvert bord kappes til
// takfallet (topp = takUnderkant på bordets senter).
function kledningBoards(c: SoppelbodConfig, w: number, d: number, topY: number, botWall: number, frontBot: number, opening?: { b: number; t: number }) {
  const ks = kledningSpec(c.kledningsbord)
  const kt = ks.t
  const topGap = 0.008 // klaring opp mot taket
  const SPRKK = 0.003 // 3 mm luftesprekk mellom bordene
  const boards: CladBoard[] = []
  const legg = (axis: 'x' | 'z', outer: number, cc0: number, bredde: number, y0: number, y1: number) => {
    const h = y1 - y0
    if (h < 0.03) return
    boards.push({
      x: axis === 'z' ? outer : cc0,
      z: axis === 'z' ? cc0 : outer,
      dx: axis === 'z' ? kt : bredde,
      dz: axis === 'z' ? bredde : kt,
      y: y0 + h / 2,
      h,
    })
  }
  const run = (axis: 'x' | 'z', outer: number, from: number, to: number, botAt: number | ((t: number) => number), topAt: (t: number) => number, split?: { b: number; t: number; xMin: number; xMax: number }) => {
    const n = Math.max(1, Math.round((to - from) / (ks.w + SPRKK)))
    const step = (to - from) / n // senteravstand
    const bredde = step - SPRKK // bordbredde med 3 mm sprekk
    for (let i = 0; i < n; i++) {
      const cc0 = from + step * (i + 0.5)
      const top = topAt(cc0) - topGap
      const bot = typeof botAt === 'number' ? botAt : botAt(cc0)
      // Splitt (åpning) kun i selve hull-bredden – kolonnene over hjørnestolpene står hele.
      if (split && cc0 >= split.xMin && cc0 <= split.xMax && split.b > bot + 0.03 && split.t < top - 0.03) {
        legg(axis, outer, cc0, bredde, bot, split.b) // nedre bordstubb
        legg(axis, outer, cc0, bredde, split.t, top) // øvre bordstubb
      } else {
        legg(axis, outer, cc0, bredde, bot, top)
      }
    }
  }
  run('z', -w / 2 - kt / 2, -d / 2, d / 2, botWall, (z) => takUnderkant(c, -w / 2, z, w, d, topY))
  run('z', w / 2 + kt / 2, -d / 2, d / 2, botWall, (z) => takUnderkant(c, w / 2, z, w, d, topY))
  // Bakvegg: bordene går forbi veggkantene (±kt) så de dekker endeveden på
  // sidekledningen (sømløst hjørne). Hullet holdes innenfor hjørnestolpene (±ST).
  const clampX = (x: number) => Math.max(-w / 2, Math.min(w / 2, x))
  run('x', -d / 2 - kt / 2, -(w / 2 + kt), w / 2 + kt, botWall, (x) => takUnderkant(c, clampX(x), -d / 2, w, d, topY), opening ? { ...opening, xMin: -w / 2 + ST, xMax: w / 2 - ST } : undefined) // bakvegg m/ åpning
  // Front: ÉN sammenhengende bordrekke (sømløst). Kolonnene ved kantene (jamber)
  // går helt til gulv; kolonnene i midten stopper ved `frontBot` (120 cm) → åpning.
  run('x', d / 2 + kt / 2, -w / 2, w / 2, (x) => (Math.abs(x) >= w / 2 - KLED_JAMB ? botWall : frontBot), (x) => takUnderkant(c, x, d / 2, w, d, topY))
  return { boards, ks }
}

// Bordposisjoner over dybden `d`: hele bord (bredde `bw`) med sprekk, siste
// bord kløyves (rippes) smalere så dekket fyller hele rammen fra kant til kant.
function dekkePosisjoner(d: number, bw: number) {
  const res: Array<{ z: number; w: number }> = []
  let z0 = -d / 2
  while (z0 < d / 2 - 0.005) {
    const wdt = Math.min(bw, d / 2 - z0)
    res.push({ z: z0 + wdt / 2, w: wdt })
    z0 += wdt + DEKKE_GAP
  }
  return res
}

interface Del {
  navn: string
  profil: string
  lengdeM: number
  antall: number
  mat: string
}

function geo(c: SoppelbodConfig) {
  const w = c.bredde * scale
  const d = c.dybde * scale
  // 21×98 terrassebord spenner kortere → tettere bjelkelag (c/c 450 mm), ellers c/c 600.
  const gulvCC = c.gulvbord === '21x98' ? 0.45 : 0.6
  const nBjelke = Math.max(2, antallCC(w, gulvCC)) // inkl. de to side-kantbjelkene
  const nPadX = w > 1.5 ? 3 : 2
  // Gulvbjelkene spenner dybden d; over maks spenn legges en midtre oppleggsrekke
  // (bærebjelke) så spennet halveres (SINTEF Byggforsk 522.351).
  const nPadZ = d > maksGulvSpenn(gulvCC) + 1e-6 ? 3 : 2
  const fg = gradBjelke(Math.max(d / (nPadZ - 1), w / (nPadX - 1)), gulvCC) // største spenn styrer
  return { w, d, nBjelke, nPadX, nPadZ, fg }
}

function deler(c: SoppelbodConfig): Del[] {
  const { w, d, nBjelke, nPadZ, fg } = geo(c)
  const oh = c.takutstikk * scale
  const out: Del[] = []
  const push = (navn: string, profil: string, lengdeM: number, antall: number, mat: string) => {
    if (lengdeM > 0.001 && antall > 0) out.push({ navn, profil, lengdeM, antall, mat })
  }
  // Kantbjelker (perimeter): front/bak (langs bredden) + de to sidene.
  push('Kantbjelke front/bak', fg.profil, w, 2, fg.pris)
  push('Kantbjelke side', fg.profil, d, 2, fg.pris)
  if (nPadZ === 3) push('Bærebjelke (gulv)', fg.profil, w, 1, fg.pris) // midtre opplegg ved store dybder
  // Gjennomgående gulvbjelker mellom side-kantbjelkene.
  const nInner = Math.max(0, nBjelke - 2)
  if (nInner > 0) push('Gulvbjelke', fg.profil, d - 2 * JW, nInner, fg.pris)
  // Terrassebord-dekke oppå bjelkelaget (fyller rammen, siste bord rippes).
  const b = boardSpec(c.gulvbord)
  push('Terrassebord (gulv)', b.profil, w, dekkePosisjoner(d, b.w).length, b.pris)

  // Veggramme: doble hjørner + bunnsvill + dobbel toppdrager + mellomstendere.
  const tbW = c.bredde // dobbel toppdrager – gradert etter bredde-spenn
  const topBeamH = tbW <= 240 ? 0.148 : tbW <= 360 ? 0.198 : 0.223
  const topBeamProfil = tbW <= 240 ? '48 × 148 mm' : tbW <= 360 ? '48 × 198 mm' : '48 × 223 mm'
  const topBeamPris = tbW <= 240 ? 'bjelke-48x148' : tbW <= 360 ? 'bjelke-48x198' : 'bjelke-48x223'
  const postH = c.hoyde * scale - SW - topBeamH
  push('Hjørnestolpe (dobbel 48×98)', STUD_PROFIL, c.hoyde * scale - topBeamH, 8, KV_BJELKE_PRIS)
  push('Bunnsvill bak', STUD_PROFIL, w, 1, KV_BJELKE_PRIS)
  push('Bunnsvill side', STUD_PROFIL, d - 2 * ST, 2, KV_BJELKE_PRIS)
  push('Toppdrager (dobbel) front/bak', topBeamProfil, w, 4, topBeamPris)
  push('Toppdrager (dobbel) side', topBeamProfil, d - 2 * ST, 4, topBeamPris)
  // Bakvegg (1×) + to sider (2×) – fronten står åpen.
  const nStud = (Math.max(1, Math.ceil(w / CC)) - 1) + 2 * (Math.max(1, Math.ceil(d / CC)) - 1)
  if (nStud > 0) push('Stender', STUD_PROFIL, postH, nStud, KV_BJELKE_PRIS)
  // Horisontal kryssavstiving (losholt) mellom stenderne, c/c 600 – sider + bakvegg.
  const nLosholt = Math.max(0, Math.floor((postH - 0.05) / CC))
  const baysZ = Math.max(1, Math.ceil(d / CC))
  const losholtLen = ((d - 2 * ST) - (baysZ - 1) * SW) / baysZ
  if (nLosholt > 0 && losholtLen > 0.02) push('Losholt (kryss, side)', STUD_PROFIL, losholtLen, 2 * nLosholt * baysZ, KV_BJELKE_PRIS)
  const baysXb = Math.max(1, Math.ceil(w / CC))
  const losholtLenBak = ((w - SW) - (baysXb - 1) * SW) / baysXb
  if (nLosholt > 0 && losholtLenBak > 0.02) push('Losholt (kryss, bak)', STUD_PROFIL, losholtLenBak, nLosholt * baysXb, KV_BJELKE_PRIS)

  // Tak – utledet direkte fra takbyggern (sperrer, takstoler, lekt, møne + trim),
  // så materiallista matcher 3D-modellen nøyaktig.
  takBomFromBuild(c.taktype, w, d, c.takvinkel, oh, c.takretning, c.moneretning, c.takpapp ? 'takpapp' : 'kryssfiner')
    .forEach((p) => push(p.navn, p.profil, p.lengdeM, p.antall, p.mat))

  // Utvendig kledning (side-/bakvegg + fronttopp) – med valgfri åpning i bakveggen.
  const deckTopD = PAD_H + fg.h + boardSpec(c.gulvbord).t
  const topY = deckTopD + c.hoyde * scale
  const roofBackD = Math.min(
    takUnderkant(c, -w / 2, -d / 2, w, d, topY),
    takUnderkant(c, 0, -d / 2, w, d, topY),
    takUnderkant(c, w / 2, -d / 2, w, d, topY),
  )
  const openBd = deckTopD + 1.0
  const openTd = Math.min(roofBackD - 0.1, topY - topBeamH, openBd + 1.5)
  const harApningD = c.bakvegapning === true && openTd > openBd + 0.05
  const frontCladBotD = deckTopD + 1.2
  const kled = kledningBoards(c, w, d, topY, PAD_H, frontCladBotD, harApningD ? { b: openBd, t: openTd } : undefined)
  if (kled.boards.length > 0) {
    const totLm = kled.boards.reduce((s, bd) => s + bd.h, 0)
    push('Kledning', kled.ks.profil, totLm / kled.boards.length, kled.boards.length, kled.ks.pris)
  }
  if (harApningD) push('Karm (sill + overligger)', STUD_PROFIL, w - 2 * ST, 2, KV_BJELKE_PRIS)
  // Front-ramme som bærer kledningen over 120 cm (nibbe + stendere).
  const frontWallTopD = topY - topBeamH
  if (frontWallTopD - frontCladBotD > 0.05) {
    push('Sill (front)', STUD_PROFIL, w - 2 * SW, 1, KV_BJELKE_PRIS)
    const fHd = frontWallTopD - (frontCladBotD + SW / 2)
    const nFront = Math.max(0, Math.max(1, Math.ceil(c.bredde / 60)) - 1)
    if (fHd > 0.05 && nFront > 0) push('Stender (front)', STUD_PROFIL, fHd, nFront, KV_BJELKE_PRIS)
  }
  return out
}

function beregn(c: SoppelbodConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const { nPadX } = geo(c)
  const del = deler(c)

  const lmByMat = new Map<string, number>()
  del.forEach((p) => lmByMat.set(p.mat, (lmByMat.get(p.mat) ?? 0) + p.lengdeM * p.antall))

  let woodKr = 0
  let totalLm = 0
  lmByMat.forEach((lmv, mat) => {
    totalLm += lmv
    woodKr += lmv * prisFor(mat) * faktor
  })
  const nPad = nPadX * 2
  const skruer = Math.round(totalLm * 4 + 20)
  const takArealM2 = ((c.bredde + 2 * c.takutstikk) / 100) * ((c.dybde + 2 * c.takutstikk) / 100) / Math.max(0.35, Math.cos((c.takvinkel * Math.PI) / 180))
  const takKr = takArealM2 * prisFor('kryssfiner-18') + (c.takpapp ? takArealM2 * prisFor('taktekke-takpapp') : 0)
  const estimatKr =
    Math.round(((woodKr) * SVINN + skruer * prisFor('skrue') + nPad * prisFor('stolpesko') + takKr) / 10) * 10

  const linjer: BomLine[] = [...lmByMat.entries()].map(([mat, lmv]) => ({
    navn: PRISER[mat]?.navn ?? mat,
    antall: Math.round(lmv * SVINN * 10) / 10,
    enhet: 'lm',
    kommentar: 'inkl. 10 % svinn',
  }))
  linjer.push({ navn: 'Taktekking (18 mm kryssfiner)', antall: Math.round(takArealM2 * SVINN * 10) / 10, enhet: 'm²', kommentar: 'inkl. svinn' })
  if (c.takpapp) linjer.push({ navn: 'Takpapp', antall: Math.round(takArealM2 * SVINN * 10) / 10, enhet: 'm²', kommentar: 'inkl. svinn' })
  linjer.push({ navn: 'Fundament (betongkloss)', antall: nPad, enhet: 'stk', kommentar: 'nedgravd/avrettet' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4', antall: skruer, enhet: 'stk' })

  const sammendrag = `${c.bredde} × ${c.dybde} × ${c.hoyde} cm · gulv + veggramme (stenderverk 48×98, doble hjørner)`

  // Montering/arbeidstid: 12 t (liten, enkel) → 35 t (stor og kompleks).
  // Basert på faktisk byggetid; skaleres av grunnflate + kompleksitet
  // (taktype, kledningsmengde, åpning). Driver «ferdig bygget»-tilbudet.
  const area = (c.bredde * c.dybde) / 10000
  const sizeN = Math.min(1, Math.max(0, (area - 0.5) / (5.0 - 0.5)))
  let arbeidstimer = 12 + sizeN * 16 // 12 t (liten) → 28 t (stor grunnflate)
  if (c.taktype === 'valmtak') arbeidstimer += 5
  else if (c.taktype === 'saltak') arbeidstimer += 2.5
  if (c.bakvegapning) arbeidstimer += 1.5
  arbeidstimer = Math.round(Math.min(35, Math.max(12, arbeidstimer)))

  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.dybde) / 10000, maal: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm`, arbeidstimer }
}

function kappliste(c: SoppelbodConfig): KapplisteDel[] {
  const map = new Map<string, KapplisteDel>()
  deler(c).forEach((p) => {
    const L = Math.round(p.lengdeM * 100)
    const key = `${p.navn}|${p.profil}|${L}`
    const ex = map.get(key)
    if (ex) ex.antall += p.antall
    else map.set(key, { navn: p.navn, profil: p.profil, lengdeCm: L, antall: p.antall })
  })
  return [...map.values()]
}

// ── Målsatt 2D-tegning (plan + snitt) ──────────────────────────────
function tegning2D(c: SoppelbodConfig): Tegning2D {
  const B = c.bredde
  const D = c.dybde
  const { nBjelke } = geo(c)
  const jw = Math.round(JW * 100)

  // Plan (ovenfra): kantbjelke-rektangel + gulvbjelker.
  const former: Tegning2D['riss'][number]['former'] = [
    { type: 'rect', x: 0, y: 0, w: B, h: jw }, // front
    { type: 'rect', x: 0, y: D - jw, w: B, h: jw }, // bak
    { type: 'rect', x: 0, y: 0, w: jw, h: D }, // v side
    { type: 'rect', x: B - jw, y: 0, w: jw, h: D }, // h side
  ]
  for (let i = 1; i < nBjelke - 1; i++) {
    const x = (i * (B - jw)) / (nBjelke - 1)
    former.push({ type: 'rect', x, y: jw, w: jw, h: D - 2 * jw, tynn: true })
  }
  const plan: Tegning2D['riss'][number] = {
    id: 'plan',
    navn: 'Gulvramme (plan)',
    bredde: B,
    hoyde: D,
    former,
    maal: [
      { x1: 0, y1: D, x2: B, y2: D, label: `${B} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
    ],
    tekster: [{ x: B * 0.5, y: D * 0.5, tekst: 'bjelkelag c/c 60' }],
  }

  // Snitt: bjelkehøyde 98 mm på betongkloss.
  const jh = Math.round(JH * 100)
  const ph = Math.round(PAD_H * 100)
  const snitt: Tegning2D['riss'][number] = {
    id: 'snitt',
    navn: 'Snitt',
    bredde: D,
    hoyde: jh + ph,
    former: [
      { type: 'rect', x: 0, y: 0, w: D, h: jh }, // bjelke
      { type: 'rect', x: 8, y: jh, w: 20, h: ph, tynn: true }, // kloss v
      { type: 'rect', x: D - 28, y: jh, w: 20, h: ph, tynn: true }, // kloss h
    ],
    maal: [{ x1: 0, y1: 0, x2: 0, y2: jh, label: '98 mm', offset: 22 }],
  }

  return { riss: [plan, snitt] }
}

// ── 3D-modell: KUN gulvramme ───────────────────────────────────────
function buildMesh(c: SoppelbodConfig, opts?: BuildOptions): THREE.Group {
  const group = new THREE.Group()
  const tex = opts?.woodTexture ?? null
  const meshMat = (pid: string, darken = 1) => {
    const ov = opts?.overrides?.[pid]
    const treslag = ov?.treslag ?? c.treslag
    const farge = ov?.farge ?? c.farge
    const base = new THREE.Color(resolveColor(treslag, farge)).multiplyScalar(darken)
    const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.8, metalness: 0.05 })
    if (tex) m.map = tex
    return m
  }

  const { w, d, nBjelke, nPadX, nPadZ, fg } = geo(c)
  const oh = c.takutstikk * scale
  const jh = fg.h
  const yb = PAD_H + jh / 2 // bjelkelag-senter (hviler på klossene)

  const bjelke = (dx: number, dz: number, x: number, z: number, pid: string, navn: string, darken: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(dx, jh, dz), meshMat(pid, darken))
    m.position.set(x, yb, z)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'konstruksjon'
    m.userData.pid = pid
    m.userData.info = { navn, profil: fg.profil, lengdeCm: Math.round(Math.max(dx, dz) * 100) }
    group.add(m)
  }

  // Kantbjelker front/bak (langs x).
  bjelke(w, JW, 0, d / 2 - JW / 2, 'kant-front', 'Kantbjelke', 0.82)
  bjelke(w, JW, 0, -d / 2 + JW / 2, 'kant-bak', 'Kantbjelke', 0.82)
  if (nPadZ === 3) bjelke(w, JW, 0, 0, 'kant-mid', 'Bærebjelke (gulv)', 0.82) // midtre opplegg
  // Gulvbjelker + side-kantbjelker (langs z), c/c ≤ 600.
  const Lz = d - 2 * JW
  for (let i = 0; i < nBjelke; i++) {
    const x = -w / 2 + JW / 2 + (i * (w - JW)) / (nBjelke - 1)
    const end = i === 0 || i === nBjelke - 1
    bjelke(JW, Lz, x, 0, `bjelke-${i}`, end ? 'Kantbjelke side' : 'Gulvbjelke', end ? 0.82 : 0.88)
  }

  // Terrassebord-dekke oppå bjelkelaget – fyller hele rammen (siste bord rippes).
  const b = boardSpec(c.gulvbord)
  const deckY = PAD_H + jh + b.t / 2
  dekkePosisjoner(d, b.w).forEach((bp, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, b.t, bp.w), meshMat(`dekke-${i}`, i % 2 ? 0.97 : 1))
    m.position.set(0, deckY, bp.z)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'gulv'
    m.userData.pid = `dekke-${i}`
    m.userData.info = { navn: bp.w < b.w - 0.001 ? 'Terrassebord (rippet)' : 'Terrassebord (gulv)', profil: b.profil, lengdeCm: Math.round(w * 100) }
    group.add(m)
  })

  // ── STEG 2: Veggramme (stenderverk) – doble hjørner i 48×98 ──
  const deckTop = PAD_H + jh + b.t
  const H = c.hoyde * scale
  const yTopPlate = deckTop + H
  // Toppramme = dobbel bjelke som bærer taket (TEK17/Eurocode 5). Øker fra
  // 2×48×148 til 2×48×198 for større spenn (bredde).
  const tbW = c.bredde // dobbel toppdrager gradert etter bredde-spenn
  const topBeamH = tbW <= 240 ? 0.148 : tbW <= 360 ? 0.198 : 0.223
  const topBeamProfil = tbW <= 240 ? '48 × 148 mm' : tbW <= 360 ? '48 × 198 mm' : '48 × 223 mm'
  const postH = H - SW - topBeamH
  const postCY = deckTop + SW + postH / 2
  const beamCY = yTopPlate - topBeamH / 2

  const woodBox = (dx: number, dy: number, dz: number, x: number, y: number, z: number, pid: string, navn: string, profil = STUD_PROFIL, darken = 0.86) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(dx, dy, dz), meshMat(pid, darken))
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'konstruksjon'
    m.userData.pid = pid
    m.userData.info = { navn, profil, lengdeCm: Math.round(Math.max(dx, dz) * 100) }
    group.add(m)
  }

  // Bunnsvill (bak + sider; front står åpen så ingen svill i front).
  woodBox(w, SW, ST, 0, deckTop + SW / 2, -d / 2 + ST / 2, 'svill-bunn-b', 'Bunnsvill', STUD_PROFIL, 0.8)
  woodBox(ST, SW, d - 2 * ST, -w / 2 + ST / 2, deckTop + SW / 2, 0, 'svill-bunn-v', 'Bunnsvill', STUD_PROFIL, 0.8)
  woodBox(ST, SW, d - 2 * ST, w / 2 - ST / 2, deckTop + SW / 2, 0, 'svill-bunn-h', 'Bunnsvill', STUD_PROFIL, 0.8)

  // Toppramme – dobbel bjelke (2×48×148/198) på stående kant, bærer taket.
  ;[-1, 1].forEach((off) => {
    woodBox(w, topBeamH, SW, 0, beamCY, d / 2 - ST / 2 + off * SW / 2, `drager-front-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
    woodBox(w, topBeamH, SW, 0, beamCY, -d / 2 + ST / 2 + off * SW / 2, `drager-bak-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
    woodBox(SW, topBeamH, d - 2 * ST, -w / 2 + ST / 2 + off * SW / 2, beamCY, 0, `drager-v-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
    woodBox(SW, topBeamH, d - 2 * ST, w / 2 - ST / 2 + off * SW / 2, beamCY, 0, `drager-h-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
  })

  // Doble hjørnestolper (L av to 48×98) – går HELT NED til dekket (bærende),
  // så det ikke blir glipe der front-svillen mangler.
  const cornerH = H - topBeamH
  const cornerCY = deckTop + cornerH / 2
  ;([[-1, -1], [1, -1], [-1, 1], [1, 1]] as Array<[number, number]>).forEach(([sx, sz], k) => {
    woodBox(SW, cornerH, ST, sx * (w / 2 - SW / 2), cornerCY, sz * (d / 2 - ST / 2), `hjorne-${k}-a`, 'Hjørnestolpe (dobbel)')
    woodBox(ST, cornerH, SW, sx * (w / 2 - ST / 2), cornerCY, sz * (d / 2 - SW / 2), `hjorne-${k}-b`, 'Hjørnestolpe (dobbel)')
  })

  // Mellomstendere c/c ≤ 600, mellom hjørnene på alle fire vegger.
  // Fronten (+z) står åpen – kun bakvegg får mellomstendere (hjørnene beholdes).
  const baysX = Math.max(1, Math.ceil(w / CC))
  // Valgfri åpning i bakveggen over FULL bredde: fra 1 m over gulv til 10 cm
  // under taket, maks 1,5 m høyt. Stenderne deles i nedre + øvre stubb, og
  // losholt + kledning fjernes i åpningen (rammes inn av sill + overligger).
  const bakApning = c.bakvegapning === true
  const wallTopBak = deckTop + SW + postH
  const roofBack = Math.min(
    takUnderkant(c, -w / 2, -d / 2, w, d, yTopPlate),
    takUnderkant(c, 0, -d / 2, w, d, yTopPlate),
    takUnderkant(c, w / 2, -d / 2, w, d, yTopPlate),
  ) // laveste takhøyde over bakveggen
  const openB = deckTop + 1.0
  // Åpningen stopper under toppdrageren (wallTopBak) slik at kledningen dekker
  // toppdrager + sperrer helt opp til taket; ellers 10 cm fra taket / maks 1,5 m.
  const openT = Math.min(roofBack - 0.1, wallTopBak, openB + 1.5)
  const harApning = bakApning && openT > openB + 0.05
  const svillTop = deckTop + SW
  for (let i = 1; i < baysX; i++) {
    const x = -w / 2 + (i * w) / baysX
    if (harApning) {
      const hLo = openB - svillTop
      if (hLo > 0.02) woodBox(SW, hLo, ST, x, svillTop + hLo / 2, -d / 2 + ST / 2, `stud-b-${i}-lo`, 'Stender')
      const hHi = wallTopBak - openT
      if (hHi > 0.02) woodBox(SW, hHi, ST, x, openT + hHi / 2, -d / 2 + ST / 2, `stud-b-${i}-hi`, 'Stender')
    } else {
      woodBox(SW, postH, ST, x, postCY, -d / 2 + ST / 2, `stud-b-${i}`, 'Stender')
    }
  }
  // Sill + overligger mellom hjørnestolpene rundt åpningen. Overliggeren kappes
  // ved toppdrageren (som fungerer som bæring når åpningen når helt opp).
  if (harApning && w - 2 * ST > 0.05) {
    const karmLen = w - 2 * ST
    woodBox(karmLen, SW, ST, 0, openB, -d / 2 + ST / 2, 'karm-bunn', 'Karm (sill)')
    woodBox(karmLen, SW, ST, 0, Math.min(openT, wallTopBak), -d / 2 + ST / 2, 'karm-topp', 'Karm (overligger)')
  }
  // Sideveggene: jevnt fordelte stendere c/c ≤ 600 med PARTALL antall bays, så
  // det alltid står en stender i MIDTEN (z = 0) rett under stretcherens ende.
  let baysZ = Math.max(2, Math.ceil(d / CC))
  if (baysZ % 2 === 1) baysZ += 1
  const sideZstuds: number[] = []
  for (let i = 1; i < baysZ; i++) sideZstuds.push(-d / 2 + (i * d) / baysZ)
  sideZstuds.forEach((z, i) => {
    woodBox(ST, postH, SW, -w / 2 + ST / 2, postCY, z, `stud-v-${i}`, 'Stender')
    woodBox(ST, postH, SW, w / 2 - ST / 2, postCY, z, `stud-h-${i}`, 'Stender')
  })

  // Horisontal kryssavstiving (losholt) på sidene – innfelt MELLOM stenderne.
  const sideZ = [-(d / 2 - SW / 2), ...sideZstuds, d / 2 - SW / 2]
  const nLosholt = Math.max(0, Math.floor((postH - 0.05) / CC))
  for (let r = 1; r <= nLosholt; r++) {
    const y = deckTop + SW + r * CC
    for (let s = 0; s < sideZ.length - 1; s++) {
      const z0 = sideZ[s] + SW / 2
      const z1 = sideZ[s + 1] - SW / 2
      const len = z1 - z0
      if (len < 0.02) continue
      const zc = (z0 + z1) / 2
      woodBox(ST, SW, len, -w / 2 + ST / 2, y, zc, `losholt-v-${r}-${s}`, 'Losholt (kryss)')
      woodBox(ST, SW, len, w / 2 - ST / 2, y, zc, `losholt-h-${r}-${s}`, 'Losholt (kryss)')
    }
  }

  // Bakvegg: horisontal kryssavstiving (losholt) mellom stenderne, c/c 600.
  const backX = [-(w / 2 - SW / 2)]
  for (let i = 1; i < baysX; i++) backX.push(-w / 2 + (i * w) / baysX)
  backX.push(w / 2 - SW / 2)
  for (let r = 1; r <= nLosholt; r++) {
    const y = deckTop + SW + r * CC
    if (harApning && y > openB - 1e-6 && y < openT + 1e-6) continue // hele bredden åpen
    for (let s = 0; s < backX.length - 1; s++) {
      const x0 = backX[s] + SW / 2
      const x1 = backX[s + 1] - SW / 2
      const len = x1 - x0
      if (len < 0.02) continue
      woodBox(len, SW, ST, (x0 + x1) / 2, y, -d / 2 + ST / 2, `losholt-bak-${r}-${s}`, 'Losholt (kryss)')
    }
  }

  // Front: kledning fra 120 cm over gulv opp til taket → nibbe (sill) + stendere
  // som bærer front-kledningen (fronttopp/gavl bæres av opplengerne i taket).
  const frontCladBot = deckTop + 1.2
  const frontWallTop = deckTop + SW + postH // underkant toppdrager (front)
  if (frontWallTop - frontCladBot > 0.05) {
    woodBox(w - 2 * SW, SW, ST, 0, frontCladBot, d / 2 - ST / 2, 'sill-front', 'Sill (front)')
    const fBot = frontCladBot + SW / 2 // stenderne sitter på sill-toppen
    const fH = frontWallTop - fBot
    if (fH > 0.05) {
      for (let i = 1; i < baysX; i++) {
        const x = -w / 2 + (i * w) / baysX
        woodBox(SW, fH, ST, x, fBot + fH / 2, d / 2 - ST / 2, `stud-f-${i}`, 'Stender (front)')
      }
    }
  }

  // ── STEG 3: Tak-konstruksjon ──
  if (c.taktype === 'pulttak') byggPulttak(group, meshMat, w, d, yTopPlate, c.takvinkel, oh, c.takretning, c.takpapp ? 'takpapp' : 'kryssfiner')
  else if (c.taktype === 'saltak') byggSaltak(group, meshMat, w, d, yTopPlate, c.takvinkel, oh, c.moneretning, c.takpapp ? 'takpapp' : 'kryssfiner')
  else if (c.taktype === 'valmtak') byggValmtak(group, meshMat, w, d, yTopPlate, c.takvinkel, oh, c.takpapp ? 'takpapp' : 'kryssfiner')

  // Fundament – betongklosser under kantbjelkene.
  const conc = new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.96, metalness: 0.02 })
  const padXs = nPadX === 3 ? [-w / 2 + 0.12, 0, w / 2 - 0.12] : [-w / 2 + 0.12, w / 2 - 0.12]
  const padZs = nPadZ === 3 ? [d / 2 - 0.12, 0, -d / 2 + 0.12] : [d / 2 - 0.12, -d / 2 + 0.12]
  padXs.forEach((px, ix) =>
    padZs.forEach((pz, iz) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, PAD_H, 0.2), conc)
      p.position.set(px, PAD_H / 2, pz)
      p.castShadow = true
      p.receiveShadow = true
      p.userData.part = 'fundament'
      p.userData.pid = `pad-${ix}-${iz}`
      p.userData.info = { navn: 'Fundament (betongkloss)', profil: '', lengdeCm: 0 }
      group.add(p)
    }),
  )

  // ── STEG 4: Utvendig kledning (side-/bakvegg + fronttopp mot taket) ──
  const kled = kledningBoards(c, w, d, yTopPlate, PAD_H, frontCladBot, harApning ? { b: openB, t: openT } : undefined)
  kled.boards.forEach((bd, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bd.dx, bd.h, bd.dz), meshMat(`kled-${i}`, 0.92))
    m.position.set(bd.x, bd.y, bd.z)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'kledning'
    m.userData.pid = `kled-${i}`
    m.userData.info = { navn: 'Kledning', profil: kled.ks.profil, lengdeCm: Math.round(bd.h * 100) }
    group.add(m)
  })

  // ── Søppeldunker (visualisering – kan skjules via lag-bryter «Søppeldunker») ──
  // Hver dunk er 55 cm bred; antall styres av innvendig bredde med 10 cm mellomrom.
  const binW = 0.55
  const binGap = 0.1
  const innerW = w - 2 * ST
  const nBins = Math.floor((innerW + binGap) / (binW + binGap))
  if (nBins >= 1) {
    const binD = Math.min(0.72, d - ST - 0.05)
    const wheelR = 0.06
    const lidH = 0.08
    const binTotalH = Math.min(1.07, yTopPlate - deckTop - 0.05)
    const bodyH = Math.max(0.3, binTotalH - lidH - wheelR)
    const groupW = nBins * binW + (nBins - 1) * binGap
    const binZ = -d / 2 + ST + 0.02 + binD / 2
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x434a51, roughness: 0.55, metalness: 0.04 })
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x2b3035, roughness: 0.5, metalness: 0.04 })
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x161819, roughness: 0.75 })
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.05, 18)
    const addBin = (geo: THREE.BufferGeometry, matl: THREE.Material, x: number, y: number, z: number, tag: string, rotZ = 0) => {
      const m = new THREE.Mesh(geo, matl)
      m.position.set(x, y, z)
      if (rotZ) m.rotation.z = rotZ
      m.castShadow = true
      m.receiveShadow = true
      m.userData.part = 'bins'
      m.userData.pid = tag
      m.userData.info = { navn: 'Søppeldunk (240 l)', profil: `${Math.round(binW * 100)} cm bred`, lengdeCm: 0 }
      group.add(m)
    }
    for (let i = 0; i < nBins; i++) {
      const bx = -groupW / 2 + binW / 2 + i * (binW + binGap)
      addBin(new THREE.BoxGeometry(binW, bodyH, binD), bodyMat, bx, deckTop + wheelR + bodyH / 2, binZ, `bin-${i}-body`)
      addBin(new THREE.BoxGeometry(binW + 0.015, lidH, binD + 0.02), lidMat, bx, deckTop + wheelR + bodyH + lidH / 2, binZ - 0.005, `bin-${i}-lid`)
      ;[-1, 1].forEach((s) => addBin(wheelGeo, wheelMat, bx + s * (binW / 2 - 0.06), deckTop + wheelR, binZ - binD / 2 + 0.07, `bin-${i}-wheel-${s > 0 ? 'h' : 'v'}`, Math.PI / 2))
    }
  }

  settSplitt(group)
  return group
}

export const soppelbod: ProductTemplate<SoppelbodConfig> = {
  id: 'soppelboder',
  navn: 'Søppelbod',
  ikon: 'faDumpster',
  beskrivelse: 'Tegn søppelboden i 3D – konstruksjon bygget opp steg for steg.',
  bilde: '/images/products/soppelbod-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    bredde: 300,
    dybde: 80,
    hoyde: 160,
    gulvbord: '28x120',
    kledningsbord: 'lekt',
    taktype: 'valmtak',
    takvinkel: 22.5,
    takutstikk: 10,
    takretning: 'bak',
    moneretning: 'bredde',
    takpapp: true,
    bakvegapning: true,
    treslag: 'lerk',
    farge: 'ubehandlet',
  },
  presets: [
    {
      id: 'pulttak-300',
      navn: 'Pulttak 300 cm',
      beskrivelse: 'Moderne, mørk grå kledning',
      config: { bredde: 300, taktype: 'pulttak', takretning: 'bak', takvinkel: 15, takpapp: true, kledningsbord: '19x148', treslag: 'impregnert', farge: 'morkegra' },
    },
    {
      id: 'saltak-300',
      navn: 'Saltak 300 cm',
      beskrivelse: 'Klassisk, sortmalt smalkledning',
      config: { bredde: 300, taktype: 'saltak', moneretning: 'bredde', takvinkel: 22.5, takpapp: true, kledningsbord: '19x98', treslag: 'gran', farge: 'sort' },
    },
    {
      id: 'valmtak-300',
      navn: 'Valmtak 300 cm',
      beskrivelse: 'Eksklusiv lerk, spilekledning',
      config: { bredde: 300, taktype: 'valmtak', takvinkel: 22.5, takpapp: true, kledningsbord: 'lekt', treslag: 'lerk', farge: 'ubehandlet' },
    },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 70, max: 400, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 60, max: 150, step: 5, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 150, max: 250, step: 5, axis: 'y' },
    { key: 'takvinkel', label: 'Takvinkel', min: 5, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false, markers: [15, 22.5, 27, 30, 38, 45] },
    { key: 'takutstikk', label: 'Takutstikk', min: 5, max: 30, step: 1, axis: 'y', handle: false },
  ],
  alternativer: [
    {
      key: 'gulvbord',
      label: 'Gulvbord (terrassebord)',
      choices: [
        { id: '28x120', label: '28 × 120 mm' },
        { id: '21x98', label: '21 × 98 mm' },
      ],
    },
    {
      key: 'kledningsbord',
      label: 'Kledning (vegg)',
      choices: [
        { id: '19x148', label: '19 × 148 mm' },
        { id: '19x98', label: '19 × 98 mm' },
        { id: 'lekt', label: 'Lekt 23 × 48 mm' },
      ],
    },
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'pulttak', label: 'Pulttak', patch: { takvinkel: 15 } },
        { id: 'valmtak', label: 'Valmtak' },
        { id: 'saltak', label: 'Saltak', patch: { takvinkel: 22.5 } },
      ],
    },
    {
      key: 'takretning',
      label: 'Fallretning',
      visibleWhen: (c) => c.taktype === 'pulttak',
      choices: [
        { id: 'bak', label: 'Bakover' },
        { id: 'front', label: 'Framover' },
        { id: 'venstre', label: 'Venstre' },
        { id: 'hoyre', label: 'Høyre' },
      ],
    },
    {
      key: 'moneretning',
      label: 'Møneretning',
      visibleWhen: (c) => c.taktype === 'saltak',
      choices: [
        { id: 'bredde', label: 'Langs bredden' },
        { id: 'dybde', label: 'Langs dybden' },
      ],
    },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  valg: [
    { key: 'takpapp', label: 'Takpapp', note: 'Tekking oppå fast 18 mm kryssfiner' },
    { key: 'bakvegapning', label: 'Åpning i bakvegg', note: 'Full bredde – fra 1 m over gulv til 10 cm under taket (maks 1,5 m)' },
  ],
  parts: [
    { key: 'gulv', label: 'Terrassebord' },
    { key: 'konstruksjon', label: 'Ramme (bjelkelag/vegg)' },
    { key: 'kledning', label: 'Kledning' },
    { key: 'bins', label: 'Søppeldunker' },
    { key: 'fundament', label: 'Fundament' },
  ],
  beregn,
  kappliste,
  tegning2D,
  raad: () => [
    'Legg betongklossene på et drenert, avrettet underlag – vater dem inn i samme høyde.',
    'Bygg bjelkelaget av 48×98 C24: kantbjelker rundt og gulvbjelker med c/c 60 cm.',
    'Fest hjørnene med vinkelbeslag og skru bjelkene sammen med rustfrie (A4) skruer.',
    'Kontroller at rammen er i vater og i vinkel (mål diagonalene) før du bygger videre.',
  ],
  buildMesh,
  bounds: (c) => {
    const rad = (c.takvinkel * Math.PI) / 180
    // Faktisk takhøyde (rise) over veggtoppen – avhenger av taktype/retning.
    const rise =
      c.taktype === 'pulttak'
        ? ((c.takretning === 'venstre' || c.takretning === 'hoyre' ? cm(c.bredde) : cm(c.dybde)) + cm(c.takutstikk)) * Math.tan(rad)
        : (Math.min(cm(c.bredde), cm(c.dybde)) / 2 + cm(c.takutstikk)) * Math.tan(rad)
    return {
      x: cm(c.bredde) + 2 * cm(c.takutstikk) + 0.05,
      y: PAD_H + JH + boardSpec(c.gulvbord).t + cm(c.hoyde) + rise + 0.22,
      z: cm(c.dybde) + 2 * cm(c.takutstikk) + 0.05,
    }
  },
  montering: () => [
    'Sett ut og grav/avrett for betongklossene i et rektangel etter målene.',
    'Legg klossene i vater, alle i samme høyde.',
    'Kapp kantbjelker og gulvbjelker (48×148) etter kapplista.',
    'Skru sammen kantrammen (rektangel) og sjekk vinkel/diagonaler.',
    'Monter gulvbjelkene med c/c 60 cm mellom front- og bakkantbjelken.',
    'Fest hele bjelkelaget til klossene med vinkelbeslag/bjelkesko.',
  ],
}
