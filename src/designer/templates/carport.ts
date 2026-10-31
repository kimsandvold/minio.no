import * as THREE from 'three'
import type { Bom, BuildOptions, DesignConfig, Form2D, Maal2D, ProductTemplate, Riss2D, Tegning2D } from '../types'
import type { Beregningsgrunnlag, BomLinePlan, KapplisteDelPlan, MonteringSteg } from '../plan-typer'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { frostForConfig, grunnForConfig, snolastForConfig } from '../byggested'
import type { SnolastPaMark } from '../snolast-data'
import { BJELKER_C24, DOBLE_C24, KMOD, LIMTRE_GL30C, MATERIALER, STOLPER, dimensjonerDrager, dimensjonerSperre, dimensjonerStolpe, knekkfaktor, kontrollerSoyle, taklaster, tverrsnitt } from '../dimensjonering'
import type { Dimensjonering, Medlemskontroll, Tverrsnitt } from '../dimensjonering'
import { LASTFAKTOR, TAKTEKKE, VB0_STANDARD, fmt, mu1, snoFonnInntilHoyereTak, snolastTak, taktekkeFra, vindOppdrift, vindlast } from '../laster'
import type { Taktekke } from '../laster'
import { fmtGrader, rundOppKapp, sperreGeometri } from '../geometri'
import type { SperreGeometri } from '../geometri'
import { dimensjonerPunktfundament, forankringsraad, frostdybde, FUNDAMENTER } from '../fundament'
import { tilByggeregler, vurderByggesak } from '../byggesak'
import type { ByggesakResultat } from '../byggesak'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { dimensjonerTakstol } from './felles-fagverk'
import type { TakstolResultat } from './felles-fagverk'
import { AX, boks, byggGruppe, halvplanLinje, iXY, iZY, kappLengde, kappVinkler, klippAlle, lagKappliste, omslutt, rad, rekt, stavPoly, tilFormer } from './felles-3d'
import type { KappInfo, P2, Prisme, V3 } from './felles-3d'

/**
 * Carport – parametrisk byggeplan etter norsk praksis (NS-EN 1990/1991/1995 + NA,
 * SINTEF Byggforsk). ÉN modell (`modell(c)`) gir 3D, kappliste, materialliste,
 * 2D-tegninger og beregningsgrunnlag – så de kan ikke drifte fra hverandre.
 *
 * Bæresystem:
 *  - Stolper på justerbare stolpesko, innstøpt i pilarrør til frostfri dybde.
 *  - Dragere langs lengden oppå stolpene (C24 enkel/dobbel eller GL30c limtre),
 *    skjøtt over stolpe. Stolpeavstanden velges så drageren holder.
 *  - Flatt tak (2° fall) / pulttak: sperrer på tvers med fuglemunn (≤ h/3) på
 *    hver drager. Høy drager-rad (eller veggbjelke mot huset) står i høyden
 *    `ovreSvillHoydeMm` fra `sperreGeometri`. Midtdrager-rad legges inn
 *    automatisk når sperrespennet blir for langt.
 *  - Saltak: W/Fink-takstoler c/c ≤ 600 på dragerne (fagverksberegnet).
 *  - En sperre/takstol står over hver stolpelinje, så kneband (45°) avstiver
 *    rammen i begge retninger.
 *
 * Koordinater: x = bredde (venstre = lav side), z = lengde (front = +z), y opp.
 * Bredde/lengde = utvendig mål over stolpene. Alle interne mål i mm.
 */

export interface CarportConfig {
  montering: string // 'frittstående' | 'veggmontert'
  bredde: number // cm – utvendig over stolpene (veggmontert: stolpe → husvegg)
  lengde: number // cm – utvendig over stolpene
  hoyde: number // cm – fri høyde til underkant drager (lav side)
  takvinkel: number // grader (pulttak/saltak)
  taktype: string // 'flatt' | 'pulttak' | 'saltak'
  taktekke: string // 'stålplater' | 'polykarbonat' | 'takpapp' | 'shingel'
  stolpeDim: string // 'auto' | '98x98' | '148x148' – minste stolpe (beregnet kan bli større)
  bjelkeDim: string // utgått (beregnes) – beholdt for lagrede design
  veggtype: string // 'ingen' | 'panel' | 'akryl' | 'kombinert'
  veggSider: string // 'bak' | 'bak+sider' | 'alle'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

// ── Konstanter (mm) ────────────────────────────────────────────────
const OH_RAFT = 300 // takutstikk ved raft (horisontalt fra drager-ytterliv)
const OH_GAVL = 300 // takutstikk ved gavl (fra stolpe-ytterliv til ytterliv endesperre)
const CC_MAKS = 600
const T = 48 // tykkelse sperre/lag
const FT = 50 // overkant fundament over terreng
const PB = 90 // underkant stolpe (stolpesko-klaring 40 mm)
const VEGGBJELKE_H = 198 // veggbjelke mot hus
const FLATT_FALL = 2 // grader for «flatt» tak (≈ 1:29, krav ≥ 1:40)
const LEKT_B = 48
const LEKT_H = 36
const PLY = 18
const VS_T = 22 // vindski/raftebord tykkelse
const VS_H = 148
const STOKK_MAKS = 5400 // lengste vanlige lagerlengde C24
const SVINN = 1.1

const R = rundOppKapp

type Side = 'front' | 'bak' | 'venstre' | 'høyre'

// ── Normalisering ──────────────────────────────────────────────────

interface Norm {
  vegg: boolean
  type: 'flatt' | 'pulttak' | 'saltak'
  vinkel: number
  W: number
  L: number
  h: number
  tekke: Taktekke
  tekkeNavn: string
  sider: Side[]
}

function normaliser(c: CarportConfig): Norm {
  const vegg = c.montering === 'veggmontert'
  let type: Norm['type'] = c.taktype === 'saltak' ? 'saltak' : c.taktype === 'flatt' ? 'flatt' : 'pulttak'
  if (vegg && type === 'saltak') type = 'pulttak' // saltak mot husvegg gir vann mot huset – ikke tillatt
  const vinkel = type === 'flatt' ? FLATT_FALL : Math.max(3, Math.min(45, Number(c.takvinkel) || 10))
  const tekkeNavn = c.taktekke === 'polykarbonat' ? 'Polykarbonat 16 mm' : c.taktekke === 'takpapp' ? 'Takpapp (2-lags)' : c.taktekke === 'shingel' ? 'Asfaltshingel' : 'Stålplater (trapes)'
  const sider: Side[] =
    c.veggtype === 'ingen' ? [] : c.veggSider === 'bak' ? ['bak'] : c.veggSider === 'alle' ? ['front', 'bak', 'venstre', 'høyre'] : ['bak', 'venstre', 'høyre']
  return {
    vegg,
    type,
    vinkel,
    W: Math.max(2000, Number(c.bredde) * 10),
    L: Math.max(2000, Number(c.lengde) * 10),
    h: Math.max(1800, Number(c.hoyde) * 10),
    tekke: taktekkeFra(c.taktekke),
    tekkeNavn,
    sider: vegg ? sider.filter((s) => s !== 'høyre') : sider,
  }
}

const papp = (t: Taktekke) => t === 'takpapp' || t === 'shingel'

// ── Modell ─────────────────────────────────────────────────────────

interface Rad {
  /** Senter x (verden, mm). */
  x: number
  /** Overkant drager (mm over terreng). */
  topp: number
  navn: string
  rolle: 'lav' | 'midt' | 'hoy'
}

interface CarportModell {
  n: Norm
  deler: Prisme[]
  sk: SnolastPaMark
  snoEff: { sk: number; tekst?: string }
  sperre?: Dimensjonering
  sperreGeo?: SperreGeometri
  takstol?: TakstolResultat
  drager: Dimensjonering
  stolpe: Dimensjonering
  stolpeVind: Medlemskontroll
  kneband: Medlemskontroll
  fundament: ReturnType<typeof dimensjonerPunktfundament>
  frost: ReturnType<typeof frostdybde>
  vindQp: number
  oppdriftPerStolpe: number
  byggesak: ByggesakResultat
  rader: Rad[]
  postZ: number[]
  sperreZ: number[]
  ccFaktisk: number
  stolpeAvstand: number
  /** Viktige høyder (mm over terreng). */
  hoyder: { fri: number; gesims: number; mone: number; dragerLav: number }
  takTopp: (x: number) => number
  tvStolpe: Tverrsnitt
  tvDrager: Tverrsnitt
  hSperre: number
  bd: number
  sb: number
  xO: number
  yRef: number
  tak: { xMin: number; xMax: number; zMin: number; zMax: number }
  meldinger: string[]
  renner: number
  vindskiLm: number
}

/** Kneband-ben (vannrett = loddrett), ca. 1/3 av fri høyde, 600–900 mm. */
const kbBenFor = (hFri: number, P = 1e9, sb = 0) => Math.min(Math.max(600, Math.min(900, Math.round((0.33 * hFri) / 50) * 50)), Math.floor(((P - sb) / 2 - 40) / 10) * 10)

/**
 * Dimensjonerende horisontal vindkraft per stolpe (kN). Tvers: kraft normalt på
 * takflaten (c_f = 1,0 – konservativt for åpne tak, NS-EN 1991-1-4 § 7.3) gir
 * horisontalkomponent ∝ tan α, + takkant/renne (c_f 1,3) + halve sideveggen.
 * Langs: gavlflate (takkant + gavltrekant, c_f 1,3) fordelt på alle stolper.
 * Veggmontert: husveggen tar tverrkraften.
 */
function vindPerStolpe(inn: { qp: number; Pmm: number; Wtak: number; tan: number; saltak: boolean; nRader: number; nStolper: number; hp: number; sideVegg: boolean; endeVegg: boolean; vegg: boolean; L: number }): number {
  const kant = 0.3
  // Kledde vegger med vindkryss (stålbånd) tar vinden i sitt plan.
  const tvers = inn.vegg || inn.sideVegg
    ? 0
    : (LASTFAKTOR.Q * inn.qp * (inn.Pmm / 1000) * (1.0 * (inn.Wtak / 1000) * inn.tan + 1.3 * kant + (inn.sideVegg ? 1.3 * (inn.hp / 1000) / 2 : 0))) / inn.nRader
  const rise = inn.saltak ? (inn.Wtak / 2000) * inn.tan : 0
  const gavl = (inn.Wtak / 1000) * (kant + rise / 2) + (inn.endeVegg ? (inn.Wtak / 1000) * (inn.hp / 1000) / 2 : 0)
  if (inn.endeVegg) return tvers
  const langs = ((LASTFAKTOR.Q * 1.3 * inn.qp * gavl) / Math.max(1, inn.nStolper)) * (inn.vegg ? 0.5 : 1)
  return Math.max(tvers, langs)
}

/** Stolpe med leddet fot (stolpesko) og kneband i toppen: aksial + vindmoment V·(h − a) (EC5 6.23/6.24 via kjernen). */
function vindStolpeKontroll(tv: Tverrsnitt, hpMm: number, NGk: number, NSk: number, Vd: number, benMm: number, forklaring: string): Medlemskontroll {
  const Mk = (Vd / LASTFAKTOR.Q) * Math.max(0.1, hpMm / 1000 - benMm / 1000)
  const k = kontrollerSoyle(tv, {
    lengdeM: hpMm / 1000,
    NGk,
    NQk: [{ type: 'sno', Nk: NSk, navn: 'Snø' }],
    MQk: [{ type: 'vind', Mk, navn: `Vind via kneband (V_Ed = ${fmt(Vd, 2)} kN per stolpe, ben ${benMm} mm)` }],
    tjenesteklasse: 3,
  })
  const navn = 'Trykk + bøying (vind via kneband)'
  return {
    ...k,
    navn: 'Stolpe – vind + aksial',
    kontroller: k.kontroller.map((d) => (d.id === 'knekk' ? { ...d, navn } : d)),
    styrende: navn,
    forutsetninger: [forklaring, 'Leddet stolpefot (stolpesko); rammehjørnet avstives av kneband 45° i begge retninger', 'Moment i stolpen ved knebandfestet M = V·(h − a)', ...k.forutsetninger],
  }
}

const cache = new Map<string, CarportModell>()

function modell(c: CarportConfig): CarportModell {
  const key = JSON.stringify(c)
  const hit = cache.get(key)
  if (hit) return hit
  const m = lagModell(c)
  cache.set(key, m)
  if (cache.size > 12) cache.delete(cache.keys().next().value as string)
  return m
}

const imp = (c: CarportConfig) => (c.treslag === 'impregnert' ? 'NTR AB' : TRESLAG[c.treslag]?.label ?? c.treslag)
const kv = (c: CarportConfig, tv: Tverrsnitt) => (tv.materiale.startsWith('GL') ? tv.materiale : `C24 · ${imp(c)}`)
const prisIdFor = (tv: Tverrsnitt) => tv.pris ?? (tv.materiale.startsWith('GL') ? (tv.b === tv.h ? `stolpe-${tv.b}x${tv.h}` : `limtre-${tv.b}x${tv.h}`) : `bjelke-${tv.b}x${tv.h}`)
const pr = (b: number, h: number) => `${b} × ${h} mm`

function lagModell(c: CarportConfig): CarportModell {
  const n = normaliser(c)
  const { W, L, h, vinkel } = n
  const tan = Math.tan(rad(vinkel))
  const cos = Math.cos(rad(vinkel))
  const meldinger: string[] = []
  const sk = snolastForConfig(c)
  const tk = 2 as const

  // Snø: veggmontert inntil hus → snøfonn (NS-EN 1991-1-3 § 5.3.6), konservativ forutsetning om huset.
  let skEff = sk.sk
  let snoTekst: string | undefined
  if (n.vegg) {
    const fonn = snoFonnInntilHoyereTak(sk.sk, 10, W / 1000, 2.0, 30)
    const ls = fonn.ls
    const b = W / 1000
    const muEnde = fonn.mu2 - (fonn.mu2 - 0.8) * Math.min(1, b / ls)
    const muMid = ((fonn.mu2 + muEnde) / 2) * 1.05
    skEff = (sk.sk * Math.max(0.8, muMid)) / 0.8
    snoTekst = `${fonn.forklaring}. Forutsatt husbredde 10 m og 2,0 m fra carporttak til husets takfot (KONTROLLER). Middel over carportbredden × 1,05 → effektiv sk = ${fmt(skEff, 2)} kN/m².`
  }
  const flater = taklaster({ sk: skEff, vinkelGrader: vinkel, tekke: n.tekke })
  const gTak = flater.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk, 0)

  // ── Stolpelinjer langs lengden (z) ──
  const minStolpe = c.stolpeDim === '148x148' ? 148 : c.stolpeDim === '98x98' ? 98 : 0

  // ── Takbærere og rader ──
  let rader: Rad[] = []
  let sperre: Dimensjonering | undefined
  let sperreGeo: SperreGeometri | undefined
  let takstol: TakstolResultat | undefined
  let hSperre = 0
  let ccFaktisk = 0.6

  // Iterasjon: stolpe/drager-valg påvirker rad-geometrien (bredde bd, sb).
  let tvStolpe: Tverrsnitt = tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98')
  let tvDrager: Tverrsnitt = tverrsnitt(48, 198, 2, 'C24', 'bjelke-48x198')
  let drager!: Dimensjonering
  let stolpe!: Dimensjonering
  let postZ: number[] = []
  let P = 0

  for (let iter = 0; iter < 3; iter++) {
    const sb = tvStolpe.b
    const bd = tvDrager.b * tvDrager.antall
    const xVegg = W / 2 // husvegg (veggmontert)
    // Antall rader: 2 (eller 1 + veggbjelke), øk med midtdrager til sperra holder.
    rader = []
    sperre = undefined
    takstol = undefined
    if (n.type === 'saltak') {
      const S = W - sb + bd
      // Takstoler: prøv c/c 600 → 450 → 400 til fagverket holder.
      for (const cc of [0.6, 0.45, 0.4]) {
        takstol = dimensjonerTakstol({ type: 'fink', spennMm: S, vinkelGrader: vinkel, utstikkMm: OH_RAFT, ccM: cc, flatelaster: flater, tjenesteklasse: tk, opplegglengdeMm: bd })
        ccFaktisk = cc
        if (takstol.ok) break
      }
      rader = [
        { x: -W / 2 + sb / 2, topp: 0, navn: 'Stolpe', rolle: 'lav' },
        { x: W / 2 - sb / 2, topp: 0, navn: 'Stolpe', rolle: 'hoy' },
      ]
      hSperre = takstol!.overgurt.valgt.h
    } else {
      const maksRader = 5
      const forsok = n.vegg ? [1, 2, 3, 4] : [2, 3, 4, 5]
      for (const nr of forsok) {
        // Rad-sentre jevnt fordelt.
        const xs: number[] = []
        if (n.vegg) {
          // nr stolperader + veggbjelke; stolperader fra venstre, jevnt mot veggen.
          const fra = -W / 2 + sb / 2
          const spennTot = xVegg - T / 2 - fra
          for (let i = 0; i < nr; i++) xs.push(fra + (i * spennTot) / nr)
        } else {
          const fra = -W / 2 + sb / 2
          const til = W / 2 - sb / 2
          for (let i = 0; i < nr; i++) xs.push(fra + (i * (til - fra)) / (nr - 1))
        }
        const lengsteSpenn = n.vegg ? (xVegg - T / 2 - xs[0]) / nr : (xs[1] - xs[0])
        sperreGeo = sperreGeometri({ vinkelGrader: vinkel, sperreHoydeMm: 198, svillBreddeMm: bd, utstikkMm: OH_RAFT, topp: { type: 'vegg', lopMm: lengsteSpenn + bd, svillBreddeMm: bd, utstikkMm: 0 } })
        sperre = dimensjonerSperre({ spennHorisontalM: lengsteSpenn / 1000, vinkelGrader: vinkel, ccM: CC_MAKS / 1000, tekke: n.tekke, sk: skEff, tjenesteklasse: tk, opplegglengdeMm: Math.min(bd, sperreGeo.fuglemunn.seteMm) })
        rader = xs.map((x, i) => ({ x, topp: 0, navn: i === 0 ? 'Stolpe lav side' : !n.vegg && i === xs.length - 1 ? 'Stolpe høy side' : 'Midtstolpe', rolle: i === 0 ? 'lav' : !n.vegg && i === xs.length - 1 ? 'hoy' : 'midt' }))
        if (sperre.ok || nr === forsok[forsok.length - 1] || nr >= maksRader) break
      }
      hSperre = sperre!.valgt.h
      ccFaktisk = 0.6
    }

    // Stolpeavstand langs lengden + drager.
    const lastbredde = (() => {
      if (n.type === 'saltak') return (W - sb + bd) / 2 / 1000 + OH_RAFT / 1000
      let maks = 0
      const xs = rader.map((r) => r.x)
      const ytre = n.vegg ? [...xs, xVegg] : xs
      for (let i = 0; i < xs.length; i++) {
        const v = i === 0 ? OH_RAFT + (ytre[1] - ytre[0]) / 2 : i === ytre.length - 1 ? OH_RAFT + (ytre[i] - ytre[i - 1]) / 2 : (ytre[i + 1] - ytre[i - 1]) / 2
        maks = Math.max(maks, v)
      }
      return maks / 1000
    })()
    // C24 foretrekkes (pris/tilgjengelighet); limtre først når ingen C24 holder.
    const dragerKandC24 = [...BJELKER_C24.filter((t) => t.h >= 148), ...DOBLE_C24]
    const qpEst = vindlast(VB0_STANDARD, 2, Math.max(4, (h + W * tan * (n.type === 'saltak' ? 0.5 : 1) + 600) / 1000)).qp
    let valgt: { d: Dimensjonering; s: Dimensjonering; np: number; v: Medlemskontroll } | undefined
    const ns0 = Math.max(1, Math.ceil((L - 148) / 3000 - 1e-9))
    for (let np = ns0; np <= ns0 + 6; np++) {
      const Pm = (L - 148) / np
      if (Pm < 1500 && np > ns0) break
      // Stolpekandidater i stigende areal: C24 98, GL 115, GL 140, C24 148 (90×90 er smalere enn en dobbel drager).
      const stolpeKand = STOLPER.filter((t) => t.b >= Math.max(98, minStolpe)).sort((a, b) => a.b * a.h - b.b * b.h)
      for (const sp of stolpeKand) {
        const dIn = { spennM: Pm / 1000, lastbreddeM: lastbredde, flatelaster: flater, sidestottet: true, tjenesteklasse: tk, opplegglengdeMm: sp.b }
        let d = dimensjonerDrager({ ...dIn, kandidater: dragerKandC24.filter((t) => t.b * t.antall <= sp.b + 2) })
        if (!d.ok) d = dimensjonerDrager({ ...dIn, kandidater: LIMTRE_GL30C.filter((t) => t.b <= sp.b + 2) })
        if (!d.ok) continue
        const hoydeMaks = (h + (n.type === 'saltak' ? 0 : (W - sb) * tan)) / 1000
        const s = dimensjonerStolpe({
          lengdeM: hoydeMaks,
          belastningsarealM2: (Pm / 1000) * lastbredde,
          flatelaster: flater,
          ekstraNGk: (5 * d.valgt.b * d.valgt.antall * d.valgt.h * 1e-6 * Pm) / 1000,
          tjenesteklasse: 3,
          kandidater: [sp],
        })
        if (!s.ok) continue
        const Wtak = (n.type === 'saltak' ? W - sp.b + d.valgt.b * d.valgt.antall : W) + 2 * OH_RAFT
        const Vd = vindPerStolpe({ qp: qpEst, Pmm: Pm, Wtak, tan, saltak: n.type === 'saltak', nRader: rader.length, nStolper: rader.length * (np + 1), hp: h, sideVegg: n.sider.includes('venstre'), endeVegg: n.sider.includes('bak'), vegg: n.vegg, L })
        const NGk = (s.kontroll.laster.find((l) => l.type === 'egen')?.verdi ?? 0)
        const NSk = s.kontroll.laster.filter((l) => l.type === 'sno').reduce((a, l) => a + l.verdi, 0)
        const v = vindStolpeKontroll(sp, hoydeMaks * 1000, NGk, NSk, Vd, kbBenFor(h, Pm, sp.b), '')
        if (!v.ok) continue
        valgt = { d, s, np, v }
        break
      }
      if (valgt) break
    }
    if (!valgt) {
      const np = ns0 + 2
      const Pm = (L - 148) / np
      const d = dimensjonerDrager({ spennM: Pm / 1000, lastbreddeM: lastbredde, flatelaster: flater, sidestottet: true, tjenesteklasse: tk, opplegglengdeMm: 148, kandidater: [...dragerKandC24, ...LIMTRE_GL30C].filter((t) => t.b * t.antall <= 150) })
      const s = dimensjonerStolpe({ lengdeM: h / 1000, belastningsarealM2: (Pm / 1000) * lastbredde, flatelaster: flater, tjenesteklasse: 3, kandidater: STOLPER.filter((t) => t.b >= 140) })
      valgt = { d, s, np, v: vindStolpeKontroll(s.valgt, h, 0, 0, 0, 600, '') }
      meldinger.push('Stolpe/drager holder ikke med standarddimensjoner (snø- og vindlast) – øk antall stolper, kle en vegg som vindavstivning eller få konstruksjonen prosjektert av RIB.')
    }
    drager = valgt.d
    stolpe = valgt.s
    const nyStolpe = valgt.s.valgt
    const nyDrager = valgt.d.valgt
    const endret = nyStolpe.id !== tvStolpe.id || nyDrager.id !== tvDrager.id
    tvStolpe = nyStolpe
    tvDrager = nyDrager
    P = (L - tvStolpe.b) / valgt.np
    postZ = Array.from({ length: valgt.np + 1 }, (_, i) => -L / 2 + tvStolpe.b / 2 + i * P)
    if (!endret) break
  }

  const sb = tvStolpe.b
  const bd = tvDrager.b * tvDrager.antall
  const hd = tvDrager.h
  const kbBen = kbBenFor(h, P, sb)
  const xO = -W / 2 + sb / 2 - bd / 2
  const yLavTopp = h + hd // overkant lav drager (= referanse for sperregeometri)
  const xVegg = W / 2

  // ── Sperre-/takstolgeometri ──
  let geo: SperreGeometri
  const sperreH = hSperre
  if (n.type === 'saltak') {
    const S = W - sb + bd
    geo = sperreGeometri({ vinkelGrader: vinkel, sperreHoydeMm: sperreH, svillBreddeMm: bd, utstikkMm: OH_RAFT, topp: { type: 'mone', lopMm: S / 2, moneTykkelseMm: 0 } })
    rader.forEach((r) => (r.topp = yLavTopp))
  } else {
    const xHoy = n.vegg ? xVegg : rader[rader.length - 1].x + bd / 2
    const lop = xHoy - xO
    geo = sperreGeometri({
      vinkelGrader: vinkel,
      sperreHoydeMm: sperreH,
      svillBreddeMm: bd,
      utstikkMm: OH_RAFT,
      topp: n.vegg ? { type: 'vegg', lopMm: lop, svillBreddeMm: T, utstikkMm: 0, toppkutt: 'lodd' } : { type: 'vegg', lopMm: lop, svillBreddeMm: bd, utstikkMm: OH_RAFT },
    })
    rader.forEach((r, i) => {
      const xh = r.x - bd / 2 - xO // nedre (downhill) ytterliv målt fra ytterliv lav drager
      r.topp = yLavTopp + (i === 0 ? 0 : !n.vegg && i === rader.length - 1 ? geo.ovreSvillHoydeMm ?? xh * tan : xh * tan)
    })
  }
  const s = geo.fuglemunn.seteMm
  if (!geo.fuglemunn.ok) meldinger.push(...geo.merknader)

  // Sperre/takstol over hver stolpelinje + jevnt c/c i feltene.
  const zEnde = L / 2 + OH_GAVL - T / 2
  const felt = (a: number, b: number, cc: number) => {
    const k = Math.max(1, Math.ceil((b - a) / cc - 1e-9))
    return Array.from({ length: k }, (_, i) => a + (i * (b - a)) / k)
  }
  const ccMm = ccFaktisk * 1000
  const sperreZ: number[] = []
  sperreZ.push(...felt(-zEnde, postZ[0], ccMm))
  for (let i = 0; i < postZ.length - 1; i++) sperreZ.push(...felt(postZ[i], postZ[i + 1], ccMm))
  sperreZ.push(...felt(postZ[postZ.length - 1], zEnde, ccMm), zEnde)

  // ── Prismer ──
  const deler: Prisme[] = []
  let orden = 0
  const ORD: Record<string, number> = {}
  const ordFor = (navn: string) => (ORD[navn] ??= orden++)
  const leggTil = (p: Omit<Prisme, 'kapp'> & { kapp?: Omit<KappInfo, 'orden'> }) => {
    deler.push({ ...p, kapp: p.kapp ? { ...p.kapp, orden: ordFor(p.navn) } : undefined } as Prisme)
  }
  const kvTre = (tv: Tverrsnitt) => kv(c, tv)

  // Fundament + stolpesko + stolper.
  const stolpeProfil = tvStolpe.profil
  const yStolpeTopp = (r: Rad) => r.topp - hd
  const postPos: Array<{ x: number; z: number; rad: Rad }> = []
  rader.forEach((r) => postZ.forEach((z) => postPos.push({ x: r.x, z, rad: r })))
  // Endevegg-stolper (veggstolper) ved kledning av front/bak.
  const veggStolper: Array<{ x: number; z: number; topp: number }> = []
  for (const side of n.sider) {
    if (side !== 'front' && side !== 'bak') continue
    const z = side === 'front' ? postZ[postZ.length - 1] : postZ[0]
    const xs = rader.map((r) => r.x)
    if (n.vegg) xs.push(xVegg - sb / 2)
    for (let i = 0; i < xs.length - 1; i++) {
      const k = Math.ceil((xs[i + 1] - xs[i]) / 2400 - 1e-9)
      for (let j = 1; j < k; j++) {
        const x = xs[i] + (j * (xs[i + 1] - xs[i])) / k
        veggStolper.push({ x, z, topp: 0 })
      }
    }
  }

  const fundDybde = frostForConfig(c, { snofri: true }) // under tak: snøfri
  const fundamentPoly: P2[] = Array.from({ length: 12 }, (_, i) => [150 * Math.cos((i * Math.PI) / 6), 150 * Math.sin((i * Math.PI) / 6)] as P2)
  const leggFundament = (x: number, z: number, idx: string) => {
    leggTil({ pid: `fundament-${idx}`, part: 'fundament', navn: 'Punktfundament (pilarrør på såle)', profil: 'Ø300 betong', poly: fundamentPoly.map(([u, v]) => [u + x, v + z] as P2), O: [0, FT, 0], U: AX.x, V: AX.z, W: AX['-y'], t: FT + 150, flate: 'betong', explode: [0, -0.5, 0] })
    // Stolpesko: bunnplate, stamme, toppplate og to vinger.
    const sk2 = sb / 2 + 4
    leggTil({ pid: `stolpesko-${idx}-b`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', ...boks([x - 75, FT, z - 75], [x + 75, FT + 6, z + 75]), flate: 'metall', explode: [0, -0.35, 0] })
    leggTil({ pid: `stolpesko-${idx}-s`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', ...boks([x - 10, FT + 6, z - 10], [x + 10, PB - 6, z + 10]), flate: 'metall', explode: [0, -0.35, 0] })
    leggTil({ pid: `stolpesko-${idx}-t`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', ...boks([x - sk2, PB - 6, z - 50], [x + sk2, PB, z + 50]), flate: 'metall', explode: [0, -0.35, 0] })
    for (const sx of [-1, 1]) leggTil({ pid: `stolpesko-${idx}-v${sx}`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', ...boks([x + sx * sk2 - (sx > 0 ? 4 : 0), PB, z - 50], [x + sx * sk2 + (sx < 0 ? 4 : 0), PB + 150, z + 50]), flate: 'metall', explode: [0, -0.35, 0] })
  }
  postPos.forEach((p, i) => {
    leggFundament(p.x, p.z, `${i}`)
    const top = yStolpeTopp(p.rad)
    const lengde = top - PB
    leggTil({
      pid: `stolpe-${i}`,
      part: 'stolpe',
      navn: p.rad.navn,
      profil: stolpeProfil,
      ...boks([p.x - sb / 2, PB, p.z - sb / 2], [p.x + sb / 2, top, p.z + sb / 2]),
      flate: 'tre',
      explode: [Math.sign(p.x) * 0.3, 0, 0],
      kapp: { kvalitet: kvTre(tvStolpe), lengdeMm: R(lengde), prisId: prisIdFor(tvStolpe), kategori: 'konstruksjon', merknad: 'Rett kapp begge ender. Endeved forsegles.' },
    })
    // Stolpehodebeslag (U-beslag): flens på stolpens sider, opp langs dragerens sider, med hylle imellom.
    for (const sx of [-1, 1]) {
      const xs = p.x + (sx * sb) / 2
      const xd = p.x + (sx * bd) / 2
      const ex: V3 = [sx * 0.1, 0.1, 0]
      leggTil({ pid: `stolpehode-${i}-${sx}-a`, part: 'beslag', navn: 'Stolpehodebeslag', profil: 'varmforsinket', ...boks([Math.min(xs, xs + sx * 4), top - 120, p.z - 45], [Math.max(xs, xs + sx * 4), top, p.z + 45]), flate: 'metall', explode: ex })
      leggTil({ pid: `stolpehode-${i}-${sx}-b`, part: 'beslag', navn: 'Stolpehodebeslag', profil: 'varmforsinket', ...boks([Math.min(xd, xd + sx * 4), top, p.z - 45], [Math.max(xd, xd + sx * 4), top + Math.min(110, hd - 20), p.z + 45]), flate: 'metall', explode: ex })
      if (Math.abs(sb - bd) > 2) leggTil({ pid: `stolpehode-${i}-${sx}-c`, part: 'beslag', navn: 'Stolpehodebeslag', profil: 'varmforsinket', ...boks([Math.min(xs, xd), top - 4, p.z - 45], [Math.max(xs, xd) + (sx > 0 ? 4 : 0), top, p.z + 45]), flate: 'metall', explode: ex })
    }
  })

  // ── Dragere (med skjøt over stolpe, forskjøvet i doble lag) ──
  const zD0 = -(L / 2 + OH_GAVL)
  const zD1 = L / 2 + OH_GAVL
  const lagAnt = tvDrager.materiale.startsWith('GL') ? 1 : tvDrager.antall
  const lagB = tvDrager.materiale.startsWith('GL') ? bd : tvDrager.b
  const dragerBiter = (lag: number): Array<[number, number]> => {
    const maks = tvDrager.materiale.startsWith('GL') ? 13500 : STOKK_MAKS
    if (zD1 - zD0 <= maks) return [[zD0, zD1]]
    const biter: Array<[number, number]> = []
    let a = zD0
    let forste = true
    while (zD1 - a > maks) {
      // Lengste skjøt over en stolpe innenfor maks; lag 2 starter ett felt kortere (forskjøvne skjøter).
      const kand = postZ.filter((z) => z - a <= maks && z > a + 500)
      let b = kand[kand.length - 1]
      if (forste && lag % 2 === 1 && kand.length > 1) b = kand[kand.length - 2]
      if (b === undefined) break
      biter.push([a, b])
      a = b
      forste = false
    }
    biter.push([a, zD1])
    return biter
  }
  rader.forEach((r, ri) => {
    for (let lag = 0; lag < lagAnt; lag++) {
      const x0 = r.x - bd / 2 + lag * lagB
      dragerBiter(lag).forEach(([a, b], bi) => {
        leggTil({
          pid: `drager-${ri}-${lag}-${bi}`,
          part: 'drager',
          navn: r.rolle === 'midt' ? 'Midtdrager' : 'Drager',
          profil: tvDrager.materiale.startsWith('GL') ? tvDrager.profil : tvDrager.boardProfil,
          ...boks([x0, r.topp - hd, a], [x0 + lagB, r.topp, b]),
          flate: 'tre',
          darken: 0.96,
          explode: [Math.sign(r.x) * 0.3, 0.2, 0],
          kapp: { kvalitet: kvTre(tvDrager), lengdeMm: R(b - a), prisId: prisIdFor(tvDrager), kategori: 'konstruksjon', merknad: lagAnt > 1 ? `${lagAnt} lag spikres/skrus sammen c/c 300, skjøter forskjøvet over stolpe` : bi > 0 || b < zD1 ? 'Skjøt midt over stolpe' : undefined },
        })
      })
    }
  })

  // ── Veggbjelke mot husvegg ──
  let veggbjelkeTopp = 0
  if (n.vegg) {
    veggbjelkeTopp = yLavTopp + (geo.ovreSvillHoydeMm ?? 0)
    leggTil({
      pid: 'veggbjelke',
      part: 'drager',
      navn: 'Veggbjelke mot hus',
      profil: pr(T, VEGGBJELKE_H),
      ...boks([xVegg - T, veggbjelkeTopp - VEGGBJELKE_H, zD0], [xVegg, veggbjelkeTopp, zD1]),
      flate: 'tre',
      explode: [0.3, 0.2, 0],
      kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: R(zD1 - zD0), prisId: `bjelke-48x${VEGGBJELKE_H}`, kategori: 'konstruksjon', merknad: 'Festes i husets stendere/bjelkelag med franske skruer 12×200 (2 stk per stender), lufteklosser 10 mm mot kledningen' },
    })
    // Husvegg (kontekst – medfølger ikke).
    const hus = deler.length
    void hus
  }

  // ── Takbærere over hver z ──
  const sperrePoly = (): P2[] => {
    const bunn = (x: number) => (x - s) * tan
    const topp = (x: number) => bunn(x) + sperreH / cos
    const o = OH_RAFT
    const pts: P2[] = [[-o, topp(-o)], [-o, bunn(-o)], [0, bunn(0)], [0, 0], [s, 0]]
    // Midtdrager-hakk.
    rader.slice(1, n.vegg ? undefined : -1).forEach((r) => {
      const xh = r.x - bd / 2 - xO
      pts.push([xh, bunn(xh)], [xh, xh * tan], [xh + s, xh * tan])
    })
    const ovre = geo.ovreFuglemunn!
    const xHoy = n.vegg ? xVegg : rader[rader.length - 1].x + bd / 2
    const lop = xHoy - xO
    const bu = n.vegg ? T : bd
    const xInner = lop - bu
    const xSete = xInner + ovre.seteMm
    const ys = geo.ovreSvillHoydeMm ?? bunn(xSete)
    pts.push([xInner, bunn(xInner)], [xInner, ys], [xSete, ys])
    const xe = lop + (n.vegg ? 0 : OH_RAFT)
    pts.push([xe, bunn(xe)], [xe, topp(xe)])
    return pts.map(([x, y]) => [x + xO, y + yLavTopp] as P2)
  }
  // Senterlinje-retning for lengdemål/kappvinkler.
  const dirSperre: P2 = [cos, Math.sin(rad(vinkel))]
  const sperreProfilTv = tverrsnitt(48, sperreH, 1, 'C24', `bjelke-48x${sperreH}`)

  // Takets overkant (sperre-/overgurt-overkant) som funksjon av x (verden) – til lekter, tekking, tegninger.
  const sperreOverkant = (x: number): number => {
    if (n.type === 'saltak') {
      const S = W - sb + bd
      const xl = x - xO
      const xs = xl <= S / 2 ? xl : S - xl
      return yLavTopp + takstol!.undergurt.valgt.h + (xs - s) * tan + sperreH / cos
    }
    return yLavTopp + (x - xO - s) * tan + sperreH / cos
  }
  const tekkeOppbygg = papp(n.tekke) ? PLY + (n.tekke === 'shingel' ? 8 : 5) : LEKT_H + (n.tekke === 'polykarbonat' ? 16 : 20)

  if (n.type !== 'saltak') {
    const poly = sperrePoly()
    const lengde = kappLengde(poly, dirSperre)
    const [vA, vB] = [vinkel, vinkel]
    sperreZ.forEach((z, i) => {
      leggTil({
        pid: `sperre-${i}`,
        part: 'spaer',
        navn: 'Sperre',
        profil: sperreProfilTv.profil,
        ...iXY(poly, z - T / 2, T),
        flate: 'tre',
        explode: [0, 0.35, 0],
        kapp: {
          kvalitet: `C24 · ${imp(c)}`,
          lengdeMm: lengde,
          prisId: `bjelke-48x${sperreH}`,
          kategori: 'konstruksjon',
          endeA: { vinkel: Math.round(vA * 10) / 10, type: 'gjaering', merknad: 'loddkutt' },
          endeB: { vinkel: Math.round(vB * 10) / 10, type: 'gjaering', merknad: n.vegg ? 'loddkutt mot vegg' : 'loddkutt' },
          merknad: `Fuglemunn ${rader.length + (n.vegg ? 1 : 0)} stk: sete ${Math.round(s)} mm, dybde ${Math.round(geo.fuglemunn.dybdeMm)} mm (≤ h/3 = ${Math.round(sperreH / 3)}), hælkutt loddrett ${fmtGrader(vinkel)}`,
        },
      })
    })
  } else {
    // Takstoler.
    const ts = takstol!
    const S = W - sb + bd
    const ho = ts.overgurt.valgt.h
    const hu = ts.undergurt.valgt.h
    const hs = ts.stav.valgt.h
    const yU = yLavTopp + hu // overkant undergurt (sperregeometriens y = 0)
    const venstre = geo.omriss.map(([x, y]) => [x + xO, y + yU] as P2)
    const hoyre = geo.omriss.map(([x, y]) => [xO + S - x, y + yU] as P2)
    const lenO = kappLengde(venstre, dirSperre)
    const bunnL = (x: number) => (x - xO - s) * tan + yU // underkant venstre overgurt
    const bunnR = (x: number) => (xO + S - x - s) * tan + yU
    const Q1: P2 = [xO + S / 4, bunnL(xO + S / 4)]
    const Q2: P2 = [xO + (3 * S) / 4, bunnR(xO + (3 * S) / 4)]
    const T1: P2 = [xO + S / 3, yU]
    const T2: P2 = [xO + (2 * S) / 3, yU]
    const A: P2 = [xO + S / 2, Math.min(bunnL(xO + S / 2), bunnR(xO + S / 2))]
    const midt: P2 = [xO + S / 2, yU + 50]
    const under = halvplanLinje([xO, bunnL(xO)], [1, tan], midt)
    const underR = halvplanLinje([xO + S, bunnR(xO + S)], [-1, tan], midt)
    const overUG = { a: 0, b: -1, c: -yU }
    const stav = (p0: P2, p1: P2, ekstra: Array<{ a: number; b: number; c: number }>) => klippAlle(stavPoly(p0, p1, hs, 400), [under, underR, overUG, ...ekstra])
    const stavDef: Array<{ navn: string; poly: P2[]; dir: P2 }> = []
    const mk = (navn: string, p0: P2, p1: P2, ekstra: Array<{ a: number; b: number; c: number }>) => {
      const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      stavDef.push({ navn, poly: stav(p0, p1, ekstra), dir: [(p1[0] - p0[0]) / d, (p1[1] - p0[1]) / d] })
    }
    mk('Takstol – stav ytre', Q1, T1, [{ a: 1, b: 0, c: T1[0] }])
    mk('Takstol – stav indre', T1, A, [{ a: -1, b: 0, c: -T1[0] }, { a: 1, b: 0, c: A[0] }])
    mk('Takstol – stav indre', T2, A, [{ a: 1, b: 0, c: T2[0] }, { a: -1, b: 0, c: -A[0] }])
    mk('Takstol – stav ytre', Q2, T2, [{ a: -1, b: 0, c: -T2[0] }])
    const ugPoly = rekt(xO, yLavTopp, xO + S, yU)
    const ugLengde = R(S)
    const kvT = `C24 (takstol)`
    sperreZ.forEach((z, i) => {
      const z0 = z - T / 2
      const ex: V3 = [0, 0.35, 0]
      leggTil({ pid: `ts-${i}-ov`, part: 'spaer', navn: 'Takstol – overgurt', profil: pr(48, ho), ...iXY(venstre, z0, T), flate: 'tre', explode: ex, kapp: { kvalitet: kvT, lengdeMm: lenO, prisId: `bjelke-48x${ho}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt raft' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt møne' }, merknad: `Sete på undergurt ${Math.round(s)} mm, hæl ${Math.round(geo.fuglemunn.haelMm)} mm loddrett` } })
      leggTil({ pid: `ts-${i}-oh`, part: 'spaer', navn: 'Takstol – overgurt', profil: pr(48, ho), ...iXY(hoyre, z0, T), flate: 'tre', explode: ex, kapp: { kvalitet: kvT, lengdeMm: lenO, prisId: `bjelke-48x${ho}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt raft' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt møne' }, merknad: `Sete på undergurt ${Math.round(s)} mm, hæl ${Math.round(geo.fuglemunn.haelMm)} mm loddrett` } })
      leggTil({ pid: `ts-${i}-ug`, part: 'spaer', navn: 'Takstol – undergurt', profil: pr(48, hu), ...iXY(ugPoly, z0, T), flate: 'tre', darken: 0.95, explode: ex, kapp: { kvalitet: kvT, lengdeMm: ugLengde, prisId: `bjelke-48x${hu}`, kategori: 'konstruksjon', merknad: 'Rett kapp' } })
      stavDef.forEach((sd, k) => {
        if (sd.poly.length < 3) return
        const [va, vb] = kappVinkler(sd.poly, sd.dir)
        leggTil({ pid: `ts-${i}-s${k}`, part: 'spaer', navn: sd.navn, profil: pr(48, hs), ...iXY(sd.poly, z0, T), flate: 'tre', darken: 0.92, explode: ex, kapp: { kvalitet: kvT, lengdeMm: kappLengde(sd.poly, sd.dir), prisId: `bjelke-48x${hs}`, kategori: 'konstruksjon', endeA: { vinkel: va, type: 'gjaering' }, endeB: { vinkel: vb, type: 'gjaering' }, merknad: 'Kapp etter mal fra første takstol' } })
      })
      // Spikerplater (begge sider) i knutepunktene.
      const plater: P2[] = [[xO + 60, yU - hu / 2 + 20], [xO + S - 60, yU - hu / 2 + 20], [A[0], A[1] + 40], Q1, Q2, T1, T2]
      plater.forEach(([px, py], k) => {
        for (const side of [-1, 1]) {
          const zz = side < 0 ? z0 - 1 : z0 + T
          leggTil({ pid: `ts-${i}-pl${k}${side}`, part: 'beslag', navn: 'Spikerplate', profil: '100 × 200 mm', ...iXY(rekt(px - 60, py - 60, px + 60, py + 60), zz, 1), flate: 'metall', explode: [0, 0.35, side * 0.05] })
        }
      })
    })
  }

  // ── Kneband ──
  // Vind på rammen (trengs for kneband-dimensjonen).
  const xTakMaxEst = n.type === 'saltak' ? xO + (W - sb + bd) + OH_RAFT : n.vegg ? xVegg : rader[rader.length - 1].x + bd / 2 + OH_RAFT
  const moneEst = (n.type === 'saltak' ? sperreOverkant(xO + (W - sb + bd) / 2) : Math.max(sperreOverkant(xO - OH_RAFT), sperreOverkant(xTakMaxEst))) + tekkeOppbygg
  const vind = vindlast(VB0_STANDARD, 2, Math.max(4, moneEst / 1000))
  const hoydeStolpe = Math.max(...postPos.map((p) => yStolpeTopp(p.rad) - PB))
  const V = vindPerStolpe({ qp: vind.qp, Pmm: P, Wtak: xTakMaxEst - (xO - OH_RAFT), tan, saltak: n.type === 'saltak', nRader: rader.length, nStolper: postPos.length, hp: hoydeStolpe, sideVegg: n.sider.includes('venstre'), endeVegg: n.sider.includes('bak'), vegg: n.vegg, L })
  const NbandEd = ((V * hoydeStolpe) / kbBen) * Math.SQRT2
  const matK = MATERIALER.C24
  const NRdKb = (tv: Tverrsnitt, l: number) => (knekkfaktor(l, tv.b / Math.sqrt(12), matK).kc * tv.b * tv.h * ((KMOD[3].kort * matK.fc0k) / matK.gammaM)) / 1000
  const kbKand = [tverrsnitt(48, 98, 1, 'C24', 'bjelke-48x98'), tverrsnitt(48, 148, 1, 'C24', 'bjelke-48x148'), tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98')]
  const kbTv = kbKand.find((tv) => tv.b <= sb && NRdKb(tv, 1.35 * kbBen * Math.SQRT2) >= NbandEd) ?? kbKand[kbKand.length - 1]
  const KB_H = kbTv.h
  const KB_T = kbTv.b
  const kbProfil = kbTv.profil
  const knebandListe: Array<{ lengde: number }> = []
  // Langs: i dragerplanet (z–y), fra stolpe til underkant drager.
  postPos.forEach((p, i) => {
    const yU = p.rad.topp - hd
    const dirs: number[] = []
    const idx = postZ.indexOf(p.z)
    if (idx > 0) dirs.push(-1)
    if (idx < postZ.length - 1) dirs.push(1)
    dirs.forEach((dz) => {
      const f: P2 = [p.z + (dz * sb) / 2, yU - kbBen]
      const t: P2 = [p.z + dz * (sb / 2 + kbBen), yU]
      const poly = klippAlle(stavPoly(f, t, KB_H, 300), [
        dz > 0 ? { a: -1, b: 0, c: -(p.z + sb / 2) } : { a: 1, b: 0, c: p.z - sb / 2 },
        { a: 0, b: 1, c: yU },
      ])
      const dir: P2 = [dz / Math.SQRT2, 1 / Math.SQRT2]
      const lengde = kappLengde(poly, dir)
      knebandListe.push({ lengde })
      leggTil({ pid: `kb-l-${i}-${dz}`, part: 'kneband', navn: 'Kneband langs', profil: kbProfil, ...iZY(poly, p.x - KB_T / 2, KB_T), flate: 'tre', darken: 0.9, explode: [0, 0, dz * 0.25], kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: lengde, prisId: kbTv.pris!, kategori: 'konstruksjon', endeA: { vinkel: 45, type: 'gjaering' }, endeB: { vinkel: 45, type: 'gjaering' }, merknad: 'Festes med 2 × M12 gjennomgående bolt i hver ende' } })
    })
  })
  // Tvers: i sperre-/takstolplanet (x–y) ved hver stolpelinje, fra stolpens innside opp til sperre/undergurt.
  const underkantTak = (x: number): number => {
    if (n.type === 'saltak') return yLavTopp
    return yLavTopp + (x - xO - s) * tan
  }
  postPos.forEach((p, i) => {
    const yU = p.rad.topp - hd
    const retn: number[] = p.rad.rolle === 'lav' ? [1] : p.rad.rolle === 'hoy' ? [-1] : [-1, 1]
    retn.forEach((dx) => {
      // Fot kbBen under drageren, topp kbBen inn fra stolpen på underkant sperre/undergurt.
      const xt = p.x + dx * (sb / 2 + kbBen)
      const f: P2 = [p.x + (dx * sb) / 2, yU - kbBen]
      const t: P2 = [xt, underkantTak(xt)]
      // Øvre grense: underkant sperre/undergurt (linje gjennom to punkter).
      const xa = p.x + (dx * sb) / 2
      const xb = xa + dx * 1500
      const la: P2 = [xa, underkantTak(xa)]
      const lb: P2 = [xb, underkantTak(xb)]
      const poly = klippAlle(stavPoly(f, t, KB_H, 300), [
        dx > 0 ? { a: -1, b: 0, c: -(p.x + sb / 2) } : { a: 1, b: 0, c: p.x - sb / 2 },
        halvplanLinje(la, [lb[0] - la[0], lb[1] - la[1]], [p.x + dx * 400, yU - 200]),
      ])
      if (poly.length < 3) return
      const dl = Math.hypot(t[0] - f[0], t[1] - f[1])
      const dir: P2 = [(t[0] - f[0]) / dl, (t[1] - f[1]) / dl]
      const lengde = kappLengde(poly, dir)
      const [va, vb] = kappVinkler(poly, dir)
      knebandListe.push({ lengde })
      leggTil({ pid: `kb-t-${i}-${dx}`, part: 'kneband', navn: 'Kneband tvers', profil: kbProfil, ...iXY(poly, p.z - KB_T / 2, KB_T), flate: 'tre', darken: 0.88, explode: [dx * 0.25, 0, 0], kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: lengde, prisId: kbTv.pris!, kategori: 'konstruksjon', endeA: { vinkel: va, type: 'gjaering' }, endeB: { vinkel: vb, type: 'gjaering' }, merknad: 'Festes med 2 × M12 gjennomgående bolt i hver ende' } })
    })
  })

  // ── Sperrebeslag (vindsug) i hvert sperre × drager-kryss ──
  const beslagRader = rader.map((r) => ({ x: r.x, y: r.topp }))
  sperreZ.forEach((z, i) => {
    beslagRader.forEach((r, k) => {
      leggTil({ pid: `beslag-${i}-${k}-v`, part: 'beslag', navn: 'Sperrebeslag', profil: 'vinkelbeslag 90×90', ...boks([r.x - 30, r.y, z + T / 2], [r.x + 30, r.y + 80, z + T / 2 + 3]), flate: 'metall', explode: [0, 0.45, 0] })
      leggTil({ pid: `beslag-${i}-${k}-f`, part: 'beslag', navn: 'Sperrebeslag', profil: 'vinkelbeslag 90×90', ...boks([r.x - 30, r.y, z + T / 2], [r.x + 30, r.y + 3, z + T / 2 + 60]), flate: 'metall', explode: [0, 0.45, 0] })
    })
  })

  // ── Tekking ──
  const xTakMin = xO - OH_RAFT
  const xTakMax = n.type === 'saltak' ? xO + (W - sb + bd) + OH_RAFT : n.vegg ? xVegg : rader[rader.length - 1].x + bd / 2 + OH_RAFT
  const zTak0 = -(L / 2 + OH_GAVL)
  const zTak1 = L / 2 + OH_GAVL
  const flater2: Array<{ x0: number; x1: number }> = n.type === 'saltak' ? [{ x0: xTakMin, x1: xO + (W - sb + bd) / 2 }, { x0: xO + (W - sb + bd) / 2, x1: xTakMax }] : [{ x0: xTakMin, x1: xTakMax }]
  // Takflate-polygon i x–y (tykkelse t over sperreoverkant + offset), ekstrudert langs z.
  const skive = (x0: number, x1: number, off: number, tykk: number): P2[] => [
    [x0, sperreOverkant(x0) + off],
    [x1, sperreOverkant(x1) + off],
    [x1, sperreOverkant(x1) + off + tykk / cos],
    [x0, sperreOverkant(x0) + off + tykk / cos],
  ]
  const tekkeFarge = n.tekke === 'stal' ? 0x4d5257 : n.tekke === 'polykarbonat' ? 0xcfe3ea : n.tekke === 'takpapp' ? 0x2e2e30 : 0x3f3a36
  if (papp(n.tekke)) {
    flater2.forEach((f, i) => {
      leggTil({ pid: `kryssfiner-${i}`, part: 'tak', navn: 'Takplate 18 mm kryssfiner', profil: '18 mm', ...iXY(skive(f.x0, f.x1, 0, PLY), zTak0, zTak1 - zTak0), flate: 'plate', explode: [0, 0.8, 0] })
      leggTil({ pid: `tekke-${i}`, part: 'tak', navn: n.tekkeNavn, profil: 'tekking', ...iXY(skive(f.x0 - 10, f.x1 + (n.type === 'saltak' && i === 0 ? 0 : 10), PLY, n.tekke === 'shingel' ? 8 : 5), zTak0 - 10, zTak1 - zTak0 + 20), flate: 'tekke', farge: tekkeFarge, explode: [0, 1.0, 0] })
    })
  } else {
    // Lekter 36×48 c/c ≤ 600 langs fallet, liggende flatt oppå sperrene, skjøt på sperre.
    flater2.forEach((f, fi) => {
      const lengdeSkra = (f.x1 - f.x0) / cos
      const nL = Math.max(2, Math.ceil((lengdeSkra - LEKT_B) / 600 - 1e-9) + 1)
      for (let j = 0; j < nL; j++) {
        const t = (j * (lengdeSkra - LEKT_B - 30)) / (nL - 1) + 15
        // Langs skråflaten fra f.x0 (venstre flate stiger, høyre flate synker).
        const xa = f.x0 + t * cos
        const xb = xa + LEKT_B * cos
        const poly = skive(xa, xb, 0, LEKT_H)
        // Skjøt over sperre ved > STOKK_MAKS.
        const biter: Array<[number, number]> = []
        let a = zTak0
        while (zTak1 - a > STOKK_MAKS) {
          const kand = sperreZ.filter((z) => z - a <= STOKK_MAKS && z > a + 300)
          const b = kand[kand.length - 1 - (j % 2)] ?? kand[kand.length - 1]
          biter.push([a, b])
          a = b
        }
        biter.push([a, zTak1])
        biter.forEach(([za, zb], bi) => {
          leggTil({ pid: `lekt-${fi}-${j}-${bi}`, part: 'tak', navn: 'Taklekt', profil: pr(LEKT_H, LEKT_B), ...iXY(poly, za, zb - za), flate: 'tre', darken: 0.85, explode: [0, 0.65, 0], kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: R(zb - za), prisId: 'taklekt-36x48', kategori: 'tak', merknad: 'Skjøt midt på sperre' } })
        })
      }
      leggTil({ pid: `tekke-${fi}`, part: 'tak', navn: n.tekkeNavn, profil: 'tekking', ...iXY(skive(f.x0 - (fi === 0 ? 30 : 0), f.x1 + (n.type === 'saltak' && fi === 0 ? 0 : 30), LEKT_H, n.tekke === 'polykarbonat' ? 16 : 6), zTak0 - 30, zTak1 - zTak0 + 60), flate: n.tekke === 'polykarbonat' ? 'akryl' : 'tekke', farge: tekkeFarge, explode: [0, 1.0, 0] })
      if (n.tekke === 'stal') {
        // Trapesribber c/c 200 langs fallet.
        const nr = Math.floor((zTak1 - zTak0) / 200)
        for (let k = 0; k <= nr; k++) {
          const z = zTak0 + 10 + (k * (zTak1 - zTak0 - 20)) / nr
          leggTil({ pid: `ribbe-${fi}-${k}`, part: 'tak', navn: n.tekkeNavn, profil: 'tekking', ...iXY(skive(f.x0 - (fi === 0 ? 30 : 0), f.x1 + (n.type === 'saltak' && fi === 0 ? 0 : 30), LEKT_H + 6, 18), z - 12, 24), flate: 'tekke', farge: 0x5a5f65, explode: [0, 1.0, 0] })
        }
      }
    })
  }
  if (n.type === 'saltak' && !papp(n.tekke)) {
    const xm = xO + (W - sb + bd) / 2
    const ym = sperreOverkant(xm) + tekkeOppbygg
    leggTil({ pid: 'monebeslag', part: 'tak', navn: 'Mønebeslag', profil: 'stål', poly: [[xm - 160, ym - 160 * tan + 4], [xm, ym + 8], [xm + 160, ym - 160 * tan + 4], [xm + 160, ym - 160 * tan + 10], [xm, ym + 14], [xm - 160, ym - 160 * tan + 10]], O: [0, 0, zTak0 - 30], U: AX.x, V: AX.y, W: AX.z, t: zTak1 - zTak0 + 60, flate: 'metall', farge: 0x4d5257, explode: [0, 1.05, 0] })
  }

  // ── Vindski (gavl) og raftebord ──
  let vindskiLm = 0
  const vsTopp = (x: number) => sperreOverkant(x) + tekkeOppbygg + 10
  for (const zs of [zTak0 - VS_T, zTak1]) {
    flater2.forEach((f, i) => {
      const poly: P2[] = [[f.x0, vsTopp(f.x0)], [f.x1, vsTopp(f.x1)], [f.x1, vsTopp(f.x1) - VS_H / cos], [f.x0, vsTopp(f.x0) - VS_H / cos]]
      const stiger = sperreOverkant(f.x1) >= sperreOverkant(f.x0)
      const lengde = kappLengde(poly, [cos, (stiger ? 1 : -1) * Math.sin(rad(vinkel))])
      vindskiLm += lengde
      leggTil({ pid: `vindski-${zs > 0 ? 'f' : 'b'}-${i}`, part: 'tak', navn: 'Vindski', profil: pr(VS_T, VS_H), ...iXY(poly, zs, VS_T), flate: 'tre', darken: 0.8, explode: [0, 0.85, zs > 0 ? 0.2 : -0.2], kapp: { kvalitet: 'Grunnet gran', lengdeMm: lengde, prisId: 'vindskibord-22x148', kategori: 'tak', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: n.type === 'saltak' ? 'gjæres i møne' : 'loddkutt' } } })
    })
  }
  // Raftebord på sperreendene (lav side + høy side ved frittstående pulttak/flatt, begge sider saltak).
  const rafter: Array<{ x: number; side: -1 | 1 }> = [{ x: xTakMin, side: -1 }]
  if (n.type === 'saltak' || !n.vegg) rafter.push({ x: xTakMax, side: 1 })
  let renner = 0
  rafter.forEach((rf, i) => {
    const yTop = sperreOverkant(rf.x) + (papp(n.tekke) ? PLY : 0)
    const x0 = rf.side < 0 ? rf.x - VS_T : rf.x
    const lengde = R(zTak1 - zTak0 + 2 * VS_T)
    leggTil({ pid: `raftebord-${i}`, part: 'tak', navn: 'Raftebord', profil: pr(VS_T, VS_H), ...boks([x0, yTop - VS_H, zTak0 - VS_T], [x0 + VS_T, yTop, zTak1 + VS_T]), flate: 'tre', darken: 0.8, explode: [rf.side * 0.3, 0.8, 0], kapp: { kvalitet: 'Grunnet gran', lengdeMm: Math.min(lengde, 99999), prisId: 'vindskibord-22x148', kategori: 'tak', merknad: lengde > STOKK_MAKS ? 'Skjøtes med skrå skjøt (45°) over sperre' : undefined } })
    // Takrenne ved lav raft (og begge sider på saltak / høy side kun ved saltak).
    const erLav = n.type === 'saltak' || rf.side < 0
    if (!erLav) return
    renner++
    const xr = rf.side < 0 ? x0 - 66 : x0 + VS_T + 66
    const yr = yTop - 30
    const halv: P2[] = []
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI + (k * Math.PI) / 8
      halv.push([xr + 62 * Math.cos(a), yr + 62 * Math.sin(a)])
    }
    for (let k = 8; k >= 0; k--) {
      const a = Math.PI + (k * Math.PI) / 8
      halv.push([xr + 58 * Math.cos(a), yr + 58 * Math.sin(a)])
    }
    leggTil({ pid: `renne-${i}`, part: 'tak', navn: 'Takrenne 125 mm', profil: 'stål', poly: halv, O: [0, 0, zTak0], U: AX.x, V: AX.y, W: AX.z, t: zTak1 - zTak0, flate: 'metall', farge: 0x3c4046, explode: [rf.side * 0.4, 0.7, 0] })
    // Nedløp i bakre ende.
    const zn = zTak0 + 120
    leggTil({ pid: `nedlop-${i}`, part: 'tak', navn: 'Nedløp', profil: 'Ø87 stål', ...boks([xr - 40, 150, zn - 40], [xr + 40, yr - 50, zn + 40]), flate: 'metall', farge: 0x3c4046, explode: [rf.side * 0.4, 0, 0] })
  })

  // ── Vegger (valgfritt) ──
  const veggT = 19
  const veggFarge = undefined
  const spikerslagY = (topp: number) => {
    const ys: number[] = [PB + 150]
    const k = Math.max(1, Math.ceil((topp - 100 - (PB + 150)) / 900))
    for (let i = 1; i <= k; i++) ys.push(PB + 150 + (i * (topp - 100 - (PB + 150))) / k)
    return ys
  }
  veggStolper.forEach((vs, i) => {
    // Veggstolpe opp til underkant sperre/undergurt.
    const top = n.type === 'saltak' ? yLavTopp : underkantTak(vs.x) - 5
    vs.topp = top
    leggFundament(vs.x, vs.z, `v${i}`)
    leggTil({ pid: `veggstolpe-${i}`, part: 'stolpe', navn: 'Veggstolpe', profil: stolpeProfil, ...boks([vs.x - sb / 2, PB, vs.z - sb / 2], [vs.x + sb / 2, top, vs.z + sb / 2]), flate: 'tre', explode: [0, 0, Math.sign(vs.z) * 0.3], kapp: { kvalitet: kvTre(tvStolpe), lengdeMm: R(top - PB), prisId: prisIdFor(tvStolpe), kategori: 'konstruksjon', merknad: n.type === 'saltak' ? 'Rett kapp' : `Toppkapp ${fmtGrader(vinkel)} mot sperra` } })
  })
  const kledd = (navn: string, poly: P2[], plan: 'xy' | 'zy', pos: number, ex: V3, akryl: boolean, i: string) => {
    const base = plan === 'xy' ? iXY(poly, pos, veggT) : iZY(poly, pos, veggT)
    leggTil({ pid: `vegg-${i}`, part: 'vegg', navn, profil: akryl ? 'akrylplate 4 mm' : 'kledning 19 mm', ...base, flate: akryl ? 'akryl' : 'tre', darken: 0.93, farge: veggFarge, explode: ex })
  }
  for (const side of n.sider) {
    const akrylAndel = c.veggtype === 'akryl' ? 1 : c.veggtype === 'kombinert' ? 0.4 : 0
    if (side === 'venstre' || side === 'høyre') {
      const r = side === 'venstre' ? rader[0] : rader[rader.length - 1]
      const topp = r.topp - hd
      const xYtre = side === 'venstre' ? r.x - sb / 2 : r.x + sb / 2
      // Spikerslag mellom stolpene (utvendig flukt med stolpene).
      for (let k = 0; k < postZ.length - 1; k++) {
        const za = k === 0 ? postZ[0] - sb / 2 : postZ[k]
        const zb = k === postZ.length - 2 ? postZ[k + 1] + sb / 2 : postZ[k + 1]
        spikerslagY(topp).forEach((y, j) => {
          const x0 = side === 'venstre' ? xYtre - T : xYtre
          leggTil({ pid: `spikerslag-${side}-${k}-${j}`, part: 'vegg', navn: 'Spikerslag (vegg)', profil: pr(48, 98), ...boks([x0, y - 49, za], [x0 + T, y + 49, zb]), flate: 'tre', darken: 0.85, explode: [side === 'venstre' ? -0.3 : 0.3, 0, 0], kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: R(zb - za), prisId: 'bjelke-48x98', kategori: 'kledning', merknad: 'Høykant utenpå stolpene, 2 skruer 6×120 i hver stolpe' } })
        })
      }
      // Vindkryss (stålbånd 40×2) i hvert felt, utenpå stolper/spikerslag.
      for (let k = 0; k < postZ.length - 1; k++) {
        const za = postZ[k] + sb / 2
        const zb = postZ[k + 1] - sb / 2
        const xb = side === 'venstre' ? xYtre - T - 2 : xYtre + T
        for (const [a0, a1] of [[[za, PB + 100], [zb, topp - 30]], [[zb, PB + 100], [za, topp - 30]]] as Array<[P2, P2]>) leggTil({ pid: `vindkryss-${side}-${k}-${a0[0]}`, part: 'vegg', navn: 'Vindkryss (stålbånd)', profil: '40 × 2 mm', ...iZY(klippAlle(stavPoly(a0, a1, 40, 0), [{ a: 0, b: 1, c: topp - 10 }, { a: 0, b: -1, c: -(PB + 80) }]), xb, 2), flate: 'metall', explode: [side === 'venstre' ? -0.35 : 0.35, 0, 0] })
      }
      const xk = side === 'venstre' ? xYtre - T - veggT - 2 : xYtre + T + 2
      const z0 = postZ[0] - sb / 2
      const z1 = postZ[postZ.length - 1] + sb / 2
      const ySplit = PB + (topp - PB) * (1 - akrylAndel)
      if (akrylAndel < 1) kledd('Veggkledning', rekt(z0, PB + 20, z1, ySplit), 'zy', xk, [side === 'venstre' ? -0.45 : 0.45, 0, 0], false, `${side}-p`)
      if (akrylAndel > 0) kledd('Akrylplate', rekt(z0, ySplit, z1, topp), 'zy', xk, [side === 'venstre' ? -0.45 : 0.45, 0, 0], true, `${side}-a`)
    } else {
      const z = side === 'front' ? postZ[postZ.length - 1] : postZ[0]
      const zYtre = side === 'front' ? z + sb / 2 : z - sb / 2
      const xs = [...rader.map((r) => r.x), ...veggStolper.filter((v) => v.z === z).map((v) => v.x), ...(n.vegg ? [xVegg + sb / 2] : [])].sort((a, b) => a - b)
      for (let k = 0; k < xs.length - 1; k++) {
        const xa = k === 0 ? xs[0] - sb / 2 : xs[k]
        const xb = n.vegg && k === xs.length - 2 ? xVegg - T : k === xs.length - 2 ? xs[k + 1] + sb / 2 : xs[k + 1]
        const topp = Math.min(underkantTak(xa), underkantTak(xb)) - 30
        spikerslagY(topp).forEach((y, j) => {
          const z0 = side === 'front' ? zYtre : zYtre - T
          leggTil({ pid: `spikerslag-${side}-${k}-${j}`, part: 'vegg', navn: 'Spikerslag (vegg)', profil: pr(48, 98), ...boks([xa, y - 49, z0], [xb, y + 49, z0 + T]), flate: 'tre', darken: 0.85, explode: [0, 0, side === 'front' ? 0.3 : -0.3], kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: R(xb - xa), prisId: 'bjelke-48x98', kategori: 'kledning', merknad: 'Høykant utenpå stolpene, 2 skruer 6×120 i hver stolpe' } })
        })
      }
      for (let k = 0; k < xs.length - 1; k++) {
        const xa = xs[k] + sb / 2
        const xb2 = n.vegg && k === xs.length - 2 ? xVegg - T : xs[k + 1] - sb / 2
        const topp = Math.min(underkantTak(xa), underkantTak(xb2)) - 30
        const zb = side === 'front' ? zYtre + T : zYtre - T - 2
        for (const [a0, a1] of [[[xa, PB + 100], [xb2, topp - 30]], [[xb2, PB + 100], [xa, topp - 30]]] as Array<[P2, P2]>) leggTil({ pid: `vindkryss-${side}-${k}-${a0[0]}`, part: 'vegg', navn: 'Vindkryss (stålbånd)', profil: '40 × 2 mm', ...iXY(klippAlle(stavPoly(a0, a1, 40, 0), [{ a: 0, b: 1, c: topp - 10 }, { a: 0, b: -1, c: -(PB + 80) }]), zb, 2), flate: 'metall', explode: [0, 0, side === 'front' ? 0.35 : -0.35] })
      }
      const zk = side === 'front' ? zYtre + T + 2 : zYtre - T - veggT - 2
      const x0 = xs[0] - sb / 2
      const x1 = n.vegg ? xVegg - T : xs[xs.length - 1] + sb / 2
      const tak = (x: number) => (n.type === 'saltak' ? yLavTopp + takstol!.undergurt.valgt.h : underkantTak(x)) - 5
      const topPoly = (yb: number, x0b: number, x1b: number): P2[] => (n.type === 'saltak' ? rekt(x0b, yb, x1b, yLavTopp) : [[x0b, yb], [x1b, yb], [x1b, tak(x1b)], [x0b, tak(x0b)]])
      const ySplit = PB + (Math.min(tak(x0), tak(x1)) - PB) * (1 - akrylAndel)
      if (akrylAndel < 1) kledd('Veggkledning', akrylAndel > 0 ? rekt(x0, PB + 20, x1, ySplit) : topPoly(PB + 20, x0, x1), 'xy', zk, [0, 0, side === 'front' ? 0.45 : -0.45], false, `${side}-p`)
      if (akrylAndel > 0) kledd('Akrylplate', topPoly(akrylAndel < 1 ? ySplit : PB + 20, x0, x1), 'xy', zk, [0, 0, side === 'front' ? 0.45 : -0.45], true, `${side}-a`)
      if (n.type === 'saltak') {
        // Gavltrekant: spikerslag 48×98 flatt mot takstolen (ytterflate i liv med veggens spikerslag) + kledning opp til vindskia.
        const S = W - sb + bd
        const xm = xO + S / 2
        const tG = sb / 2 + T / 2 // fra takstolens ytterflate til veggspikerslagets ytterflate
        const zT = side === 'front' ? z + T / 2 : z - T / 2 - tG
        const ugTopp = yLavTopp + takstol!.undergurt.valgt.h
        const bunnO = (x: number) => sperreOverkant(x) - takstol!.overgurt.valgt.h / cos
        const toppG = (x: number) => sperreOverkant(x) - 15
        const gavlRader: number[] = []
        for (let y = ugTopp + 150; y < bunnO(xm) - 200; y += 600) gavlRader.push(y)
        gavlRader.forEach((y, j) => {
          // Horisontal lekt mellom overgurtenes underkant i høyden y.
          const dx = (bunnO(xm) - (y + 24)) / tan
          const xa = xm - dx
          const xb = xm + dx
          if (xb - xa < 200) return
          leggTil({ pid: `gavlslag-${side}-${j}`, part: 'vegg', navn: 'Spikerslag (gavl)', profil: pr(48, 98), ...boks([xa, y - 24, zT], [xb, y + 24, zT + tG]), flate: 'tre', darken: 0.85, explode: [0, 0, side === 'front' ? 0.3 : -0.3], kapp: { kvalitet: `C24 · ${imp(c)}`, lengdeMm: R(xb - xa), prisId: 'bjelke-48x98', kategori: 'kledning', endeA: { vinkel: Math.round((90 - vinkel) * 10) / 10, type: 'gjaering' }, endeB: { vinkel: Math.round((90 - vinkel) * 10) / 10, type: 'gjaering' }, merknad: `Liggende mot takstolen, skrues i overgurtene${tG < 97 ? ` – kløyves til ${Math.round(tG)} mm` : ''}` } })
        })
        kledd('Gavlkledning', [[x0, yLavTopp], [x1, yLavTopp], [x1, toppG(x1)], [xm, toppG(xm)], [x0, toppG(x0)]], 'xy', zk, [0, 0, side === 'front' ? 0.45 : -0.45], false, `${side}-g`)
      }
    }
  }

  // ── Husvegg (kontekst) ──
  const yTakMaks = omslutt(deler, (d) => d.part === 'tak').max[1]
  if (n.vegg) {
    leggTil({ pid: 'husvegg', part: 'husvegg', navn: 'Husvegg (medfølger ikke)', profil: 'eksisterende vegg', ...boks([xVegg, 0, zTak0 - 400], [xVegg + 40, yTakMaks + 400, zTak1 + 400]), flate: 'kontekst', explode: [0.5, 0, 0] })
  }

  // ── Beregninger: vind, stolpe (vind + aksial), kneband, fundament ──
  const moneTopp = Math.max(...flater2.map((f) => Math.max(sperreOverkant(f.x0), sperreOverkant(f.x1)))) + tekkeOppbygg
  const nRader = rader.length
  // Aksiallast per stolpe (karakteristisk) – fra stolpekontrollen.
  const NGk = stolpe.kontroll.laster.find((l) => l.type === 'egen')?.verdi ?? 0
  const NSk = stolpe.kontroll.laster.filter((l) => l.type === 'sno').reduce((sum, l) => sum + l.verdi, 0)
  const stolpeVind = vindStolpeKontroll(tvStolpe, hoydeStolpe, NGk, NSk, V, kbBen, `${vind.forklaring}; c_f = 1,0 normalt på takflaten (åpent tak), 1,3 på takkant/vegg; ${nRader} stolperad(er)`)
  const kbMaks = Math.max(...knebandListe.map((k) => k.lengde), 600)
  const kcK = knekkfaktor(kbMaks, kbTv.b / Math.sqrt(12), matK).kc
  const NRdK = NRdKb(kbTv, kbMaks)
  const uK = NbandEd / NRdK
  const kneband: Medlemskontroll = {
    navn: 'Kneband',
    tverrsnitt: kbTv,
    tjenesteklasse: 3,
    spennMm: kbMaks,
    kontroller: [{ id: 'knekk', navn: 'Knekking (vind)', utnyttelse: uK, ok: uK <= 1, detalj: `N_Ed = ${fmt(NbandEd, 2)} kN ≤ N_Rd = k_c·A·f_c,0,d = ${fmt(NRdK, 1)} kN (l = ${Math.round(kbMaks)} mm, svak akse, k_c ${fmt(kcK, 2)})` }],
    maksUtnyttelse: uK,
    styrende: 'Knekking (vind)',
    ok: uK <= 1,
    lastkombinasjon: '6.10b: 1,2·G + 1,5·vind',
    laster: [{ navn: 'Vind, horisontal per stolpe (dim.)', type: 'vind', verdi: V, enhet: 'kN' }],
    forutsetninger: ['Kraft i kneband N = V·h_stolpe/a·√2 (leddet stolpefot)', 'Boltet med 2 × M12 i hver ende'],
  }
  // Fundament (største stolpe) + oppløft.
  const takAreal = ((xTakMax - xTakMin) * (zTak1 - zTak0)) / 1e6
  const antStolper = postPos.length
  const Gtot = gTak * takAreal
  const oppdriftPerStolpe = vindOppdrift(vind.qp, takAreal, Gtot) / antStolper
  const fundament = dimensjonerPunktfundament({ NGk, NQk: [{ type: 'sno', Nk: NSk }], grunn: grunnForConfig(c), dybdeM: Math.max(1.0, fundDybde.anbefaltDybdeM), oppdriftKN: Math.max(0, oppdriftPerStolpe) })
  // Vis valgt pilarrør-diameter i 3D (sentrum beholdes).
  {
    const rr = Number(fundament.valgt.navn.match(/Ø(\d+)/)?.[1] ?? 300) / 2
    for (const d of deler) {
      if (!d.pid.startsWith('fundament-')) continue
      const cx = d.poly.reduce((a2, q) => a2 + q[0], 0) / d.poly.length
      const cz = d.poly.reduce((a2, q) => a2 + q[1], 0) / d.poly.length
      d.poly = d.poly.map((_, k) => [cx + rr * Math.cos((k * Math.PI) / 6), cz + rr * Math.sin((k * Math.PI) / 6)] as P2)
      d.profil = `Ø${rr * 2} betong`
      d.navn = fundament.valgt.type === 'betongsoyle-saale' ? 'Punktfundament (pilarrør på såle)' : 'Punktfundament (pilarrør)'
    }
  }

  // Høyder.
  const gesims = n.type === 'saltak' ? vsTopp(xTakMin) : n.type === 'flatt' ? moneTopp : vsTopp(xTakMax)
  const byggesak = vurderByggesak({
    tiltak: n.vegg ? 'tilbygg' : 'frittliggende',
    byaM2: (W * L) / 1e6,
    moneHoydeM: Math.round(moneTopp) / 1000,
    gesimsHoydeM: Math.round(gesims) / 1000,
  })
  void FUNDAMENTER

  return {
    n,
    deler,
    sk,
    snoEff: { sk: skEff, tekst: snoTekst },
    sperre,
    sperreGeo: n.type === 'saltak' ? undefined : geo,
    takstol,
    drager,
    stolpe,
    stolpeVind,
    kneband,
    fundament,
    frost: fundDybde,
    vindQp: vind.qp,
    oppdriftPerStolpe,
    byggesak,
    rader,
    postZ,
    sperreZ,
    ccFaktisk: Math.max(...sperreZ.slice(1).map((z, i) => z - sperreZ[i])) / 1000,
    stolpeAvstand: P,
    hoyder: { fri: h, gesims, mone: moneTopp, dragerLav: yLavTopp },
    takTopp: (x: number) => sperreOverkant(x) + tekkeOppbygg,
    tvStolpe,
    tvDrager,
    hSperre: sperreH,
    bd,
    sb,
    xO,
    yRef: yLavTopp,
    tak: { xMin: xTakMin, xMax: xTakMax, zMin: zTak0, zMax: zTak1 },
    meldinger,
    renner,
    vindskiLm,
  }
}

// ── Kappliste ──────────────────────────────────────────────────────

function kappliste(c: CarportConfig): KapplisteDelPlan[] {
  return lagKappliste(modell(c).deler)
}

// ── Materialliste ──────────────────────────────────────────────────

const tall = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d
const metr = (mm: number) => `${(mm / 1000).toFixed(1).replace('.', ',')} m`

function beregn(c: CarportConfig): Bom {
  const m = modell(c)
  const { n } = m
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const rader = kappliste(c)
  const linjer: BomLinePlan[] = []
  let kr = 0

  // Trelast per prisnøkkel: kjøpslengder fra kappeplanen (30 cm-sprang), ellers eksakt bestillingslengde.
  const perPris = new Map<string, { profil: string; kvalitet: string; behov: Array<{ pos: string; lengdeMm: number; antall: number }>; kategori: BomLinePlan['kategori'] }>()
  for (const r of rader) {
    const d = m.deler.find((p) => p.kapp && p.navn === r.navn && p.profil === r.profil && p.kapp.lengdeMm === r.lengdeMm)
    const prisId = d?.kapp?.prisId ?? 'bjelke-48x198'
    const e = perPris.get(prisId) ?? { profil: r.profil, kvalitet: r.kvalitet ?? '', behov: [], kategori: r.kategori ?? 'konstruksjon' }
    e.behov.push({ pos: r.pos ?? '', lengdeMm: r.lengdeMm ?? r.lengdeCm * 10, antall: r.antall })
    perPris.set(prisId, e)
  }
  for (const [prisId, e] of perPris) {
    const limtre = prisId.startsWith('limtre') || (prisId.startsWith('stolpe-1') && prisId !== 'stolpe-148x148')
    const lager = [2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400, 6000]
    let kjopt = 0
    const spes: string[] = []
    if (limtre) {
      for (const b of e.behov) {
        kjopt += (b.lengdeMm * b.antall) / 1000
        spes.push(`${b.antall} × ${metr(b.lengdeMm)} (bestillingsmål)`)
      }
    } else {
      // Enkel «first fit decreasing» per lagerlengde.
      const stykker = e.behov.flatMap((b) => Array.from({ length: b.antall }, () => b.lengdeMm)).sort((a, b) => b - a)
      const planker: number[] = []
      const rest: number[] = []
      for (const st of stykker) {
        const behov = st + 5
        const i = rest.findIndex((r) => r >= behov)
        if (i < 0) {
          const L = lager.find((l) => l >= behov) ?? Math.ceil(behov / 300) * 300
          planker.push(L)
          rest.push(L - behov)
        } else rest[i] -= behov
      }
      const tell = new Map<number, number>()
      for (const p of planker) tell.set(p, (tell.get(p) ?? 0) + 1)
      ;[...tell.entries()].sort((a, b) => b[0] - a[0]).forEach(([L, k]) => spes.push(`${k} × ${metr(L)}`))
      kjopt = planker.reduce((s, p) => s + p, 0) / 1000
    }
    const tre = !prisId.startsWith('limtre') && prisId !== 'vindskibord-22x148'
    const pris = kjopt * prisFor(prisId) * (tre ? faktor : 1)
    kr += pris
    linjer.push({ navn: PRISER[prisId]?.navn ?? e.profil, spesifikasjon: spes.join(', '), antall: tall(kjopt), enhet: 'lm', kategori: e.kategori, kvalitet: e.kvalitet, prisId, prisKr: Math.round(pris) })
  }

  // Tak.
  const cos = Math.cos(rad(n.vinkel))
  const takAreal = ((m.tak.xMax - m.tak.xMin) / cos) * (m.tak.zMax - m.tak.zMin) / 1e6
  const leggTil = (l: BomLinePlan, enhetPris: number) => {
    const p = Math.round(l.antall * enhetPris)
    kr += p
    linjer.push({ ...l, prisKr: p })
  }
  if (papp(n.tekke)) {
    const plater = Math.ceil((takAreal * 1.05) / 2.88)
    leggTil({ navn: PRISER['kryssfiner-18-plate'].navn, antall: plater, enhet: 'stk', kategori: 'tak', kommentar: 'Spikres/skrues c/c 150 i kant, 300 i felt. Skjøter på sperre.', prisId: 'kryssfiner-18-plate' }, prisFor('kryssfiner-18-plate'))
    if (n.tekke === 'shingel') leggTil({ navn: PRISER['undertaksbelegg'].navn, antall: Math.ceil((takAreal * SVINN) / 15), enhet: 'rull', kategori: 'tak', prisId: 'undertaksbelegg' }, prisFor('undertaksbelegg'))
  }
  const tekkeId = n.tekke === 'stal' ? 'taktekke-stalplater' : n.tekke === 'polykarbonat' ? 'taktekke-polykarbonat' : n.tekke === 'takpapp' ? 'taktekke-takpapp' : 'taktekke-shingel'
  leggTil({ navn: n.tekkeNavn, spesifikasjon: n.tekke === 'stal' ? 'Med antikondensbelegg (dryppfilt) – åpent bygg' : n.tekke === 'takpapp' ? 'Underlag + overlag, sveiset/spikret' : undefined, antall: tall(takAreal * SVINN), enhet: 'm²', kategori: 'tak', kommentar: 'inkl. 10 % svinn/omlegg', prisId: tekkeId }, prisFor(tekkeId))
  if (n.type === 'saltak' && !papp(n.tekke)) leggTil({ navn: PRISER['monebeslag'].navn, antall: tall((m.tak.zMax - m.tak.zMin) / 1000 + 0.3), enhet: 'lm', kategori: 'tak', prisId: 'monebeslag' }, prisFor('monebeslag'))
  if (n.tekke === 'stal') leggTil({ navn: PRISER['vindskibeslag'].navn, antall: tall(m.vindskiLm / 1000), enhet: 'lm', kategori: 'tak', prisId: 'vindskibeslag' }, prisFor('vindskibeslag'))
  const renneLm = (m.renner * (m.tak.zMax - m.tak.zMin)) / 1000
  if (renneLm > 0) {
    leggTil({ navn: PRISER['takrenne'].navn, antall: tall(renneLm + 0.2 * m.renner), enhet: 'lm', kategori: 'tak', kommentar: 'Fall min. 1:200 mot nedløp', prisId: 'takrenne' }, prisFor('takrenne'))
    leggTil({ navn: PRISER['rennekrok'].navn, antall: Math.ceil(renneLm / 0.6) + m.renner, enhet: 'stk', kategori: 'tak', kommentar: 'c/c ≤ 600, på hver sperre/takstol', prisId: 'rennekrok' }, prisFor('rennekrok'))
    leggTil({ navn: PRISER['nedlop'].navn, antall: tall((m.renner * m.hoyder.fri) / 1000 + 0.5 * m.renner), enhet: 'lm', kategori: 'tak', prisId: 'nedlop' }, prisFor('nedlop'))
    leggTil({ navn: PRISER['renne-ende'].navn, antall: m.renner, enhet: 'stk', kategori: 'tak', prisId: 'renne-ende' }, prisFor('renne-ende'))
  }

  // Fundament og beslag.
  const nStolper = m.deler.filter((d) => d.part === 'stolpe').length
  const f = m.fundament.valgt
  const dybde = Math.max(1.0, m.frost.anbefaltDybdeM)
  const d = Number(f.navn.match(/Ø(\d+)/)?.[1] ?? 250)
  const t = f.type === 'betongsoyle-saale' ? f.saaleTykkelseM ?? 0.15 : 0
  const rorL = dybde + 0.05 - t
  const volPer = f.volumPerM * rorL + (f.type === 'betongsoyle-saale' ? f.arealM2 * t : 0)
  const rorId = d >= 300 ? 'pilarror-300' : d >= 250 ? 'pilarror-250' : 'pilarror'
  leggTil({ navn: PRISER[rorId].navn, spesifikasjon: `${f.navn}: rør ${fmt(rorL, 2)} m (frostfri dybde ${fmt(dybde, 1)} m, 5 cm over terreng)`, antall: nStolper * Math.ceil(rorL / 1.2 - 1e-9), enhet: 'stk', kategori: 'fundament', prisId: rorId }, prisFor(rorId))
  const volTot = nStolper * volPer
  if (volTot > 0.8) leggTil({ navn: PRISER['betong-m3'].navn, spesifikasjon: `${fmt(volPer * 1000, 0)} l per fundament`, antall: Math.round(volTot * 1.08 * 10) / 10, enhet: 'm³', kategori: 'fundament', kommentar: 'inkl. 8 % svinn – bestill bil/pumpe', prisId: 'betong-m3' }, prisFor('betong-m3'))
  else leggTil({ navn: PRISER['betong-sekk'].navn, spesifikasjon: `${fmt(volPer * 1000, 0)} l per fundament`, antall: Math.ceil(volTot / 0.0115), enhet: 'stk', kategori: 'fundament', prisId: 'betong-sekk' }, prisFor('betong-sekk'))
  if (f.type === 'betongsoyle-saale') leggTil({ navn: 'Armering såle (Ø10 kamstål, kryss c/c 150)', antall: nStolper, enhet: 'stk', kategori: 'fundament', prisId: 'armeringsnett' }, prisFor('armeringsnett') * 0.4)
  leggTil({ navn: PRISER['stolpesko-innstop'].navn, spesifikasjon: `for ${m.tvStolpe.profil}`, antall: nStolper, enhet: 'stk', kategori: 'beslag', kommentar: 'Støpes inn; stolpen 40 mm over betong', prisId: 'stolpesko-innstop' }, prisFor('stolpesko-innstop'))
  const nPoster = m.rader.length * m.postZ.length
  leggTil({ navn: PRISER['stolpehodebeslag'].navn, antall: nPoster, enhet: 'stk', kategori: 'beslag', kommentar: 'Drager → stolpe', prisId: 'stolpehodebeslag' }, prisFor('stolpehodebeslag'))
  const nKb = m.deler.filter((d) => d.part === 'kneband').length
  leggTil({ navn: PRISER['bolt-m12'].navn, spesifikasjon: 'lengde = virke + 30 mm', antall: nKb * 4 + nPoster * 2, enhet: 'stk', kategori: 'festemidler', kommentar: '2 per kneband-ende, 2 gjennom stolpehodet', prisId: 'bolt-m12' }, prisFor('bolt-m12'))
  const nSperrebeslag = m.deler.filter((d) => d.navn === 'Sperrebeslag').length / 2
  leggTil({ navn: PRISER['vinkelbeslag'].navn, antall: nSperrebeslag, enhet: 'stk', kategori: 'beslag', kommentar: 'Hver sperre/takstol på hver drager (vindsug)', prisId: 'vinkelbeslag' }, prisFor('vinkelbeslag'))
  if (n.type === 'saltak') {
    const nPl = m.deler.filter((d) => d.navn === 'Spikerplate').length
    leggTil({ navn: PRISER['spikerplate'].navn, antall: nPl, enhet: 'stk', kategori: 'beslag', kommentar: '2 per knutepunkt (begge sider)', prisId: 'spikerplate' }, prisFor('spikerplate'))
  }
  if (n.vegg) leggTil({ navn: PRISER['franskskrue-12'].navn, antall: Math.ceil((m.tak.zMax - m.tak.zMin) / 600) * 2 + 2, enhet: 'stk', kategori: 'festemidler', kommentar: 'Veggbjelke → husets stendere, 2 per stender', prisId: 'franskskrue-12' }, prisFor('franskskrue-12'))
  leggTil({ navn: PRISER['kamspiker'].navn, antall: Math.max(1, Math.ceil((nSperrebeslag * 10 + nPoster * 16) / 250)), enhet: 'pk', kategori: 'festemidler', kommentar: 'Til beslag (alle hull fylles)', prisId: 'kamspiker' }, prisFor('kamspiker'))
  const skruer = Math.round(takAreal * (papp(n.tekke) ? 14 : 8) + m.sperreZ.length * 8)
  leggTil({ navn: 'Skruer', spesifikasjon: 'rustfri A4 / varmforsinket, 5×90 og 5×50', antall: skruer, enhet: 'stk', kategori: 'festemidler', prisId: 'skrue' }, prisFor('skrue'))

  // Vegger.
  const veggM2 = m.deler.filter((d) => d.navn === 'Veggkledning').reduce((s, d) => s + areal(d.poly), 0) / 1e6
  const akrylM2 = m.deler.filter((d) => d.navn === 'Akrylplate').reduce((s, d) => s + areal(d.poly), 0) / 1e6
  if (veggM2 > 0) leggTil({ navn: PRISER['veggpanel'].navn, spesifikasjon: 'Stående kledning 19 mm, en-over-en', antall: tall(veggM2 * SVINN), enhet: 'm²', kategori: 'kledning', prisId: 'veggpanel' }, prisFor('veggpanel') * faktor)
  const kryss = m.deler.filter((d) => d.navn === 'Vindkryss (stålbånd)')
  if (kryss.length) {
    const lm = kryss.reduce((sum, d) => sum + Math.max(...d.poly.map((q) => q[0])) - Math.min(...d.poly.map((q) => q[0])), 0) * 1.15 / 1000
    leggTil({ navn: PRISER['hulband'].navn, antall: Math.ceil(lm / 10), enhet: 'rull', kategori: 'beslag', kommentar: 'Vindkryss i kledde vegger, spikres i hver stolpe/spikerslag', prisId: 'hulband' }, prisFor('hulband'))
    leggTil({ navn: PRISER['bandstrammer'].navn, antall: kryss.length, enhet: 'stk', kategori: 'beslag', prisId: 'bandstrammer' }, prisFor('bandstrammer'))
  }
  if (akrylM2 > 0) leggTil({ navn: PRISER['akrylplate'].navn, spesifikasjon: '4 mm, i aluminiumsprofiler', antall: tall(akrylM2 * SVINN), enhet: 'm²', kategori: 'kledning', prisId: 'akrylplate' }, prisFor('akrylplate'))

  const estimatKr = Math.round(kr / 10) * 10
  const areal2 = (n.W * n.L) / 1e6
  let timer = 18 + areal2 * 1.1 + nStolper * 1.2
  if (n.type === 'saltak') timer += 6 + m.sperreZ.length * 0.6
  if (veggM2 + akrylM2 > 0) timer += (veggM2 + akrylM2) * 0.6
  const sammendrag = `${c.bredde} × ${c.lengde} cm · fri høyde ${c.hoyde} cm · ${n.type === 'flatt' ? 'flatt tak (2° fall)' : `${n.type} ${n.vinkel}°`} · ${n.tekkeNavn.toLowerCase()} · stolper ${m.tvStolpe.profil}, drager ${m.tvDrager.profil}${m.tvDrager.materiale.startsWith('GL') ? ' limtre' : ''}`
  return { linjer, estimatKr, sammendrag, arealM2: tall(areal2, 2), maal: `${c.bredde} × ${c.lengde} cm`, arbeidstimer: Math.round(timer) }
}

function areal(poly: P2[]): number {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return Math.abs(a) / 2
}

// ── Tegninger ──────────────────────────────────────────────────────

const SKJULT_I_FASADE = /Taklekt|Takplate|Sperrebeslag|Spikerplate|Stolpehode|Stolpesko|Punktfundament/

function fasade(c: CarportConfig, vis: 'front' | 'venstre' | 'hoyre' | 'bak', id: string, navn: string): Riss2D {
  const m = modell(c)
  const { n } = m
  const sett = m.deler.filter((d) => d.part !== 'husvegg' && !SKJULT_I_FASADE.test(d.navn) && d.pid.indexOf('ribbe') < 0)
  // Sideriss: sperrer/takstoler er skjult bak raftebordet.
  const synlig = vis === 'front' || vis === 'bak' ? sett.filter((d) => !(d.part === 'kneband' && d.navn === 'Kneband langs')) : sett.filter((d) => d.part !== 'spaer' && d.navn !== 'Kneband tvers')
  const topp = m.hoyder.mone + 40
  const ext = omslutt(synlig)
  const u0 = vis === 'front' ? ext.min[0] : vis === 'bak' ? -ext.max[0] : vis === 'venstre' ? ext.min[2] : -ext.max[2]
  const u1 = vis === 'front' ? ext.max[0] : vis === 'bak' ? -ext.min[0] : vis === 'venstre' ? ext.max[2] : -ext.min[2]
  const former: Form2D[] = tilFormerCm(synlig, vis, [u0, 0], topp)
  const H = topp / 10
  const B = (u1 - u0) / 10
  const cmX = (u: number) => Math.round(u - u0) / 10
  const cmY = (y: number) => Math.round(topp - y) / 10
  const maal: Maal2D[] = []
  if (vis === 'front' || vis === 'bak') {
    const xa = vis === 'front' ? -n.W / 2 : -(n.W / 2)
    const xb = n.W / 2
    maal.push({ x1: cmX(xa), y1: H, x2: cmX(xb), y2: H, label: `${c.bredde} cm`, offset: 26 })
    maal.push({ x1: 0, y1: H, x2: B, y2: H, label: `${Math.round((u1 - u0) / 10)} cm`, offset: 52 })
    const xh = vis === 'front' ? -n.W / 2 : n.W / 2 - m.sb
    const fri = m.hoyder.fri
    maal.push({ x1: cmX(xh), y1: cmY(fri), x2: cmX(xh), y2: H, label: `Fri ${Math.round(fri / 10)} cm`, offset: -24 })
    maal.push({ x1: B, y1: cmY(m.hoyder.mone), x2: B, y2: H, label: `${n.type === 'saltak' ? 'Møne' : 'Topp'} ${Math.round(m.hoyder.mone / 10)} cm`, offset: 30 })
    if (n.type === 'saltak') maal.push({ x1: 0, y1: cmY(m.hoyder.gesims), x2: 0, y2: H, label: `Gesims ${Math.round(m.hoyder.gesims / 10)} cm`, offset: -30 })
  } else {
    const za = -n.L / 2
    const zb = n.L / 2
    const u = (z: number) => (vis === 'venstre' ? z : -z)
    maal.push({ x1: cmX(Math.min(u(za), u(zb))), y1: H, x2: cmX(Math.max(u(za), u(zb))), y2: H, label: `${c.lengde} cm`, offset: 26 })
    const ps = m.postZ.map(u).sort((a, b) => a - b)
    if (ps.length > 2) for (let i = 0; i < ps.length - 1; i++) maal.push({ x1: cmX(ps[i]), y1: H, x2: cmX(ps[i + 1]), y2: H, label: `${Math.round((ps[i + 1] - ps[i]) / 10)}`, offset: 50 })
    const r = vis === 'venstre' ? m.rader[0] : m.rader[m.rader.length - 1]
    maal.push({ x1: 0, y1: cmY(r.topp - m.tvDrager.h), x2: 0, y2: H, label: `${Math.round((r.topp - m.tvDrager.h) / 10)} cm`, offset: -26 })
  }
  return { id, navn, type: 'fasade', bredde: B, hoyde: H, former, maal, tekster: n.type !== 'flatt' && (vis === 'front' || vis === 'bak') ? [{ x: B / 2, y: cmY(m.hoyder.mone) - 4, tekst: `${n.vinkel}°` }] : undefined }
}

function tilFormerCm(deler: Prisme[], vis: 'front' | 'bak' | 'venstre' | 'hoyre' | 'plan', origo: P2, topp: number, tynn?: (p: Prisme) => boolean, stiplet?: (p: Prisme) => boolean): Form2D[] {
  return tilFormer(deler, vis, origo, topp, { tynn, stiplet }) as Form2D[]
}

function plan(c: CarportConfig): Riss2D {
  const m = modell(c)
  const { n } = m
  const sett = m.deler.filter((d) => ['stolpe', 'drager', 'spaer'].includes(d.part) && d.navn !== 'Takstol – stav ytre' && d.navn !== 'Takstol – stav indre' && !d.navn.includes('undergurt'))
  // Planens utstrekning = hele modellen (inkl. takutstikk og renner).
  const alt = omslutt(m.deler.filter((d) => d.part !== 'husvegg' && d.part !== 'fundament'))
  const x0 = alt.min[0]
  const z0 = alt.min[2]
  const renner = m.deler.filter((d) => d.navn === 'Takrenne 125 mm' || d.navn === 'Raftebord' || d.navn === 'Vindski')
  const former: Form2D[] = [
    ...tilFormerCm(sett, 'plan', [x0, z0], 0, (d) => d.part === 'spaer'),
    ...tilFormerCm(renner, 'plan', [x0, z0], 0, () => true),
    { type: 'rect', x: (m.tak.xMin - VS_T - x0) / 10, y: (m.tak.zMin - VS_T - z0) / 10, w: (m.tak.xMax - m.tak.xMin + 2 * VS_T) / 10, h: (m.tak.zMax - m.tak.zMin + 2 * VS_T) / 10, dashed: true },
  ]
  if (n.type === 'saltak') {
    const xm = (m.xO + (n.W - m.sb + m.bd) / 2 - x0) / 10
    former.push({ type: 'line', points: [[xm, (m.tak.zMin - VS_T - z0) / 10], [xm, (m.tak.zMax + VS_T - z0) / 10]], dashed: true })
  }
  const cx = (x: number) => Math.round(x - x0) / 10
  const cz = (z: number) => Math.round(z - z0) / 10
  const B = (alt.max[0] - x0) / 10
  const H = (alt.max[2] - z0) / 10
  const maal: Maal2D[] = [
    { x1: cx(-n.W / 2), y1: H, x2: cx(n.W / 2), y2: H, label: `${c.bredde} cm`, offset: 26 },
    { x1: 0, y1: H, x2: B, y2: H, label: `${Math.round(B)} cm (tak)`, offset: 50 },
    { x1: 0, y1: cz(-n.L / 2), x2: 0, y2: cz(n.L / 2), label: `${c.lengde} cm`, offset: -26 },
  ]
  for (let i = 0; i < m.postZ.length - 1; i++) maal.push({ x1: B, y1: cz(m.postZ[i]), x2: B, y2: cz(m.postZ[i + 1]), label: `${Math.round(m.stolpeAvstand / 10)}`, offset: 26 })
  return {
    id: 'plan',
    navn: 'Plan (ovenfra)',
    type: 'plan',
    bredde: B,
    hoyde: H,
    former,
    maal,
    tekster: [{ x: B / 2, y: 8, tekst: `${n.type === 'saltak' ? 'Takstoler' : 'Sperrer'} c/c ≤ ${Math.round(m.ccFaktisk * 1000)} mm` }],
  }
}

function snitt(c: CarportConfig): Riss2D {
  const m = modell(c)
  const { n } = m
  const zc = m.postZ[Math.floor((m.postZ.length - 1) / 2)]
  const kutt = m.deler.filter((d) => {
    if (d.part === 'husvegg' || /Spikerplate|Stolpesko|Sperrebeslag|Stolpehode/.test(d.navn)) return false
    const e = omslutt([d])
    return e.min[2] <= zc + 1 && e.max[2] >= zc - 1
  })
  const topp = m.hoyder.mone + 40
  const ext = omslutt(kutt)
  const u0 = ext.min[0]
  const former = tilFormerCm(kutt, 'front', [u0, 0], topp, (d) => d.navn === 'Taklekt' || d.part === 'tak')
  const B = (ext.max[0] - u0) / 10
  const H = topp / 10
  const cmX = (u: number) => Math.round(u - u0) / 10
  const cmY = (y: number) => Math.round(topp - y) / 10
  const maal: Maal2D[] = [
    { x1: cmX(-n.W / 2), y1: H, x2: cmX(n.W / 2), y2: H, label: `${c.bredde} cm`, offset: 26 },
    { x1: cmX(-n.W / 2), y1: cmY(m.hoyder.fri), x2: cmX(-n.W / 2), y2: H, label: `Fri ${Math.round(m.hoyder.fri / 10)}`, offset: -26 },
    { x1: B, y1: cmY(m.hoyder.mone), x2: B, y2: H, label: `${Math.round(m.hoyder.mone / 10)}`, offset: 26 },
  ]
  if (m.rader.length > 2 || (n.vegg && m.rader.length > 1)) {
    const xs = [...m.rader.map((r) => r.x), ...(n.vegg ? [n.W / 2] : [])]
    for (let i = 0; i < xs.length - 1; i++) maal.push({ x1: cmX(xs[i]), y1: H, x2: cmX(xs[i + 1]), y2: H, label: `${Math.round((xs[i + 1] - xs[i]) / 10)}`, offset: 50 })
  }
  return { id: 'snitt', navn: 'Snitt A–A (ved stolpelinje)', type: 'snitt', bredde: B, hoyde: H, former, maal, tekster: n.type !== 'flatt' ? [{ x: B / 2, y: cmY(m.hoyder.mone) + 8, tekst: `${n.vinkel}°` }] : undefined }
}

function tegning2D(c: CarportConfig): Tegning2D {
  const n = normaliser(c)
  return { riss: [plan(c), fasade(c, 'front', 'forfra', 'Forfra'), fasade(c, n.vegg ? 'venstre' : 'hoyre', 'siden', 'Fra siden'), snitt(c)] }
}

function soknadTegning(c: CarportConfig): Tegning2D {
  const n = normaliser(c)
  const riss: Riss2D[] = [plan(c), fasade(c, 'front', 'fasade-front', 'Fasade forfra'), fasade(c, 'bak', 'fasade-bak', 'Fasade bakfra'), fasade(c, 'venstre', 'fasade-venstre', 'Fasade venstre')]
  if (!n.vegg) riss.push(fasade(c, 'hoyre', 'fasade-hoyre', 'Fasade høyre'))
  riss.push(snitt(c))
  return { riss }
}

// ── Beregningsgrunnlag / byggeregler ───────────────────────────────

function posFor(c: CarportConfig, navn: string): string | undefined {
  return kappliste(c).find((r) => r.navn === navn)?.pos
}

function beregningsgrunnlag(c: CarportConfig): Beregningsgrunnlag {
  const m = modell(c)
  const { n } = m
  const deler: Record<string, Dimensjonering | Medlemskontroll> = {}
  const pos: Record<string, string> = {}
  const sett = (navn: string, d: Dimensjonering | Medlemskontroll | undefined, kappNavn?: string) => {
    if (!d) return
    deler[navn] = d
    const p = kappNavn ? posFor(c, kappNavn) : undefined
    if (p) pos[navn] = p
  }
  if (m.takstol) {
    sett('Takstol – overgurt', m.takstol.overgurt, 'Takstol – overgurt')
    sett('Takstol – undergurt', m.takstol.undergurt, 'Takstol – undergurt')
    sett('Takstol – staver', m.takstol.stav, 'Takstol – stav indre')
  } else sett('Sperre', m.sperre, 'Sperre')
  sett(m.rader.some((r) => r.rolle === 'midt') ? 'Drager (verste rad)' : 'Drager', m.drager, m.rader.some((r) => r.rolle === 'midt') ? 'Midtdrager' : 'Drager')
  sett('Stolpe – aksial', m.stolpe, m.rader[0].navn)
  sett('Stolpe – vind + aksial', m.stolpeVind, m.rader[0].navn)
  sett('Kneband', m.kneband, 'Kneband tvers')
  const vind = vindlast(VB0_STANDARD, 2, Math.max(4, m.hoyder.mone / 1000))
  const t = TAKTEKKE[n.tekke]
  const forut = [
    { navn: 'Taktype', verdi: n.type === 'flatt' ? 'Flatt tak, 2° fall' : `${n.type === 'saltak' ? 'Saltak' : 'Pulttak'} ${fmt(n.vinkel, 1)}°` },
    { navn: 'Taktekking', verdi: t.navn, kilde: `g_k = ${fmt(t.gk, 2)} kN/m² takflate (${t.oppbygging})` },
    { navn: 'Pålitelighetsklasse', verdi: 'CC1/RC1 (K_FI = 1,0)', kilde: 'NS-EN 1990 NA' },
    { navn: 'Tjenesteklasse', verdi: 'TK 2 tak/dragere (overdekket), TK 3 stolper', kilde: 'NS-EN 1995-1-1 2.3.1.3' },
    { navn: 'Materialer', verdi: 'C24 konstruksjonsvirke, GL30c limtre', kilde: 'NS-EN 338 / NS-EN 14080' },
    { navn: 'Stolpeavstand', verdi: Math.round(m.stolpeAvstand), enhet: 'mm' },
    { navn: n.type === 'saltak' ? 'Takstolavstand' : 'Sperreavstand', verdi: `c/c ≤ ${Math.round(m.ccFaktisk * 1000)}`, enhet: 'mm' },
    { navn: 'Vind', verdi: `v_b,0 = ${VB0_STANDARD} m/s, terrengkategori II`, kilde: 'NS-EN 1991-1-4 NA (standardverdi)', usikker: true },
    { navn: 'Grunn/frost', verdi: 'Morene (telefarlig), innlandsklima', kilde: 'Byggforsk 521.111 (forenklet sone)', usikker: true },
  ]
  if (m.snoEff.tekst) forut.push({ navn: 'Snøfonn mot husvegg', verdi: `effektiv sk = ${fmt(m.snoEff.sk, 2)} kN/m²`, kilde: m.snoEff.tekst, usikker: true })
  const rapport = lagBeregningsrapport({
    produkt: 'carport',
    tittel: `Carport ${c.bredde} × ${c.lengde} cm – ${n.type}`,
    forutsetninger: forut,
    snolast: { mark: m.sk, tak: snolastTak(m.snoEff.sk, n.vinkel) },
    vind,
    deler,
    pos,
    frost: m.frost,
    fundament: m.fundament,
    byggesak: m.byggesak,
    merknader: [
      ...forankringsraad({ aapentTak: true, oppdriftPerStolpeKN: m.oppdriftPerStolpe }),
      n.type === 'saltak' ? `Takstolene: ${m.takstol!.melding}. Oppleggsreaksjon per takstol: G = ${fmt(m.takstol!.reaksjon.G[0], 2)} kN, snø = ${fmt(m.takstol!.reaksjon.S[0], 2)} kN. Nedbøyning ${fmt(m.takstol!.nedboyningMm.inst, 1)} mm (snø).` : `Sperre: fuglemunn sete ${Math.round(m.sperreGeo!.fuglemunn.seteMm)} mm, dybde ${Math.round(m.sperreGeo!.fuglemunn.dybdeMm)} mm ≤ h/3 = ${Math.round(m.hSperre / 3)} mm.`,
      `Snø μ1 = ${fmt(mu1(n.vinkel), 2)} (snøen kan gli av – ingen snøfangere forutsatt).`,
    ],
    ekstraAdvarsler: m.meldinger,
  })
  return tilPlanVedlegg(rapport)
}

function byggeregler(c: CarportConfig) {
  const m = modell(c)
  const b = tilByggeregler(m.byggesak)
  b.punkter.splice(1, 0, `BYA ${fmt((m.n.W * m.n.L) / 1e6, 1)} m² regnet innenfor stolpene (takutstikk ≤ 1,0 m teller ikke). Mønehøyde ${fmt(m.hoyder.mone / 1000, 2)} m og gesimshøyde ${fmt(m.hoyder.gesims / 1000, 2)} m er målt fra terreng.`)
  if (m.n.vegg) b.punkter.push('Veggmontert carport er et tilbygg: den må ikke dekke rømningsvindu, og veggen må tåle festet (bjelkelag/stendere – ikke bare kledning).')
  return b
}

// ── Montering ──────────────────────────────────────────────────────

function monteringPlan(c: CarportConfig): MonteringSteg[] {
  const m = modell(c)
  const { n } = m
  const kl = kappliste(c)
  const p = (navn: string) => kl.find((r) => r.navn === navn)?.pos ?? ''
  const dybde = fmt(Math.max(1.0, m.frost.anbefaltDybdeM), 1)
  const diag = Math.round(Math.hypot(n.W, n.L) / 10)
  const steg: MonteringSteg[] = [
    { trinn: 'fundament', tittel: 'Sett ut og kontroller mål', tekst: `Sett ut hjørnene med snor og pinner: ${c.bredde} × ${c.lengde} cm utvendig over stolpene. Kontroller at diagonalene er like (≈ ${diag} cm). Stolpesentre: ${m.rader.length} rad(er) × ${m.postZ.length} stolper, c/c ${Math.round(m.stolpeAvstand / 10)} cm langs lengden.`, verktoy: ['Snor', 'Målebånd', 'Laser/vater'], tidTimer: 2 },
    { trinn: 'fundament', tittel: 'Støp punktfundamenter', tekst: `Grav til ${dybde} m (frostfri dybde, snøfri flate under tak) og legg 10 cm komprimert pukk i bunnen. Fundament per stolpe: ${m.fundament.valgt.navn}${m.fundament.valgt.type === 'betongsoyle-saale' ? ' – støp armert såle først, sett røret på sålen' : ''}. Pilarrøret står i lodd 5 cm over ferdig terreng og fylles med betong (B30). Sålen gir bæreflate og holder carporten nede mot vindsug (oppløft ca. ${fmt(Math.max(0, m.oppdriftPerStolpe), 1)} kN per stolpe). Støp inn stolpeskoene i riktig høyde og linje – snor langs radene. La betongen herde minst 3 døgn.`, verktoy: ['Spade/minigraver', 'Betongblander', 'Vater'], tidTimer: 6, advarsel: 'Pilarrøret må stå til frostfri dybde på telefarlig grunn – ellers kan telehiv løfte carporten.' },
    { trinn: 'reisverk', tittel: `Reis stolpene (pos. ${p(m.rader[0].navn)})`, tekst: `Kapp stolpene ${m.tvStolpe.profil} etter kapplista – stolpene har ulik lengde ${n.type === 'saltak' ? '' : 'per rad '}fordi ${n.type === 'saltak' ? 'dragerne ligger i samme høyde' : 'høy rad står høyere (takfall)'}. Sett dem i stolpeskoene, lodd i begge retninger og avstiv midlertidig med lekter.`, verktoy: ['Kappsag', 'Vater', 'Skrutvinge'], tidTimer: 3 },
    { trinn: 'reisverk', tittel: `Legg dragerne (pos. ${p('Drager')})`, tekst: `Legg dragerne ${m.tvDrager.profil}${m.tvDrager.materiale.startsWith('GL') ? ' (limtre GL30c)' : ''} langs lengden oppå stolpene i stolpehodebeslag, med ${OH_GAVL / 10} cm utstikk forbi endestolpene. ${m.tvDrager.antall > 1 ? `Lagene skrus/spikres sammen c/c 300 i forband, skjøter forskjøvet og alltid midt over stolpe. ` : ''}Bolt gjennom stolpehodet med 2 × M12. Kontroller at radene er parallelle og i riktig høyde (snor/laser).`, verktoy: ['Drill', 'Bor Ø13', 'Pipenøkkel'], tidTimer: 3 },
  ]
  if (n.vegg) steg.push({ trinn: 'reisverk', tittel: `Monter veggbjelken (pos. ${p('Veggbjelke mot hus')})`, tekst: `Fest veggbjelken 48×198 vannrett mot husveggen med overkant ${Math.round((m.rader[0].topp + (m.sperreGeo?.ovreSvillHoydeMm ?? 0)) / 10)} cm over terreng – i husets stendere/bjelkelag (ikke bare kledningen), 2 franske skruer 12×200 per stender. Bruk 10 mm lufteklosser mot kledningen og beslag over bjelken.`, verktoy: ['Laser', 'Drill', 'Pipenøkkel'], tidTimer: 2, advarsel: 'Finn stenderne i husveggen før du borer. Murvegg: bruk kjemisk anker.' })
  if (n.type === 'saltak') {
    const ts = m.takstol!
    steg.push({ trinn: 'tak', tittel: 'Lag takstolene', tekst: `Lag én takstol som mal på et plant underlag: undergurt 48×${ts.undergurt.valgt.h} ${Math.round((n.W - m.sb + m.bd) / 10)} cm, overgurter 48×${ts.overgurt.valgt.h} med loddkutt ${fmtGrader(n.vinkel)} i møne og raft, og W-staver 48×${ts.stav.valgt.h} (pos. ${p('Takstol – stav ytre')}/${p('Takstol – stav indre')}). Alle knutepunkter får spikerplate på begge sider. Kontroller mønehøyden og at malen er symmetrisk, og lag resten (${m.sperreZ.length} stk) på malen.`, verktoy: ['Kappsag', 'Hammer/presse', 'Vinkel'], tidTimer: 2 + m.sperreZ.length * 0.4, advarsel: 'Alternativt kan takstolene bestilles fra takstolfabrikk med denne geometrien – de prosjekterer da spikerplatene.' })
    steg.push({ trinn: 'tak', tittel: 'Reis takstolene', tekst: `Reis takstolene c/c ≤ ${Math.round(m.ccFaktisk * 1000)} mm – én rett over hver stolpelinje. Fest hver takstol til dragerne med sperrebeslag på begge sider. Stiv av midlertidig med en lekt langs mønet og diagonalt i takflaten til lekting/takplater er på.`, verktoy: ['Drill', 'Hammer'], tidTimer: 3 })
  } else {
    steg.push({ trinn: 'tak', tittel: `Kapp sperrene (pos. ${p('Sperre')})`, tekst: `Lag én sperre som mal: ${m.hSperre === 0 ? '' : `48×${m.hSperre}, `}${fmt((m.sperreGeo?.kappLengdeMm ?? 0) / 10, 1)} cm${m.rader.length > 2 || (n.vegg && m.rader.length > 1) ? ' (lengde på kappliste)' : ''}. Loddkutt ${fmtGrader(n.vinkel)} i begge ender. Fuglemunn på hver drager: sete ${Math.round(m.sperreGeo!.fuglemunn.seteMm)} mm, dybde ${Math.round(m.sperreGeo!.fuglemunn.dybdeMm)} mm (maks h/3 = ${Math.round(m.hSperre / 3)} mm). Prøv malen på alle dragere før du kapper resten.`, verktoy: ['Kappsag', 'Stikksag/håndsag', 'Vinkelhake'], tidTimer: 2 + m.sperreZ.length * 0.25 })
    steg.push({ trinn: 'tak', tittel: 'Legg sperrene', tekst: `Legg sperrene c/c ≤ ${CC_MAKS} mm – én rett over hver stolpelinje. Fest hver sperre med sperrebeslag på hver drager${n.vegg ? ' og i bjelkesko/beslag på veggbjelken' : ''}. Sperrenes utstikk ${OH_RAFT / 10} cm ved raftet.`, verktoy: ['Drill', 'Hammer'], tidTimer: 2 })
  }
  steg.push({ trinn: 'reisverk', tittel: `Monter kneband (pos. ${p('Kneband langs')}/${p('Kneband tvers')})`, tekst: `Kneband ${m.kneband.tverrsnitt.profil} i 45°: langs dragerne på hver side av stolpene, og på tvers fra stolpen opp til ${n.type === 'saltak' ? 'undergurten' : 'sperra'} over stolpelinja. Benlengde ${kbBenFor(n.h, m.stolpeAvstand, m.sb) / 10} cm. Bolt med 2 × M12 i hver ende. Fjern midlertidig avstivning når alle kneband er på.`, verktoy: ['Drill', 'Bor Ø13'], tidTimer: 2 + m.postZ.length * 0.4 })
  if (papp(n.tekke)) steg.push({ trinn: 'tak', tittel: 'Legg takplater', tekst: `Legg 18 mm kryssfiner (not/fjær) med lengderetning på tvers av sperrene, forskjøvne skjøter, endeskjøter midt på sperre. Skru c/c 150 i kant og 300 i felt.`, verktoy: ['Sirkelsag', 'Skrutrekker'], tidTimer: 3 })
  else steg.push({ trinn: 'tak', tittel: `Legg taklekter (pos. ${p('Taklekt')})`, tekst: `Taklekter 36×48 liggende, c/c ≤ 600 langs fallet, første lekt helt ute ved raftet. Skjøt alltid midt på sperre. Kontroller at lektene ligger i rett linje (snor).`, verktoy: ['Skrutrekker', 'Snor'], tidTimer: 2 })
  steg.push({ trinn: 'tak', tittel: 'Vindski, raftebord og renner', tekst: `Monter raftebord 22×148 på sperreendene og vindski 22×148 på gavlene${n.type === 'saltak' ? ' (gjæres i mønet)' : ''}. Heng opp takrenne med rennekroker c/c 600 og fall min. 1:200 mot nedløpet.`, verktoy: ['Gjæringssag', 'Snor'], tidTimer: 3 })
  steg.push({ trinn: 'tak', tittel: 'Tekking', tekst: n.tekke === 'stal' ? 'Legg stålplatene fra bakre gavl, med omlegg på ett profil og skruer med tetningsskive i bunnen av profilet c/c ihht. leverandør. Bruk plater med antikondensbelegg.' : n.tekke === 'polykarbonat' ? 'Legg polykarbonatplatene med kanalene i fallretningen, tett endene med tape (tett øverst, ventilerende nederst) og skru med tetningsskiver i forborede hull (termisk bevegelse).' : n.tekke === 'takpapp' ? 'Legg underlagspapp med 10 cm omlegg, deretter overlagspapp sveiset/spikret etter leverandørens anvisning.' : 'Legg underlagsbelegg, deretter shingel etter leverandørens anvisning (min. takvinkel 15°).', tidTimer: 4 })
  if (n.sider.length) steg.push({ trinn: 'kledning', tittel: 'Vegger', tekst: `Monter spikerslag 48×98 høykant mellom stolpene og kle ${n.sider.join(', ')} med ${c.veggtype === 'akryl' ? 'akrylplater i profiler' : c.veggtype === 'kombinert' ? 'stående kledning nederst og akrylplater øverst' : 'stående kledning'}. Hold kledningen minst 3 cm over terreng.`, tidTimer: 4 })
  return steg
}

function montering(c: CarportConfig): string[] {
  return monteringPlan(c).map((s) => `${s.tittel}: ${s.tekst}`)
}

function raad(c: CarportConfig): string[] {
  const m = modell(c)
  const { n } = m
  const r = [
    `Planen er dimensjonert for snølast på mark sk = ${fmt(m.sk.sk, 1)} kN/m²${m.sk.status === 'manuell' ? ' (oppgitt)' : ''}. Velg kommune og høyde over havet i «Byggested» – dimensjonene oppdateres automatisk.`,
    ...forankringsraad({ aapentTak: true }).slice(0, 2),
    'Bruk varmforsinkede beslag og rustfrie/varmforsinkede skruer utendørs. Impregnert virke (NTR AB) skal ikke ha kontakt med jord – stolpene står 40 mm over betong i stolpeskoene.',
    'Forbor i endene av kneband og sperrer så virket ikke sprekker, og forsegl endeved på stolpene.',
    'La impregnert virke tørke noen uker før beising/maling.',
  ]
  if (n.type === 'flatt') r.push('Flatt tak har 2° fall (≈ 1:30). Takpapp/membran er tryggest; stålplater på så slakt tak krever produkt godkjent for lav helning og tettede omlegg.')
  if (n.tekke === 'shingel' && n.vinkel < 15) r.push('Asfaltshingel krever normalt minst 15° takvinkel – øk vinkelen eller velg takpapp.')
  if (n.tekke === 'stal' && n.vinkel < 6) r.push('Stålplater bør ha minst 6° fall (ellers plater for lav helning med tettede omlegg).')
  if (n.vegg) r.push('Snø fra husets tak kan rase ned og danne snøfonn mot carporten. Beregningen forutsetter 2 m høydeforskjell til husets takfot og 10 m husbredde – er huset høyere/bredere, må sk økes (oppgi sk manuelt). Vurder snøfangere på husets tak.')
  if (m.rader.some((x) => x.rolle === 'midt')) r.push(`Spennet er for langt for én sperre, så planen har ${m.rader.filter((x) => x.rolle === 'midt').length} midtdrager-rad(er) med stolper. Vil du unngå midtstolper, velg saltak (takstoler) eller lavere snølast.`)
  if (m.tvDrager.materiale.startsWith('GL')) r.push('Limtredrageren er ikke impregnert: beskytt endeved med maling/endeforsegling og hold den under taket (tjenesteklasse 2).')
  return r
}

// ── 3D ─────────────────────────────────────────────────────────────

function buildMesh(c: CarportConfig, opts?: BuildOptions): THREE.Group {
  const m = modell(c)
  const tex = opts?.woodTexture ?? null
  const tre = (pid: string, darken = 1) => {
    const ov = opts?.overrides?.[pid]
    const base = new THREE.Color(resolveColor(ov?.treslag ?? c.treslag, ov?.farge ?? c.farge)).multiplyScalar(darken)
    const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.82, metalness: 0.03 })
    if (tex) mat.map = tex
    return mat
  }
  return byggGruppe(m.deler, { tre })
}

function bounds(c: CarportConfig) {
  const m = modell(c)
  const e = omslutt(m.deler, (d) => d.part !== 'husvegg')
  const x = 2 * Math.max(Math.abs(e.min[0]), Math.abs(e.max[0]))
  const z = 2 * Math.max(Math.abs(e.min[2]), Math.abs(e.max[2]))
  return { x: x / 1000, y: e.max[1] / 1000, z: z / 1000 }
}

// ── Template ───────────────────────────────────────────────────────

export const carport: ProductTemplate<CarportConfig> & {
  beregningsgrunnlag: (c: CarportConfig) => Beregningsgrunnlag
  monteringPlan: (c: CarportConfig) => MonteringSteg[]
} = {
  id: 'carport',
  navn: 'Carport',
  ikon: 'faWarehouse',
  beskrivelse: 'Tegn carporten i 3D – frittstående eller inntil huset, med flatt tak, pulttak eller saltak med takstoler. Dimensjonert etter Eurokode for snølasten der du bor.',
  bilde: '/images/products/carport-3d.webp',
  tilgjengelig: true,
  fraPris: 449,
  leveranser: ['plan'],
  defaultConfig: {
    montering: 'frittstående',
    bredde: 600,
    lengde: 600,
    hoyde: 230,
    takvinkel: 22,
    taktype: 'saltak',
    taktekke: 'stålplater',
    stolpeDim: 'auto',
    bjelkeDim: 'auto',
    veggtype: 'ingen',
    veggSider: 'bak+sider',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'enkel', navn: 'Enkel carport', beskrivelse: 'Én bil · pulttak 8° · stål', config: { montering: 'frittstående', bredde: 330, lengde: 540, hoyde: 220, taktype: 'pulttak', takvinkel: 8, taktekke: 'stålplater', stolpeDim: 'auto', veggtype: 'ingen' } },
    { id: 'dobbel', navn: 'Dobbel carport', beskrivelse: 'To biler · saltak 22° · takstoler', config: { montering: 'frittstående', bredde: 600, lengde: 600, hoyde: 230, taktype: 'saltak', takvinkel: 22, taktekke: 'stålplater', stolpeDim: 'auto', veggtype: 'ingen' } },
    { id: 'veggmontert', navn: 'Veggmontert', beskrivelse: 'Inntil huset · pulttak 6° · papp', config: { montering: 'veggmontert', bredde: 330, lengde: 540, hoyde: 225, taktype: 'pulttak', takvinkel: 6, taktekke: 'takpapp', stolpeDim: 'auto', veggtype: 'ingen' } },
    { id: 'stor-saltak', navn: 'Carport med bod-vegg', beskrivelse: 'Saltak 27° · shingel · kledd bakvegg', config: { montering: 'frittstående', bredde: 620, lengde: 720, hoyde: 230, taktype: 'saltak', takvinkel: 27, taktekke: 'shingel', stolpeDim: '148x148', veggtype: 'panel', veggSider: 'bak' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde (utvendig stolper)', min: 240, max: 800, step: 10, axis: 'x' },
    { key: 'hoyde', label: 'Fri høyde (u.k. drager)', min: 200, max: 300, step: 5, axis: 'y' },
    { key: 'lengde', label: 'Lengde', min: 300, max: 1200, step: 10, axis: 'z' },
    { key: 'takvinkel', label: 'Takvinkel', min: 3, max: 40, step: 1, unit: '°', axis: 'y', handle: false, markers: [6, 10, 15, 22, 27, 35], visibleWhen: (c) => c.taktype !== 'flatt' },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'montering',
      label: 'Montering',
      choices: [
        { id: 'frittstående', label: 'Frittstående', note: 'Stolper på begge sider.' },
        { id: 'veggmontert', label: 'Inntil huset', note: 'Høy side på veggbjelke mot husveggen (pulttak/flatt).', patch: { taktype: 'pulttak', takvinkel: 6 } },
      ],
    },
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'flatt', label: 'Flatt', note: '2° fall mot renna.' },
        { id: 'pulttak', label: 'Pulttak', note: 'Sperrer på dragere.', patch: { takvinkel: 8 } },
        { id: 'saltak', label: 'Saltak', note: 'Takstoler c/c 600.', patch: { takvinkel: 22, montering: 'frittstående' } },
      ],
    },
    {
      key: 'taktekke',
      label: 'Taktekke',
      choices: [
        { id: 'stålplater', label: 'Stålplater', note: 'På lekter, min. 6°.' },
        { id: 'polykarbonat', label: 'Polykarbonat', note: 'Slipper lys gjennom.' },
        { id: 'takpapp', label: 'Takpapp', note: 'På 18 mm kryssfiner.' },
        { id: 'shingel', label: 'Shingel', note: 'På kryssfiner, min. 15°.' },
      ],
    },
    {
      key: 'stolpeDim',
      label: 'Stolper',
      choices: [
        { id: 'auto', label: 'Beregnet', note: 'Minste dimensjon som holder.' },
        { id: '98x98', label: 'Minst 98 × 98' },
        { id: '148x148', label: '148 × 148', note: 'Kraftigere uttrykk.' },
      ],
    },
    {
      key: 'veggtype',
      label: 'Vegger',
      choices: [
        { id: 'ingen', label: 'Åpen', note: 'Ingen vegger.' },
        { id: 'panel', label: 'Kledning', note: 'Stående kledning.' },
        { id: 'akryl', label: 'Akryl', note: 'Klare akrylplater.' },
        { id: 'kombinert', label: 'Kledning + akryl', note: 'Kledning nede, akryl øverst.' },
      ],
    },
    {
      key: 'veggSider',
      label: 'Kledde sider',
      visibleWhen: (c) => c.veggtype !== 'ingen',
      choices: [
        { id: 'bak', label: 'Bak' },
        { id: 'bak+sider', label: 'Bak + sider' },
        { id: 'alle', label: 'Alle fire' },
      ],
    },
  ],
  parts: [
    { key: 'stolpe', label: 'Stolper' },
    { key: 'drager', label: 'Dragere' },
    { key: 'spaer', label: 'Sperrer / takstoler' },
    { key: 'kneband', label: 'Kneband' },
    { key: 'vegg', label: 'Vegger' },
    { key: 'tak', label: 'Tak' },
  ],
  beregn,
  kappliste,
  tegning2D,
  soknadTegning,
  raad,
  byggeregler,
  beregningsgrunnlag,
  monteringPlan,
  montering,
  buildMesh,
  bounds,
}

/** Til tester/QA: hele den beregnede modellen (prismer, dimensjonering, høyder). */
export const carportModell = (c: Partial<CarportConfig>) => modell({ ...carport.defaultConfig, ...c } as CarportConfig)
