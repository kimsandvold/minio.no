import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, Byggeregler, DesignConfig, Form2D, KapplisteDel, ProductTemplate, Riss2D, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { antallCC, byggPulttak, byggSaltak, byggValmtak, gradSperre, settSplitt } from '../konstruksjon'

/**
 * Garasje – bygget på samme prinsipp som vedskjulet (stenderverk, doble hjørner,
 * dobbel toppdrager, kledning, takstoler), men UTEN gulv: veggene står på en
 * støpt betongplate. Enkel (1 port) eller dobbel (2 porter). Stenderverket
 * dimensjoneres etter SINTEF Byggforsk (minst 48×148), se studSpec().
 */

export interface GarasjeConfig {
  bredde: number // cm (x)
  dybde: number // cm (z)
  hoyde: number // cm (y) – vegghøyde
  garasjetype: string // 'enkel' | 'dobbel'
  porthoyde: number // cm – garasjeportens høyde
  kledningsbord: string // '19x148' | '19x98' | 'lekt'
  taktype: string // 'pulttak' | 'valmtak' | 'saltak'
  takvinkel: number // grader
  takutstikk: number // cm
  takretning: string // pulttak
  moneretning: string // saltak
  takpapp: boolean
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const cm = (v: number) => v / 100
const scale = 0.01

const SW = 0.048 // stender-tykkelse (langs veggen)
const CC = 0.6
const SLAB_H = 0.1 // betongplate 10 cm

// Stenderdimensjon etter SINTEF Byggforsk 523.251 (bindingsverk i yttervegger):
// styres av vegghøyden (knekking) og takstol-/snølasten (takspennet = dybden),
// c/c 600. Garasjer får minst 48×148 pga. høye vegger + stor takstollast.
// (Forenklet gradering – verifiser mot gjeldende Byggforsk-blad før byggeplan.)
function studSpec(c: GarasjeConfig) {
  if (c.hoyde > 280 || c.dybde > 800) return { d: 0.223, profil: '48 × 223 mm', pris: 'bjelke-48x223' }
  if (c.hoyde > 250 || c.dybde > 650) return { d: 0.198, profil: '48 × 198 mm', pris: 'bjelke-48x198' }
  return { d: 0.148, profil: '48 × 148 mm', pris: 'bjelke-48x148' }
}

function portCount(c: GarasjeConfig): number {
  return c.garasjetype === 'dobbel' ? 2 : 1
}

// Toppdrager gradert etter bredde-spennet.
function topBeam(bredde: number) {
  if (bredde <= 300) return { h: 0.198, profil: '48 × 198 mm', pris: 'bjelke-48x198' }
  return { h: 0.223, profil: '48 × 223 mm', pris: 'bjelke-48x223' }
}

// Portåpning per fag (sentrert): mest mulig av fagbredden, med karm i hver side.
function portLayout(c: GarasjeConfig, w: number) {
  const ST = studSpec(c).d
  const N = portCount(c)
  const bayW = w / N
  const bays: Array<{ xC: number; openW: number; jambL: number; jambR: number }> = []
  for (let j = 0; j < N; j++) {
    const xC = -w / 2 + (j + 0.5) * bayW
    const openW = Math.max(1.4, bayW - 2 * ST - 0.12)
    bays.push({ xC, openW, jambL: xC - openW / 2 - SW / 2, jambR: xC + openW / 2 + SW / 2 })
  }
  return { N, bayW, bays }
}

// ── Utvendig kledning ─────────────────────────────────────────────────────
function kledningSpec(id: string) {
  if (id === '19x98') return { t: 0.019, w: 0.098, profil: '19 × 98 mm', pris: 'bord-19x98' }
  if (id === 'lekt') return { t: 0.023, w: 0.048, profil: 'Lekt 23 × 48 mm', pris: 'lekt-23x48' }
  return { t: 0.019, w: 0.148, profil: '19 × 148 mm', pris: 'bord-19x148' }
}

function takUnderkant(c: GarasjeConfig, x: number, z: number, w: number, d: number, topY: number): number {
  const rad = (c.takvinkel * Math.PI) / 180
  if (c.taktype === 'pulttak') {
    let ddp: number, s: number
    if (c.takretning === 'venstre') { ddp = w; s = x }
    else if (c.takretning === 'hoyre') { ddp = w; s = -x }
    else if (c.takretning === 'front') { ddp = d; s = -z }
    else { ddp = d; s = z }
    return topY + ddp * Math.tan(rad) * ((s + ddp / 2) / ddp)
  }
  if (c.taktype === 'saltak') {
    const along = c.moneretning === 'dybde' ? w : d
    const p = c.moneretning === 'dybde' ? x : z
    const halfD = along / 2
    const rise = halfD * Math.tan(rad)
    return topY + rise - (halfD > 1e-6 ? (rise / halfD) * Math.abs(p) : 0)
  }
  return topY
}

interface CladBoard { x: number; y: number; z: number; dx: number; dz: number; h: number }

// Kledning: bak + sider (fulle) + fronten RUNDT portene (sidefelt, mellom
// dobbeltporter, og over portene opp til taket). Portåpningene står åpne.
function kledningBoards(c: GarasjeConfig, w: number, d: number, topY: number, botWall: number) {
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
  // Front rundt portene.
  const { bays } = portLayout(c, w)
  const takFront = (x: number) => takUnderkant(c, clampX(x), d / 2, w, d, topY)
  const edges = [-(w / 2 + kt), ...bays.flatMap((b) => [b.jambL, b.jambR]), w / 2 + kt]
  // Fulle felt mellom port-jambene (hjørne→port, mellom porter, port→hjørne).
  for (let i = 0; i < edges.length; i += 2) {
    run('x', d / 2 + kt / 2, edges[i], edges[i + 1], botWall, takFront)
  }
  // Over portene: fra portens overkant (header) og opp til taket – dekker
  // header + krybbestendere + gavl, så det ikke blir en åpen glipe over porten.
  const portTop = botWall + Math.min(c.porthoyde * scale, c.hoyde * scale - 0.25)
  bays.forEach((b) => run('x', d / 2 + kt / 2, b.jambL, b.jambR, portTop, takFront))
  return { boards, ks }
}

interface Del { navn: string; profil: string; lengdeM: number; antall: number; mat: string }

function geo(c: GarasjeConfig) {
  return { w: c.bredde * scale, d: c.dybde * scale }
}

function deler(c: GarasjeConfig): Del[] {
  const { w, d } = geo(c)
  const { d: ST, profil: STUD_PROFIL, pris: STUD_PRIS } = studSpec(c)
  const oh = c.takutstikk * scale
  const out: Del[] = []
  const push = (navn: string, profil: string, lengdeM: number, antall: number, mat: string) => {
    if (lengdeM > 0.001 && antall > 0) out.push({ navn, profil, lengdeM, antall, mat })
  }
  const H = c.hoyde * scale
  const tb = topBeam(c.bredde)
  const postH = H - SW - tb.h
  const { N, bays } = portLayout(c, w)
  const portH = Math.min(c.porthoyde * scale, H - 0.25)

  // Veggramme.
  push('Hjørnestolpe (dobbel)', STUD_PROFIL, H - tb.h, 8, STUD_PRIS)
  push('Bunnsvill bak', STUD_PROFIL, w, 1, STUD_PRIS)
  push('Bunnsvill side', STUD_PROFIL, d - 2 * ST, 2, STUD_PRIS)
  push('Toppdrager (dobbel) front/bak', tb.profil, w, 4, tb.pris)
  push('Toppdrager (dobbel) side', tb.profil, d - 2 * ST, 4, tb.pris)
  const nStud = (Math.max(1, Math.ceil(w / CC)) - 1) + 2 * (Math.max(1, Math.ceil(d / CC)) - 1)
  if (nStud > 0) push('Stender', STUD_PROFIL, postH, nStud, STUD_PRIS)
  const nLosholt = Math.max(0, Math.floor((postH - 0.05) / CC))
  const baysZ = Math.max(1, Math.ceil(d / CC))
  const losholtLen = ((d - 2 * ST) - (baysZ - 1) * SW) / baysZ
  if (nLosholt > 0 && losholtLen > 0.02) push('Losholt (kryss, side)', STUD_PROFIL, losholtLen, 2 * nLosholt * baysZ, STUD_PRIS)
  const baysXb = Math.max(1, Math.ceil(w / CC))
  const losholtLenBak = ((w - SW) - (baysXb - 1) * SW) / baysXb
  if (nLosholt > 0 && losholtLenBak > 0.02) push('Losholt (kryss, bak)', STUD_PROFIL, losholtLenBak, nLosholt * baysXb, STUD_PRIS)

  // Front: karm + drager (header) over hver port + midtstolpe (dobbel).
  push('Portkarm (bæringsstender)', STUD_PROFIL, portH, 2 * N, STUD_PRIS)
  bays.forEach((b) => push('Portbjelke (header)', tb.profil, b.openW + 2 * SW, 2, tb.pris))
  if (N === 2) push('Midtstolpe (dobbel)', STUD_PROFIL, H - tb.h, 2, STUD_PRIS)
  push('Bunnsvill front (mellom porter)', STUD_PROFIL, w, 1, STUD_PRIS)

  // Tak.
  if (c.taktype === 'pulttak') {
    const sideFall = c.takretning === 'venstre' || c.takretning === 'hoyre'
    const rw = sideFall ? d : w
    const rd = sideFall ? w : d
    const rise = Math.max(0, rd * Math.tan((c.takvinkel * Math.PI) / 180))
    const rafP = gradSperre(Math.hypot(rd, rise) / 2)
    push('Sperre (pulttak)', rafP.profil, Math.hypot(rd + 2 * oh, rise), antallCC(rw), rafP.pris)
    push('Undergurt (takstol)', STUD_PROFIL, rd, antallCC(rw), STUD_PRIS)
  } else if (c.taktype === 'saltak') {
    const rad = (c.takvinkel * Math.PI) / 180
    const rw = c.moneretning === 'dybde' ? d : w
    const rd = c.moneretning === 'dybde' ? w : d
    const slopeLen = (rd / 2 + oh) / Math.cos(rad)
    const rafS = gradSperre(slopeLen)
    push('Sperre (saltak)', rafS.profil, slopeLen, antallCC(rw) * 2, rafS.pris)
    push('Undergurt (takstol)', STUD_PROFIL, rd, antallCC(rw), STUD_PRIS)
  } else {
    const W = Math.max(w, d), D = Math.min(w, d)
    const MH = Math.max(0.05, (D / 2) * Math.tan((c.takvinkel * Math.PI) / 180))
    const profilV = `48 × ${Math.round(MH * 1000)} mm`
    push('Stretcher', profilV, W + 2 * oh, 1, 'bjelke-48x198')
    push('Tverrbjelke', profilV, D + 2 * oh, Math.max(1, Math.ceil(W / CC) - 1), 'bjelke-48x198')
    push('Hjørnebjelke', profilV, (D / 2 + oh) * Math.SQRT2, 4, 'bjelke-48x198')
  }

  // Garasjeport(er) – seksjonsport (sandwichpanel), pris pr. stk via m².
  bays.forEach(() => push('Garasjeport (seksjonsport)', 'seksjonsport', portH, Math.max(1, Math.round((bays[0]?.openW ?? 2.5) / 0.5)), 'veggpanel'))

  // Kledning.
  const kled = kledningBoards(c, w, d, SLAB_H + H, SLAB_H)
  if (kled.boards.length > 0) {
    const totLm = kled.boards.reduce((s, bd) => s + bd.h, 0)
    push('Kledning', kled.ks.profil, totLm / kled.boards.length, kled.boards.length, kled.ks.pris)
  }
  return out
}

function beregn(c: GarasjeConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const del = deler(c)
  const lmByMat = new Map<string, number>()
  del.forEach((p) => lmByMat.set(p.mat, (lmByMat.get(p.mat) ?? 0) + p.lengdeM * p.antall))
  let woodKr = 0
  let totalLm = 0
  lmByMat.forEach((lmv, mat) => { totalLm += lmv; woodKr += lmv * prisFor(mat) * faktor })
  const skruer = Math.round(totalLm * 4 + 40)
  const takArealM2 = ((c.bredde + 2 * c.takutstikk) / 100) * ((c.dybde + 2 * c.takutstikk) / 100) / Math.max(0.35, Math.cos((c.takvinkel * Math.PI) / 180))
  const takKr = takArealM2 * prisFor('kryssfiner-18') + (c.takpapp ? takArealM2 * prisFor('taktekke-takpapp') : 0)
  const plateM2 = (c.bredde / 100) * (c.dybde / 100)
  const plateKr = plateM2 * prisFor('platting-dekke')
  const estimatKr = Math.round((woodKr * SVINN + skruer * prisFor('skrue') + takKr + plateKr) / 10) * 10

  const linjer: BomLine[] = [...lmByMat.entries()].map(([mat, lmv]) => ({
    navn: PRISER[mat]?.navn ?? mat,
    antall: Math.round(lmv * SVINN * 10) / 10,
    enhet: mat === 'veggpanel' ? 'm²' : 'lm',
    kommentar: 'inkl. 10 % svinn',
  }))
  linjer.push({ navn: 'Taktekking (18 mm kryssfiner)', antall: Math.round(takArealM2 * SVINN * 10) / 10, enhet: 'm²', kommentar: 'inkl. svinn' })
  if (c.takpapp) linjer.push({ navn: 'Takpapp', antall: Math.round(takArealM2 * SVINN * 10) / 10, enhet: 'm²' })
  linjer.push({ navn: 'Betongplate (støpt gulv)', antall: Math.round(plateM2 * 10) / 10, enhet: 'm²', kommentar: 'armert, ~100 mm' })
  linjer.push({ navn: 'Garasjeport', antall: portCount(c), enhet: 'stk' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4', antall: skruer, enhet: 'stk' })

  // Arbeidstid: 40 t (liten enkel) → 140 t (stor dobbel).
  const area = (c.bredde * c.dybde) / 10000
  const sizeN = Math.min(1, Math.max(0, (area - 9) / (45 - 9)))
  let arbeidstimer = 40 + sizeN * 70
  if (portCount(c) === 2) arbeidstimer += 15
  if (c.taktype === 'valmtak') arbeidstimer += 12
  else if (c.taktype === 'saltak') arbeidstimer += 6
  arbeidstimer = Math.round(Math.min(140, Math.max(40, arbeidstimer)))

  const sammendrag = `${c.bredde} × ${c.dybde} × ${c.hoyde} cm · ${portCount(c) === 2 ? 'dobbel' : 'enkel'} garasje på betongplate`
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.dybde) / 10000, maal: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm`, arbeidstimer }
}

function kappliste(c: GarasjeConfig): KapplisteDel[] {
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

function tegning2D(c: GarasjeConfig): Tegning2D {
  const B = c.bredde
  const D = c.dybde
  const jw = Math.round(studSpec(c).d * 100)
  const former: Tegning2D['riss'][number]['former'] = [
    { type: 'rect', x: 0, y: 0, w: B, h: jw },
    { type: 'rect', x: 0, y: D - jw, w: B, h: jw },
    { type: 'rect', x: 0, y: 0, w: jw, h: D },
    { type: 'rect', x: B - jw, y: 0, w: jw, h: D },
  ]
  const plan: Tegning2D['riss'][number] = {
    id: 'plan', navn: 'Plan (veggramme)', bredde: B, hoyde: D, former,
    maal: [
      { x1: 0, y1: D, x2: B, y2: D, label: `${B} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
    ],
    tekster: [{ x: B * 0.5, y: D * 0.5, tekst: portCount(c) === 2 ? 'dobbel garasje' : 'enkel garasje' }],
  }
  return { riss: [plan] }
}

// ── Søknadsklart tegningssett (plan + fasader + snitt) for byggesøknad ──────
function fasadeKind(c: GarasjeConfig, side: 'front' | 'side'): 'gable' | 'slope' | 'flat' {
  if (c.taktype === 'valmtak') return 'gable'
  if (c.taktype === 'saltak') {
    const gableHere = side === 'front' ? c.moneretning === 'dybde' : c.moneretning === 'bredde'
    return gableHere ? 'gable' : 'flat'
  }
  // pulttak
  const fallX = c.takretning === 'venstre' || c.takretning === 'hoyre'
  return (side === 'front' ? fallX : !fallX) ? 'slope' : 'flat'
}

function globalFall(c: GarasjeConfig): number {
  const tan = Math.tan((c.takvinkel * Math.PI) / 180)
  const { bredde: B, dybde: D } = c
  if (c.taktype === 'pulttak') return Math.round((c.takretning === 'venstre' || c.takretning === 'hoyre' ? B : D) * tan)
  if (c.taktype === 'saltak') return Math.round(((c.moneretning === 'dybde' ? B : D) / 2) * tan)
  return Math.round((Math.min(B, D) / 2) * tan)
}

function soknadTegning(c: GarasjeConfig): Tegning2D {
  const B = c.bredde, D = c.dybde, h = c.hoyde
  const oh = Math.round(c.takutstikk)
  const tan = Math.tan((c.takvinkel * Math.PI) / 180)
  const gF = globalFall(c)
  const portH = Math.round(Math.min(c.porthoyde, h - 25))
  const { bays } = portLayout(c, B / 100)
  const portOpenings: Array<[number, number]> = bays.map((b) => {
    const wOpen = Math.round(b.openW * 100)
    return [Math.round(b.xC * 100 + B / 2 - wOpen / 2), wOpen]
  })

  const fasade = (id: string, navn: string, span: number, kind: 'gable' | 'slope' | 'flat', openings: Array<[number, number]>): Riss2D => {
    const fall = kind === 'gable' ? Math.round((span / 2) * tan) : kind === 'slope' ? Math.round(span * tan) : 0
    const H = h + gF
    const eaveY = H - h // veggtopp/raftlinje (y peker ned, 0 = topp)
    const sG = fall / Math.max(1, span / 2)
    const sS = fall / Math.max(1, span)
    let takLinje: Array<[number, number]>
    if (kind === 'gable') takLinje = [[-oh, eaveY + oh * sG], [0, eaveY], [span / 2, eaveY - fall], [span, eaveY], [span + oh, eaveY + oh * sG]]
    else if (kind === 'slope') takLinje = [[-oh, eaveY + oh * sS], [0, eaveY], [span, eaveY - fall], [span + oh, eaveY - fall - oh * sS]]
    else takLinje = [[-oh, eaveY], [span + oh, eaveY]]
    const former: Form2D[] = [
      { type: 'poly', points: takLinje },
      { type: 'line', points: [[0, eaveY], [0, H]] },
      { type: 'line', points: [[span, eaveY], [span, H]] },
    ]
    if (kind === 'flat' && gF > 1) former.push({ type: 'line', points: [[0, eaveY - gF], [span, eaveY - gF]], dashed: true })
    openings.forEach(([x0, wOpen]) => former.push({ type: 'rect', x: x0, y: H - portH, w: wOpen, h: portH }))
    return {
      id, navn, type: 'fasade', bredde: span, hoyde: H, former,
      maal: [
        { x1: 0, y1: H, x2: span, y2: H, label: `${span} cm`, offset: 26 },
        { x1: 0, y1: eaveY, x2: 0, y2: H, label: `${h} cm`, offset: 24 },
      ],
      tekster: kind !== 'flat' ? [{ x: span * 0.5, y: eaveY - Math.max(6, fall * 0.5), tekst: `${c.takvinkel}°` }] : undefined,
    }
  }

  const front = fasade('fasade-front', 'Fasade front (port)', B, fasadeKind(c, 'front'), portOpenings)
  const side = fasade('fasade-side', 'Fasade side', D, fasadeKind(c, 'side'), [])

  const jw = Math.round(studSpec(c).d * 100)
  const planFormer: Form2D[] = [{ type: 'rect', x: 0, y: 0, w: B, h: D }]
  if (c.taktype === 'saltak') planFormer.push(c.moneretning === 'dybde' ? { type: 'line', points: [[B / 2, 0], [B / 2, D]], dashed: true } : { type: 'line', points: [[0, D / 2], [B, D / 2]], dashed: true })
  portOpenings.forEach(([x0, wOpen]) => planFormer.push({ type: 'rect', x: x0, y: 0, w: wOpen, h: jw }))
  const plan: Riss2D = {
    id: 'plan', navn: 'Plan (ovenfra)', type: 'plan', bredde: B, hoyde: D, former: planFormer,
    maal: [
      { x1: 0, y1: D, x2: B, y2: D, label: `${B} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
    ],
    tekster: [{ x: B * 0.5, y: D * 0.5, tekst: portCount(c) === 2 ? 'dobbel garasje' : 'enkel garasje' }],
  }

  // Snitt gjennom dybden.
  const sKind = fasadeKind(c, 'side')
  const fall = sKind === 'gable' ? Math.round((D / 2) * tan) : sKind === 'slope' ? Math.round(D * tan) : gF
  const Htot = h + fall
  const Y = (hgt: number) => Htot - hgt
  const under: Array<[number, number]> =
    sKind === 'gable' ? [[0, h], [D / 2, h + fall], [D, h]]
      : sKind === 'slope' ? [[0, h], [D, h + fall]]
        : [[0, h], [D, h]]
  const gesims = 10 + h
  const mone = 10 + h + fall
  const snitt: Riss2D = {
    id: 'snitt', navn: 'Snitt A–A', type: 'snitt', bredde: D, hoyde: Htot,
    former: [
      { type: 'poly', points: under.map(([x, hh]) => [x, Y(hh)] as [number, number]) },
      { type: 'line', points: [[0, Y(h)], [0, Y(0)]] },
      { type: 'line', points: [[D, Y(sKind === 'slope' ? h + fall : h)], [D, Y(0)]] },
    ],
    maal: [
      { x1: 0, y1: Y(0), x2: D, y2: Y(0), label: `${D} cm`, offset: 26 },
      { x1: 0, y1: Y(h), x2: 0, y2: Y(0), label: `Gesims ${gesims} cm`, offset: 26 },
      ...(fall > 1 ? [{ x1: D, y1: Y(h + fall), x2: D, y2: Y(0), label: `Møne ${mone} cm`, offset: 26 }] : []),
    ],
  }

  return { riss: [plan, front, side, snitt] }
}

function byggeregler(c: GarasjeConfig): Byggeregler {
  const areal = (c.bredde * c.dybde) / 10000
  const fall = globalFall(c) / 100
  const gesims = c.hoyde / 100 + 0.1 // + plate over terreng
  const mone = gesims + fall
  const punkter: string[] = []
  let sokfri = true
  if (areal > 50) { sokfri = false; punkter.push(`Grunnflate ${areal.toFixed(1)} m² er over 50 m² – frittstående garasje er søknadspliktig.`) }
  if (gesims > 3.0) { sokfri = false; punkter.push(`Gesimshøyde ~${gesims.toFixed(1)} m er over 3,0 m – søknad kreves.`) }
  if (mone > 4.0) { sokfri = false; punkter.push(`Mønehøyde ~${mone.toFixed(1)} m er over 4,0 m – søknad kreves.`) }
  punkter.push('Frittstående garasje/uthus inntil 50 m² kan være unntatt søknad (PBL § 20-5) – over dette kreves søknad.')
  punkter.push('Avstand til nabogrense må være minst 1,0 m for å være unntatt søknad. Veiledende – sjekk lokale regler.')
  return { sokfri, tittel: sokfri ? 'Trolig søknadsfri' : 'Søknad kreves', punkter }
}

function buildMesh(c: GarasjeConfig, opts?: BuildOptions): THREE.Group {
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

  const { w, d } = geo(c)
  const { d: ST, profil: STUD_PROFIL } = studSpec(c)
  const oh = c.takutstikk * scale
  const slabTop = SLAB_H
  const H = c.hoyde * scale
  const yTopPlate = slabTop + H
  const tb = topBeam(c.bredde)
  const topBeamH = tb.h
  const topBeamProfil = tb.profil
  const postH = H - SW - topBeamH
  const postCY = slabTop + SW + postH / 2
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

  // ── Betongplate ──
  {
    const conc = new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.96, metalness: 0.02 })
    const p = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, SLAB_H, d + 0.1), conc)
    p.position.set(0, SLAB_H / 2, 0)
    p.castShadow = true
    p.receiveShadow = true
    p.userData.part = 'plate'
    p.userData.pid = 'betongplate'
    p.userData.info = { navn: 'Betongplate (støpt gulv)', profil: '~100 mm', lengdeCm: 0 }
    group.add(p)
  }

  // ── Veggramme ──
  const { N, bayW, bays } = portLayout(c, w)
  const frontZ = d / 2 - ST / 2
  const frontWallTop = slabTop + SW + postH

  // Bunnsvill (bak + sider + front i feltene mellom portene).
  woodBox(w, SW, ST, 0, slabTop + SW / 2, -d / 2 + ST / 2, 'svill-bunn-b', 'Bunnsvill', STUD_PROFIL, 0.8)
  woodBox(ST, SW, d - 2 * ST, -w / 2 + ST / 2, slabTop + SW / 2, 0, 'svill-bunn-v', 'Bunnsvill', STUD_PROFIL, 0.8)
  woodBox(ST, SW, d - 2 * ST, w / 2 - ST / 2, slabTop + SW / 2, 0, 'svill-bunn-h', 'Bunnsvill', STUD_PROFIL, 0.8)

  // Toppramme – dobbel bjelke.
  ;[-1, 1].forEach((off) => {
    woodBox(w, topBeamH, SW, 0, beamCY, d / 2 - ST / 2 + off * SW / 2, `drager-front-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
    woodBox(w, topBeamH, SW, 0, beamCY, -d / 2 + ST / 2 + off * SW / 2, `drager-bak-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
    woodBox(SW, topBeamH, d - 2 * ST, -w / 2 + ST / 2 + off * SW / 2, beamCY, 0, `drager-v-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
    woodBox(SW, topBeamH, d - 2 * ST, w / 2 - ST / 2 + off * SW / 2, beamCY, 0, `drager-h-${off}`, 'Toppdrager (dobbel)', topBeamProfil, 0.8)
  })

  // Doble hjørnestolper.
  const cornerH = H - topBeamH
  const cornerCY = slabTop + cornerH / 2
  ;([[-1, -1], [1, -1], [-1, 1], [1, 1]] as Array<[number, number]>).forEach(([sx, sz], k) => {
    woodBox(SW, cornerH, ST, sx * (w / 2 - SW / 2), cornerCY, sz * (d / 2 - ST / 2), `hjorne-${k}-a`, 'Hjørnestolpe (dobbel)')
    woodBox(ST, cornerH, SW, sx * (w / 2 - ST / 2), cornerCY, sz * (d / 2 - SW / 2), `hjorne-${k}-b`, 'Hjørnestolpe (dobbel)')
  })

  // Bakvegg mellomstendere.
  const baysX = Math.max(1, Math.ceil(w / CC))
  for (let i = 1; i < baysX; i++) {
    const x = -w / 2 + (i * w) / baysX
    woodBox(SW, postH, ST, x, postCY, -d / 2 + ST / 2, `stud-b-${i}`, 'Stender')
  }
  // Sidevegger mellomstendere.
  let baysZ = Math.max(2, Math.ceil(d / CC))
  if (baysZ % 2 === 1) baysZ += 1
  const sideZstuds: number[] = []
  for (let i = 1; i < baysZ; i++) sideZstuds.push(-d / 2 + (i * d) / baysZ)
  sideZstuds.forEach((z, i) => {
    woodBox(ST, postH, SW, -w / 2 + ST / 2, postCY, z, `stud-v-${i}`, 'Stender')
    woodBox(ST, postH, SW, w / 2 - ST / 2, postCY, z, `stud-h-${i}`, 'Stender')
  })

  // Losholt sider + bakvegg.
  const sideZ = [-(d / 2 - SW / 2), ...sideZstuds, d / 2 - SW / 2]
  const nLosholt = Math.max(0, Math.floor((postH - 0.05) / CC))
  for (let r = 1; r <= nLosholt; r++) {
    const y = slabTop + SW + r * CC
    for (let s = 0; s < sideZ.length - 1; s++) {
      const z0 = sideZ[s] + SW / 2, z1 = sideZ[s + 1] - SW / 2
      if (z1 - z0 < 0.02) continue
      woodBox(ST, SW, z1 - z0, -w / 2 + ST / 2, y, (z0 + z1) / 2, `losholt-v-${r}-${s}`, 'Losholt (kryss)')
      woodBox(ST, SW, z1 - z0, w / 2 - ST / 2, y, (z0 + z1) / 2, `losholt-h-${r}-${s}`, 'Losholt (kryss)')
    }
  }
  const backX = [-(w / 2 - SW / 2)]
  for (let i = 1; i < baysX; i++) backX.push(-w / 2 + (i * w) / baysX)
  backX.push(w / 2 - SW / 2)
  for (let r = 1; r <= nLosholt; r++) {
    const y = slabTop + SW + r * CC
    for (let s = 0; s < backX.length - 1; s++) {
      const x0 = backX[s] + SW / 2, x1 = backX[s + 1] - SW / 2
      if (x1 - x0 < 0.02) continue
      woodBox(x1 - x0, SW, ST, (x0 + x1) / 2, y, -d / 2 + ST / 2, `losholt-bak-${r}-${s}`, 'Losholt (kryss)')
    }
  }

  // ── Front: portåpninger med karm + header + midtstolpe (dobbel) ──
  const portH = Math.min(c.porthoyde * scale, H - 0.25)
  const portTop = slabTop + portH
  if (N === 2) {
    // Midtstolpe (bærende) mellom de to portene.
    woodBox(SW, cornerH, ST, 0, cornerCY, frontZ, 'midtstolpe-a', 'Midtstolpe (dobbel)')
    woodBox(ST, cornerH, SW, 0, cornerCY, frontZ, 'midtstolpe-b', 'Midtstolpe (dobbel)')
  }
  bays.forEach((b, j) => {
    // Karm (bæringsstender) i hver side av porten.
    woodBox(SW, postH, ST, b.jambL, postCY, frontZ, `portkarm-${j}-v`, 'Portkarm (bæringsstender)', STUD_PROFIL, 0.82)
    woodBox(SW, postH, ST, b.jambR, postCY, frontZ, `portkarm-${j}-h`, 'Portkarm (bæringsstender)', STUD_PROFIL, 0.82)
    // Header (dobbel drager) over porten.
    const headLen = b.jambR - b.jambL + SW
    ;[-1, 1].forEach((off) => woodBox(headLen, topBeamH, SW, b.xC, portTop + topBeamH / 2, frontZ + off * SW / 2, `porthead-${j}-${off}`, 'Portbjelke (header)', topBeamProfil, 0.8))
    // Krybbestendere over headeren opp til toppdrageren.
    const cripBot = portTop + topBeamH
    const cripH = frontWallTop - cripBot
    if (cripH > 0.05) {
      const nCr = Math.max(1, Math.ceil(b.openW / CC) - 1)
      for (let i = 1; i < nCr; i++) {
        const x = b.jambL + (i * (b.jambR - b.jambL)) / nCr
        woodBox(SW, cripH, ST, x, cripBot + cripH / 2, frontZ, `crip-${j}-${i}`, 'Krybbestender')
      }
    }
    // ── Garasjeport (seksjonsport) ──
    const leafW = b.openW - 0.02
    const portZ = frontZ - ST / 2 + 0.03
    const nP = Math.max(3, Math.round(portH / 0.55))
    const panelH = portH / nP
    for (let k = 0; k < nP; k++) {
      woodBox(leafW, panelH - 0.012, 0.05, b.xC, slabTop + (k + 0.5) * panelH, portZ, `port-${j}-${k}`, 'Garasjeport (seksjon)', 'seksjonsport', 0.95, 'port')
    }
  })

  // ── Tak ──
  if (c.taktype === 'pulttak') byggPulttak(group, meshMat, w, d, yTopPlate, c.takvinkel, oh, c.takretning, c.takpapp ? 'takpapp' : 'kryssfiner')
  else if (c.taktype === 'saltak') byggSaltak(group, meshMat, w, d, yTopPlate, c.takvinkel, oh, c.moneretning, c.takpapp ? 'takpapp' : 'kryssfiner')
  else byggValmtak(group, meshMat, w, d, yTopPlate, c.takvinkel, oh, c.takpapp ? 'takpapp' : 'kryssfiner')

  // ── Kledning ──
  const kled = kledningBoards(c, w, d, yTopPlate, slabTop)
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

  void bayW
  settSplitt(group)
  return group
}

export const garasje: ProductTemplate<GarasjeConfig> = {
  id: 'garasje',
  navn: 'Garasje',
  ikon: 'faWarehouse',
  beskrivelse: 'Tegn garasjen i 3D – enkel eller dobbel, på betongplate, med seksjonsport(er), kledning og takstoler.',
  tilgjengelig: true,
  fraPris: 990,
  leveranser: ['plan'],
  defaultConfig: {
    bredde: 360,
    dybde: 600,
    hoyde: 240,
    garasjetype: 'enkel',
    porthoyde: 210,
    kledningsbord: 'lekt',
    taktype: 'saltak',
    takvinkel: 27,
    takutstikk: 20,
    takretning: 'bak',
    moneretning: 'dybde',
    takpapp: true,
    treslag: 'impregnert',
    farge: 'morkegra',
  },
  presets: [
    {
      id: 'enkel-saltak',
      navn: 'Enkel garasje',
      beskrivelse: 'Saltak, mørk grå kledning',
      config: { bredde: 360, dybde: 600, hoyde: 240, garasjetype: 'enkel', taktype: 'saltak', moneretning: 'dybde', takvinkel: 27, takpapp: true, kledningsbord: 'lekt', treslag: 'impregnert', farge: 'morkegra' },
    },
    {
      id: 'enkel-pulttak',
      navn: 'Enkel m/ pulttak',
      beskrivelse: 'Moderne, slakt pulttak',
      config: { bredde: 380, dybde: 600, hoyde: 250, garasjetype: 'enkel', taktype: 'pulttak', takretning: 'bak', takvinkel: 12, takpapp: true, kledningsbord: '19x148', treslag: 'royal', farge: 'brun' },
    },
    {
      id: 'dobbel-saltak',
      navn: 'Dobbel garasje',
      beskrivelse: 'To porter, saltak, sortmalt',
      config: { bredde: 620, dybde: 620, hoyde: 240, garasjetype: 'dobbel', taktype: 'saltak', moneretning: 'bredde', takvinkel: 27, takpapp: true, kledningsbord: '19x98', treslag: 'gran', farge: 'sort' },
    },
    {
      id: 'dobbel-valmtak',
      navn: 'Dobbel m/ valmtak',
      beskrivelse: 'Eksklusiv lerk, valmtak',
      config: { bredde: 640, dybde: 640, hoyde: 250, garasjetype: 'dobbel', taktype: 'valmtak', takvinkel: 27, takpapp: true, kledningsbord: '19x148', treslag: 'lerk', farge: 'ubehandlet' },
    },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 300, max: 800, step: 10, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 500, max: 900, step: 10, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 220, max: 300, step: 5, axis: 'y' },
    { key: 'porthoyde', label: 'Porthøyde', min: 190, max: 260, step: 5, axis: 'y', handle: false },
    { key: 'takvinkel', label: 'Takvinkel', min: 5, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false, markers: [15, 22.5, 27, 30, 38, 45] },
    { key: 'takutstikk', label: 'Takutstikk', min: 5, max: 40, step: 1, axis: 'y', handle: false },
  ],
  alternativer: [
    {
      key: 'garasjetype',
      label: 'Type',
      choices: [
        { id: 'enkel', label: 'Enkel (1 port)' },
        { id: 'dobbel', label: 'Dobbel (2 porter)' },
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
        { id: 'saltak', label: 'Saltak', patch: { takvinkel: 27 } },
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
    { key: 'plate', label: 'Betongplate' },
    { key: 'konstruksjon', label: 'Ramme (vegg/takstol)' },
    { key: 'kledning', label: 'Kledning' },
    { key: 'port', label: 'Garasjeport' },
  ],
  beregn,
  kappliste,
  tegning2D,
  soknadTegning,
  byggeregler,
  raad: () => [
    'Støp en armert betongplate (~100 mm) på komprimert, drenert underlag – med fall mot porten.',
    'Fest bunnsvillene til plata med ekspansjonsbolter og mellomlegg (radonsperre/asfaltpapp).',
    'Reis stenderverket, rett opp hjørnene og avstiv midlertidig før toppdrager og takstoler.',
    'Monter garasjeporten(e) etter leverandørens anvisning når kledningen er på.',
  ],
  buildMesh,
  bounds: (c) => {
    const rad = (c.takvinkel * Math.PI) / 180
    const rise =
      c.taktype === 'pulttak'
        ? ((c.takretning === 'venstre' || c.takretning === 'hoyre' ? cm(c.bredde) : cm(c.dybde)) + cm(c.takutstikk)) * Math.tan(rad)
        : (Math.min(cm(c.bredde), cm(c.dybde)) / 2 + cm(c.takutstikk)) * Math.tan(rad)
    return {
      x: cm(c.bredde) + 2 * cm(c.takutstikk) + 0.1,
      y: SLAB_H + cm(c.hoyde) + rise + 0.3,
      z: cm(c.dybde) + 2 * cm(c.takutstikk) + 0.1,
    }
  },
  montering: () => [
    'Støp og herd betongplata med riktig fall og innstøpte forankringer.',
    'Kapp og reis stenderverk (48×98) på plata; doble hjørner + karm ved portene.',
    'Legg dobbel toppdrager rundt og bær takstolene på side-/gavlvegg.',
    'Kle inn vegger, legg undertak/tekking, og monter porten(e) til slutt.',
  ],
}
