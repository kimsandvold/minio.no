/**
 * Byggeplanen side for side – komponert på en `Dok` (PDF eller SVG).
 *
 *   1  Forside – 3D, nøkkeltall, plan-ID, tiltakshaver
 *   2  Prosjektinformasjon + tegningsliste
 *   –  Tegningsark A4 liggende med tegningshode (A = form/fasader fra
 *      templatet, K = konstruksjon fra 3D-modellen, D = detaljer)
 *   3  Materialliste gruppert med kvalitet og pris
 *   4  Kappliste med kappvinkler, kappskisser og kappeplan (innkjøpslengder)
 *   5  Montering trinn for trinn med illustrasjoner, verktøy, tid og HMS
 *   6  Konstruksjonsgrunnlag (beregningsvedlegg når kjernen leverer det)
 *   7  Råd om utførelse og vedlikehold
 */
import type { Bom, Byggeregler, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from './types'
import type { Beregningsgrunnlag, BomLinePlan, KapplisteDelPlan, Materialkategori, MonteringSteg } from './plan-typer'
import { brytTekst, type Dok, type Flate, type TekstStil } from './plan-flate'
import { FARGE, mm, rissTilTegning, tegnTegning, tegningStorrelse, velgMalestokk, type Tegning } from './plan-tegning'
import { byggModellTegninger, ccAvstand, delOmriss, type Del3D } from './plan-modell'
import { takvinkelFraModell, velgDetaljer } from './plan-detaljer'
import { lagKappeplan, normalProfil } from './plan-kapp'
import { TRINN, TRINN_NAVN } from './byggetrinn'
import { PRISER, prisFor } from './priser'
import { TRESLAG } from './materials'

// ── Inndata ─────────────────────────────────────────────────────────────

export interface PlanInn {
  template: ProductTemplate
  config: DesignConfig
  bom: Bom
  tittel: string
  kunde?: string
  planId: string
  revisjon: string
  dato: string
  deler: Array<KapplisteDel | KapplisteDelPlan>
  montering: string[]
  monteringPlan?: MonteringSteg[]
  raad: string[]
  byggeregler?: Byggeregler
  beregning?: Beregningsgrunnlag
  /** Templatets riss (søknadssett foretrekkes, ellers arbeidsrisset). */
  tegning?: Tegning2D
  /** 3D-modellen lest av `lesModell()`. */
  modell: Del3D[]
  bilder: {
    forside?: string
    splitt?: string
    /** Illustrasjon etter hvert byggetrinn (indeks i TRINN). */
    trinn?: Array<{ trinn: number; bilde: string }>
    logo?: string
    /** Logoens bredde/høyde-forhold. */
    logoForhold?: number
  }
  /** «Etikett: verdi»-linjer med alle valg (konfigTekst). */
  konfig: string[]
  arbeidstimer?: number
  /** Skjul tall (forhåndsvisning før kjøp). */
  laast?: boolean
}

// ── Konstanter og stil ──────────────────────────────────────────────────

const C = {
  tekst: '#1b1d21',
  dempet: '#5f6670',
  svak: '#8b929b',
  linje: '#d9dce1',
  lys: '#f3f4f6',
  aksent: '#3d4ba8',
  aksentLys: '#eceefb',
  tre: '#b48a58',
  ok: '#2f7d4f',
  adv: '#a8670f',
  feil: '#b23b32',
}
const SL = 18 // venstre marg (stående)
const SR = 15
const TOPP = 24
const BUNN = 280
const BREDDE = 210 - SL - SR

const kr = (n: number) => `${Math.round(n).toLocaleString('nb-NO').replace(/\u00a0/g, ' ')} kr`
const desimal = (v: number, d = 1) => v.toFixed(d).replace('.', ',')
const grader = (v: number) => `${desimal(v, 1)}°`

// ── Merker (posisjoner) ─────────────────────────────────────────────────

export interface PosRad {
  merke: string
  navn: string
  profil: string
  kvalitet: string
  lengdeMm: number
  antall: number
  vinkel: string
  merknad: string
  cc?: number
  omriss?: Array<[number, number]> | null
}

const forsteOrd = (s: string) => s.toLowerCase().replace(/[^a-zæøå0-9 ]/g, ' ').trim().split(/\s+/)[0] ?? ''

/**
 * Kobler 3D-deler til kappliste-rader. Eksakt nøkkel (navn|profil|lengde)
 * først; ellers samme profil, lengde innen ±3 cm og samme hovedord i navnet
 * («Stolpe venstre» ↔ «Stolpe (lav side)»).
 */
function kobleModell(deler: Array<KapplisteDel | KapplisteDelPlan>, modell: Del3D[]): Map<Del3D, number> {
  const eksakt = new Map<string, number>()
  deler.forEach((d, i) => eksakt.set(`${d.navn}|${d.profil}|${d.lengdeCm}`, i))
  const ut = new Map<Del3D, number>()
  for (const m of modell) {
    const e = eksakt.get(m.nokkel)
    if (e !== undefined) { ut.set(m, e); continue }
    if (!m.tre) continue
    const mp = normalProfil(m.profil)
    const mL = (m.lengdeMm ?? m.lengdeCm * 10) / 10
    let best: { i: number; score: number } | null = null
    deler.forEach((d, i) => {
      if (normalProfil(d.profil) !== mp) return
      const diff = Math.min(Math.abs(d.lengdeCm - m.lengdeCm), Math.abs(d.lengdeCm - mL))
      if (diff > 3) return
      const navnLik = forsteOrd(d.navn) === forsteOrd(m.navn) ? 0 : 5
      const score = diff + navnLik
      if (score <= 5 && (!best || score < best.score)) best = { i, score }
    })
    const b = best as { i: number } | null
    if (b) ut.set(m, b.i)
  }
  return ut
}

/** Kapplista beriket med presise lengder og kappvinkler fra 3D-modellen. */
export function byggPosisjoner(inn: Pick<PlanInn, 'deler' | 'modell' | 'config'>): { rader: PosRad[]; merkeFor: (d: Del3D) => string | undefined } {
  const tre = String(inn.config.treslag ?? '')
  const cc = ccAvstand(inn.modell)
  const kobling = kobleModell(inn.deler, inn.modell)
  const rader: PosRad[] = inn.deler.map((d0, i) => {
    const d = d0 as KapplisteDelPlan
    const merke = d.pos ?? String.fromCharCode(65 + (i % 26)) + (i >= 26 ? String(Math.floor(i / 26)) : '')
    const iModell = inn.modell.filter((m) => kobling.get(m) === i)
    // Presis lengde: templatets mm > målt i 3D (når den stemmer) > cm × 10.
    let lengdeMm = d.lengdeMm ?? d.lengdeCm * 10
    if (d.lengdeMm === undefined && iModell.length) {
      const L = [...iModell.map((m) => m.lengdeMm ?? 0)].sort((a, b) => a - b)[Math.floor(iModell.length / 2)]
      if (Math.abs(L - d.lengdeCm * 10) <= 15) lengdeMm = Math.round(L)
    }
    // Kappvinkler: templatets > 3D (når alle like deler er enige).
    let vinkel = ''
    if (d.endeA || d.endeB) {
      const a = d.endeA?.vinkel ?? 0
      const b = d.endeB?.vinkel ?? 0
      vinkel = a === 0 && b === 0 ? 'Rett' : `${grader(a)} / ${grader(b)}`
    } else if (iModell.length) {
      const sett = new Set(iModell.map((m) => {
        if (m.vinkelA === null || m.vinkelB === null) return 'sammensatt'
        const v = [m.vinkelA ?? 0, m.vinkelB ?? 0].sort((x, y) => x - y)
        return v.join('/')
      }))
      if (sett.size === 1) {
        const s = [...sett][0]
        if (s === 'sammensatt') vinkel = 'Se skisse'
        else {
          const [a, b] = s.split('/').map(Number)
          vinkel = a < 0.05 && b < 0.05 ? 'Rett' : `${grader(a)} / ${grader(b)}`
        }
      } else if (sett.size > 1) vinkel = 'Se skisse'
    }
    const kat = (d.kategori ?? kategoriFor(d.navn)) as Materialkategori
    const omriss = iModell.length ? delOmriss(iModell[0]) : null
    const ccM = cc.get(`${d.navn}|${d.profil}`) ?? (iModell[0] ? cc.get(`${iModell[0].navn}|${iModell[0].profil}`) : undefined)
    return {
      merke,
      navn: d.navn,
      profil: d.profil,
      kvalitet: d.kvalitet ?? kvalitetFor(kat, tre, d.profil),
      lengdeMm,
      antall: d.antall,
      vinkel,
      merknad: d.merknad ?? '',
      cc: ccM,
      omriss,
    }
  })
  const merkeFor = (m: Del3D) => {
    const i = kobling.get(m)
    return i === undefined ? undefined : rader[i].merke
  }
  return { rader, merkeFor }
}

// ── Materialkategorier ──────────────────────────────────────────────────

const KATEGORI_NAVN: Record<Materialkategori, string> = {
  fundament: 'Fundament',
  konstruksjon: 'Bærende konstruksjon',
  bjelkelag: 'Bjelkelag',
  tak: 'Tak og tekking',
  kledning: 'Kledning og vegger',
  dekke: 'Gulv og dekke',
  beslag: 'Beslag',
  festemidler: 'Festemidler',
  overflate: 'Overflate og tilbehør',
  utstyr: 'Utstyr og innredning',
  annet: 'Annet',
}
const KATEGORI_REKKE: Materialkategori[] = ['fundament', 'bjelkelag', 'konstruksjon', 'dekke', 'tak', 'kledning', 'beslag', 'festemidler', 'overflate', 'utstyr', 'annet']

export function kategoriFor(navn: string, spes = ''): Materialkategori {
  const s = `${navn} ${spes}`.toLowerCase()
  if (/skrue|spiker|dykkert|kamspik|bolt|lim\b|trelim/.test(s)) return 'festemidler'
  if (/beslag|vinkel|bjelkesko|hengsel|lås|håndtak|anker|stolpesko/.test(s)) return /stolpesko/.test(s) ? 'fundament' : 'beslag'
  if (/betong|fundament|pilar|sonorør|grus|ringmur|støpt|armering|sement/.test(s)) return 'fundament'
  if (/tak|papp|shingel|sutak|stålplate|polykarbonat|møne|vindski|tekking/.test(s)) return 'tak'
  if (/terrassebord|gulvbord|bunnbord|dekke|platting|gulv/.test(s)) return 'dekke'
  if (/kledning|panel|akryl|spile|espalier|topplist|list\b|hjørnebord|vegg/.test(s)) return 'kledning'
  if (/olje|beis|maling|fiberduk|duk\b/.test(s)) return 'overflate'
  if (/port|dør|vask|skap|benk|postkasse|kran/.test(s)) return 'utstyr'
  if (/bjelkelag|gulvbjelke/.test(s)) return 'bjelkelag'
  if (/stolpe|bjelke|drager|spær|sperre|stender|svill|losholt|lekt|knebånd|strever|kongstolpe|ledger|undergurt|rem|bord|ramme|stiver/.test(s)) return 'konstruksjon'
  return 'annet'
}

function kvalitetFor(kat: Materialkategori, treslag: string, profil = ''): string {
  const tre = /\d\s*[×xX]\s*\d/.test(profil) || ['konstruksjon', 'bjelkelag', 'kledning', 'dekke'].includes(kat)
  if (!tre) return ''
  const impr = treslag === 'impregnert' || treslag === 'royal'
  const ntr = treslag === 'royal' ? 'Royal, NTR AB' : impr ? 'NTR AB' : TRESLAG[treslag]?.label ?? ''
  if (kat === 'konstruksjon' || kat === 'bjelkelag') return impr ? `C24 · ${ntr}` : 'C24'
  return ntr
}

/** Prisoppslag for linjer der navnet ikke er identisk med prislista. */
const PRIS_ALIAS: Array<[RegExp, string]> = [
  [/^skruer?\b/i, 'skrue'],
  [/sperrebeslag|vinkelbeslag|takåsanker/i, 'vinkelbeslag'],
  [/shingel/i, 'taktekke-shingel'],
  [/stålplate/i, 'taktekke-stalplater'],
  [/polykarbonat/i, 'taktekke-polykarbonat'],
  [/takpapp \(taktekke\)/i, 'taktekke-takpapp'],
  [/stolpesko/i, 'stolpesko'],
  [/fiberduk/i, 'fiberduk'],
  [/kryssfiner|takplate/i, 'kryssfiner-18'],
]

const TRE_PRIS = /^(bord|stolpe|bjelke|lekt|spile|espalier|terrassebord)-/

function linjePris(l: BomLinePlan, faktor: number): number | undefined {
  if (l.prisKr !== undefined) return l.prisKr
  let id = l.prisId
  if (!id) id = Object.values(PRISER).find((p) => p.navn === l.navn)?.id
  if (!id) id = PRIS_ALIAS.find(([re]) => re.test(`${l.navn} ${l.spesifikasjon ?? ''}`))?.[1]
  if (!id) return undefined
  const p = PRISER[id]
  if (!p || p.enhet !== l.enhet.replace('m2', 'm²')) {
    if (!p || !(p.enhet === 'stk' && l.enhet === 'stk')) return undefined
  }
  return prisFor(id) * l.antall * (TRE_PRIS.test(id) ? faktor : 1)
}

// ── Sideoppsett ─────────────────────────────────────────────────────────

/** Skriver for stående tekstsider med automatisk sideskift. */
class Skriver {
  f!: Flate
  y = TOPP
  sider: number[] = []
  private dok: Dok
  constructor(dok: Dok) {
    this.dok = dok
    this.ny()
  }
  ny() {
    this.f = this.dok.nySide('p')
    this.sider.push(this.dok.antallSider - 1)
    this.y = TOPP
  }
  plass(h: number): boolean {
    if (this.y + h > BUNN) { this.ny(); return true }
    return false
  }
  seksjon(nr: string, tittel: string, ingress?: string) {
    if (this.y > TOPP + 2) this.plass(40)
    const f = this.f
    f.tekst(nr, SL, this.y + 6, { str: 9, vekt: 'bold', farge: C.aksent })
    f.tekst(tittel, SL + 9, this.y + 6, { str: 17, vekt: 'bold', farge: C.tekst })
    f.rekt(SL, this.y + 9.5, 14, 0.9, { strek: null, fyll: C.aksent })
    this.y += 15
    if (ingress) this.avsnitt(ingress, { str: 9.5, farge: C.dempet })
  }
  under(tittel: string) {
    this.plass(16)
    this.f.tekst(tittel.toUpperCase(), SL, this.y + 4, { str: 8, vekt: 'bold', farge: C.dempet, sperring: 0.3 })
    this.f.strek(SL, this.y + 6, SL + BREDDE, this.y + 6, { bredde: 0.2, strek: C.linje })
    this.y += 9.5
  }
  avsnitt(t: string, s: Partial<TekstStil> & { bredde?: number; x?: number } = {}) {
    const str = s.str ?? 9
    const linjer = brytTekst(this.f, t, s.bredde ?? BREDDE, str, s.vekt)
    const lh = str * 0.42
    for (const l of linjer) {
      this.plass(lh + 1)
      this.f.tekst(l, s.x ?? SL, this.y + lh, { str, vekt: s.vekt, farge: s.farge ?? C.tekst, kursiv: s.kursiv })
      this.y += lh
    }
    this.y += 2.2
  }
  punkter(liste: string[], s: { str?: number; tegn?: string; farge?: string } = {}) {
    const str = s.str ?? 9
    const lh = str * 0.42
    for (const p of liste) {
      const linjer = brytTekst(this.f, p, BREDDE - 6, str)
      this.plass(lh * Math.min(2, linjer.length) + 1)
      this.f.tekst(s.tegn ?? '•', SL + 1, this.y + lh, { str, farge: s.farge ?? C.aksent, vekt: 'bold' })
      for (const l of linjer) {
        this.plass(lh)
        this.f.tekst(l, SL + 6, this.y + lh, { str, farge: C.tekst })
        this.y += lh
      }
      this.y += 1.4
    }
    this.y += 1
  }
}

interface Kolonne { tittel: string; b: number; juster?: 'left' | 'right' | 'center' }
type Celle = string | { tekst: string; vekt?: 'bold' | 'normal'; farge?: string }

/** Tabell med linjebryting, gjentatt tabellhode og gruppe-rader. */
function tabell(s: Skriver, kol: Kolonne[], rader: Array<Celle[] | { gruppe: string; hoyre?: string }>, opts: { str?: number } = {}) {
  const str = opts.str ?? 8
  const lh = str * 0.4
  const hode = () => {
    const f = s.f
    let x = SL
    for (const k of kol) {
      const tx = k.juster === 'right' ? x + k.b - 1.5 : k.juster === 'center' ? x + k.b / 2 : x + 1.5
      f.tekst(k.tittel.toUpperCase(), tx, s.y + 4, { str: 6.5, vekt: 'bold', farge: C.dempet, juster: k.juster ?? 'left' })
      x += k.b
    }
    f.strek(SL, s.y + 6, SL + BREDDE, s.y + 6, { bredde: 0.35, strek: C.tekst })
    s.y += 7.5
  }
  s.plass(18)
  hode()
  for (const r of rader) {
    if (!Array.isArray(r)) {
      if (s.plass(14)) hode()
      s.f.rekt(SL, s.y, BREDDE, 6, { strek: null, fyll: C.lys })
      s.f.tekst(r.gruppe, SL + 1.5, s.y + 4.1, { str: 8.2, vekt: 'bold', farge: C.tekst })
      if (r.hoyre) s.f.tekst(r.hoyre, SL + BREDDE - 1.5, s.y + 4.1, { str: 8.2, vekt: 'bold', farge: C.tekst, juster: 'right' })
      s.y += 6.8
      continue
    }
    const celler = r.map((c, i) => {
      const t = typeof c === 'string' ? c : c.tekst
      return brytTekst(s.f, t, kol[i].b - 3, str, typeof c === 'string' ? undefined : c.vekt)
    })
    const n = Math.max(1, ...celler.map((c) => c.length))
    const h = n * lh + 2.6
    if (s.plass(h + 1)) hode()
    let x = SL
    celler.forEach((linjer, i) => {
      const k = kol[i]
      const c = r[i]
      const vekt = typeof c === 'string' ? undefined : c.vekt
      const farge = typeof c === 'string' ? C.tekst : c.farge ?? C.tekst
      linjer.forEach((l, j) => {
        const tx = k.juster === 'right' ? x + k.b - 1.5 : k.juster === 'center' ? x + k.b / 2 : x + 1.5
        s.f.tekst(l, tx, s.y + 1.3 + lh * (j + 0.85), { str, vekt, farge, juster: k.juster ?? 'left' })
      })
      x += k.b
    })
    s.y += h
    s.f.strek(SL, s.y, SL + BREDDE, s.y, { bredde: 0.12, strek: C.linje })
  }
  s.y += 3
}

// ── Plan-ID ─────────────────────────────────────────────────────────────

export function lagPlanId(templateId: string, config: DesignConfig): string {
  const s = templateId + JSON.stringify(Object.keys(config).sort().map((k) => [k, config[k]]))
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return `MIN-${templateId.slice(0, 3).toUpperCase()}-${(h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`
}

// ── Tegningsark ─────────────────────────────────────────────────────────

const AL = 15 // ramme venstre (innbinding)
const AR = 287
const AT = 10
const AB = 200
const BAND = 34 // tegningshode-bånd
const TA = { x: AL + 2, y: AT + 2, w: AR - AL - 4, h: AB - AT - BAND - 4 }

export interface Ark {
  nr: string
  tittel: string
  celler: Array<{ tg: Tegning; M: number; x: number; y: number; w: number; h: number }>
  merker: string[]
  side?: number
}

function layoutFor(tgs: Tegning[]): { rows: number; cols: number; M: number } {
  let best: { rows: number; cols: number; M: number } | null = null
  const opsjoner = tgs.length === 1 ? [[1, 1]] : tgs.length === 2 ? [[1, 2], [2, 1]] : tgs.length === 3 ? [[1, 3], [2, 2]] : [[2, 2], [1, 4]]
  for (const [rows, cols] of opsjoner) {
    const w = TA.w / cols - 4
    const h = TA.h / rows - 9
    const M = Math.max(...tgs.map((t) => t.malestokk ?? velgMalestokk(t, w, h)))
    if (!best || M < best.M) best = { rows, cols, M }
  }
  return best!
}

/** Fordeler tegninger på ark: planer alene, oppriss/snitt sammen når målestokken tåler det. */
function planleggArk(tgs: Tegning[], prefiks: string, startNr: number, navnFor: (tgs: Tegning[]) => string): Ark[] {
  const ark: Ark[] = []
  let i = 0
  let nr = startNr
  while (i < tgs.length) {
    const alene = (t: Tegning) => t.malestokk ?? velgMalestokk(t, TA.w - 4, TA.h - 9)
    let valgt = 1
    if (tgs[i].type !== 'plan') {
      for (let c = Math.min(tgs[i].type === 'detalj' ? 3 : 4, tgs.length - i); c > 1; c--) {
        const gruppe = tgs.slice(i, i + c)
        if (gruppe.some((t) => t.type === 'plan')) continue
        if (gruppe.some((t) => (t.type === 'detalj') !== (tgs[i].type === 'detalj'))) continue
        const lay = layoutFor(gruppe)
        const maksAlene = Math.max(...gruppe.map(alene))
        // Detaljer skal ikke krympes; oppriss tåler ett målestokktrinn.
        // Detaljer: to på samme ark så lenge de holder 1:10 eller bedre.
        if (tgs[i].type === 'detalj' ? lay.M <= Math.max(maksAlene, 10) : lay.M <= maksAlene * 2) { valgt = c; break }
      }
    }
    const gruppe = tgs.slice(i, i + valgt)
    const lay = layoutFor(gruppe)
    const cw = TA.w / lay.cols
    const ch = TA.h / lay.rows
    const celler = gruppe.map((tg, k) => {
      const r = Math.floor(k / lay.cols)
      const c = k % lay.cols
      return { tg, M: tg.malestokk ?? lay.M, x: TA.x + c * cw, y: TA.y + r * ch, w: cw, h: ch }
    })
    const merker = new Set<string>()
    for (const tg of gruppe) for (const e of tg.el) if (e.t === 'pos') merker.add(e.merke)
    ark.push({ nr: `${prefiks}-${String(nr).padStart(2, '0')}`, tittel: navnFor(gruppe), celler, merker: [...merker].sort() })
    nr++
    i += valgt
  }
  return ark
}

function malestokkTekst(a: Ark): string {
  const ms = [...new Set(a.celler.map((c) => c.M))]
  return ms.length === 1 ? `1:${ms[0]}` : ms.map((m) => `1:${m}`).join(' / ')
}

function tegnLogo(f: Flate, inn: PlanInn, x: number, y: number, h: number) {
  if (inn.bilder.logo) {
    const w = h * (inn.bilder.logoForhold ?? 3.7)
    f.bilde(inn.bilder.logo, x, y, w, h)
    return w
  }
  f.tekst('MINIO', x, y + h * 0.8, { str: h * 2.4, vekt: 'bold', farge: C.tekst })
  return h * 3.2
}

function tegnArk(f: Flate, a: Ark, inn: PlanInn, posRader: PosRad[]) {
  // Ramme.
  f.rekt(AL, AT, AR - AL, AB - AT, { bredde: 0.5, strek: C.tekst })
  // Tegninger.
  for (const c of a.celler) {
    const ramme = { x: c.x + 2, y: c.y + 1, w: c.w - 4, h: c.h - 10 }
    tegnTegning(f, c.tg, ramme, c.M, { laast: inn.laast })
    const st = tegningStorrelse(c.tg, c.M)
    const ty = Math.min(c.y + c.h - 4, ramme.y + (ramme.h + st.h) / 2 + 6)
    const tittel = c.tg.navn.toUpperCase()
    const tw = f.maal(tittel, 8.5, 'bold')
    const mtekst = `1:${c.M}`
    const cx = c.x + c.w / 2
    f.tekst(tittel, cx - 4, ty, { str: 8.5, vekt: 'bold', juster: 'center' })
    f.tekst(mtekst, cx - 4 + tw / 2 + 2, ty, { str: 7.5, farge: C.dempet })
    f.strek(cx - 4 - tw / 2, ty + 1.3, cx - 4 + tw / 2, ty + 1.3, { bredde: 0.35, strek: C.tekst })
    if (c.tg.undertittel) f.tekst(c.tg.undertittel, cx - 4, ty + 4.4, { str: 6.4, farge: C.svak, juster: 'center', kursiv: true })
    if (c.tg.nordpil !== undefined) nordpil(f, c.x + c.w - 14, c.y + 16)
  }

  // Tegningshode-bånd.
  const by = AB - BAND
  f.strek(AL, by, AR, by, { bredde: 0.5, strek: C.tekst })
  const hx = AR - 118
  f.strek(hx, by, hx, AB, { bredde: 0.5, strek: C.tekst })

  // Venstre del: merknader, målestokklinjal og posisjonsliste.
  const notat = 'Alle mål i mm. Målestokk gjelder ved utskrift på A4 i faktisk størrelse (ikke «tilpass siden»). Kontroller mål på stedet før kapping.'
  brytTekst(f, notat, hx - AL - 64, 6.2).forEach((l, i) => f.tekst(l, AL + 2, by + 4 + i * 2.6, { str: 6.2, farge: C.dempet }))
  skalastav(f, hx - 60, by + 2.2, a.celler[0].M)
  const sett = new Set<string>()
  const pos = posRader.filter((p) => {
    const k = `${p.merke}|${p.navn}|${p.profil}`
    if (!a.merker.includes(p.merke) || sett.has(k)) return false
    sett.add(k)
    return true
  })
  const kolW = (hx - AL - 4) / 2
  const rader = Math.floor((BAND - 11) / 2.9)
  pos.slice(0, rader * 2).forEach((p, i) => {
    const kx = AL + 2 + Math.floor(i / rader) * kolW
    const ky = by + 12 + (i % rader) * 2.9
    f.sirkel(kx + 1.6, ky - 0.8, 1.35, { bredde: 0.18, strek: FARGE.aksent, fyll: '#ffffff' })
    f.tekst(p.merke, kx + 1.6, ky - 0.75, { str: 5, vekt: 'bold', farge: FARGE.aksent, juster: 'center', grunnlinje: 'middle' })
    const cc = p.cc ? ` · c/c maks ${mm(p.cc)}` : ''
    const t = `${p.navn} – ${normalProfil(p.profil)}${p.kvalitet ? ` ${p.kvalitet}` : ''}${cc}`
    const linjer = brytTekst(f, t, kolW - 6, 6.2)
    f.tekst(linjer[0] + (linjer.length > 1 ? ' …' : ''), kx + 4, ky, { str: 6.2 })
  })
  if (pos.length === 0) f.tekst('Posisjonsmerkene (A, B …) viser til kapplista.', AL + 2, by + 14, { str: 6.2, farge: C.svak })

  // Høyre del: tegningshodet.
  const rad = (y: number) => f.strek(hx, y, AR, y, { bredde: 0.15, strek: C.tekst })
  const felt = (lbl: string, v: string, x: number, y: number, w: number, str = 7.4, vekt: 'bold' | 'normal' = 'bold') => {
    f.tekst(lbl.toUpperCase(), x + 1.4, y + 2.6, { str: 4.8, farge: C.svak, sperring: 0.15 })
    const l = brytTekst(f, v, w - 2.8, str, vekt)[0] ?? ''
    f.tekst(l, x + 1.4, y + 6.2, { str, vekt })
  }
  const lw = tegnLogo(f, inn, hx + 2, by + 1.6, 5.2)
  f.tekst('Byggeplan · minio.no', hx + 4 + lw, by + 5.4, { str: 6.4, farge: C.dempet })
  rad(by + 8)
  felt('Prosjekt', inn.tittel, hx, by + 8, 70)
  felt('Tiltakshaver', inn.kunde ?? '', hx + 70, by + 8, 48, 6.8, 'normal')
  f.strek(hx + 70, by + 8, hx + 70, by + 16, { bredde: 0.15, strek: C.tekst })
  rad(by + 16)
  felt('Tegning', a.tittel, hx, by + 16, 118, 8.6)
  rad(by + 25)
  const cw = 118 / 4
  felt('Tegningsnr', a.nr, hx, by + 25, cw, 8)
  felt('Målestokk', malestokkTekst(a), hx + cw, by + 25, cw, 7.2)
  felt('Dato', inn.dato, hx + cw * 2, by + 25, cw, 6.6, 'normal')
  felt('Rev.', inn.revisjon, hx + cw * 3, by + 25, cw, 7.2)
  for (let k = 1; k < 4; k++) f.strek(hx + cw * k, by + 25, hx + cw * k, AB, { bredde: 0.15, strek: C.tekst })
}

function nordpil(f: Flate, x: number, y: number) {
  f.sirkel(x, y, 4.2, { bredde: 0.25, strek: C.tekst })
  f.poly([[x, y - 4.2], [x + 1.7, y + 2.6], [x, y + 1.4]], true, { strek: C.tekst, bredde: 0.15, fyll: C.tekst })
  f.poly([[x, y - 4.2], [x - 1.7, y + 2.6], [x, y + 1.4]], true, { strek: C.tekst, bredde: 0.15, fyll: '#ffffff' })
  f.tekst('N', x, y - 5.6, { str: 7, vekt: 'bold', juster: 'center' })
  f.tekst('orienteres etter tomta', x, y + 7.4, { str: 4.6, farge: C.svak, juster: 'center' })
}

function skalastav(f: Flate, x: number, y: number, M: number) {
  // Velg rundt segment (i virkelige mm) som gir ~10–14 mm på arket.
  const kandidater = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000]
  const seg = kandidater.find((k) => k / M >= 9) ?? 5000
  const p = seg / M
  for (let i = 0; i < 4; i++) f.rekt(x + i * p, y + 2, p, 1.6, { bredde: 0.15, strek: C.tekst, fyll: i % 2 ? C.tekst : '#ffffff' })
  const etikett = (v: number) => (v >= 1000 ? `${desimal(v / 1000, v % 1000 ? 1 : 0)} m` : `${v} mm`)
  for (let i = 0; i <= 4; i += 2) f.tekst(etikett(seg * i), x + i * p, y + 6.4, { str: 5, juster: i === 0 ? 'left' : i === 4 ? 'right' : 'center' })
  f.tekst(`1:${M}`, x + 4 * p + 2, y + 3.6, { str: 5.6, farge: C.dempet })
}

// ── Forside ─────────────────────────────────────────────────────────────

function forside(f: Flate, inn: PlanInn, innhold: string[]) {
  const W = 210
  tegnLogo(f, inn, SL, 16, 9)
  f.tekst('BYGGEPLAN', W - SR, 22, { str: 8.5, vekt: 'bold', farge: C.aksent, juster: 'right', sperring: 0.8 })
  f.tekst(inn.template.navn, W - SR, 26.5, { str: 7.5, farge: C.dempet, juster: 'right' })

  f.tekst(inn.tittel, SL, 48, { str: 28, vekt: 'bold', farge: C.tekst })
  const sub = brytTekst(f, inn.bom.sammendrag, BREDDE, 10)
  sub.slice(0, 2).forEach((l, i) => f.tekst(l, SL, 56 + i * 4.6, { str: 10, farge: C.dempet }))

  // 3D-illustrasjon.
  const iy = 68
  const ih = 118
  f.rekt(SL, iy, BREDDE, ih, { strek: null, fyll: '#f2f1ee' })
  if (inn.bilder.forside) f.bilde(inn.bilder.forside, SL + 2, iy + 2, BREDDE - 4, ih - 4)
  f.tekst('Illustrasjon av ditt design – generert fra 3D-modellen', SL + 3, iy + ih - 3, { str: 6, farge: C.svak })

  // Nøkkeltall.
  const ky = iy + ih + 8
  const tall: Array<[string, string]> = [
    ['Mål', inn.bom.maal ?? '–'],
    ['Grunnflate', inn.bom.arealM2 !== undefined ? `${desimal(inn.bom.arealM2)} m²` : '–'],
    ['Materialer ca.', inn.laast ? '• • •' : kr(inn.bom.estimatKr)],
    ['Arbeidstid ca.', (() => { const t = arbeidstimer(inn); return `${desimal(t, t % 1 ? 1 : 0)} timer` })()],
  ]
  const bw = BREDDE / 4
  tall.forEach(([l, v], i) => {
    const x = SL + i * bw
    if (i > 0) f.strek(x, ky, x, ky + 15, { bredde: 0.2, strek: C.linje })
    f.tekst(l.toUpperCase(), x + (i ? 4 : 0), ky + 4, { str: 6.5, vekt: 'bold', farge: C.svak, sperring: 0.3 })
    f.tekst(v, x + (i ? 4 : 0), ky + 11.5, { str: 12, vekt: 'bold', farge: C.tekst })
  })

  // Prosjektdata.
  const py = ky + 24
  f.strek(SL, py, SL + BREDDE, py, { bredde: 0.5, strek: C.tekst })
  const felt: Array<[string, string]> = [
    ['Prosjekt', inn.tittel],
    ['Tiltakshaver', inn.kunde || '_______________________'],
    ['Plan-ID', inn.planId],
    ['Revisjon', inn.revisjon],
    ['Dato', inn.dato],
    ['Utarbeidet med', 'Minio designverktøy · minio.no'],
  ]
  felt.forEach(([l, v], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = SL + col * (BREDDE / 3)
    const y = py + 5 + row * 12
    f.tekst(l.toUpperCase(), x, y, { str: 6.2, vekt: 'bold', farge: C.svak, sperring: 0.3 })
    f.tekst(brytTekst(f, v, BREDDE / 3 - 4, 9, 'bold')[0] ?? '', x, y + 5, { str: 9, vekt: 'bold' })
  })

  // Innhold.
  const iy2 = py + 30
  f.tekst('DOKUMENTET INNEHOLDER', SL, iy2, { str: 6.5, vekt: 'bold', farge: C.svak, sperring: 0.3 })
  brytTekst(f, innhold.join('  ·  '), BREDDE, 8.2).forEach((l, i) => f.tekst(l, SL, iy2 + 5 + i * 3.8, { str: 8.2, farge: C.dempet }))
}

// ── Prosjektinformasjon ─────────────────────────────────────────────────

function prosjektinfo(s: Skriver, inn: PlanInn, ark: Ark[], seksjoner: Array<[string, string]>) {
  s.seksjon('1', 'Prosjektinformasjon', `Byggeplan for «${inn.tittel}», laget ut fra målene og valgene i designet ditt. Tegninger, materialliste og kappliste er regnet ut fra den samme 3D-modellen, så tall og tegninger stemmer overens.`)
  s.under('Innhold')
  tabell(s, [
    { tittel: 'Del', b: 18 },
    { tittel: 'Innhold', b: 133 },
    { tittel: 'Side', b: 26, juster: 'right' },
  ], seksjoner.map(([nr, t], i) => [{ tekst: String(i + 1), vekt: 'bold' }, t, nr]))

  s.under('Valgt utførelse')
  const halv = Math.ceil(inn.konfig.length / 2)
  const startY = s.y
  s.plass(halv * 4.6 + 4)
  const y0 = s.y === TOPP ? TOPP : startY
  inn.konfig.forEach((l, i) => {
    const kol = i < halv ? 0 : 1
    const rad = kol === 0 ? i : i - halv
    const [k, ...v] = l.split(':')
    const x = SL + kol * (BREDDE / 2)
    const y = y0 + rad * 4.6 + 3.4
    s.f.tekst(k, x, y, { str: 8, farge: C.dempet })
    s.f.tekst(v.join(':').trim(), x + 38, y, { str: 8, vekt: 'bold' })
  })
  s.y = y0 + halv * 4.6 + 4

  if (inn.byggeregler) {
    s.under('Byggeregler (veiledende)')
    const b = inn.byggeregler
    s.plass(10)
    s.f.rekt(SL, s.y, BREDDE, 7.4, { strek: null, fyll: b.sokfri ? '#e9f4ee' : '#fbf1e2' })
    s.f.tekst(b.tittel, SL + 3, s.y + 5, { str: 9, vekt: 'bold', farge: b.sokfri ? C.ok : C.adv })
    s.y += 10
    s.punkter([...b.punkter.slice(0, 2), ...(b.punkter.length > 2 ? ['Fullstendig vurdering: se del 6 (byggesak).'] : [])], { str: 8.4 })
  }

  s.under('Tegningsliste')
  tabell(s, [
    { tittel: 'Nr.', b: 18 },
    { tittel: 'Tegning', b: 103 },
    { tittel: 'Målestokk', b: 30 },
    { tittel: 'Side', b: 26, juster: 'right' },
  ], ark.map((a) => [{ tekst: a.nr, vekt: 'bold' }, a.tittel, malestokkTekst(a), a.side !== undefined ? String(a.side + 1) : '']))

}

// ── Materialliste ───────────────────────────────────────────────────────

function materialliste(s: Skriver, inn: PlanInn) {
  s.seksjon('3', 'Materialliste', 'Alt du trenger å handle, gruppert etter bruk. Mengdene inkluderer kapp og svinn der det står. Prisene er veiledende ca-priser fra norske byggevarehus – sjekk mot din lokale forhandler.')
  const tre = String(inn.config.treslag ?? '')
  const faktor = TRESLAG[tre]?.prisFaktor ?? 1
  const linjer = inn.bom.linjer as BomLinePlan[]
  const grupper = new Map<Materialkategori, Array<{ l: BomLinePlan; pris?: number; kval: string }>>()
  for (const l of linjer) {
    const k = l.kategori ?? kategoriFor(l.navn, l.spesifikasjon)
    const g = grupper.get(k) ?? []
    g.push({ l, pris: linjePris(l, faktor), kval: l.kvalitet ?? kvalitetFor(k, tre, `${l.navn} ${l.spesifikasjon ?? ''}`) })
    grupper.set(k, g)
  }
  const skjul = (v: string) => (inn.laast ? '•••' : v)
  const rader: Array<Celle[] | { gruppe: string; hoyre?: string }> = []
  let pos = 1
  let sumPrisa = 0
  for (const k of KATEGORI_REKKE) {
    const g = grupper.get(k)
    if (!g?.length) continue
    const sum = g.reduce((s, e) => s + (e.pris ?? 0), 0)
    sumPrisa += sum
    rader.push({ gruppe: KATEGORI_NAVN[k], hoyre: sum > 0 ? skjul(kr(sum)) : undefined })
    for (const e of g) {
      const besk = [e.l.spesifikasjon, e.l.kommentar].filter(Boolean).join(' · ')
      rader.push([
        { tekst: String(pos++), farge: C.svak },
        { tekst: e.l.navn, vekt: 'bold' },
        besk || '–',
        e.kval || '–',
        skjul(desimal(e.l.antall, Number.isInteger(e.l.antall) ? 0 : 1)),
        e.l.enhet,
        e.pris !== undefined ? skjul(kr(e.pris)) : '–',
      ])
    }
  }
  tabell(s, [
    { tittel: 'Pos', b: 9 },
    { tittel: 'Materiale', b: 50 },
    { tittel: 'Spesifikasjon / merknad', b: 46 },
    { tittel: 'Kvalitet', b: 24 },
    { tittel: 'Mengde', b: 16, juster: 'right' },
    { tittel: 'Enh.', b: 11 },
    { tittel: 'Ca. pris', b: 21, juster: 'right' },
  ], rader)
  s.plass(22)
  s.f.strek(SL, s.y, SL + BREDDE, s.y, { bredde: 0.5, strek: C.tekst })
  s.f.tekst('Veiledende materialkostnad', SL, s.y + 6, { str: 10, vekt: 'bold' })
  s.f.tekst(skjul(kr(inn.bom.estimatKr)), SL + BREDDE, s.y + 6, { str: 12, vekt: 'bold', juster: 'right' })
  s.y += 9
  const rest = inn.bom.estimatKr - sumPrisa
  const tekst = `Totalen er designverktøyets estimat for hele materialpakken (inkl. svinn, taktekking, beslag og festemidler). ${rest > 50 ? `Poster uten enhetspris i tabellen utgjør ca. ${skjul(kr(rest))}. ` : ''}Treslag: ${TRESLAG[tre]?.label ?? tre}${faktor !== 1 ? ` (prisfaktor ${desimal(faktor, 2)} på trevirke)` : ''}.`
  s.avsnitt(tekst, { str: 7.6, farge: C.dempet })
}

// ── Kappliste + kappeplan ───────────────────────────────────────────────

function kappliste(s: Skriver, inn: PlanInn, pos: PosRad[]) {
  s.seksjon('4', 'Kappliste og kappeplan', 'Hver unik del med posisjonsmerke (som på tegningene), ferdig lengde og kappvinkler. Lengden er målt spiss til spiss (lengste side). Vinkelen er sagens innstilling i hver ende – 0° er rett kapp.')
  const skjul = (v: string) => (inn.laast ? '•••' : v)
  tabell(s, [
    { tittel: 'Pos', b: 10, juster: 'center' },
    { tittel: 'Del', b: 48 },
    { tittel: 'Profil (mm)', b: 22 },
    { tittel: 'Kvalitet', b: 24 },
    { tittel: 'Lengde mm', b: 20, juster: 'right' },
    { tittel: 'Antall', b: 14, juster: 'right' },
    { tittel: 'Kapp A / B', b: 22, juster: 'right' },
    { tittel: 'c/c', b: 17, juster: 'right' },
  ], pos.map((p) => [
    { tekst: p.merke, vekt: 'bold', farge: C.aksent },
    { tekst: p.navn, vekt: 'bold' },
    normalProfil(p.profil),
    p.kvalitet || '–',
    skjul(mm(p.lengdeMm)),
    skjul(String(p.antall)),
    p.vinkel || '–',
    p.cc ? skjul(mm(p.cc)) : '',
  ]))

  // Kappskisser (eksakte omriss fra 3D med vinkler).
  const skisser = pos.filter((p) => p.omriss && p.omriss.length >= 3)
  if (skisser.length) {
    s.under('Kappskisser')
    s.avsnitt('Delene sett fra siden, tegnet i samme forhold. Skrå ender viser kappvinkelen.', { str: 7.6, farge: C.dempet })
    const maxL = Math.max(...skisser.map((p) => Math.max(...p.omriss!.map((q) => q[0]))))
    const skala = Math.min(0.06, (BREDDE - 40) / maxL)
    for (const p of skisser) {
      const pts = p.omriss!
      const h = Math.max(...pts.map((q) => q[1])) * skala
      const radH = Math.max(7, h + 4)
      s.plass(radH + 2)
      const y = s.y + 1
      s.f.sirkel(SL + 2.5, y + 2.5, 2.2, { bredde: 0.25, strek: C.aksent, fyll: '#ffffff' })
      s.f.tekst(p.merke, SL + 2.5, y + 2.55, { str: 6.8, vekt: 'bold', farge: C.aksent, juster: 'center', grunnlinje: 'middle' })
      const x0 = SL + 8
      s.f.poly(pts.map(([u, v]) => [x0 + u * skala, y + v * skala] as [number, number]), true, { bredde: 0.25, strek: C.tekst, fyll: '#efe2cc' })
      const L = Math.max(...pts.map((q) => q[0])) * skala
      s.f.tekst(`${skjul(mm(p.lengdeMm))} mm${p.vinkel && p.vinkel !== 'Rett' ? ` · ${p.vinkel}` : ''} · ${skjul(String(p.antall))} stk`, x0 + L + 3, y + Math.min(h, 5) / 2 + 1.3, { str: 7, farge: C.dempet })
      s.y += radH
    }
    s.y += 2
  }

  // Kappeplan – innkjøpslengder.
  const plan = lagKappeplan(pos.map((p) => ({ profil: p.profil, pos: p.merke, lengdeMm: p.lengdeMm, antall: p.antall })))
  if (plan.length) {
    s.under('Kappeplan – lengder å kjøpe')
    s.avsnitt('Forslag til innkjøp i standardlengder (30 cm sprang) med minst mulig svinn. Hver rad er én planke: kapp delene i rekkefølgen som står, med 4 mm sagsnitt.', { str: 7.6, farge: C.dempet })
    const rader: Array<Celle[] | { gruppe: string; hoyre?: string }> = []
    for (const p of plan) {
      rader.push({ gruppe: `${p.profil} mm`, hoyre: inn.laast ? '•••' : `${p.antallPlanker} planker · ${desimal(p.kjoptLm)} lm · svinn ${Math.round(p.svinnPst)} %` })
      for (const g of p.grupper) {
        rader.push([
          skjul(`${g.antall} ×`),
          skjul(`${desimal(g.lager / 1000, 1)} m`),
          inn.laast ? '•••' : g.kutt.map((k) => `${k.pos} ${mm(k.lengdeMm)}`).join('  +  '),
          skjul(mm(g.rest)),
        ])
      }
      for (const fl of p.forLange) rader.push(['', { tekst: 'Over 6 m', farge: C.adv }, { tekst: `${fl.pos} ${mm(fl.lengdeMm)} × ${fl.antall} – bestill spesiallengde eller skjøt over opplegg`, farge: C.adv }, ''])
    }
    tabell(s, [
      { tittel: 'Antall', b: 16, juster: 'right' },
      { tittel: 'Lengde', b: 18, juster: 'right' },
      { tittel: 'Kapp (pos + lengde mm)', b: 121 },
      { tittel: 'Rest mm', b: 22, juster: 'right' },
    ], rader, { str: 7.6 })
  }
}

// ── Montering ───────────────────────────────────────────────────────────

const TRINN_ORD: RegExp[] = [
  /fundament|stolpesko|betong|grav|sett ut|merk opp|oppmerk|klossene|pilar|sonorør|frost|plasser.*kloss|punkt|grus/,
  /bjelkelag|bjelkene|bjelker|gulvramme|bjelkesko|rammen/,
  /terrassebord|gulvbord|dekke|gulvet|bunnbord|bunnen/,
  /stolpe|stender|vegg|reis|svill|knebånd|drager|losholt|hjørne/,
  /tak|sperre|spær|takstol|møne|tekking|vindski|lekt|sutak/,
  /kledning|dør|luke|panel|list|beis|maling|olje|ferdig|topplist|espalier|rekkverk|trapp|benk|innred|hylle/,
]

/**
 * Ordbok fra modellen: hovedordet i hvert delnavn («stolpe», «bjelke»,
 * «terrassebord» …) → byggetrinnet delen faktisk hører til i DENNE modellen
 * (en stolpe er fundament på en terrasse, men reisverk på en carport).
 */
function modellOrdbok(modell: Del3D[]): Map<string, number> {
  const tell = new Map<string, Map<number, number>>()
  for (const d of modell) {
    if (d.trinn < 0) continue
    const ord = d.navn.toLowerCase().replace(/[^a-zæøå ]/g, ' ').split(/\s+/).filter((o) => o.length >= 4)
    for (const o of ord.slice(0, 2)) {
      const stamme = o.length > 6 ? o.slice(0, o.length - 2) : o
      const m = tell.get(stamme) ?? new Map<number, number>()
      m.set(d.trinn, (m.get(d.trinn) ?? 0) + 1)
      tell.set(stamme, m)
    }
  }
  const ut = new Map<string, number>()
  for (const [o, m] of tell) ut.set(o, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0])
  return ut
}

function trinnForSteg(t: string, ordbok?: Map<string, number>): number | null {
  const s = t.toLowerCase()
  if (ordbok?.size) {
    let best: { t: number; pos: number } | null = null
    for (const [o, tr] of ordbok) {
      const i = s.search(new RegExp(`(^|[^a-zæøå])${o}`))
      if (i >= 0 && (!best || i < best.pos)) best = { t: tr, pos: i }
    }
    if (best) return (best as { t: number }).t
  }
  let best: { i: number; pos: number } | null = null
  TRINN_ORD.forEach((re, i) => {
    const m = s.match(re)
    if (m && m.index !== undefined && (!best || m.index < best.pos)) best = { i, pos: m.index }
  })
  return (best as { i: number } | null)?.i ?? null
}

function verktoyFor(inn: PlanInn): string[] {
  const m = inn.modell
  const harTak = m.some((d) => d.trinn === 4)
  const harStolper = m.some((d) => d.loddrett && /stolpe/i.test(d.navn))
  const harFund = m.some((d) => d.trinn === 0)
  const l = [
    'Målebånd, tommestokk, blyant og snor/merkepinner',
    'Vater (min. 1 m) og gjerne laser- eller slangevater',
    'Vinkelhake og tømmermannsvinkel',
    'Kapp-/gjæringssag (vinkler) og håndsirkelsag',
    'Drill/skrutrekker med bits, forbor og senkebor',
    'Skrutvinger og et par sagbukker',
  ]
  if (harFund) l.push('Spade, spett og trillebår (fundamenter)')
  if (harStolper) l.push('Slagbor/bor Ø12–14 og fastnøkkel/pipe for bolter')
  if (harTak) l.push('Stige og helst stillas/arbeidsplattform for takarbeid')
  return l
}

function hmsFor(inn: PlanInn): string[] {
  const m = inn.modell
  const hoyde = Math.max(0, ...m.map((d) => d.max[1])) / 1000
  const l = [
    'Bruk vernebriller og hørselvern ved kapping og skruing, og støvmaske når du kapper impregnert virke.',
    'Løft tunge deler (dragere, stolper, takstoler) to sammen, og stiv av stolper og vegger midlertidig til konstruksjonen er låst.',
    'Kapprester av impregnert trevirke er farlig avfall – lever dem på gjenvinningsstasjonen, ikke brenn dem.',
  ]
  if (m.some((d) => d.trinn === 0)) l.push('Sjekk hvor kabler og rør går før du graver (kontakt kommunen/netteier).')
  if (hoyde > 2) l.push(`Takarbeid i ca. ${desimal(hoyde)} m høyde: bruk stillas eller sikret stige, aldri arbeid alene, og hold avstand til strømførende ledninger.`)
  return l
}

/**
 * Arbeidstid: templatets anslag når det finnes, ellers et anslag fra modellen
 * (antall bærende deler, kledning/dekke-bord, fundamenter og takflate).
 */
export function arbeidstimer(inn: Pick<PlanInn, 'arbeidstimer' | 'modell' | 'bom'>): number {
  if (inn.arbeidstimer) return inn.arbeidstimer
  const m = inn.modell
  const baerende = m.filter((d) => d.tre && (d.trinn === 1 || d.trinn === 3 || d.trinn === 4)).length
  const bord = m.filter((d) => d.trinn === 2 || d.trinn === 5).length
  const fund = m.filter((d) => d.trinn === 0).length
  const tak = m.some((d) => d.trinn === 4 && !d.tre) ? (inn.bom.arealM2 ?? 0) * 1.25 : 0
  const t = baerende * 0.3 + bord * 0.1 + fund * 0.8 + tak * 0.35
  return Math.max(2, Math.round(t * 2) / 2)
}

function montering(s: Skriver, inn: PlanInn) {
  s.seksjon('5', 'Montering trinn for trinn', 'Følg trinnene i rekkefølge. Illustrasjonene viser modellen din slik den skal se ut når trinnet er ferdig.')

  // Før du starter: verktøy, tid, HMS.
  const verk = verktoyFor(inn)
  const hms = hmsFor(inn)
  const kolW = (BREDDE - 6) / 2
  const vLinjer = verk.flatMap((v) => brytTekst(s.f, v, kolW - 8, 8))
  const hLinjer = hms.flatMap((v) => brytTekst(s.f, v, kolW - 8, 8))
  const boksH = Math.max(vLinjer.length + verk.length * 0.4, hLinjer.length + hms.length * 0.4) * 3.5 + 20
  s.plass(boksH + 4)
  const by = s.y
  s.f.rekt(SL, by, kolW, boksH, { strek: null, fyll: C.lys })
  s.f.rekt(SL + kolW + 6, by, kolW, boksH, { strek: null, fyll: '#fbf1e2' })
  s.f.tekst('VERKTØY', SL + 4, by + 6, { str: 7.5, vekt: 'bold', farge: C.dempet, sperring: 0.3 })
  s.f.tekst('SIKKERHET (HMS)', SL + kolW + 10, by + 6, { str: 7.5, vekt: 'bold', farge: C.adv, sperring: 0.3 })
  const liste = (items: string[], x: number, farge: string) => {
    let y = by + 12
    for (const it of items) {
      const ls = brytTekst(s.f, it, kolW - 10, 8)
      s.f.tekst('•', x, y, { str: 8, vekt: 'bold', farge })
      ls.forEach((l, i) => s.f.tekst(l, x + 4, y + i * 3.5, { str: 8 }))
      y += ls.length * 3.5 + 1.4
    }
  }
  liste(verk, SL + 4, C.aksent)
  liste(hms, SL + kolW + 10, C.adv)
  s.y = by + boksH + 4
  const timer = arbeidstimer(inn)
  if (timer) {
    const dager = timer / 2 / 7.5
    s.avsnitt(`Tidsbruk: ca. ${desimal(timer, timer % 1 ? 1 : 0)} arbeidstimer – med to personer omtrent ${dager < 1 ? 'én dag' : `${desimal(Math.ceil(dager * 2) / 2, dager % 1 ? 1 : 0)} dager`}. Gjelder byggere med grunnleggende erfaring, uten herdetid for betong og tørketid for overflatebehandling.`, { str: 8.6, vekt: 'bold' })
  }

  // Steg gruppert per byggetrinn.
  const steg: MonteringSteg[] = inn.monteringPlan?.length
    ? inn.monteringPlan
    : inn.montering.map((t) => {
        const m = t.match(/^([^:.]{3,48})[:.]\s+(.*)$/)
        return m ? { tittel: m[1], tekst: m[2] } : { tittel: '', tekst: t }
      })
  const bilder = new Map((inn.bilder.trinn ?? []).map((b) => [b.trinn, b.bilde]))
  const tilgjengelig = [...bilder.keys()].sort((a, b) => a - b)
  // Hvert steg får sitt eget trinn (fra templatet eller ut fra teksten);
  // steg uten treff arver forrige. Forberedelser (kapping, oppmerking av
  // materialer) samles først uten illustrasjon.
  const ordbok = modellOrdbok(inn.modell)
  const FORBEREDELSE = /^(kapp|klargjør|forbered|sorter|les gjennom|bestill|hent)/i
  let gjeldende: number | null = null
  const grupper: Array<{ trinn: number; steg: MonteringSteg[] }> = []
  for (const st of steg) {
    const tekst = `${st.tittel} ${st.tekst}`.trim()
    const eks = st.trinn ? TRINN.indexOf(st.trinn as (typeof TRINN)[number]) : -1
    let t: number
    if (eks >= 0) t = eks
    else if (FORBEREDELSE.test(tekst) && grupper.length === 0) t = -1
    else t = trinnForSteg(tekst, ordbok) ?? gjeldende ?? -1
    // Byggingen går fremover: et steg som nevner en tidligere del (f.eks.
    // «fest kledningen til stolpene») hører til trinnet vi allerede er i.
    if (gjeldende !== null && gjeldende >= 0 && t < gjeldende && eks < 0) t = gjeldende
    gjeldende = t
    // Vis illustrasjonen for nærmeste trinn som finnes i modellen.
    const medBilde = tilgjengelig.filter((x) => x <= t)
    const visTrinn = t < 0 ? -1 : medBilde.length ? medBilde[medBilde.length - 1] : tilgjengelig[0] ?? t
    const siste = grupper[grupper.length - 1]
    if (siste && siste.trinn === visTrinn) siste.steg.push(st)
    else grupper.push({ trinn: visTrinn, steg: [st] })
  }
  // Trinn uten tekst men med bilde: vis bildet (f.eks. ferdig modell).
  let nr = 1
  let trinnNr = 1
  for (const g of grupper) {
    const bilde = g.trinn >= 0 ? bilder.get(g.trinn) : undefined
    const tittel = g.trinn < 0 ? 'Forberedelser' : `Trinn ${trinnNr++} – ${TRINN_NAVN[TRINN[g.trinn]] ?? 'Montering'}`
    s.plass(bilde ? 64 : 20)
    s.f.rekt(SL, s.y, BREDDE, 7.5, { strek: null, fyll: C.aksentLys })
    s.f.tekst(tittel, SL + 3, s.y + 5.1, { str: 9.5, vekt: 'bold', farge: C.aksent })
    s.y += 10
    const startY = s.y
    const bildeW = bilde ? 70 : 0
    if (bilde) {
      s.f.rekt(SL, startY, bildeW, 50, { strek: null, fyll: '#f2f1ee' })
      s.f.bilde(bilde, SL + 1, startY + 1, bildeW - 2, 48)
    }
    const tx = SL + (bilde ? bildeW + 5 : 0)
    const tw = BREDDE - (bilde ? bildeW + 5 : 0)
    let y = startY
    for (const st of g.steg) {
      const full = y > startY + 50
      const x = full ? SL : tx
      const w = full ? BREDDE : tw
      const tLinjer = st.tittel ? brytTekst(s.f, st.tittel, w - 9, 8.8, 'bold') : []
      const linjer = brytTekst(s.f, st.tekst, w - 9, 8.4)
      const h = tLinjer.length * 3.8 + linjer.length * 3.6 + (st.advarsel ? 6 : 0) + 3
      if (y + h > BUNN) { s.ny(); y = s.y }
      s.f.sirkel(x + 3, y + 2.6, 2.8, { strek: null, fyll: C.tekst })
      s.f.tekst(String(nr++), x + 3, y + 2.7, { str: 7.4, vekt: 'bold', farge: '#ffffff', juster: 'center', grunnlinje: 'middle' })
      let ly = y + 3.6
      for (const l of tLinjer) { s.f.tekst(l, x + 8, ly, { str: 8.8, vekt: 'bold' }); ly += 3.8 }
      for (const l of linjer) { s.f.tekst(l, x + 8, ly, { str: 8.4 }); ly += 3.6 }
      if (st.advarsel) {
        s.f.tekst(`! ${st.advarsel}`, x + 8, ly + 1, { str: 8, vekt: 'bold', farge: C.adv })
        ly += 5
      }
      y = ly + 2
    }
    s.y = Math.max(y, bilde ? startY + 52 : y) + 3
  }
}

// ── Konstruksjonsgrunnlag ───────────────────────────────────────────────

const STANDARDER: Array<{ kode: string; tittel: string }> = [
  { kode: 'TEK17', tittel: 'Byggteknisk forskrift – krav til sikkerhet, konstruksjon og fukt' },
  { kode: 'SAK10', tittel: 'Byggesaksforskriften – søknadsplikt og unntak (§ 4-1)' },
  { kode: 'NS-EN 1990', tittel: 'Eurokode 0: Grunnlag for prosjektering av konstruksjoner' },
  { kode: 'NS-EN 1991-1-3', tittel: 'Eurokode 1: Snølaster (med nasjonalt tillegg)' },
  { kode: 'NS-EN 1991-1-4', tittel: 'Eurokode 1: Vindlaster (med nasjonalt tillegg)' },
  { kode: 'NS-EN 1995-1-1', tittel: 'Eurokode 5: Prosjektering av trekonstruksjoner' },
  { kode: 'NS-EN 338', tittel: 'Konstruksjonstrevirke – fasthetsklasser (C24)' },
  { kode: 'NS-EN 14081-1', tittel: 'Fasthetssortert konstruksjonstrevirke – CE-merking' },
  { kode: 'NTR', tittel: 'Nordisk Trebeskyttelsesråd – impregneringsklasse AB (over mark) og A (jordkontakt)' },
  { kode: 'SINTEF Byggforsk', tittel: 'Byggdetaljer for trekonstruksjoner, fundamentering og terrasser' },
]

const FORBEHOLD = 'Byggeplanen er generert automatisk fra designet ditt og er et veiledende grunnlag for selvbygging. Den erstatter ikke prosjektering av foretak med ansvarsrett der plan- og bygningsloven krever det. Kontroller lokale snø- og vindlaster for byggestedet, grunnforhold og frostfri dybde, og at tiltaket følger reguleringsplan, TEK17 og kommunens krav. Minio er ikke ansvarlig søker, prosjekterende eller utførende.'

function utnyttelseFarge(u: number) {
  return u > 1 ? C.feil : u > 0.85 ? C.adv : C.ok
}

function grunnlag(s: Skriver, inn: PlanInn) {
  const b = inn.beregning
  s.seksjon('6', b ? 'Beregningsvedlegg' : 'Konstruksjonsgrunnlag', b
    ? 'Sammendrag av den statiske kontrollen av de bærende delene for gjeldende mål og byggested.'
    : 'Forutsetninger for dimensjonene i planen, og regelverket konstruksjonen bygger på.')
  if (b) {
    if (b.forutsetninger.length) {
      s.under('Forutsetninger')
      tabell(s, [{ tittel: 'Parameter', b: 62 }, { tittel: 'Verdi', b: 45 }, { tittel: 'Kilde / merknad', b: 70 }],
        b.forutsetninger.map((v) => [v.navn, { tekst: `${typeof v.verdi === 'number' ? desimal(v.verdi, v.verdi % 1 ? 2 : 0) : v.verdi}${v.enhet ? ` ${v.enhet}` : ''}`, vekt: 'bold' }, v.kilde ?? '']))
    }
    if (b.laster.length) {
      s.under('Laster')
      tabell(s, [{ tittel: 'Last', b: 52 }, { tittel: 'Uttrykk', b: 80 }, { tittel: 'Verdi', b: 45, juster: 'right' }],
        [...b.laster, ...(b.lastkombinasjoner ?? [])].map((l) => [`${l.navn}${l.symbol ? ` (${l.symbol})` : ''}`, l.uttrykk ?? l.kommentar ?? '', { tekst: `${desimal(l.verdi, 2)} ${l.enhet}`, vekt: 'bold' }]))
    }
    if (b.kontroller.length) {
      s.under('Kontroll av bærende deler')
      const rader = b.kontroller.map((k) => [
        { tekst: k.pos ?? '', vekt: 'bold' as const, farge: C.aksent },
        { tekst: k.komponent, vekt: 'bold' as const },
        `${k.tverrsnitt}${k.kvalitet ? ` ${k.kvalitet}` : ''}${k.ccMm ? ` c/c ${mm(k.ccMm)}` : ''}`,
        k.spennMm ? mm(k.spennMm) : '–',
        `${k.kontroll}${k.krav ? ` (${k.krav})` : ''}`,
        { tekst: `${Math.round(k.utnyttelse * 100)} %`, vekt: 'bold' as const, farge: utnyttelseFarge(k.utnyttelse) },
      ])
      tabell(s, [{ tittel: 'Pos', b: 10 }, { tittel: 'Komponent', b: 38 }, { tittel: 'Tverrsnitt', b: 38 }, { tittel: 'Spenn', b: 16, juster: 'right' }, { tittel: 'Kontroll', b: 55 }, { tittel: 'Utn.', b: 20, juster: 'right' }], rader)
      s.avsnitt('Utnyttelse under 100 % betyr at kravet er oppfylt. Grønn < 85 %, gul 85–100 %, rød > 100 %.', { str: 7.4, farge: C.dempet })
    }
    if (b.merknader?.length) { s.under('Merknader'); s.punkter(b.merknader, { str: 8.4 }) }
  } else {
    s.under('Dimensjonering')
    s.avsnitt('Bærende deler er valgt etter forenklede, konservative regler: konstruksjonsvirke i fasthetsklasse C24, senteravstand maks 600 mm, og spennvidder for bjelker, dragere og sperrer gradert for en karakteristisk snølast på mark på ca. 3,0 kN/m². Bygger du i et område med høyere snølast (innlandet, fjellet, Nord-Norge), må dimensjonene kontrolleres for din kommune før bygging.')
    s.punkter([
      'Bruk CE-merket, fasthetssortert virke (C24) i alle bærende deler – ikke umerket «materialer».',
      'Virke med jordkontakt skal være impregnert i klasse NTR A; virke over mark NTR AB.',
      'Åpninger i bærende vegger skal ha opplegg (bæringsstender) i begge sider.',
      'Stolper skal stå på fundament til frostfri dybde, eller på justerbare stolpesko over terreng – aldri med endeved rett i jord.',
      'Sperrer og bjelker festes med beslag i hvert opplegg for å ta opp vindsug.',
    ], { str: 8.6 })
  }
  const bs = b?.byggesak
  if (bs || inn.byggeregler) {
    s.under('Byggesak')
    const tittel = bs?.tittel ?? inn.byggeregler!.tittel
    const ok = bs ? bs.sokfri === true : inn.byggeregler!.sokfri
    s.plass(10)
    s.f.rekt(SL, s.y, BREDDE, 7.4, { strek: null, fyll: ok ? '#e9f4ee' : '#fbf1e2' })
    s.f.tekst(tittel, SL + 3, s.y + 5, { str: 9, vekt: 'bold', farge: ok ? C.ok : C.adv })
    s.y += 10
    s.punkter(bs?.punkter ?? inn.byggeregler!.punkter, { str: 8.4 })
    if (bs?.hjemmel?.length) s.avsnitt(`Hjemmel: ${bs.hjemmel.join('; ')}`, { str: 7.6, farge: C.dempet })
  }
  s.under('Standarder og anvisninger')
  tabell(s, [{ tittel: 'Kode', b: 38 }, { tittel: 'Tittel', b: 139 }], (b?.standarder?.length ? b.standarder : STANDARDER).map((x) => [{ tekst: x.kode, vekt: 'bold' }, x.tittel]))
  s.under('Forbehold')
  s.avsnitt(b?.forbehold || FORBEHOLD, { str: 8, farge: C.dempet })
}

// ── Råd ─────────────────────────────────────────────────────────────────

function raad(s: Skriver, inn: PlanInn) {
  s.seksjon('7', 'Råd om utførelse og vedlikehold')
  if (inn.raad.length) { s.under('Råd for ditt prosjekt'); s.punkter(inn.raad, { str: 8.6 }) }
  s.under('Festemidler')
  s.punkter([
    'Bruk varmforsinkede eller rustfrie (A4) skruer og beslag utendørs – impregnert virke korroderer vanlig stål.',
    'Forbor nær endene for å unngå sprekker, og senk skruehodene i synlige flater.',
    'Bærende forbindelser (sperrer, bjelker, stolper) skal ha beslag eller bolter som angitt – ikke bare skruer i endeved.',
  ], { str: 8.6 })
  s.under('Overflatebehandling i norsk klima')
  s.punkter([
    'La impregnert virke tørke noen uker før behandling, ellers fester ikke olje eller beis seg.',
    'Forsegl endeved ekstra – det er der vannet trekker inn og råte starter.',
    'Olje gir et naturlig uttrykk og fornyes årlig; beis/dekkbeis beskytter lenger mot UV og gråning.',
    'Hev konstruksjonen fra bakken og unngå stående vann – konstruktiv trebeskyttelse varer lengst.',
    'Se over skruer, beslag og tekking hvert år, og skift ut skadde bord tidlig.',
  ], { str: 8.6 })
}

// ── Hovedfunksjon ───────────────────────────────────────────────────────

export interface PlanResultat {
  ark: Ark[]
  antallSider: number
  /** Etikett per side (forhåndsvisning/miniatyrer). */
  sider: Array<{ navn: string; type: 'forside' | 'info' | 'ark' | 'tekst' }>
}

/** Bygger hele byggeplanen på dokumentet. */
/**
 * Bygger hele byggeplanen. Kjøres i to pass: det første (på et kast-dokument
 * av samme type) finner sidetallene, det andre tegner med riktig
 * tegningsliste og innholdsfortegnelse – også når prosjektinfoen går over
 * flere sider.
 */
export function byggPlan<D extends Dok>(lagDok: () => D, inn: PlanInn): { dok: D; res: PlanResultat } {
  const forste = tegnPlan(lagDok(), inn)
  const dok = lagDok()
  const res = tegnPlan(dok, inn, forste)
  return { dok, res }
}

interface Sidetall { arkSider: Array<number | undefined>; seksjoner: Array<[string, string]>; infoSide: number }

function tegnPlan(dok: Dok, inn: PlanInn, ref?: Sidetall): PlanResultat & Sidetall {
  const { rader: pos, merkeFor } = byggPosisjoner(inn)

  // Tegninger: A = templatets riss, K = fra 3D-modellen, D = detaljer.
  const aTeg = (inn.tegning?.riss ?? []).map(rissTilTegning)
  const { tegninger: kTeg } = byggModellTegninger(inn.modell, { merkeFor })
  const kvalitet = kvalitetFor('konstruksjon', String(inn.config.treslag ?? ''))
  const vinkel = typeof inn.config.takvinkel === 'number' ? inn.config.takvinkel : takvinkelFraModell(inn.modell)
  const dTeg = velgDetaljer({ deler: inn.modell, kvalitet, takvinkel: vinkel })
  const navn = (tgs: Tegning[]) => {
    if (tgs.length === 1) return tgs[0].navn
    if (tgs.every((t) => t.type === 'detalj')) return 'Detaljer'
    if (tgs.every((t) => t.type === 'fasade')) return 'Fasader'
    if (tgs.every((t) => t.type === 'plan')) return 'Planer'
    return tgs.map((t) => t.navn.replace(/ – konstruksjon/, '')).join(', ')
  }
  const ark = [
    ...planleggArk(aTeg, 'A', 1, navn),
    ...planleggArk(kTeg, 'K', 1, (t) => (t.length > 1 && t.every((x) => x.type === 'oppriss') ? 'Konstruksjon – oppriss' : navn(t))),
    ...planleggArk(dTeg, 'D', 1, navn),
  ]

  // Sideplan: 1 forside, 1–2 prosjektinfo, så ark … Vi kjenner ikke antall
  // tekstsider på forhånd, så tegningslista får sidetall i etterkant.
  const innhold = [
    `${ark.length} tegningsark (plan, oppriss, snitt${dTeg.length ? ', detaljer' : ''})`,
    'materialliste med priser',
    'kappliste med vinkler og kappeplan',
    'monteringsanvisning med illustrasjoner',
    inn.beregning ? 'beregningsvedlegg' : 'konstruksjonsgrunnlag og byggesak',
  ]
  const f0 = dok.nySide('p')
  forside(f0, inn, innhold)

  // Prosjektinfo (fra side 2). Sidetallene i listene kommer fra første pass.
  const infoSide = dok.antallSider
  if (ref) ark.forEach((a, i) => { a.side = ref.arkSider[i] })
  const info = new Skriver(dok)
  const plassholder: Array<[string, string]> = [['00', 'Materialliste'], ['00', 'Kappliste og kappeplan'], ['00', 'Montering trinn for trinn'], ['00', 'Konstruksjonsgrunnlag'], ['00', 'Råd om utførelse og vedlikehold']]
  prosjektinfo(info, inn, ark, [[String(infoSide + 1), 'Prosjektinformasjon'], [ref?.arkSider[0] !== undefined ? String(ref.arkSider[0]! + 1) : '00', 'Tegninger'], ...(ref?.seksjoner ?? plassholder)])

  // Tegningsark.
  for (const a of ark) {
    const f = dok.nySide('l')
    a.side = dok.antallSider - 1
    tegnArk(f, a, inn, pos)
  }

  const seksjonSider: Array<[string, string]> = []
  const s = new Skriver(dok)
  seksjonSider.push([String(s.sider[0] + 1), 'Materialliste'])
  materialliste(s, inn)
  s.ny()
  seksjonSider.push([String(s.sider[s.sider.length - 1] + 1), 'Kappliste og kappeplan'])
  kappliste(s, inn, pos)
  s.ny()
  seksjonSider.push([String(s.sider[s.sider.length - 1] + 1), 'Montering trinn for trinn'])
  montering(s, inn)
  s.ny()
  seksjonSider.push([String(s.sider[s.sider.length - 1] + 1), inn.beregning ? 'Beregningsvedlegg og byggesak' : 'Konstruksjonsgrunnlag og byggesak'])
  grunnlag(s, inn)
  s.ny()
  seksjonSider.push([String(s.sider[s.sider.length - 1] + 1), 'Råd om utførelse og vedlikehold'])
  raad(s, inn)


  // Topp- og bunntekst på alle stående sider (unntatt forsiden) + sidetall i tegningshodene.
  const N = dok.antallSider
  const arkSider = new Set(ark.map((a) => a.side))
  for (let i = 1; i < N; i++) {
    const f = dok.side(i)
    if (arkSider.has(i)) {
      f.tekst(`Side ${i + 1} av ${N}`, AR - 2, AT + 4.6, { str: 6.2, farge: C.svak, juster: 'right' })
      f.tekst(`Plan-ID ${inn.planId}`, AL + 2, AT + 4.6, { str: 6.2, farge: C.svak })
      continue
    }
    tegnLogo(f, inn, SL, 9, 4.4)
    f.tekst(`BYGGEPLAN · ${inn.tittel}`.toUpperCase(), 210 - SR, 12.4, { str: 6.6, farge: C.svak, juster: 'right', sperring: 0.3 })
    f.strek(SL, 16, 210 - SR, 16, { bredde: 0.2, strek: C.linje })
    f.strek(SL, 285, 210 - SR, 285, { bredde: 0.2, strek: C.linje })
    f.tekst(`Plan-ID ${inn.planId} · Rev. ${inn.revisjon} · ${inn.dato}`, SL, 289.5, { str: 6.6, farge: C.svak })
    f.tekst('minio.no', 105, 289.5, { str: 6.6, farge: C.svak, juster: 'center' })
    f.tekst(`Side ${i + 1} av ${N}`, 210 - SR, 289.5, { str: 6.6, farge: C.svak, juster: 'right' })
  }
  const sider: PlanResultat['sider'] = Array.from({ length: N }, () => ({ navn: '', type: 'tekst' as const }))
  sider[0] = { navn: 'Forside', type: 'forside' }
  for (const i of info.sider) sider[i] = { navn: 'Prosjektinformasjon', type: 'info' }
  for (const a of ark) if (a.side !== undefined) sider[a.side] = { navn: `${a.nr} ${a.tittel}`, type: 'ark' }
  const starter = seksjonSider.map(([side, navn]) => [Number(side) - 1, navn] as [number, string])
  let gjeldende = ''
  for (let i = 0; i < N; i++) {
    const start = starter.find(([sd]) => sd === i)
    if (start) gjeldende = start[1]
    if (!sider[i].navn) sider[i] = { navn: gjeldende || `Side ${i + 1}`, type: 'tekst' }
  }
  return { ark, antallSider: N, sider, arkSider: ark.map((a) => a.side), seksjoner: seksjonSider, infoSide }
}
