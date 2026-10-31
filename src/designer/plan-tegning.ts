/**
 * Tegnings-scene + renderer for byggeplanen.
 *
 * En `Tegning` er et riss i MODELL-millimeter (y nedover) med elementer som
 * konturer, målekjeder, posisjonsbobler, akser, snittmarkører og nivåer.
 * `tegnTegning()` plasserer den på en `Flate` i en ekte målestokk (1:20,
 * 1:50 …) – identisk i PDF (vektor) og i forhåndsvisningen (SVG).
 *
 * Linjevekter (mm på arket) følger vanlig norsk tegnepraksis:
 *   snitt 0,50 · synlig kontur 0,30 · tynn/detalj 0,15 · målsetting 0,13
 */
import type { Flate, Stil } from './plan-flate'
import type { Fyll, Riss2DPlan } from './plan-typer'
import type { Form2D, Riss2D } from './types'

export type P = [number, number]
export type Linjetype = 'synlig' | 'snitt' | 'skjult' | 'tynn' | 'hjelp' | 'senter'

export interface TPoly {
  t: 'poly'
  pts: P[]
  lukket: boolean
  linje: Linjetype
  /** Fyll/skravur. 'hvit' = dekkende hvit (skjuler det bak), 'tone' = lys tretone. */
  fyll?: Fyll | 'hvit' | 'tone'
}
export interface TMaal {
  t: 'maal'
  retning: 'h' | 'v'
  /** Koordinater langs målretningen (x for 'h', y for 'v'), modell-mm. */
  punkter: number[]
  /** Hvor hjelpelinjene starter (y for 'h', x for 'v') – én pr. punkt eller felles. */
  fra: number | number[]
  /** 1 = under/høyre for geometrien, -1 = over/venstre. */
  side: 1 | -1
  /** Nivå 0, 1, 2 … utover fra geometrien (kjede innerst, totalmål ytterst). */
  niva: number
  /** Overstyrte tekster pr. segment. */
  tekster?: string[]
}
export interface TTekst {
  t: 'tekst'
  x: number
  y: number
  tekst: string
  str?: number
  juster?: 'left' | 'center' | 'right'
  kursiv?: boolean
  vekt?: 'normal' | 'bold'
  farge?: string
}
export interface TPaaskrift {
  t: 'paaskrift'
  x: number
  y: number
  tekst: string
  /** Etikettens forskyvning fra ankeret, i ark-mm. */
  dx: number
  dy: number
}
export interface TPos { t: 'pos'; x: number; y: number; merke: string }
export interface TAkse { t: 'akse'; navn: string; retning: 'x' | 'y'; pos: number }
export interface TSnitt { t: 'snitt'; navn: string; a: P; b: P; retning: 1 | -1 }
export interface TNivaa { t: 'nivaa'; y: number; tekst: string }
export interface TTerreng { t: 'terreng'; y: number; x0: number; x1: number }

export type TElement = TPoly | TMaal | TTekst | TPaaskrift | TPos | TAkse | TSnitt | TNivaa | TTerreng

export interface Tegning {
  id: string
  navn: string
  type: 'plan' | 'fasade' | 'snitt' | 'oppriss' | 'detalj'
  el: TElement[]
  /** Geometriens utstrekning [minX, minY, maxX, maxY] i modell-mm. */
  geo: [number, number, number, number]
  /** Fast målestokk (nevner). Utelatt = velges automatisk. */
  malestokk?: number
  nordpil?: number
  /** Liten tekst under tittelen, f.eks. «Konstruksjon – kledning ikke vist». */
  undertittel?: string
}

export const FARGE = {
  strek: '#141414',
  maal: '#1f3a52',
  hjelp: '#8a96a3',
  tone: '#f4efe4',
  betong: '#e4e4e2',
  aksent: '#3d4ba8',
  gra: '#6b6f76',
}

const LINJE: Record<Linjetype, Stil> = {
  snitt: { bredde: 0.5, strek: FARGE.strek },
  synlig: { bredde: 0.28, strek: FARGE.strek },
  tynn: { bredde: 0.15, strek: FARGE.strek },
  skjult: { bredde: 0.18, strek: FARGE.strek, stiplet: [1.4, 0.8] },
  hjelp: { bredde: 0.12, strek: FARGE.hjelp },
  senter: { bredde: 0.13, strek: FARGE.gra, stiplet: [5, 1, 0.6, 1] },
}

export const MALESTOKKER = [1, 2, 5, 10, 20, 50, 100, 200, 500]

/** Talltekst i mm med mellomrom som tusenskille (norsk), f.eks. 12 000. */
export function mm(v: number): string {
  const r = Math.round(v)
  return Math.abs(r) >= 10000 ? r.toLocaleString('nb-NO').replace(/\u00a0/g, ' ') : String(r)
}

// ── Marg rundt geometrien (ark-mm) ──────────────────────────────────────

const MAAL_AVST = 7 // første målelinje fra geometrien
const MAAL_STEG = 6.5 // mellom nivåene

interface Marg { v: number; h: number; o: number; u: number }

function marg(tg: Tegning, M = 50): Marg {
  const [gx0, gy0, gx1, gy1] = tg.geo
  const m: Marg = { v: 4, h: 4, o: 4, u: 4 }
  for (const e of tg.el) {
    if (e.t === 'maal') {
      const d = MAAL_AVST + e.niva * MAAL_STEG + 4.5
      if (e.retning === 'h') { if (e.side > 0) m.u = Math.max(m.u, d); else m.o = Math.max(m.o, d) }
      else if (e.side > 0) m.h = Math.max(m.h, d)
      else m.v = Math.max(m.v, d)
    } else if (e.t === 'akse') {
      if (e.retning === 'x') m.o = Math.max(m.o, 12)
      else m.v = Math.max(m.v, 12)
    } else if (e.t === 'nivaa') m.h = Math.max(m.h, 24)
    else if (e.t === 'snitt') {
      const horisontal = Math.abs(e.a[1] - e.b[1]) < 0.01
      if (horisontal) { m.v += 9; m.h += 9 } else { m.o += 9; m.u += 9 }
    }
    else if (e.t === 'paaskrift') {
      // Etiketten (≈ 1,15 mm per tegn ved 6,6 pt) regnet fra ankerpunktet
      // i målestokken M – bare det som stikker utenfor geometrien teller.
      const linjer = e.tekst.split('\n')
      const b = Math.max(...linjer.map((l) => l.length)) * 1.15 + 3
      if (e.dx > 0) m.h = Math.max(m.h, (e.x - gx1) / M + e.dx + b)
      else m.v = Math.max(m.v, (gx0 - e.x) / M - e.dx + b)
      if (e.dy < 0) m.o = Math.max(m.o, (gy0 - e.y) / M - e.dy + 3.5)
      else m.u = Math.max(m.u, (e.y - gy1) / M + e.dy + linjer.length * 2.8 + 1)
    }
  }
  return m
}

/** Største målestokk (minste nevner) som får tegningen inn i w × h ark-mm. */
export function velgMalestokk(tg: Tegning, w: number, h: number): number {
  const [x0, y0, x1, y1] = tg.geo
  const gw = Math.max(1, x1 - x0)
  const gh = Math.max(1, y1 - y0)
  // Detaljer tegnes ikke større enn 1:5, øvrige riss ikke større enn 1:10.
  const min = tg.type === 'detalj' ? 5 : 10
  for (const M of MALESTOKKER) {
    if (M < min) continue
    const mg = marg(tg, M)
    if (gw / M + mg.v + mg.h <= w && gh / M + mg.o + mg.u <= h) return M
  }
  return MALESTOKKER[MALESTOKKER.length - 1]
}

/** Ark-utstrekning (w, h) for en tegning ved målestokk M, inkl. marg. */
export function tegningStorrelse(tg: Tegning, M: number): { w: number; h: number } {
  const [x0, y0, x1, y1] = tg.geo
  const mg = marg(tg, M)
  return { w: (x1 - x0) / M + mg.v + mg.h, h: (y1 - y0) / M + mg.o + mg.u }
}

// ── Skravur ─────────────────────────────────────────────────────────────

/** Skjærer en uendelig linje (p + t·d) med polygonet → segmenter innenfor. */
function linjeIPolygon(pts: P[], p: P, d: P): Array<[P, P]> {
  const ts: number[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const ex = b[0] - a[0]
    const ey = b[1] - a[1]
    const den = d[0] * ey - d[1] * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den
    const s = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den
    if (s >= -1e-9 && s <= 1 + 1e-9) ts.push(t)
  }
  ts.sort((x, y) => x - y)
  const ut: Array<[P, P]> = []
  for (let i = 0; i + 1 < ts.length; i += 2) {
    if (ts[i + 1] - ts[i] < 1e-6) continue
    ut.push([[p[0] + d[0] * ts[i], p[1] + d[1] * ts[i]], [p[0] + d[0] * ts[i + 1], p[1] + d[1] * ts[i + 1]]])
  }
  return ut
}

/** Parallell skravur (vinkel i grader, avstand i ark-mm) klippet til polygonet. */
function skravur(f: Flate, pts: P[], vinkel: number, avst: number, s: Stil) {
  const r = (vinkel * Math.PI) / 180
  const d: P = [Math.cos(r), Math.sin(r)]
  const nrm: P = [-d[1], d[0]]
  const proj = pts.map((p) => p[0] * nrm[0] + p[1] * nrm[1])
  const lo = Math.min(...proj)
  const hi = Math.max(...proj)
  for (let k = lo + avst / 2; k < hi; k += avst) {
    for (const [a, b] of linjeIPolygon(pts, [nrm[0] * k, nrm[1] * k], d)) f.strek(a[0], a[1], b[0], b[1], s)
  }
}

function fyllPolygon(f: Flate, pts: P[], fyll: TPoly['fyll'], snittet: boolean) {
  if (!fyll) return
  if (fyll === 'hvit') { f.poly(pts, true, { strek: null, fyll: '#ffffff' }); return }
  if (fyll === 'tone') { f.poly(pts, true, { strek: null, fyll: FARGE.tone }); return }
  const tynn: Stil = { bredde: 0.1, strek: FARGE.strek }
  switch (fyll) {
    case 'tre':
      f.poly(pts, true, { strek: null, fyll: '#efe4cf' })
      if (snittet && pts.length === 4) {
        // Konstruksjonsvirke i snitt: diagonalkryss.
        f.strek(pts[0][0], pts[0][1], pts[2][0], pts[2][1], tynn)
        f.strek(pts[1][0], pts[1][1], pts[3][0], pts[3][1], tynn)
      } else skravur(f, pts, 45, 1.1, tynn)
      break
    case 'betong':
      f.poly(pts, true, { strek: null, fyll: FARGE.betong })
      skravur(f, pts, 45, 1.6, { bredde: 0.09, strek: '#555555' })
      break
    case 'jord':
      skravur(f, pts, 45, 1.0, { bredde: 0.09, strek: '#555555' })
      skravur(f, pts, -45, 2.0, { bredde: 0.07, strek: '#888888' })
      break
    case 'grus':
      f.poly(pts, true, { strek: null, fyll: '#f0eee8' })
      skravur(f, pts, 30, 1.4, { bredde: 0.07, strek: '#8a8a8a', stiplet: [0.3, 0.9] })
      break
    case 'isolasjon':
      f.poly(pts, true, { strek: null, fyll: '#fbf3c8' })
      skravur(f, pts, 60, 1.5, { bredde: 0.08, strek: '#a08a30' })
      break
    case 'stal':
      f.poly(pts, true, { strek: null, fyll: '#4a4f57' })
      break
    case 'tett':
      f.poly(pts, true, { strek: null, fyll: '#2a2a2a' })
      break
  }
}

// ── Renderer ────────────────────────────────────────────────────────────

export interface TegnOpts {
  /** Skjul alle måltall (låst forhåndsvisning). */
  laast?: boolean
}

/**
 * Tegner `tg` i målestokk 1:M, sentrert i rammen (ark-mm). Returnerer
 * transformen slik at kalleren kan tegne mer i samme koordinatsystem.
 */
export function tegnTegning(f: Flate, tg: Tegning, ramme: { x: number; y: number; w: number; h: number }, M: number, opts: TegnOpts = {}) {
  const [gx0, gy0, gx1, gy1] = tg.geo
  const mg = marg(tg, M)
  const bw = (gx1 - gx0) / M + mg.v + mg.h
  const bh = (gy1 - gy0) / M + mg.o + mg.u
  const ox = ramme.x + (ramme.w - bw) / 2 + mg.v
  const oy = ramme.y + (ramme.h - bh) / 2 + mg.o
  const X = (x: number) => ox + (x - gx0) / M
  const Y = (y: number) => oy + (y - gy0) / M
  const pp = (p: P): P => [X(p[0]), Y(p[1])]
  const gL = X(gx0)
  const gR = X(gx1)
  const gT = Y(gy0)
  const gB = Y(gy1)

  const maalStil: Stil = { bredde: 0.13, strek: FARGE.maal }
  const hjelpStil: Stil = { bredde: 0.1, strek: FARGE.hjelp }
  const tall = (v: string) => (opts.laast ? '• • •' : v)

  // 1) Terreng under alt annet.
  for (const e of tg.el) {
    if (e.t !== 'terreng') continue
    const y = Y(e.y)
    const x0 = X(e.x0)
    const x1 = X(e.x1)
    const band: P[] = [[x0, y], [x1, y], [x1, y + 2.6], [x0, y + 2.6]]
    skravur(f, band, 45, 1.3, { bredde: 0.1, strek: '#777777' })
    f.strek(x0, y, x1, y, { bredde: 0.45, strek: FARGE.strek })
  }

  // 2) Geometri (malerens algoritme – rekkefølgen i lista er dybderekkefølgen).
  for (const e of tg.el) {
    if (e.t !== 'poly') continue
    const pts = e.pts.map(pp)
    if (e.lukket && e.fyll) fyllPolygon(f, pts, e.fyll, e.linje === 'snitt')
    f.poly(pts, e.lukket, { ...LINJE[e.linje], fyll: null })
  }

  // 3) Akser.
  for (const e of tg.el) {
    if (e.t !== 'akse') continue
    const r = 2.6
    if (e.retning === 'x') {
      const x = X(e.pos)
      const yTop = gT - 7
      f.strek(x, yTop + r, x, gB + 3, LINJE.senter)
      f.sirkel(x, yTop, r, { bredde: 0.2, strek: FARGE.strek, fyll: '#ffffff' })
      f.tekst(e.navn, x, yTop, { str: 7, vekt: 'bold', juster: 'center', grunnlinje: 'middle' })
    } else {
      const y = Y(e.pos)
      const xL = gL - 7
      f.strek(xL + r, y, gR + 3, y, LINJE.senter)
      f.sirkel(xL, y, r, { bredde: 0.2, strek: FARGE.strek, fyll: '#ffffff' })
      f.tekst(e.navn, xL, y, { str: 7, vekt: 'bold', juster: 'center', grunnlinje: 'middle' })
    }
  }

  // 4) Målsetting (kjeder med skrå avslutningsstreker, tekst over linja).
  for (const e of tg.el) {
    if (e.t !== 'maal') continue
    const pkt = [...e.punkter].sort((a, b) => a - b)
    if (pkt.length < 2) continue
    const fra = (i: number) => (Array.isArray(e.fra) ? e.fra[e.punkter.indexOf(pkt[i])] ?? e.fra[0] : e.fra)
    const avst = MAAL_AVST + e.niva * MAAL_STEG
    const tick = 1.1
    const str = 6.4
    if (e.retning === 'h') {
      const ly = e.side > 0 ? gB + avst : gT - avst
      for (let i = 0; i < pkt.length; i++) {
        const x = X(pkt[i])
        const y0 = Y(fra(i))
        const start = e.side > 0 ? y0 + 1.2 : y0 - 1.2
        f.strek(x, start, x, ly + e.side * 1.6, hjelpStil)
        f.strek(x - tick, ly + tick, x + tick, ly - tick, { bredde: 0.3, strek: FARGE.maal })
      }
      f.strek(X(pkt[0]) - 1.6, ly, X(pkt[pkt.length - 1]) + 1.6, ly, maalStil)
      for (let i = 0; i + 1 < pkt.length; i++) {
        const a = X(pkt[i])
        const b = X(pkt[i + 1])
        const t = tall(e.tekster?.[i] ?? mm(pkt[i + 1] - pkt[i]))
        const tw = f.maal(t, str)
        const smal = tw + 1 > b - a
        // Smale segmenter: teksten løftes vekselvis så tallene ikke kolliderer.
        const løft = smal ? (i % 2 ? 3.2 : 0) : 0
        const tx = smal && b - a < tw * 0.6 && i === pkt.length - 2 ? b + tw / 2 + 1 : (a + b) / 2
        f.tekst(t, tx, ly - 0.8 - løft, { str, farge: FARGE.maal, juster: 'center' })
      }
    } else {
      const lx = e.side > 0 ? gR + avst : gL - avst
      for (let i = 0; i < pkt.length; i++) {
        const y = Y(pkt[i])
        const x0 = X(fra(i))
        const start = e.side > 0 ? x0 + 1.2 : x0 - 1.2
        f.strek(start, y, lx + e.side * 1.6, y, hjelpStil)
        f.strek(lx - tick, y + tick, lx + tick, y - tick, { bredde: 0.3, strek: FARGE.maal })
      }
      f.strek(lx, Y(pkt[0]) - 1.6, lx, Y(pkt[pkt.length - 1]) + 1.6, maalStil)
      for (let i = 0; i + 1 < pkt.length; i++) {
        const a = Y(pkt[i])
        const b = Y(pkt[i + 1])
        const t = tall(e.tekster?.[i] ?? mm(pkt[i + 1] - pkt[i]))
        const tw = f.maal(t, str)
        const smal = tw + 1 > b - a
        const løft = smal ? (i % 2 ? 3.2 : 0) : 0
        f.tekst(t, lx - 0.8 - løft, (a + b) / 2, { str, farge: FARGE.maal, juster: 'center', vinkel: 90 })
      }
    }
  }

  // 5) Nivåer (høydekoter) til høyre for geometrien.
  for (const e of tg.el) {
    if (e.t !== 'nivaa') continue
    const y = Y(e.y)
    const x = gR + 5
    f.strek(gR + 1.5, y, x + 16, y, hjelpStil)
    f.poly([[x + 2, y], [x + 0.6, y - 1.6], [x + 3.4, y - 1.6]], true, { bredde: 0.15, strek: FARGE.maal, fyll: FARGE.maal })
    f.tekst(tall(e.tekst), x + 4.2, y - 0.8, { str: 6.4, farge: FARGE.maal })
  }

  // 6) Snittmarkører.
  for (const e of tg.el) {
    if (e.t !== 'snitt') continue
    const a = pp(e.a)
    const b = pp(e.b)
    // Snittlinja trekkes helt ut til margkanten, utenfor målekjedene.
    if (Math.abs(a[1] - b[1]) < 0.01) {
      const [lo, hi] = [gL - mg.v + 3, gR + mg.h - 3]
      if (a[0] <= b[0]) { a[0] = lo; b[0] = hi } else { a[0] = hi; b[0] = lo }
    } else if (Math.abs(a[0] - b[0]) < 0.01) {
      const [lo, hi] = [gT - mg.o + 3, gB + mg.u - 3]
      if (a[1] <= b[1]) { a[1] = lo; b[1] = hi } else { a[1] = hi; b[1] = lo }
    }
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const L = Math.hypot(dx, dy) || 1
    const ux = dx / L
    const uy = dy / L
    // Normal mot synsretningen.
    const nx = -uy * e.retning
    const ny = ux * e.retning
    const tykk: Stil = { bredde: 0.6, strek: FARGE.strek }
    f.strek(a[0] - ux * 4, a[1] - uy * 4, a[0] + ux * 5, a[1] + uy * 5, tykk)
    f.strek(b[0] + ux * 4, b[1] + uy * 4, b[0] - ux * 5, b[1] - uy * 5, tykk)
    f.strek(a[0] + ux * 5, a[1] + uy * 5, b[0] - ux * 5, b[1] - uy * 5, { ...LINJE.senter, bredde: 0.18 })
    for (const [p, s] of [[a, -1], [b, 1]] as Array<[P, number]>) {
      const ex = p[0] + ux * s * 4
      const ey = p[1] + uy * s * 4
      // Pil i synsretningen: basis på linja, spiss ut mot betrakterens blikk.
      f.poly([[ex + nx * 3.4, ey + ny * 3.4], [ex - ux * 1.4, ey - uy * 1.4], [ex + ux * 1.4, ey + uy * 1.4]], true, { strek: null, fyll: FARGE.strek })
      f.tekst(e.navn, ex + ux * s * 2.6, ey + uy * s * 2.6, { str: 9, vekt: 'bold', juster: 'center', grunnlinje: 'middle' })
    }
  }

  // 7) Påskrifter med leder.
  for (const e of tg.el) {
    if (e.t !== 'paaskrift') continue
    const [ax, ay] = pp([e.x, e.y])
    const lx = ax + e.dx
    const ly = ay + e.dy
    f.sirkel(ax, ay, 0.45, { strek: null, fyll: FARGE.strek })
    f.strek(ax, ay, lx, ly, { bredde: 0.13, strek: FARGE.strek })
    const linjer = e.tekst.split('\n')
    const tw = Math.max(...linjer.map((l) => f.maal(l, 6.6)))
    const right = e.dx >= 0
    f.strek(lx, ly, lx + (right ? tw + 1.5 : -tw - 1.5), ly, { bredde: 0.13, strek: FARGE.strek })
    linjer.forEach((l, i) => f.tekst(l, lx + (right ? 0.8 : -0.8), ly - 0.9 + i * 2.8, { str: 6.6, juster: right ? 'left' : 'right' }))
  }

  // 8) Frie tekster.
  for (const e of tg.el) {
    if (e.t !== 'tekst') continue
    f.tekst(e.tekst, X(e.x), Y(e.y), { str: e.str ?? 7, juster: e.juster ?? 'center', kursiv: e.kursiv, vekt: e.vekt, farge: e.farge ?? FARGE.maal, grunnlinje: 'middle' })
  }

  // 9) Posisjonsbobler øverst.
  for (const e of tg.el) {
    if (e.t !== 'pos') continue
    const [x, y] = pp([e.x, e.y])
    const r = e.merke.length > 1 ? 2.6 : 2.2
    f.sirkel(x, y, r, { bredde: 0.25, strek: FARGE.aksent, fyll: '#ffffff' })
    f.tekst(e.merke, x, y + 0.05, { str: 6.8, vekt: 'bold', juster: 'center', grunnlinje: 'middle', farge: FARGE.aksent })
  }

  return { X, Y, gL, gR, gT, gB }
}

// ── Templatets Riss2D → Tegning ─────────────────────────────────────────

/**
 * Gjør om målteksten til mm. Stemmer tallet med geometrien (cm), brukes den
 * eksakte geometriske lengden – ingen avrundingsdrift mellom 3D og tegning.
 */
function maalTekstMm(label: string, lengdeCm: number): string {
  if (/\bmm\b/.test(label)) return label
  const m = label.match(/^(.*?)(-?\d+(?:[.,]\d+)?)(\s*cm)?(.*)$/)
  if (!m) return label
  const tall = Number(m[2].replace(',', '.'))
  const pre = m[1].trim()
  const post = m[4].trim()
  // Tallet er geometriens lengde i cm → bruk eksakt geometri i mm.
  if (Math.abs(tall - lengdeCm) <= 1) return `${pre ? `${pre} ` : ''}${mm(lengdeCm * 10)}${post ? ` ${post}` : ''}`
  if (m[3]) return `${pre ? `${pre} ` : ''}${mm(tall * 10)}${post ? ` ${post}` : ''}`
  return label
}

function formTilPoly(fm: Form2D & { fyll?: Fyll; snittet?: boolean }): TPoly {
  const linje: Linjetype = fm.snittet ? 'snitt' : fm.dashed ? 'skjult' : fm.tynn ? 'tynn' : 'synlig'
  if (fm.type === 'rect') {
    const x = (fm.x ?? 0) * 10
    const y = (fm.y ?? 0) * 10
    const w = (fm.w ?? 0) * 10
    const h = (fm.h ?? 0) * 10
    return { t: 'poly', pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], lukket: true, linje, fyll: fm.fyll }
  }
  const pts = (fm.points ?? []).map(([x, y]) => [x * 10, y * 10] as P)
  const lukket = !!fm.fyll && pts.length > 2
  return { t: 'poly', pts, lukket, linje, fyll: fm.fyll }
}

export function rissTilTegning(r: Riss2D | Riss2DPlan): Tegning {
  const rp = r as Riss2DPlan
  const el: TElement[] = []
  let x0 = 0
  let y0 = 0
  let x1 = r.bredde * 10
  let y1 = r.hoyde * 10
  for (const fm of r.former) {
    const p = formTilPoly(fm)
    for (const [x, y] of p.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    el.push(p)
  }
  if (r.type === 'fasade' || r.type === 'snitt') el.unshift({ t: 'terreng', y: r.hoyde * 10, x0: x0 - 400, x1: x1 + 400 })

  // Mål: mål på samme side med samme forskyvning ligger på samme linje
  // (målekjede); ulike forskyvninger blir nivåer utover (innerst først).
  const nivaer = new Map<string, number[]>()
  const nivaFor = (k: string, off: number) => {
    const l = nivaer.get(k) ?? []
    if (!l.some((o) => Math.abs(o - off) < 0.5)) l.push(off)
    l.sort((x, y) => x - y)
    nivaer.set(k, l)
  }
  const info = r.maal.map((m) => {
    const horisontal = Math.abs(m.y1 - m.y2) < 0.001
    const side: 1 | -1 = horisontal ? (m.y1 >= r.hoyde / 2 ? 1 : -1) : (m.x1 >= r.bredde / 2 ? 1 : -1)
    const k = `${horisontal ? 'h' : 'v'}${side}`
    const off = Math.abs(m.offset ?? 22)
    nivaFor(k, off)
    return { m, horisontal, side, k, off }
  })
  for (const { m, horisontal, side, k, off } of info) {
    const niva = (nivaer.get(k) ?? [off]).findIndex((o) => Math.abs(o - off) < 0.5)
    const L = horisontal ? Math.abs(m.x2 - m.x1) : Math.abs(m.y2 - m.y1)
    const tekst = maalTekstMm(m.label, L)
    if (horisontal) {
      el.push({ t: 'maal', retning: 'h', punkter: [m.x1 * 10, m.x2 * 10], fra: [m.y1 * 10, m.y2 * 10], side, niva, tekster: [tekst] })
    } else {
      const lo = Math.min(m.y1, m.y2)
      const hi = Math.max(m.y1, m.y2)
      el.push({ t: 'maal', retning: 'v', punkter: [lo * 10, hi * 10], fra: [m.x1 * 10, m.x2 * 10], side, niva, tekster: [tekst] })
    }
  }
  for (const t of r.tekster ?? []) el.push({ t: 'tekst', x: t.x * 10, y: t.y * 10, tekst: t.tekst, kursiv: true })
  for (const a of rp.akser ?? []) el.push({ t: 'akse', navn: a.navn, retning: a.retning, pos: a.pos * 10 })
  for (const s of rp.snitt ?? []) el.push({ t: 'snitt', navn: s.navn, a: [s.x1 * 10, s.y1 * 10], b: [s.x2 * 10, s.y2 * 10], retning: s.retning ?? 1 })
  for (const p of rp.paaskrifter ?? []) {
    const harLeder = p.tilX !== undefined && p.tilY !== undefined
    if (harLeder) el.push({ t: 'paaskrift', x: p.tilX! * 10, y: p.tilY! * 10, tekst: p.tekst, dx: (p.x - p.tilX!) >= 0 ? 12 : -12, dy: -6 })
    else el.push({ t: 'tekst', x: p.x * 10, y: p.y * 10, tekst: p.tekst, juster: 'left' })
  }
  const type = r.type === 'plan' ? 'plan' : r.type === 'snitt' ? 'snitt' : r.type === 'fasade' ? 'fasade' : 'oppriss'
  return { id: r.id, navn: r.navn, type, el, geo: [x0, y0, x1, y1], malestokk: rp.malestokk, nordpil: rp.nordpil }
}
