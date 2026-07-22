import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { KV_BJELKE_PRIS, antallCC, byggPulttak, byggSaltak, byggValmtak, gradBjelke, gradMonebjelke, gradSperre, maksGulvSpenn, settSplitt } from '../konstruksjon'

/**
 * Utedo – 1×1 m standard, ~2 m vegghøyde. Bygget opp med samme
 * konstruksjon som de øvrige byggene: bjelkelag i 48×98 (C24, c/c ≤ 600 mm)
 * på nedgravde betongklosser, terrassebord-dekke, stenderverk og pulttak.
 */

export interface UtedoConfig {
  bredde: number // cm (x)
  dybde: number // cm (z)
  hoyde: number // cm (y) – vegghøyde
  gulvbord: string // '21x98' | '28x120'
  kledningsbord: string // '19x148' | '19x98' | 'lekt' – utvendig kledning
  dorbredde: number // cm, dørens bredde (60–90)
  taktype: string // 'pulttak' | 'valmtak' | 'saltak'
  takvinkel: number // grader
  takutstikk: number // cm takutstikk
  takretning: string // pulttak: bak|front|venstre|hoyre
  moneretning: string // saltak: bredde|dybde
  takpapp: boolean // tekking oppå den faste kryssfineren
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

// Dørramme = 48×98. Skråbånd holder døra i vinkel.
const DOOR_FACE = ST // rammebredde i dørplanet (98 mm)
const DOOR_T = SW // rammetykkelse (48 mm)

// Døråpning i fronten: bredden (60–90 cm) klemmes så den får plass innenfor
// hjørnestolpene, med karmstender i hver side.
function doorLayout(c: UtedoConfig, w: number) {
  const maxOpen = w - 2 * ST - 0.06
  const openW = Math.max(0.5, Math.min(c.dorbredde * scale, maxOpen))
  return { openW, leafW: openW - 0.02, karmDx: openW / 2 + SW / 2, jamb: openW / 2 + SW }
}

// ── Utvendig kledning (samme valg som de andre byggene) ───────────────────
function kledningSpec(id: string) {
  if (id === '19x98') return { t: 0.019, w: 0.098, profil: '19 × 98 mm', pris: 'bord-19x98' }
  if (id === 'lekt') return { t: 0.023, w: 0.048, profil: 'Lekt 23 × 48 mm', pris: 'lekt-23x48' }
  return { t: 0.019, w: 0.148, profil: '19 × 148 mm', pris: 'bord-19x148' }
}

function takUnderkant(c: UtedoConfig, x: number, z: number, w: number, d: number, topY: number): number {
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

// Kledning på bak- + sidevegg + fronten RUNDT døra (feltene ved siden av og
// over døra). Selve døråpningen står åpen for døra.
function kledningBoards(c: UtedoConfig, w: number, d: number, topY: number, botWall: number) {
  const ks = kledningSpec(c.kledningsbord)
  const kt = ks.t
  const topGap = 0.03
  const SPRKK = 0.003
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
  const run = (axis: 'x' | 'z', outer: number, from: number, to: number, botAt: number, topAt: (t: number) => number) => {
    if (to - from < ks.w) return
    const n = Math.max(1, Math.round((to - from) / (ks.w + SPRKK)))
    const step = (to - from) / n
    const bredde = step - SPRKK
    for (let i = 0; i < n; i++) {
      const cc0 = from + step * (i + 0.5)
      legg(axis, outer, cc0, bredde, botAt, topAt(cc0) - topGap)
    }
  }
  const clampX = (x: number) => Math.max(-w / 2, Math.min(w / 2, x))
  run('z', -w / 2 - kt / 2, -d / 2, d / 2, botWall, (z) => takUnderkant(c, -w / 2, z, w, d, topY))
  run('z', w / 2 + kt / 2, -d / 2, d / 2, botWall, (z) => takUnderkant(c, w / 2, z, w, d, topY))
  run('x', -d / 2 - kt / 2, -(w / 2 + kt), w / 2 + kt, botWall, (x) => takUnderkant(c, clampX(x), -d / 2, w, d, topY))
  // Front rundt døra: sidefelt (full høyde) + felt over døra opp til taket.
  const { jamb } = doorLayout(c, w)
  const tbW = c.bredde
  const topBeamH = tbW <= 240 ? 0.148 : tbW <= 360 ? 0.198 : 0.223
  const frontWallTop = topY - topBeamH
  const takFront = (x: number) => takUnderkant(c, clampX(x), d / 2, w, d, topY)
  run('x', d / 2 + kt / 2, -(w / 2 + kt), -jamb, botWall, takFront) // venstre for døra
  run('x', d / 2 + kt / 2, jamb, w / 2 + kt, botWall, takFront) // høyre for døra
  run('x', d / 2 + kt / 2, -jamb, jamb, frontWallTop, takFront) // over døra
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

function geo(c: UtedoConfig) {
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

function deler(c: UtedoConfig): Del[] {
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

  // Tak (pulttak): sperrer 48×148 c/c 600 + opplenger + kryss-lekt 48×48.
  if (c.taktype === 'pulttak') {
    const sideFall = c.takretning === 'venstre' || c.takretning === 'hoyre'
    const rw = sideFall ? d : w // takbredde (langs lekt/mønekant)
    const rd = sideFall ? w : d // fallretning (sperre-spenn)
    const rise = Math.max(0, rd * Math.tan((c.takvinkel * Math.PI) / 180))
    const rafP = gradSperre(Math.hypot(rd + 2 * oh, rise))
    push('Sperre (pulttak)', rafP.profil, Math.hypot(rd + 2 * oh, rise), antallCC(rw), rafP.pris)
    push('Taklekt (kryss) 48×48', '48 × 48 mm', rw + 2 * oh, antallCC(rd + 2 * oh), 'stolpe-48x48')
    if (rise > 0.07) {
      push('Opplenger (stender)', STUD_PROFIL, rise - 0.048, antallCC(rw), KV_BJELKE_PRIS)
      push('Hevet rem (opplenger)', STUD_PROFIL, rw, 1, KV_BJELKE_PRIS)
    }
  }
  // Tak (saltak): sperrer 48×148 c/c 600 begge takflater + bærende mønebjelke
  // (gradert etter styrke/spenn) + kingposts + kryss-lekt 48×48.
  if (c.taktype === 'saltak') {
    const rad = (c.takvinkel * Math.PI) / 180
    const rw = c.moneretning === 'dybde' ? d : w // mønelengde
    const rd = c.moneretning === 'dybde' ? w : d // takflate-spenn (begge sider)
    const rise = Math.max(0, (rd / 2) * Math.tan(rad))
    const slopeLen = (rd / 2 + oh) / Math.cos(rad)
    const g = gradMonebjelke(rw, rd)
    const rafS = gradSperre(slopeLen)
    push('Sperre (saltak)', rafS.profil, slopeLen, antallCC(rw) * 2, rafS.pris)
    push('Mønebjelke (bærende)', g.boardProfil, rw, g.count, g.pris)
    push('Taklekt (kryss) 48×48', '48 × 48 mm', rw + 2 * oh, antallCC(rd / 2 + oh) * 2, 'stolpe-48x48')
    const kingH = rise - g.h
    if (kingH > 0.05) push('Kingpost (møne)', STUD_PROFIL, kingH, 2, KV_BJELKE_PRIS)
  }
  // Tak (valmtak): stretcher + tverrbjelker (kun i møne-lengden) + grater + fascia.
  if (c.taktype === 'valmtak') {
    const W = Math.max(w, d)
    const D = Math.min(w, d)
    const MH = Math.max(0.05, (D / 2) * Math.tan((c.takvinkel * Math.PI) / 180))
    const profilV = `48 × ${Math.round(MH * 1000)} mm`
    const nCross = Math.max(1, Math.ceil(W / CC) - 1)
    const hjorneLen = (D / 2 + oh) * Math.SQRT2
    push(`Stretcher (${profilV})`, profilV, W + 2 * oh, 1, 'bjelke-48x198')
    push('Tverrbjelke', profilV, D + 2 * oh, nCross, 'bjelke-48x198')
    push('Hjørnebjelke', profilV, hjorneLen, 4, 'bjelke-48x198')
    push('Fasciebord (20 × 50 mm)', '20 × 50 mm', 2 * (W + 2 * oh) + 2 * (D + 2 * oh), 1, 'stolpe-48x48')
  }

  // Front: terskel + dørkarm + dør (ramme + skråbånd).
  const { leafW } = doorLayout(c, w)
  const railW = Math.max(0.05, leafW - 2 * ST)
  push('Bunnsvill front (terskel)', STUD_PROFIL, w, 1, KV_BJELKE_PRIS)
  push('Dørkarm (bæringsstender)', STUD_PROFIL, postH, 2, KV_BJELKE_PRIS)
  push('Dørstolpe (ramme)', STUD_PROFIL, postH, 2, KV_BJELKE_PRIS)
  push('Dørtverrtre (ramme)', STUD_PROFIL, railW, 3, KV_BJELKE_PRIS)
  push('Skråbånd (dør)', STUD_PROFIL, Math.hypot(railW, postH), 1, KV_BJELKE_PRIS)

  // Utvendig kledning (bak + sider + front rundt døra).
  const deckTopD = PAD_H + fg.h + b.t
  const yTopPlateD = deckTopD + c.hoyde * scale
  const kled = kledningBoards(c, w, d, yTopPlateD, PAD_H)
  if (kled.boards.length > 0) {
    const totLm = kled.boards.reduce((s, bd) => s + bd.h, 0)
    push('Kledning', kled.ks.profil, totLm / kled.boards.length, kled.boards.length, kled.ks.pris)
  }

  // Sittebenk: ramme (4 ben + rammer) + sete (m/hull) + front-kledning.
  const ksb = kledningSpec(c.kledningsbord)
  const innerWb = w - 2 * ST
  const benchH = 0.4
  push('Benkeben', '42 × 42 mm', benchH - 0.028, 4, 'stolpe-48x48')
  push('Benkramme', '42 × 42 mm', innerWb, 3, 'stolpe-48x48')
  push('Sete (kledning)', ksb.profil, innerWb, Math.max(1, Math.ceil(Math.min(0.5, d - ST - 0.05) / ksb.w)), ksb.pris)
  push('Benkfront (kledning)', ksb.profil, innerWb, Math.max(1, Math.ceil(benchH / ksb.w)), ksb.pris)
  return out
}

function beregn(c: UtedoConfig): Bom {
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
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.dybde) / 10000, maal: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm` }
}

function kappliste(c: UtedoConfig): KapplisteDel[] {
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
function tegning2D(c: UtedoConfig): Tegning2D {
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
function buildMesh(c: UtedoConfig, opts?: BuildOptions): THREE.Group {
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

  const woodBox = (dx: number, dy: number, dz: number, x: number, y: number, z: number, pid: string, navn: string, profil = STUD_PROFIL, darken = 0.86, part = 'konstruksjon') => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(dx, dy, dz), meshMat(pid, darken))
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = part
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
  for (let i = 1; i < baysX; i++) {
    const x = -w / 2 + (i * w) / baysX
    woodBox(SW, postH, ST, x, postCY, -d / 2 + ST / 2, `stud-b-${i}`, 'Stender')
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
    for (let s = 0; s < backX.length - 1; s++) {
      const x0 = backX[s] + SW / 2
      const x1 = backX[s + 1] - SW / 2
      const len = x1 - x0
      if (len < 0.02) continue
      woodBox(len, SW, ST, (x0 + x1) / 2, y, -d / 2 + ST / 2, `losholt-bak-${r}-${s}`, 'Losholt (kryss)')
    }
  }

  // ── STEG 2b: Front – dør med karm/ramme ──
  const { leafW, karmDx } = doorLayout(c, w)
  const frontZ = d / 2 - ST / 2 // frontveggens plan
  // Terskel (bunnsvill) i full bredde.
  woodBox(w, SW, ST, 0, deckTop + SW / 2, frontZ, 'svill-bunn-f', 'Bunnsvill front (terskel)', STUD_PROFIL, 0.8)
  // Dørkarm: bæringsstender i hver side av åpningen (bærer toppdrageren).
  woodBox(SW, postH, ST, -karmDx, postCY, frontZ, 'dorkarm-v', 'Dørkarm (bæringsstender)', STUD_PROFIL, 0.82)
  woodBox(SW, postH, ST, karmDx, postCY, frontZ, 'dorkarm-h', 'Dørkarm (bæringsstender)', STUD_PROFIL, 0.82)
  // Dør: ramme (2 stolper + 3 tverrtre) + skråbånd.
  const doorBot = deckTop + SW
  const doorH = postH
  const doorCY = doorBot + doorH / 2
  const doorZ = frontZ - ST / 2 + DOOR_T / 2 + 0.006
  const railW = Math.max(0.05, leafW - 2 * DOOR_FACE)
  woodBox(DOOR_FACE, doorH, DOOR_T, -leafW / 2 + DOOR_FACE / 2, doorCY, doorZ, 'dor-sv', 'Dør (ramme)', STUD_PROFIL, 0.9, 'dor')
  woodBox(DOOR_FACE, doorH, DOOR_T, leafW / 2 - DOOR_FACE / 2, doorCY, doorZ, 'dor-sh', 'Dør (ramme)', STUD_PROFIL, 0.9, 'dor')
  woodBox(railW, DOOR_FACE, DOOR_T, 0, doorBot + DOOR_FACE / 2, doorZ, 'dor-rb', 'Dør (ramme)', STUD_PROFIL, 0.9, 'dor')
  woodBox(railW, DOOR_FACE, DOOR_T, 0, doorCY, doorZ, 'dor-rm', 'Dør (ramme)', STUD_PROFIL, 0.9, 'dor')
  woodBox(railW, DOOR_FACE, DOOR_T, 0, doorBot + doorH - DOOR_FACE / 2, doorZ, 'dor-rt', 'Dør (ramme)', STUD_PROFIL, 0.9, 'dor')
  {
    const bh = doorH - 2 * DOOR_FACE
    if (railW > 0.05 && bh > 0.05) {
      const bl = Math.hypot(railW, bh)
      const bm = new THREE.Mesh(new THREE.BoxGeometry(bl, DOOR_FACE * 0.8, DOOR_T * 0.9), meshMat('dor-brace', 0.9))
      bm.position.set(0, doorCY, doorZ - 0.002)
      bm.rotation.z = Math.atan2(bh, railW)
      bm.castShadow = true
      bm.receiveShadow = true
      bm.userData.part = 'dor'
      bm.userData.pid = 'dor-brace'
      bm.userData.info = { navn: 'Dør (skråbånd)', profil: STUD_PROFIL, lengdeCm: Math.round(bl * 100) }
      group.add(bm)
    }
  }

  // ── Sittebenk (utedo): fra bakveggen 50 cm fram, 40 cm høy, boret hull i ──
  // setet. Setet + fronten kles med bord; tynne vanger bærer setet.
  {
    const innerW = w - 2 * ST
    const zBack = -d / 2 + ST
    const benchDepth = Math.min(0.5, d - ST - 0.05)
    const zFront = zBack + benchDepth
    const benchH = 0.4
    const seatY = deckTop + benchH
    const seatT = 0.028
    const ks = kledningSpec(c.kledningsbord)
    // Benkramme (KONSTRUKSJON – blir stående når kledning skjules): 4 ben +
    // topp-/bunnrammer som bærer setet og som fronten kles på.
    const legT = 0.042
    const seatBotY = seatY - seatT
    const legLen = seatBotY - deckTop
    const cx = innerW / 2 - legT / 2
    ;([[-cx, zBack + legT / 2], [cx, zBack + legT / 2], [-cx, zFront - legT / 2], [cx, zFront - legT / 2]] as Array<[number, number]>).forEach(([lx, lz], i) => {
      woodBox(legT, legLen, legT, lx, deckTop + legLen / 2, lz, `benk-ben-${i}`, 'Benkeben', '42 × 42 mm', 0.84)
    })
    // Topprammer (setebærere) foran + bak, og bunnramme foran (for fronten).
    woodBox(innerW - 2 * legT, legT, legT, 0, seatBotY - legT / 2, zBack + legT / 2, 'benk-rail-bak', 'Benkramme', '42 × 42 mm', 0.84)
    woodBox(innerW - 2 * legT, legT, legT, 0, seatBotY - legT / 2, zFront - legT / 2, 'benk-rail-front', 'Benkramme', '42 × 42 mm', 0.84)
    woodBox(innerW - 2 * legT, legT, legT, 0, deckTop + legT / 2, zFront - legT / 2, 'benk-rail-bunn', 'Benkramme', '42 × 42 mm', 0.84)
    // Front-kledning som lukker fronten på benken.
    const fm = new THREE.Mesh(new THREE.BoxGeometry(innerW, benchH, ks.t), meshMat('benk-front', 0.92))
    fm.position.set(0, deckTop + benchH / 2, zFront)
    fm.castShadow = true
    fm.receiveShadow = true
    fm.userData.part = 'kledning'
    fm.userData.pid = 'benk-front'
    fm.userData.info = { navn: 'Benkfront (kledning)', profil: ks.profil, lengdeCm: Math.round(benchH * 100) }
    group.add(fm)
    // Sete (bord) med sirkulært hull – ekstrudert plate.
    const holeR = Math.min(0.14, innerW / 2 - 0.06, benchDepth / 2 - 0.06)
    const holeZ = zBack + benchDepth * 0.5
    const shape = new THREE.Shape()
    shape.moveTo(-innerW / 2, -zBack)
    shape.lineTo(innerW / 2, -zBack)
    shape.lineTo(innerW / 2, -zFront)
    shape.lineTo(-innerW / 2, -zFront)
    shape.closePath()
    const hole = new THREE.Path()
    hole.absarc(0, -holeZ, holeR, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const geo = new THREE.ExtrudeGeometry(shape, { depth: seatT, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, seatY - seatT, 0)
    const sm = new THREE.Mesh(geo, meshMat('benk-sete', 1))
    sm.castShadow = true
    sm.receiveShadow = true
    sm.userData.part = 'kledning'
    sm.userData.pid = 'benk-sete'
    sm.userData.info = { navn: 'Sete m/hull (kledning)', profil: ks.profil, lengdeCm: Math.round(innerW * 100) }
    group.add(sm)
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

  // ── Utvendig kledning (bak + sider + front rundt døra) ──
  const kled = kledningBoards(c, w, d, yTopPlate, PAD_H)
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

  settSplitt(group)
  return group
}

export const utedo: ProductTemplate<UtedoConfig> = {
  id: 'utedo',
  navn: 'Utedo',
  ikon: 'faToilet',
  beskrivelse: 'Tegn utedoen i 3D – konstruksjon bygget opp steg for steg.',
  tilgjengelig: true,
  fraPris: 349,
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    bredde: 100,
    dybde: 110,
    hoyde: 200,
    gulvbord: '28x120',
    kledningsbord: 'lekt',
    dorbredde: 70,
    taktype: 'pulttak',
    takvinkel: 15,
    takutstikk: 10,
    takretning: 'bak',
    moneretning: 'dybde',
    takpapp: true,
    treslag: 'impregnert',
    farge: 'morkegra',
  },
  presets: [
    {
      id: 'pulttak-100',
      navn: 'Pulttak 100 cm',
      beskrivelse: 'Moderne, mørk grå lektekledning',
      config: { bredde: 100, dybde: 110, hoyde: 200, taktype: 'pulttak', takretning: 'bak', takvinkel: 15, takpapp: true, kledningsbord: 'lekt', dorbredde: 70, treslag: 'impregnert', farge: 'morkegra' },
    },
    {
      id: 'saltak-120',
      navn: 'Saltak 120 cm',
      beskrivelse: 'Klassisk, sortmalt smalkledning',
      config: { bredde: 120, dybde: 120, hoyde: 210, taktype: 'saltak', moneretning: 'dybde', takvinkel: 27, takpapp: true, kledningsbord: '19x98', dorbredde: 80, treslag: 'gran', farge: 'sort' },
    },
    {
      id: 'valmtak-140',
      navn: 'Valmtak 140 cm',
      beskrivelse: 'Eksklusiv lerk, bred kledning',
      config: { bredde: 140, dybde: 130, hoyde: 220, taktype: 'valmtak', takvinkel: 22.5, takpapp: true, kledningsbord: '19x148', dorbredde: 90, treslag: 'lerk', farge: 'ubehandlet' },
    },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 90, max: 160, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 90, max: 160, step: 5, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 180, max: 240, step: 5, axis: 'y' },
    { key: 'dorbredde', label: 'Dørbredde', min: 60, max: 90, step: 5, axis: 'x', handle: false },
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
        { id: 'saltak', label: 'Saltak', patch: { takvinkel: 22.5, moneretning: 'dybde' } },
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
  ],
  parts: [
    { key: 'gulv', label: 'Terrassebord' },
    { key: 'konstruksjon', label: 'Ramme (bjelkelag/vegg)' },
    { key: 'kledning', label: 'Kledning' },
    { key: 'dor', label: 'Dør' },
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
