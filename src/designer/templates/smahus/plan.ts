/**
 * Byggeplan for småhus-modellen: materialliste, kappliste, tegninger,
 * monteringsanvisning, beregningsgrunnlag og byggeregler – alt avledet av
 * SAMME `Modell` som 3D-en bygges fra.
 */
import type { Bom, Bounds, Byggeregler, Tegning2D } from '../../types'
import type { BeregningKontroll, Beregningsgrunnlag, BomLinePlan, Form2DPlan, KapplisteDelPlan, Materialkategori, MonteringSteg, Riss2DPlan } from '../../plan-typer'
import { PRISER, prisFor } from '../../priser'
import { TRESLAG } from '../../materials'
import { lagBeregningsrapport, tilPlanVedlegg } from '../../beregningsgrunnlag'
import { frostsoneForConfig, grunnForConfig } from '../../byggested'
import { FROSTSONER, GRUNN } from '../../fundament'
import { tilByggeregler, vurderByggesak } from '../../byggesak'
import { fmtGrader } from '../../geometri'
import { fmt } from '../../laster'
import type { Dimensjonering } from '../../dimensjonering'
import { konvekstSkall, punkter, type P2, type V3 } from './geo'
import { kledSpec, gulvSpec, lagModell, type Del, type Modell, type SmahusInput } from './modell'

// ── Modell-cache (templatene kaller mange funksjoner med samme config) ──
const cache = new Map<string, Modell>()
export function modellFor(inn: SmahusInput): Modell {
  const { config, ...rest } = inn
  const key = JSON.stringify(rest) + '|' + JSON.stringify({ k: config.kommune, m: config.moh, s: config.sk, f: config.frostsone, g: config.grunn })
  const hit = cache.get(key)
  if (hit) return hit
  const m = lagModell(inn)
  cache.set(key, m)
  if (cache.size > 24) cache.delete(cache.keys().next().value as string)
  return m
}

/** Pris fra den sentrale prislista (`priser.ts`). */
export const pris = (id: string) => prisFor(id)
const prisNavn = (id: string) => PRISER[id]?.navn ?? id
const SVINN = 1.1

const KAT_REKKE: Materialkategori[] = ['fundament', 'bjelkelag', 'dekke', 'konstruksjon', 'tak', 'kledning', 'beslag', 'festemidler', 'utstyr', 'annet']

// ── Kappliste ──────────────────────────────────────────────────────

export function kappliste(m: Modell): KapplisteDelPlan[] {
  const map = new Map<string, KapplisteDelPlan>()
  for (const d of m.deler) {
    if (!d.tre) continue
    const key = `${d.navn}|${d.profil}|${d.lengdeCm}`
    const ex = map.get(key)
    if (ex) {
      ex.antall++
      ex.lengdeMm = Math.max(ex.lengdeMm ?? 0, d.kappMm)
    } else
      map.set(key, {
        navn: d.navn,
        profil: d.profil,
        lengdeCm: d.lengdeCm,
        antall: 1,
        lengdeMm: d.kappMm,
        kvalitet: d.kvalitet,
        endeA: d.endeA,
        endeB: d.endeB,
        merknad: d.merknad,
        kategori: d.kategori,
      })
  }
  return [...map.values()].sort((a, b) => KAT_REKKE.indexOf(a.kategori ?? 'annet') - KAT_REKKE.indexOf(b.kategori ?? 'annet') || a.navn.localeCompare(b.navn, 'nb') || b.lengdeCm - a.lengdeCm)
}

// ── Materialliste ──────────────────────────────────────────────────

const KAT_NAVN: Partial<Record<Materialkategori, string>> = {
  bjelkelag: 'bjelkelag',
  konstruksjon: 'stenderverk',
  tak: 'tak',
  kledning: 'kledning',
  dekke: 'gulv',
  utstyr: 'innredning',
}

export function materialliste(m: Modell, c: { treslag: string; bredde: number; dybde: number; hoyde: number }, ekstraTimer?: number): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const linjer: BomLinePlan[] = []
  let kr = 0
  // Trelast per kategori + pris-id (løpemeter)
  const lm = new Map<string, { kat: Materialkategori; mat: string; profil: string; kvalitet?: string; lm: number }>()
  for (const d of m.deler) {
    if (!d.tre) continue
    const key = `${d.kategori}|${d.mat}`
    const e = lm.get(key) ?? { kat: d.kategori, mat: d.mat, profil: d.profil, kvalitet: d.kvalitet, lm: 0 }
    e.lm += d.kappMm / 1000
    lm.set(key, e)
  }
  for (const e of [...lm.values()].sort((a, b) => KAT_REKKE.indexOf(a.kat) - KAT_REKKE.indexOf(b.kat))) {
    const antall = Math.round(e.lm * SVINN * 10) / 10
    const p = antall * pris(e.mat) * faktor
    kr += p
    linjer.push({ navn: `${prisNavn(e.mat)}${KAT_NAVN[e.kat] ? ` – ${KAT_NAVN[e.kat]}` : ''}`, spesifikasjon: `${e.profil}${e.kvalitet && e.kvalitet !== 'Kledningsbord' ? ` ${e.kvalitet}` : ''}`, antall, enhet: 'lm', kommentar: 'inkl. 10 % svinn', kategori: e.kat, kvalitet: e.kvalitet, prisId: e.mat, prisKr: Math.round(p) })
  }
  // Plater (m²)
  const m2 = new Map<string, { navn: string; kat: Materialkategori; m2: number }>()
  for (const d of m.deler) {
    if (d.m2 === undefined) continue
    const e = m2.get(d.mat) ?? { navn: d.navn, kat: d.kategori, m2: 0 }
    e.m2 += d.m2
    m2.set(d.mat, e)
  }
  for (const [mat, e] of m2) {
    const antall = Math.round(e.m2 * SVINN * 10) / 10
    const p = antall * pris(mat)
    kr += p
    linjer.push({ navn: e.navn, antall, enhet: 'm²', kommentar: 'inkl. svinn', kategori: e.kat, prisId: mat, prisKr: Math.round(p) })
  }
  // Stykk-varer
  const stk = new Map<string, { navn: string; kat: Materialkategori; n: number; spes?: string }>()
  for (const d of m.deler) {
    if (!d.stk || !d.mat) continue
    const e = stk.get(d.mat) ?? { navn: d.navn, kat: d.kategori, n: 0, spes: d.profil || undefined }
    e.n++
    stk.set(d.mat, e)
  }
  const leggStk = (mat: string, navn: string, n: number, kat: Materialkategori, spes?: string, kommentar?: string) => {
    if (n <= 0) return
    const p = n * pris(mat)
    kr += p
    linjer.push({ navn, spesifikasjon: spes, antall: n, enhet: 'stk', kategori: kat, prisId: mat, prisKr: Math.round(p), kommentar })
  }
  for (const [mat, e] of stk) {
    if (mat === 'pilarror') continue
    leggStk(mat, e.navn, e.n, e.kat, e.spes)
  }
  // Fundament
  const nPad = m.gulv.padX.length * m.gulv.padZ.length
  const r = m.gulv.dia / 2000
  const saale = /såle (\d+)/.exec(m.statikk.fundament.valgt.navn)
  const saaleM = saale ? Number(saale[1]) / 1000 : 0
  const volum = nPad * (Math.PI * r * r * (m.gulv.dybde + m.niva.fund / 1000) + saaleM * saaleM * 0.15)
  leggStk('pilarror', `Pilarrør Ø${m.gulv.dia}`, nPad, 'fundament', `${fmt(m.gulv.dybde + m.niva.fund / 1000 + 0.1, 1)} m lange${saale ? `, på såle ${saale[1]} × ${saale[1]} mm` : ''}`, 'Støpes til frostfri dybde')
  leggStk('betong-sekk', 'Ferdigbetong 25 kg', Math.ceil((volum * 1.1) / 0.0115), 'fundament', `${fmt(volum, 2)} m³`)
  leggStk('pukk', 'Pukk 0–32 under fundamentene', nPad * 2, 'fundament', '≈ 150 mm drenerende lag')
  leggStk('stolpefot', 'Forankring bjelkelag–fundament', nPad, 'beslag', 'vinkelbeslag + betongskrue')
  // Beslag
  const bjelker = m.deler.filter((d) => d.navn === 'Gulvbjelke').length
  leggStk('bjelkesko', 'Bjelkesko 48 mm', bjelker * 2, 'beslag', 'med kamspiker 4,0 × 40')
  const sperrer = m.deler.filter((d) => /^(Sperre|Skiftesperre|Valmsperre)$/.test(d.navn)).length
  const gratN = m.deler.filter((d) => d.navn === 'Gratsperre').length
  const sperreEnder = m.inn.taktype === 'pulttak' ? sperrer * 2 : sperrer
  leggStk('vinkelbeslag', 'Sperrebeslag (forankring sperre–toppsvill)', sperreEnder + gratN, 'beslag', 'ett per opplegg, mot vindsug')
  leggStk('vinkelbeslag', 'Vinkelbeslag hjørner/skillevegger', 8 + (m.inn.skillevegger?.length ?? 0) * 4, 'beslag')
  // Festemidler (veiledende mengde)
  const konstrLm = m.deler.filter((d) => d.tre && (d.kategori === 'konstruksjon' || d.kategori === 'tak' || d.kategori === 'bjelkelag')).reduce((s, d) => s + d.kappMm / 1000, 0)
  const kledLm = m.deler.filter((d) => d.tre && d.kategori === 'kledning').reduce((s, d) => s + d.kappMm / 1000, 0)
  const dekkeLm = m.deler.filter((d) => d.tre && d.kategori === 'dekke').reduce((s, d) => s + d.kappMm / 1000, 0)
  const skrueKonstr = Math.ceil((konstrLm * 3.5) / 50) * 50
  const skrueKled = Math.ceil((kledLm * 3.4) / 50) * 50
  const skrueDekke = Math.ceil((dekkeLm * (1000 / m.gulv.cc) * 2) / 50) * 50
  const leggSkrue = (navn: string, spes: string, n: number) => {
    const p = n * prisFor('skrue')
    kr += p
    linjer.push({ navn, spesifikasjon: spes, antall: n, enhet: 'stk', kategori: 'festemidler', prisId: 'skrue', prisKr: Math.round(p) })
  }
  leggSkrue('Konstruksjonsskruer', 'varmforsinket 5,0 × 90/100', skrueKonstr)
  leggSkrue('Kledningsskruer', 'rustfri A4, 4,2 × 55', skrueKled)
  leggSkrue('Terrasseskruer', 'rustfri A4, 4,2 × 56', skrueDekke)
  linjer.sort((a, b) => KAT_REKKE.indexOf(a.kategori ?? 'annet') - KAT_REKKE.indexOf(b.kategori ?? 'annet'))
  // Taktekking-kostnad er med i m²-postene over. Treslagfaktoren gjelder trelast.
  const estimatKr = Math.round(kr / 10) * 10
  const ks = kledSpec(m.inn.kledning, m.inn.spalte)
  const sammendrag = `${c.bredde} × ${c.dybde} cm · vegghøyde ${c.hoyde} cm · ${m.inn.taktype} ${fmtGrader(m.vinkel)} · ${ks.navn.toLowerCase()}`
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.dybde) / 10000, maal: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm`, arbeidstimer: ekstraTimer }
}

// ── Bounds (eksakt fra modellen) ───────────────────────────────────

export function grenser(m: Modell): Bounds {
  let mx = 0
  let mz = 0
  let my = 0
  for (const d of m.deler) {
    for (const p of punkter(d.geo)) {
      mx = Math.max(mx, Math.abs(p[0]))
      mz = Math.max(mz, Math.abs(p[2]))
      my = Math.max(my, p[1])
    }
  }
  return { x: (2 * mx) / 1000, y: my / 1000, z: (2 * mz) / 1000 }
}

// ── Beregningsgrunnlag + byggeregler ───────────────────────────────

export function byggesak(m: Modell) {
  return vurderByggesak({ tiltak: 'frittliggende', byaM2: m.byaM2, moneHoydeM: m.moneHoydeM, gesimsHoydeM: m.gesimsHoydeM })
}

export function byggeregler(m: Modell): Byggeregler {
  return tilByggeregler(byggesak(m))
}

export function beregningsgrunnlag(m: Modell, tittel: string): Beregningsgrunnlag {
  const s = m.statikk
  const deler: Record<string, Dimensjonering> = {
    Gulvbjelke: s.gulvbjelke,
    'Kantbjelke front/bak': s.kantbjelke,
    'Kantbjelke side': s.sidekant,
  }
  if (s.midtdrager) deler.Midtdrager = s.midtdrager
  deler.Sperre = s.sperre
  if (s.mDrager) deler['Drager under sperrene'] = s.mDrager
  if (s.grat) deler.Gratsperre = s.grat
  deler.Stender = s.stender
  // Overliggere: én rad per unik (profil, spenn, vegg) – største først.
  const sett = new Set<string>()
  for (const o of [...s.overliggere].sort((a, b) => b.dim.kontroll.maksUtnyttelse - a.dim.kontroll.maksUtnyttelse)) {
    const k = `${o.dim.valgt.profil}|${Math.round(o.spennMm / 10)}|${o.navn.replace(/ \d+ /, ' ')}`
    if (sett.has(k)) continue
    sett.add(k)
    deler[o.navn.charAt(0).toUpperCase() + o.navn.slice(1)] = o.dim
  }
  const rapport = lagBeregningsrapport({
    produkt: m.inn.produkt,
    tittel,
    forutsetninger: [
      { navn: 'Takvinkel', verdi: fmt(m.vinkel, 1), enhet: '°' },
      { navn: 'Taktekking', verdi: m.inn.takpapp ? 'Takpapp på 18 mm kryssfiner' : '18 mm kryssfiner (uten tekking)' },
      { navn: 'Sperrer c/c', verdi: '≤ 600', enhet: 'mm' },
      { navn: 'Gulvbjelker c/c', verdi: m.gulv.cc, enhet: 'mm' },
      { navn: 'Nyttelast gulv', verdi: m.inn.lagerKN ? `bod 3,0 kN/m² / ved ${fmt(m.inn.lagerKN, 1)} kN/m² (ikke samtidig)` : 'bod 3,0 kN/m²', kilde: 'NS-EN 1991-1-1 (valgt)' },
      { navn: 'Tjenesteklasse', verdi: '2 (overdekket, uoppvarmet)', kilde: 'NS-EN 1995-1-1' },
      { navn: 'Grunnforhold', verdi: GRUNN[grunnForConfig(m.inn.config)].navn, kilde: grunnForConfig(m.inn.config) === 'ukjent' ? 'Ikke oppgitt – konservativ antakelse (Byggested)' : 'Valgt i Byggested – kontroller på tomta', usikker: true },
      { navn: 'Frostsone', verdi: FROSTSONER[frostsoneForConfig(m.inn.config).sone].navn, kilde: frostsoneForConfig(m.inn.config).merknad, usikker: true },
    ],
    snolast: { mark: s.sk, tak: s.snoTak },
    vind: s.vind,
    deler,
    frost: s.frost,
    fundament: s.fundament,
    byggesak: byggesak(m),
    merknader: [
      ...s.merknader,
      'Stenderverket er avstivet av kledningen og losholter c/c 600. Hjørnene får vinkelbeslag; dobbel toppsvill skjøtes forskjøvet.',
      'Sperrer forankres med sperrebeslag i hvert opplegg (vindsug). Bjelkelaget festes til hvert fundament med vinkelbeslag og betongskrue.',
    ],
    ekstraAdvarsler: m.advarsler,
  })
  return tilPlanVedlegg(rapport)
}

/** Kontrolltabell til UI (Statikk-panelet) – kortversjon. */
export function kontroller(m: Modell): BeregningKontroll[] {
  return beregningsgrunnlag(m, '').kontroller
}

// ── Tegninger (projisert fra modellen) ─────────────────────────────

type Vis = 'plan' | 'front' | 'bak' | 'venstre' | 'hoyre'
const proj = (v: Vis, p: V3): [number, number, number] => {
  switch (v) {
    case 'plan': return [p[0], p[2], p[1]]
    case 'front': return [p[0], -p[1], p[2]]
    case 'bak': return [-p[0], -p[1], -p[2]]
    case 'venstre': return [p[2], -p[1], -p[0]]
    case 'hoyre': return [-p[2], -p[1], p[0]]
  }
}

interface RissBygg {
  former: Form2DPlan[]
  pts: P2[]
}

function tegnDeler(deler: Del[], v: Vis, opts: { fyll?: (d: Del) => Form2DPlan['fyll'] | undefined; tynn?: (d: Del) => boolean } = {}): RissBygg {
  const former: Form2DPlan[] = []
  const pts: P2[] = []
  // malerens algoritme: fjernest først
  const sortert = deler
    .map((d) => {
      const pp = punkter(d.geo).map((p) => proj(v, p))
      return { d, pp, dyp: Math.max(...pp.map((p) => p[2])) }
    })
    .sort((a, b) => a.dyp - b.dyp)
  for (const { d, pp } of sortert) {
    const sk = konvekstSkall(pp.map((p) => [p[0] / 10, p[1] / 10] as P2))
    if (sk.length < 3) continue
    former.push({ type: 'poly', points: [...sk, sk[0]], tynn: opts.tynn?.(d) ?? true, fyll: opts.fyll?.(d) })
    pts.push(...sk)
  }
  return { former, pts }
}

function normaliser(r: RissBygg, ekstra: P2[] = []): { dx: number; dy: number; w: number; h: number } {
  const all = [...r.pts, ...ekstra]
  const minX = Math.min(...all.map((p) => p[0]))
  const minY = Math.min(...all.map((p) => p[1]))
  const maxX = Math.max(...all.map((p) => p[0]))
  const maxY = Math.max(...all.map((p) => p[1]))
  return { dx: -minX, dy: -minY, w: maxX - minX, h: maxY - minY }
}

const flytt = (f: Form2DPlan, dx: number, dy: number): Form2DPlan => {
  if (f.type === 'rect') return { ...f, x: (f.x ?? 0) + dx, y: (f.y ?? 0) + dy }
  return { ...f, points: f.points?.map(([x, y]) => [x + dx, y + dy] as [number, number]) }
}

const cmT = (mm: number) => `${fmt(mm / 10, mm % 10 === 0 ? 0 : 1)} cm`

/** Takets omriss i plan (stiplet) – så planene viser utstikket. */
function takOmriss(m: Modell): RissBygg {
  const pts: P2[] = []
  for (const d of m.deler) if (d.gruppe === 'tekking') for (const p of punkter(d.geo)) pts.push([p[0] / 10, p[2] / 10])
  const sk = konvekstSkall(pts)
  return { former: sk.length > 2 ? [{ type: 'poly', points: [...sk, sk[0]], dashed: true, tynn: true }] : [], pts: sk }
}
const slaSammen = (a: RissBygg, b: RissBygg): RissBygg => ({ former: [...b.former, ...a.former], pts: [...a.pts, ...b.pts] })

export function tegninger(m: Modell): Tegning2D {
  const { B, D } = m.inn
  const riss: Riss2DPlan[] = []
  const n = m.niva

  // 1) Fundament og bjelkelag (plan)
  {
    const del = m.deler.filter((d) => d.gruppe === 'bjelkelag' || d.gruppe === 'fundament')
    const r = slaSammen(tegnDeler(del, 'plan', { fyll: (d) => (d.gruppe === 'fundament' ? 'betong' : undefined), tynn: (d) => d.navn === 'Gulvbjelke' }), takOmriss(m))
    const nm = normaliser(r)
    const X = (x: number) => x / 10 + nm.dx
    const Y = (z: number) => z / 10 + nm.dy
    const maal = [
      { x1: X(-B / 2), y1: Y(D / 2), x2: X(B / 2), y2: Y(D / 2), label: cmT(B), offset: 34 },
      { x1: X(-B / 2), y1: Y(-D / 2), x2: X(-B / 2), y2: Y(D / 2), label: cmT(D), offset: -30 },
    ]
    const px = m.gulv.padX
    for (let i = 0; i < px.length - 1; i++) maal.push({ x1: X(px[i]), y1: Y(-D / 2), x2: X(px[i + 1]), y2: Y(-D / 2), label: cmT(Math.round(px[i + 1] - px[i])), offset: -18 })
    const pz = [...m.gulv.padZ].sort((a, b) => a - b)
    for (let i = 0; i < pz.length - 1; i++) maal.push({ x1: X(B / 2), y1: Y(pz[i]), x2: X(B / 2), y2: Y(pz[i + 1]), label: cmT(Math.round(pz[i + 1] - pz[i])), offset: 18 })
    riss.push({
      id: 'fundament',
      navn: 'Fundament og bjelkelag (plan)',
      type: 'plan',
      bredde: nm.w,
      hoyde: nm.h,
      former: r.former.map((f) => flytt(f, nm.dx, nm.dy)),
      maal,
      tekster: [
        { x: X(0), y: Y(0), tekst: `gulvbjelker 48×${m.gulv.hJ} c/c ${m.gulv.cc}` },
        { x: X(px[0]), y: Y(-D / 2) + 22, tekst: `pilarrør Ø${m.gulv.dia}` },
      ],
      paaskrifter: [{ x: X(B / 2) + 8, y: Y(D / 2) + 14, tekst: 'FRONT' }],
    })
  }
  // 2) Veggplan – horisontalsnitt 1 m over gulv
  {
    const yc = n.dekke + 1000
    const del = m.deler.filter((d) => (d.gruppe === 'vegg' || d.gruppe === 'skillevegg' || d.gruppe === 'kledning' || d.gruppe === 'dor') && Math.min(...punkter(d.geo).map((p) => p[1])) <= yc && Math.max(...punkter(d.geo).map((p) => p[1])) >= yc)
    const r = slaSammen(tegnDeler(del, 'plan', { fyll: (d) => (d.gruppe === 'vegg' || d.gruppe === 'skillevegg' ? 'tre' : undefined), tynn: (d) => d.gruppe === 'kledning' }), takOmriss(m))
    const nm = normaliser(r)
    const X = (x: number) => x / 10 + nm.dx
    const Y = (z: number) => z / 10 + nm.dy
    const maal = [
      { x1: X(-B / 2), y1: Y(D / 2), x2: X(B / 2), y2: Y(D / 2), label: cmT(B), offset: 30 },
      { x1: X(-B / 2), y1: Y(-D / 2), x2: X(-B / 2), y2: Y(D / 2), label: cmT(D), offset: -28 },
    ]
    riss.push({ id: 'veggplan', navn: 'Plan – stenderverk (snitt 1 m over gulv)', type: 'plan', bredde: nm.w, hoyde: nm.h, former: r.former.map((f) => flytt(f, nm.dx, nm.dy)), maal, tekster: [{ x: X(0), y: Y(0), tekst: `stendere 48×98 c/c ≤ 600` }] })
  }
  // 3) Fasader
  const fasade = (v: Vis, navn: string) => {
    const nrm: Record<string, (p: V3) => number> = { front: (p) => p[2], bak: (p) => -p[2], venstre: (p) => -p[0], hoyre: (p) => p[0] }
    const plan = v === 'front' || v === 'bak' ? D / 2 : B / 2
    const del = m.deler.filter((d) => {
      if (d.gruppe === 'tekking' || d.part === 'fundament' || /Lufterør|Ventilasjonshatt/.test(d.navn)) return true
      if (d.gruppe === 'kledning') return Math.max(...punkter(d.geo).map(nrm[v])) >= plan - 1
      if (d.gruppe === 'dor') return Math.min(...punkter(d.geo).map(nrm[v])) >= plan - 1
      return false
    })
    const r = tegnDeler(del, v, { fyll: (d) => (d.part === 'beslag' ? 'tett' : undefined), tynn: (d) => d.gruppe !== 'tekking' })
    const nm = normaliser(r)
    const bred = v === 'front' || v === 'bak' ? B : D
    const X = (x: number) => x / 10 + nm.dx
    const Yh = (y: number) => -y / 10 + nm.dy
    const maal = [
      { x1: X(-bred / 2), y1: Yh(0), x2: X(bred / 2), y2: Yh(0), label: `${cmT(bred)} (bjelkelag)`, offset: 26 },
      { x1: X(-bred / 2) - 10, y1: Yh(0), x2: X(-bred / 2) - 10, y2: Yh(n.plate), label: `${cmT(n.plate)}`, offset: -24 },
      { x1: X(bred / 2) + 10, y1: Yh(0), x2: X(bred / 2) + 10, y2: Yh(n.mone), label: `${cmT(Math.round(n.mone))}`, offset: 26 },
    ]
    const tekster = [{ x: X(0), y: Yh(n.mone) - 12, tekst: m.inn.taktype === 'valmtak' ? `takvinkel ${fmtGrader(m.vinkel)}, grat ${fmtGrader(m.beta ?? 0)}` : `takvinkel ${fmtGrader(m.vinkel)}` }]
    for (const o of m.apninger) {
      if (o.side !== v) continue
      tekster.push({ x: X(0), y: Yh((o.bunnAbs + o.toppAbs) / 2), tekst: `${o.navn}: ${cmT(Math.round(o.x1 - o.x0))} × ${cmT(Math.round(o.toppAbs - o.bunnAbs))}` })
    }
    const former: Form2DPlan[] = [{ type: 'line', points: [[X(-bred / 2) - 40, Yh(0)], [X(bred / 2) + 40, Yh(0)]] }, ...r.former.map((f) => flytt(f, nm.dx, nm.dy))]
    riss.push({ id: `fasade-${v}`, navn: navn, type: 'fasade', bredde: Math.max(nm.w, (X(bred / 2) + 40)), hoyde: nm.h, former, maal, tekster })
  }
  fasade('front', 'Fasade front')
  fasade(m.ramme.uAx[0] !== 0 ? 'bak' : 'venstre', m.ramme.uAx[0] !== 0 ? 'Fasade bak' : 'Fasade venstre side')
  fasade(m.ramme.uAx[0] !== 0 ? 'venstre' : 'hoyre', m.ramme.uAx[0] !== 0 ? 'Fasade venstre side' : 'Fasade høyre side')
  // 4) Snitt A–A gjennom en sperre (i fallretningen)
  {
    const { L, M, O, uAx, vAx } = m.ramme
    const vs = m.inn.taktype === 'valmtak' ? 0 + (M - L >= 96 ? Math.min(M / 2 - L / 2 - 24, 300) * 0 : 0) : m.sperreV[Math.min(1, m.sperreV.length - 1)]
    const tilR = (p: V3): V3 => {
      const x = p[0] - O[0]
      const z = p[2] - O[1]
      return [x * uAx[0] + z * uAx[1], p[1], x * vAx[0] + z * vAx[1]]
    }
    const former: Form2DPlan[] = []
    const pts: P2[] = []
    const kand = m.deler
      .filter((d) => d.geo.type === 'prisme' && d.gruppe !== 'utstyr' && d.part !== 'bins')
      .map((d) => {
        const g = d.geo as Extract<Del['geo'], { type: 'prisme' }>
        const ra = g.a.map(tilR)
        const rb = g.b.map(tilR)
        const vmin = Math.min(...ra.map((p) => p[2]), ...rb.map((p) => p[2]))
        const vmax = Math.max(...ra.map((p) => p[2]), ...rb.map((p) => p[2]))
        return { d, ra, rb, vmin, vmax }
      })
      .filter((k) => k.vmin <= vs + 0.5 && k.vmax >= vs - 0.5)
    for (const k of kand) {
      const ext: V3 = [k.rb[0][0] - k.ra[0][0], k.rb[0][1] - k.ra[0][1], k.rb[0][2] - k.ra[0][2]]
      const el = Math.hypot(...ext) || 1
      const iPlan = Math.abs(ext[2]) / el > 0.9
      let poly: P2[]
      if (iPlan) {
        const g = k.d.geo as Extract<Del['geo'], { type: 'prisme' }>
        poly = k.ra.slice(0, g.ytre).map((p) => [p[0] / 10, -p[1] / 10] as P2)
      } else poly = konvekstSkall([...k.ra, ...k.rb].map((p) => [p[0] / 10, -p[1] / 10] as P2))
      if (poly.length < 3) continue
      const snittet = !iPlan || /Sperre|Skiftesperre|Valmsperre/.test(k.d.navn)
      former.push({ type: 'poly', points: [...poly, poly[0]], snittet, fyll: snittet && k.d.tre ? 'tre' : k.d.mat === 'kryssfiner-18' ? 'tre' : undefined, tynn: !snittet })
      pts.push(...poly)
    }
    // Lufterør o.l. over taket vises i sidesnitt (ikke snittet).
    for (const d of m.deler.filter((x) => /Lufterør|Ventilasjonshatt/.test(x.navn))) {
      const pp = punkter(d.geo).map(tilR)
      const poly = konvekstSkall(pp.map((p) => [p[0] / 10, -p[1] / 10] as P2))
      if (poly.length > 2) {
        former.push({ type: 'poly', points: [...poly, poly[0]], tynn: true, dashed: true })
        pts.push(...poly)
      }
    }
    const minX = Math.min(...pts.map((p) => p[0]), -20)
    const minY = Math.min(...pts.map((p) => p[1]))
    const maxX = Math.max(...pts.map((p) => p[0]))
    const dx = -minX + 30
    const dy = -minY
    const X = (u: number) => u / 10 + dx
    const Yh = (y: number) => -y / 10 + dy
    const maal = [
      { x1: X(0), y1: Yh(0), x2: X(L), y2: Yh(0), label: cmT(L), offset: 24 },
      { x1: X(-m.ohU), y1: Yh(n.plate), x2: X(0), y2: Yh(n.plate), label: cmT(Math.round(m.ohU)), offset: -14 },
      { x1: X(0) - 20, y1: Yh(n.dekke), x2: X(0) - 20, y2: Yh(n.plate), label: `vegg ${cmT(m.inn.H)}`, offset: -16 },
      { x1: X(L) + 20, y1: Yh(0), x2: X(L) + 20, y2: Yh(n.mone), label: `${cmT(Math.round(n.mone))}`, offset: 20 },
    ]
    if (m.inn.taktype === 'pulttak') maal.push({ x1: X(L) + 6, y1: Yh(n.plate), x2: X(L) + 6, y2: Yh(n.plateHoy), label: `+${Math.round(n.plateHoy - n.plate)} mm`, offset: 10 })
    const fm = m.sg.fuglemunn
    riss.push({
      id: 'snitt',
      navn: 'Snitt A–A (gjennom sperre)',
      type: 'snitt',
      bredde: maxX + dx + 40,
      hoyde: dy,
      former: [{ type: 'line', points: [[X(-m.ohU) - 40, Yh(0)], [X(L + m.ohU) + 40, Yh(0)]] }, ...former.map((f) => flytt(f, dx, dy))],
      maal,
      tekster: [
        { x: X(L / 2), y: Yh(n.mone) - 14, tekst: `sperre 48×${m.statikk.sperre.valgt.h}, ${fmtGrader(m.vinkel)}` },
        { x: X(L / 2), y: Yh(n.plate) + 26, tekst: `fuglemunn: sete ${Math.round(fm.seteMm)} mm, hæl ${Math.round(fm.haelMm)} mm` },
      ],
    })
  }
  // 5) Takplan – sperrer
  {
    const del = m.deler.filter((d) => d.gruppe === 'tak')
    const r = slaSammen(tegnDeler(del, 'plan', { tynn: (d) => !/Grat|Møne|Toppkloss/.test(d.navn) }), takOmriss(m))
    const nm = normaliser(r)
    const X = (x: number) => x / 10 + nm.dx
    const Y = (z: number) => z / 10 + nm.dy
    const tekst = m.inn.taktype === 'valmtak' ? `gratsperrer 48×${m.hg}${(m.tg ?? 48) > 48 ? ' (doble)' : ''}, ${fmtGrader(m.beta ?? 0)}; skiftesperrer c/c ≤ 600` : `sperrer 48×${m.statikk.sperre.valgt.h} c/c ≤ 600`
    riss.push({ id: 'takplan', navn: 'Takplan – sperrer (sett ovenfra)', type: 'plan', bredde: nm.w, hoyde: nm.h, former: r.former.map((f) => flytt(f, nm.dx, nm.dy)), maal: [{ x1: X(-B / 2), y1: Y(D / 2), x2: X(B / 2), y2: Y(D / 2), label: cmT(B), offset: 24 }], tekster: [{ x: X(0), y: Y(0), tekst }] })
  }
  return { riss }
}

// ── Montering ──────────────────────────────────────────────────────

export function monteringPlan(m: Modell, produkt: string, ekstra: MonteringSteg[] = []): MonteringSteg[] {
  const { B, D, H } = m.inn
  const s = m.statikk
  const diag = Math.round(Math.hypot(B, D))
  const ks = kledSpec(m.inn.kledning, m.inn.spalte)
  const gs = gulvSpec(m.inn.gulvbord)
  const fm = m.sg.fuglemunn
  const nPad = m.gulv.padX.length * m.gulv.padZ.length
  const ap = m.apninger
  const steg: MonteringSteg[] = []
  steg.push({
    trinn: 'fundament',
    tittel: 'Sett ut og støp fundamentene',
    tekst: `Sett ut bjelkelagets yttermål ${B} × ${D} mm med snor og kontroller at diagonalene er like (${diag} mm). Fundamentene står med senter ${Math.round(m.gulv.padX[0] + B / 2)} mm inn fra ytterkant (rett under kantbjelkene): ${nPad} stk ${s.fundament.valgt.navn} i ${m.gulv.padZ.length} rader (c/c ${Math.round(m.gulv.padX[1] - m.gulv.padX[0])} mm langs bredden). Grav til frostfri dybde ${fmt(m.gulv.dybde, 1)} m, legg 150 mm komprimert pukk, still pilarrørene i lodd og støp. Alle topper i samme høyde, ${m.niva.fund} mm over ferdig terreng – bruk laser/slangevater.`,
    verktoy: ['snor og målebånd', 'spade/minigraver', 'laser eller slangevater', 'betongblander'],
    tidTimer: 3 + nPad * 0.6,
    advarsel: 'Står bygget på telefarlig grunn uten frostsikring, vil det løfte seg om vinteren. Ved fjell: bolt fundamentet til fjellet.',
  })
  steg.push({
    trinn: 'bjelkelag',
    tittel: 'Bygg bjelkelaget',
    tekst: `Kapp kantbjelker 48 × ${m.gulv.hK} mm og gulvbjelker 48 × ${m.gulv.hJ} mm etter kapplista. Front/bak går hele bredden ${B} mm; sidene ligger mellom. ${m.gulv.midt ? `Midtdrager legges over den midtre fundamentrekka. ` : ''}Gulvbjelkene henges i bjelkesko med c/c ${m.gulv.cc} mm (mål fra venstre kant). Kontroller diagonalene (${diag} mm) før alt skrus fast, og fest bjelkelaget til hvert fundament med vinkelbeslag og betongskrue.`,
    verktoy: ['kapp-/sirkelsag', 'skrutrekker', 'vinkel', 'vater'],
    tidTimer: 2 + (B * D) / 1e6 * 0.4,
  })
  steg.push({
    trinn: 'bjelkelag',
    tittel: 'Legg gulvet',
    tekst: `Legg gulvbord ${gs.profil} på tvers av bjelkene med ${m.inn.dekkeSprekk} mm luft (lufting og drenering). Start ved fronten, skru 2 rustfrie skruer i hver bjelke, og ripp siste bord ved bakkant. Bordene går helt ut til ytterkant av bjelkelaget – veggene står oppå.`,
    tidTimer: (B * D) / 1e6 * 0.6,
  })
  const veggTekst = [
    `Bygg veggene liggende på gulvet: bunnsvill og nedre toppsvill 48 × 98 legges side om side og stendere merkes av c/c ≤ 600 – rett under hver sperre der taket skal ligge. Vegghøyden (overkant toppsvill) er ${H} mm over gulvet${m.inn.taktype === 'pulttak' ? `; den høye veggen er ${Math.round(H + (m.sg.ovreSvillHoydeMm ?? 0))} mm (+${Math.round(m.sg.ovreSvillHoydeMm ?? 0)} mm, nøyaktig så sperrene får ${fmtGrader(m.vinkel)} fall)` : ''}.`,
    'Hjørnene bygges som L med én endestender i hver vegg. Losholter (spikerslag for kledningen) felles inn mellom stenderne c/c 600 i høyden.',
  ]
  if (ap.length) {
    const o = ap[0]
    veggTekst.push(`Åpninger: hver åpning får bærestender i begge sider, gjennomgående karmstender utenfor, og dobbel overligger ${o.dim.valgt.profil} på høykant (${ap.map((x) => `${x.navn.toLowerCase()} ${Math.round(x.x1 - x.x0)} × ${Math.round(x.toppAbs - x.bunnAbs)} mm`).join(', ')}). Kortstendere over overliggeren opp til toppsvillen.`)
  }
  veggTekst.push(`Reis veggene, lodd dem og stag midlertidig. Skru bunnsvillen ned i bjelkelaget. Legg øvre toppsvill${m.inn.taktype === 'valmtak' ? ' omlagt i hjørnene' : ' forskjøvet over skjøtene'} så veggene bindes sammen.`)
  steg.push({ trinn: 'reisverk', tittel: 'Reis stenderverket', tekst: veggTekst.join(' '), verktoy: ['sag', 'spikerpistol/skrutrekker', 'lodd/vater', 'tvinger'], tidTimer: 4 + (B + D) / 1000 })
  if (m.inn.skillevegger?.length) steg.push({ trinn: 'reisverk', tittel: 'Skillevegger', tekst: `Sett opp ${m.inn.skillevegger.length} skillevegg(er) mellom bakveggen og frontveggen (svill, toppsvill, stendere c/c 600 og losholter). De skrus i den ekstra stenderen i front- og bakveggen.`, tidTimer: m.inn.skillevegger.length * 1.5 })
  const sperreH = s.sperre.valgt.h
  const takTekst: string[] = []
  takTekst.push(`Lag én malsperre 48 × ${sperreH} mm og prøv den på plass før du kapper resten: fuglemunn med sete ${Math.round(fm.seteMm)} mm og hæl ${Math.round(fm.haelMm)} mm (dybde ${Math.round(fm.dybdeMm)} mm ≤ h/3). Loddkutt ${fmtGrader(m.vinkel)} fra vinkelrett (${fmtGrader(90 - m.vinkel)} mot sperrekanten); setekuttet er ${fmtGrader(90 - m.vinkel)}. Sperrene settes c/c ≤ 600 rett over stenderne og forankres med sperrebeslag.`)
  if (m.inn.taktype === 'pulttak') takTekst.push(`Pulttak: sperrene har fuglemunn på begge veggene og stikker ${Math.round(m.ohU)} mm ut (fra ytterkant stenderverk) i begge ender.`)
  if (m.inn.taktype === 'saltak') takTekst.push(`Saltak: monter mønebord 48 × ${m.hb} på mønestenderne i gavlene, sett sperreparene mot mønebordet og spikre sperrebind (bindbjelke) til hvert sperrepar på toppsvillnivå før sutaket legges.`)
  if (m.inn.taktype === 'valmtak' && m.valm) {
    takTekst.push(`Valmtak: ${m.deler.some((d) => d.navn === 'Toppkloss') ? 'sett toppklossen' : 'monter mønebordet på de vanlige sperreparene'}, deretter valmsperrene midt på endeveggene. Gratsperrene (48 × ${m.hg}${(m.tg ?? 48) > 48 ? ', doble' : ''}) har ${fmtGrader(m.beta ?? 0)} helning, senkes ${Math.round(m.valm.senkingMm * ((m.tg ?? 48) / 48))} mm og kinnkuttes mot mønet (skråsnitt 45°). Skiftesperrene c/c 600 får loddkutt ${fmtGrader(m.vinkel)} + kinnkutt mot grata (gjæring ${fmtGrader(m.vinkel)}, skråsnitt 45°); hver neste skiftesperre er ${Math.round(m.valm.skiftesperreTrinnMm)} mm lengre langs sperra.`)
  }
  if (m.inn.taktype !== 'valmtak') takTekst.push(`Gavlutstikk: bygg gavlstige av stikkere 48 × 98 c/c ≤ 600 mellom ytterste sperre og gavlsperra (${Math.round(m.gOh)} mm ut fra stenderverket).`)
  steg.push({ trinn: 'tak', tittel: 'Sperrer og takkonstruksjon', tekst: takTekst.join(' '), verktoy: ['kappsag med gjæring/skråsnitt', 'stikksag/håndsag', 'vinkelhake (sperrevinkel)'], tidTimer: 4 + m.deler.filter((d) => d.gruppe === 'tak').length * 0.25, advarsel: 'Arbeid i høyden: bruk stødig stillas/stige og ha en medhjelper når sperrene løftes på plass.' })
  steg.push({
    trinn: 'tak',
    tittel: 'Vannbord, vindski, sutak og takpapp',
    tekst: `Spikre vannbord 19 × ${m.hv} på sperreendene${m.inn.taktype === 'valmtak' ? ' (gjæret 45° i hjørnene)' : ` og vindski 19 × ${m.hvv} langs gavlsperrene`}. Legg 18 mm kryssfiner med skjøter på sperrene, skru c/c 150 i kant og 300 i felt. ${m.inn.takpapp ? 'Rull ut underlagspapp og overlagspapp med 100 mm omlegg, brett over vannbord/vindski og spikre med takpappspiker. Legg ekstra strimmel over møne/grater.' : 'Kryssfineren MÅ tekkes (takpapp, shingel e.l.) før høsten – ubeskyttet kryssfiner tåler ikke vær.'}`,
    tidTimer: 2 + m.takArealM2 * 0.5,
  })
  steg.push({
    trinn: 'kledning',
    tittel: 'Kledning',
    tekst: `${ks.navn}. Start i et hjørne og la bordene på front/bak dekke endeveden på sideveggene. Underkant ${m.niva.fund - m.niva.kledBunn} mm under bjelkelaget (dryppkant), minst ${m.niva.kledBunn} mm over terreng. Bordene skrus i bunnsvill/kantbjelke, losholter og toppsvill. På gavlene kappes toppen til takfallet ${fmtGrader(m.vinkel)} – hold 8–10 mm klaring opp mot sutaket.${m.inn.lufting ? ' Stift insektnett i sperrefeltene over kledningen (lufting av taket og rommet).' : ''} Gerikt 19 × 98 rundt åpningene.`,
    tidTimer: m.deler.filter((d) => d.gruppe === 'kledning').length * 0.08,
  })
  if (ap.some((o) => o.blad)) steg.push({ trinn: 'kledning', tittel: 'Dører og luker', tekst: `Bygg bladene liggende: bord på to-tre tverrtre 48 × 98 og skråbånd som går fra hengselsiden nede til låssiden oppe (Z-dør – hindrer at døra henger). Bladet er 10 mm smalere enn åpningen. Heng opp med T-hengsler og monter vrider/hasp.`, tidTimer: ap.filter((o) => o.blad).length * 1.5 })
  steg.push(...ekstra)
  steg.push({ trinn: 'ferdig', tittel: 'Overflate og kontroll', tekst: `Beis/mal alt utvendig trevirke (endeved ekstra), helst før montering. Kontroller at alle sperrebeslag og forankringer sitter, og at terrenget har fall bort fra bygget. Planen: ${produkt}.`, tidTimer: 2 + m.deler.filter((d) => d.gruppe === 'kledning').length * 0.02 })
  return steg
}

export function monteringTekst(steg: MonteringSteg[]): string[] {
  return steg.map((s, i) => `${i + 1}. ${s.tittel}: ${s.tekst}`)
}

export function felleRaad(m: Modell): string[] {
  const s = m.statikk
  const r = [
    `Snølast: planen er dimensjonert for sk = ${fmt(s.sk.sk, 1)} kN/m² på mark (${s.sk.kilde}). Velg kommune og høyde over havet i «Byggested» for riktig verdi.`,
    `Alt bærende virke er C24 (stempel på virket). Bruk impregnert virke (NTR AB) i bjelkelaget og der virket er nær bakken.`,
    'Sperrebeslag i hver sperre og vinkelbeslag/betongskrue i hvert fundament – lette uthus løftes lett av vindsug.',
    'Skru kledningen med rustfrie A4-skruer, 2 per bord per spikerslag; ikke skru i spalten mellom bordene.',
    `Hold underkant kledning minst ${m.niva.kledBunn} mm over terreng og legg pukk/singel under og rundt bygget så regnsprut ikke treffer veggen.`,
    'Takpapp: legg med fall mot takfoten, 100 mm omlegg og ekstra strimmel over møne/grater. Vurder takrenne mot gangvei.',
  ]
  if (m.advarsler.length) r.unshift(...m.advarsler.map((a) => `OBS: ${a}`))
  return r
}
