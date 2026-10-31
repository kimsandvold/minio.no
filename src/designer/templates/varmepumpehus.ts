import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, Byggeregler, DesignConfig, ProductTemplate, Tegning2D } from '../types'
import type { Beregningsgrunnlag, KapplisteDelPlan, MonteringSteg } from '../plan-typer'
import { TRESLAG, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { snolastForConfig } from '../byggested'
import { VB0_STANDARD, fmt, snolastTak, vindOppdrift, vindlast } from '../laster'
import type { Taktekke } from '../laster'
import { kontrollerBjelke, kontrollerSoyle, linjelaster, taklaster, tverrsnitt } from '../dimensjonering'
import type { Medlemskontroll, Tverrsnitt } from '../dimensjonering'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { fmtGrader } from '../geometri'
import {
  basis, byggMesher, ende, f0, lagMatFabrikk, lmLinje, lmPerPris, plasser, prisme, prof, samleKappliste, stegTilTekst,
} from './smaa-felles'
import type { Stav, V2 } from './smaa-felles'

/**
 * Varmepumpehus – parametrisk template (Minio bygger det ferdig).
 *
 * KONSTRUKSJON (alle mål i meter i koden, cm i config):
 *  - Såle i U-form (front + to sider, åpen bak mot veggen), gjæret 45° i
 *    fronthjørnene. Standard: lekt 23×48 flatt. Forsterket: 48×98 flatt.
 *  - Fire hjørnebein av to lekter limt flate mot flate og forskjøvet én
 *    lekttykkelse (T), så spjeldene får en skulder å skrus mot. Bak-beina har
 *    to lekter innerst (96 mm) og står 48 mm bak bakplanet – den flaten skrus
 *    til husveggen.
 *  - Skrå spjeld (lameller): lekt T×48 kløyvd på langs med sagbladet tiltet
 *    45° → to like trapes-blad per lekt. Montert med 45° skråflate som faller
 *    UTOVER, så regn renner ut og luft passerer. Spjeldene på sidene følger
 *    takfallet med et hjørneklipp parallelt med strekkeren.
 *  - Front-stivere 11×36 bak frontspjeldene (c/c ≤ 600). På sidene er det et
 *    skråstag fra bakre bunn til fremre topp, som også holder hvert spjeld.
 *  - Tak: én sidestrekker (sperre) på hver side, båret av ytre lamell i bein-
 *    ene og kappet loddrett i begge ender. Tverrbord (åser) på høykant oppå
 *    strekkerne; antall og høyde dimensjoneres for snølast (NS-EN 1991-1-3 +
 *    NS-EN 1995-1-1). Takbord langs fallet: over/underligger, faspanel eller
 *    takpapp på tett bordunderlag. Fall FRAMOVER (bort fra veggen).
 *
 * Utedelen (varmepumpas utedel) vises som kontekst, og klaringene rundt den
 * kontrolleres mot vanlige krav i produsentenes monteringsanvisninger.
 */

export interface VarmepumpehusConfig {
  kvalitet: string // 'standard' (lekt 23×48) | 'forsterket' (36×48 + såle 48×98)
  bredde: number // cm (x) – utvendig mellom beinas ytterflater
  hoyde: number // cm – fri høyde foran (bakken → underkant sidestrekker i frontplanet)
  dybde: number // cm – frontplan → bakplan (bak-beina står 4,8 cm bak dette, mot veggen)
  takvinkel: number // grader
  spileGap: number // cm – luftspalte mellom spjeldene
  taktype: string // 'overunder' | 'faspanel' | 'takpapp'
  utedel: string // 'kompakt' | 'standard' | 'stor' | 'egen'
  utB: number // cm – egen utedel
  utH: number
  utD: number
  utMont: number // cm – utedelens underkant over bakken (veggkonsoll/bakkestativ)
  visUtedel: boolean
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const W = 0.048 // lektbredde
const OVERHENG_F = 0.05 // takutstikk foran sperre-/strekkerende
const TV_UT = 0.05 // tverrbordene stikker 5 cm ut forbi strekkerne
const VEGGAVSTAND = 0.1 // utedelens bakkant fra veggen (konsoll/stativ)
const STIV_T = 0.011
const STIV_B = 0.036
const STIV_MAKS = 0.6

/** Vanlige klaringer (produsentenes monteringsanvisninger – varierer per modell). */
export const KLARING = {
  side: { min: 0.1, anbefalt: 0.15 },
  front: { min: 0.15, anbefalt: 0.2 },
  topp: { min: 0.1, anbefalt: 0.15 },
  vegg: VEGGAVSTAND,
  service: 0.3,
}

/** Typiske utedeler (B × H × D, meter). Sjekk alltid målene på din modell. */
const UTEDELER: Record<string, { navn: string; B: number; H: number; D: number }> = {
  kompakt: { navn: 'Kompakt (2,5–3,5 kW)', B: 0.8, H: 0.55, D: 0.29 },
  standard: { navn: 'Standard (4–6 kW)', B: 0.84, H: 0.65, D: 0.33 },
  stor: { navn: 'Stor / nordisk modell', B: 0.95, H: 0.85, D: 0.37 },
}

const rad = (g: number) => (g * Math.PI) / 180
const cm = (v: number) => v / 100
const opp5 = (m: number) => Math.ceil(m * 20 - 1e-9) * 5 // meter → cm rundet opp til 5

function utedelMaal(c: VarmepumpehusConfig) {
  if (c.utedel === 'egen') return { navn: 'Egen utedel', B: cm(num(c.utB, 84)), H: cm(num(c.utH, 65)), D: cm(num(c.utD, 33)) }
  return UTEDELER[c.utedel] ?? UTEDELER.standard
}
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)

// ── Materialvalg ────────────────────────────────────────────────────

function virke(c: VarmepumpehusConfig) {
  const forsterket = c.kvalitet === 'forsterket'
  const T = forsterket ? 0.036 : 0.023
  return {
    forsterket,
    T,
    lektProfil: prof(forsterket ? 36 : 23, 48),
    lektPris: forsterket ? 'stolpe-36x48' : 'lekt-23x48',
    // Såle: flatt under begge beinlamellene (2T ≤ sålebredde).
    saaleH: forsterket ? 0.048 : 0.023,
    saaleB: forsterket ? 0.098 : 0.048,
    saaleProfil: forsterket ? prof(48, 98) : prof(23, 48),
    saalePris: forsterket ? 'stolpe-48x98' : 'lekt-23x48',
  }
}

/** Spjeldblad: trapes T dypt, a foran og a+T bak (45° skråflate). */
function blad(T: number) {
  const a = (W - T) / 2 // 12,5 mm (23) / 6 mm (36)
  return { a, h: a + T }
}

function tekke(c: VarmepumpehusConfig) {
  if (c.taktype === 'takpapp') return { bord: prof(21, 98), t: 0.021, b: 0.098, pris: 'bord-21x98', last: 'takpapp' as Taktekke }
  if (c.taktype === 'faspanel') return { bord: prof(19, 98), t: 0.019, b: 0.098, pris: 'bord-19x98', last: 'bord' as Taktekke }
  return { bord: prof(21, 98), t: 0.021, b: 0.098, pris: 'bord-21x98', last: 'bord' as Taktekke }
}

const pris = (id: string) => prisFor(id)
const prisNavn = (id: string) => PRISER[id]?.navn ?? id

function rammePris(T: number, h: number): string {
  const t = Math.round(T * 1000)
  const hh = Math.round(h * 1000)
  if (hh === 48) return t === 36 ? 'stolpe-36x48' : 'lekt-23x48'
  return `lekt-${t}x${hh}`
}

// ── Statikk (snø på taket) ──────────────────────────────────────────

const RAMMEHOYDER = [0.048, 0.073, 0.098]

interface Statikk {
  hR: number // sidestrekker-høyde
  /** 2 = strekkeren forsterkes med en innerlekt (to lag limt/skrudd). */
  lagR: number
  hT: number // tverrbord-høyde
  nTv: number // antall tverrbord
  ok: boolean
  melding: string
  bord: Medlemskontroll
  tverrbord: Medlemskontroll
  strekker: Medlemskontroll
  bein: Medlemskontroll
  sk: ReturnType<typeof snolastForConfig>
}

function statikk(c: VarmepumpehusConfig): Statikk {
  const v = virke(c)
  const T = v.T
  const w = cm(c.bredde)
  const d = cm(c.dybde)
  const a = Math.max(0, Math.min(60, c.takvinkel))
  const tk = tekke(c)
  const sk = snolastForConfig(c)
  const flater = taklaster({ sk: sk.sk, vinkelGrader: a, tekke: tk.last })
  const roofW = w + 2 * TV_UT
  const run = d + W + OVERHENG_F // horisontal takdybde (vegg → frontkant)
  const tvT = (h: number): Tverrsnitt => tverrsnitt(Math.round(T * 1000), Math.round(h * 1000), 1, 'C24', rammePris(T, h))
  // Takbord: bærende bredde (underligger bærer også halve overliggere).
  const bordTv = tverrsnitt(98, Math.round(tk.t * 1000), 1, 'C24', tk.pris)
  const bordTrib = c.taktype === 'overunder' ? 0.16 : tk.b

  let best: { kost: number; s: Statikk } | undefined
  let siste: Statikk | undefined
  for (let n = 2; n <= 8; n++) {
    const s = (run - T) / (n - 1) // horisontal c/c mellom tverrbordene
    const bord = kontrollerBjelke(bordTv, {
      spennM: s,
      vinkelGrader: a,
      laster: linjelaster(flater, bordTrib),
      tjenesteklasse: 3,
      nedboyning: 'tak',
      opplegglengdeMm: T * 1000,
      ccM: bordTrib,
    })
    const trib = n === 2 ? s / 2 + T / 2 + 0.02 : s
    const finn = (lag: (h: number, n: number) => Medlemskontroll, maksLag = 1) => {
      let k: Medlemskontroll | undefined
      for (let n = 1; n <= maksLag; n++) {
        for (const h of RAMMEHOYDER) {
          k = lag(h, n)
          if (k.ok) return { h, n, k }
        }
      }
      return { h: RAMMEHOYDER[RAMMEHOYDER.length - 1], n: maksLag, k: k as Medlemskontroll }
    }
    const tv = finn((h) =>
      kontrollerBjelke(tvT(h), {
        spennM: w - T,
        laster: linjelaster(flater, trib),
        tjenesteklasse: 2,
        nedboyning: 'tak',
        sidestottet: true,
        opplegglengdeMm: T * 1000,
        ccM: s,
      }),
    )
    // Sidestrekker: punktlaster fra tverrbordene → ekvivalent jevnt fordelt last
    // med samme maksimalmoment (fritt opplagt mellom front- og bakbein).
    const L = d
    const zFront = d / 2 + OVERHENG_F
    const zs = Array.from({ length: n }, (_, i) => zFront - T / 2 - i * s)
    const tribI = zs.map((_, i) => (i === 0 || i === n - 1 ? s / 2 + T / 2 : s))
    const pos = zs.map((z) => d / 2 - W / 2 - z) // avstand fra frontopplegg
    let M1 = 0
    for (let k = 0; k <= 40; k++) {
      const x = (k / 40) * L
      let RA = 0
      let M = 0
      pos.forEach((p, i) => {
        if (p <= 0 || p >= L) return
        const P = tribI[i] * (roofW / 2)
        RA += (P * (L - p)) / L
      })
      M = RA * x
      pos.forEach((p, i) => {
        if (p <= 0 || p >= L || p > x) return
        M -= tribI[i] * (roofW / 2) * (x - p)
      })
      M1 = Math.max(M1, M)
    }
    const tribEq = Math.max(0.05, (8 * M1) / (L * L))
    const st = finn((h, lag) =>
      kontrollerBjelke(tverrsnitt(Math.round(T * 1000), Math.round(h * 1000), lag, 'C24', rammePris(T, h)), {
        spennM: L,
        vinkelGrader: a,
        laster: linjelaster(flater, tribEq),
        tjenesteklasse: 3,
        nedboyning: 'tak',
        sidestottet: true,
        opplegglengdeMm: W * 1000,
      }),
    2)
    const qA = flater.reduce((sum, f) => sum + f.qk, 0)
    const legA = (roofW * run) / 4
    // Beina er holdt av spjeldene (skrudd c/c ≈ 75 mm) og skråstaget i begge
    // retninger. Konservativt: knekklengde 0,5 m om begge akser.
    const beinL = Math.max(0.3, cm(c.hoyde))
    const bein = kontrollerSoyle(tverrsnitt(Math.round(T * 1000), 48, 2, 'C24', v.lektPris), {
      lengdeM: beinL,
      knekklengdefaktor: Math.min(1, 0.5 / beinL),
      avstivetSvakAkse: true,
      svakAkseLengdeM: Math.min(0.5, beinL),
      NGk: flater.filter((f) => f.type === 'egen').reduce((sum, f) => sum + f.qk, 0) * legA + 0.05,
      NQk: flater.filter((f) => f.type !== 'egen').map((f) => ({ type: 'sno' as const, Nk: f.qk * legA, navn: f.navn })),
      tjenesteklasse: 3,
    })
    void qA
    const ok = bord.ok && tv.k.ok && st.k.ok && bein.ok
    const res: Statikk = {
      hR: st.h,
      lagR: st.n,
      hT: tv.h,
      nTv: n,
      ok,
      melding: ok
        ? `Taket holder for snølast sk = ${fmt(sk.sk, 1)} kN/m² med ${n} tverrbord ${prof(Math.round(T * 1000), Math.round(tv.h * 1000))} og sidestrekkere ${st.n > 1 ? '2 × ' : ''}${prof(Math.round(T * 1000), Math.round(st.h * 1000))}.`
        : `Taket holder IKKE for sk = ${fmt(sk.sk, 1)} kN/m² med disse målene – velg «Forsterket», mindre bredde eller kontakt oss.`,
      bord: { ...bord, navn: 'Takbord' },
      tverrbord: { ...tv.k, navn: 'Tverrbord (åse)' },
      strekker: { ...st.k, navn: 'Sidestrekker' },
      bein: { ...bein, navn: 'Hjørnebein' },
      sk,
    }
    siste = res
    if (ok) {
      const kost = n * tv.h * roofW + 2 * st.h * st.n * run
      if (!best || kost < best.kost - 1e-9) best = { kost, s: res }
    }
  }
  return best?.s ?? (siste as Statikk)
}

// ── Geometri ────────────────────────────────────────────────────────

interface Geo {
  w: number
  d: number
  h: number
  T: number
  a: number
  tanA: number
  cosA: number
  sinA: number
  yS: number
  zFront: number
  zBack: number
  roofW: number
  st: Statikk
  /** Underkant sidestrekker (= topp ytre beinlamell og sidespjeld). */
  L0: (z: number) => number
  /** Overkant sidestrekker (= underkant tverrbord, topp indre lamell). */
  L1: (z: number) => number
  /** Underkant takbord. */
  L2: (z: number) => number
  blad: { a: number; h: number }
  pitch: number
  gap: number
  ut: { navn: string; B: number; H: number; D: number }
  utMont: number
  /** Utedelens plassering (verdens-z for bak- og forkant). */
  utZ0: number
  utZ1: number
  klaring: { side: number; front: number; topp: number }
}

function geo(c: VarmepumpehusConfig): Geo {
  const v = virke(c)
  const T = v.T
  const w = cm(c.bredde)
  const d = cm(c.dybde)
  const h = cm(c.hoyde)
  const a = Math.max(0, Math.min(60, c.takvinkel))
  const tanA = Math.tan(rad(a))
  const cosA = Math.cos(rad(a))
  const sinA = Math.sin(rad(a))
  const st = statikk(c)
  const L0 = (z: number) => h + (d / 2 - z) * tanA
  const L1 = (z: number) => L0(z) + st.hR / cosA
  const L2 = (z: number) => L1(z) + st.hT / cosA
  const bl = blad(T)
  const gap = Math.max(0.01, cm(num(c.spileGap, 4)))
  const ut = utedelMaal(c)
  const utMont = cm(num(c.utMont, 30))
  const zBack = -d / 2 - W
  const utZ0 = zBack + VEGGAVSTAND
  const utZ1 = utZ0 + ut.D
  const innerW = w - 4 * T
  return {
    w, d, h, T, a, tanA, cosA, sinA,
    yS: v.saaleH,
    zFront: d / 2 + OVERHENG_F,
    zBack,
    roofW: w + 2 * TV_UT,
    st, L0, L1, L2,
    blad: bl,
    pitch: bl.h + gap,
    gap,
    ut,
    utMont,
    utZ0,
    utZ1,
    klaring: {
      side: (innerW - ut.B) / 2,
      front: d / 2 - T - STIV_T - utZ1,
      topp: L1(utZ1) - (utMont + ut.H),
    },
  }
}

/** Anbefalte utvendige mål (cm) for en utedel – brukes av utedel-valgene. */
function anbefalt(ut: { B: number; H: number; D: number }, T = 0.023, mont = 0.3, vinkel = 22.5, hR = 0.048) {
  const w = ut.B + 2 * KLARING.side.anbefalt + 4 * T
  const d = KLARING.front.anbefalt + T + STIV_T - W + VEGGAVSTAND + ut.D
  const dc = opp5(d)
  const tanA = Math.tan(rad(vinkel))
  const zFront = dc / 200 // d/2 i meter
  const utZ1 = -zFront - W + VEGGAVSTAND + ut.D
  const h = mont + ut.H + KLARING.topp.anbefalt - (zFront - utZ1) * tanA - hR / Math.cos(rad(vinkel))
  return { bredde: opp5(w), dybde: dc, hoyde: Math.max(50, opp5(h)) }
}

// ── Stavliste (én kilde for 3D, kappliste og materialliste) ─────────

const X: [number, number, number] = [1, 0, 0]
const Y: [number, number, number] = [0, 1, 0]
const Z: [number, number, number] = [0, 0, 1]

function konstruer(c: VarmepumpehusConfig): { staver: Stav[]; g: Geo } {
  const g = geo(c)
  const v = virke(c)
  const { w, d, T, yS, tanA, cosA, sinA, L0, L1 } = g
  const st = g.st
  const Tmm = Math.round(T * 1000)
  const staver: Stav[] = []
  const add = (s: Omit<Stav, 'kvalitet'> & { kvalitet?: string }) => staver.push({ kvalitet: 'Impregnert', ...s })

  // ── Såle (U-form, gjæret 45° foran) ──
  const sB = v.saaleB
  const sH = v.saaleH
  const saaleFront = prisme(
    [[0, d / 2 - sB], [0, d / 2], [sH, d / 2], [sH, d / 2 - sB]],
    (_y, z) => -w / 2 + (d / 2 - z),
    (_y, z) => w / 2 - (d / 2 - z),
  )
  add({ navn: 'Såle front', profil: v.saaleProfil, pris: v.saalePris, lengdeMm: w * 1000, endeA: ende(45, 'gjaering'), endeB: ende(45, 'gjaering'), part: 'ramme', pid: 'saale-front', geom: saaleFront, darken: 0.88, explode: new THREE.Vector3(0, -0.3, 0.2), kategori: 'konstruksjon', merknad: 'Ligger flatt. Gjæres 45° i begge ender.' })
  ;[1, -1].forEach((sx) => {
    // Lokal x = verdens z (bak → front), lokal z = verdens x.
    const prof2: V2[] = [[0, sx * (w / 2 - sB)], [0, sx * (w / 2)], [sH, sx * (w / 2)], [sH, sx * (w / 2 - sB)]]
    const geom = plasser(
      prisme(prof2, () => g.zBack, (_y, x) => d / 2 - (w / 2 - Math.abs(x))),
      basis(Z, Y, X),
    )
    add({ navn: 'Såle side', profil: v.saaleProfil, pris: v.saalePris, lengdeMm: (d / 2 - g.zBack) * 1000, endeA: ende(0), endeB: ende(45, 'gjaering'), part: 'ramme', pid: `saale-${sx > 0 ? 'h' : 'v'}`, geom, darken: 0.88, explode: new THREE.Vector3(sx * 0.2, -0.3, 0), kategori: 'konstruksjon', merknad: 'Gjæres 45° foran, rett kapp bak (mot veggen).' })
  })

  // ── Hjørnebein (to lamelllag, forskjøvet T) ──
  // Lokal x = verdens y (opp), lokal y = verdens z, lokal z = verdens x.
  const lamell = (navn: string, pid: string, x0: number, x1: number, z0: number, z1: number, topp: (z: number) => number, sx: number, sz: number) => {
    const geom = plasser(
      prisme([[z0, x0], [z1, x0], [z1, x1], [z0, x1]], () => yS, (z) => topp(z)),
      basis(Y, Z, X),
    )
    const lengde = Math.max(topp(z0), topp(z1)) - yS
    add({ navn, profil: v.lektProfil, pris: v.lektPris, lengdeMm: lengde * 1000, endeA: ende(0), endeB: ende(g.a, 'gjaering', 'skråkapp i takvinkelen over 48 mm-siden'), part: 'ramme', pid, geom, darken: 0.9, explode: new THREE.Vector3(sx * 0.25, 0, sz * 0.25), kategori: 'konstruksjon' })
  }
  ;[1, -1].forEach((sx) => {
    const xo0 = sx > 0 ? w / 2 - T : -w / 2
    const xo1 = sx > 0 ? w / 2 : -w / 2 + T
    const xi0 = sx > 0 ? w / 2 - 2 * T : -w / 2 + T
    const xi1 = sx > 0 ? w / 2 - T : -w / 2 + 2 * T
    const s = sx > 0 ? 'h' : 'v'
    // Front
    lamell('Hjørnebein front, ytre', `bein-f${s}-y`, xo0, xo1, d / 2 - W, d / 2, L0, sx, 1)
    lamell('Hjørnebein front, indre', `bein-f${s}-i`, xi0, xi1, d / 2 - T - W, d / 2 - T, L1, sx, 1)
    // Bak (ytre står W bak bakplanet – mot veggen)
    lamell('Hjørnebein bak, ytre', `bein-b${s}-y`, xo0, xo1, -d / 2 - W, -d / 2, L0, sx, -1)
    lamell('Hjørnebein bak, indre bakre', `bein-b${s}-ib`, xi0, xi1, -d / 2 + T - 2 * W, -d / 2 + T - W, L1, sx, -1)
    lamell('Hjørnebein bak, indre fremre', `bein-b${s}-if`, xi0, xi1, -d / 2 + T - W, -d / 2 + T, L1, sx, -1)
  })

  // ── Spjeld ──
  const bl = g.blad
  const vSpjeld = { profil: `${v.lektProfil} kløyvd 45°`, pris: v.lektPris, lmFaktor: 0.5, part: 'spiler', kategori: 'kledning' as const }
  // Front: mellom de ytre lamellene, fra sålen og opp under tverrbordet.
  const frontLen = w - 2 * T
  for (let i = 0, yb = yS; ; i++, yb += g.pitch) {
    if (yb + bl.a > L1(d / 2) - 0.002 || yb + bl.h > L1(d / 2 - T) - 0.002) break
    const geom = prisme(
      [[yb, d / 2], [yb + bl.a, d / 2], [yb + bl.h, d / 2 - T], [yb, d / 2 - T]],
      () => -frontLen / 2,
      () => frontLen / 2,
    )
    add({ navn: 'Spjeld front', ...vSpjeld, lengdeMm: frontLen * 1000, endeA: ende(0), endeB: ende(0), pid: `spjeld-f-${i}`, geom, explode: new THREE.Vector3(0, 0, 0.35) })
  }
  // Sider: fra bak-beinet til front-beinet; øverste blad får hjørneklipp
  // parallelt med strekkeren (planet z = d/2 − (y − h)/tan α).
  const zA = -d / 2
  const zB = d / 2 - W
  const kryss = L0(zB) // knekknivå: over dette klippes enden etter takfallet
  const zKutt = (y: number) => (tanA > 1e-6 ? d / 2 - (y - g.h) / tanA : y <= g.h + 1e-9 ? Infinity : -Infinity)
  ;[1, -1].forEach((sx) => {
    const s = sx > 0 ? 'h' : 'v'
    for (let i = 0, yb = yS; ; i++, yb += g.pitch) {
      const topp = yb + bl.h
      if (zKutt(topp) < zA + 0.06) break // for kort – ikke plass under strekkeren
      const xo = sx * (w / 2)
      const xi = sx * (w / 2 - T)
      const klipp = topp > kryss + 1e-6
      const geom = plasser(
        prisme(
          [[yb, xo], [yb + bl.a, xo], [yb + bl.h, xi], [yb, xi]],
          () => zA,
          (y) => Math.min(zB, zKutt(y)),
          klipp ? [kryss] : [],
        ),
        basis(Z, Y, X),
      )
      const lengde = Math.min(zB, zKutt(yb)) - zA
      add({
        navn: klipp ? 'Spjeld side, klippet' : 'Spjeld side',
        ...vSpjeld,
        lengdeMm: lengde * 1000,
        endeA: ende(0),
        endeB: klipp ? ende(90 - g.a, 'gjaering', `hjørneklipp parallelt med takfallet (${fmtGrader(g.a)})`) : ende(0),
        pid: `spjeld-${s}-${i}`,
        geom,
        explode: new THREE.Vector3(sx * 0.35, 0, 0),
      })
    }
  })

  // ── Front-stivere (11×36) bak frontspjeldene ──
  const nStiv = Math.max(0, Math.ceil(frontLen / STIV_MAKS - 1e-9) - 1)
  for (let k = 1; k <= nStiv; k++) {
    const x = -frontLen / 2 + (k * frontLen) / (nStiv + 1)
    const top = L1(d / 2 - T) - 0.002
    const z0 = d / 2 - T - STIV_T
    const geom = plasser(prisme([[z0, x - STIV_B / 2], [d / 2 - T, x - STIV_B / 2], [d / 2 - T, x + STIV_B / 2], [z0, x + STIV_B / 2]], () => yS, () => top), basis(Y, Z, X))
    add({ navn: 'Stiver bak frontspjeld', profil: prof(11, 36), pris: 'lekt-11x36', lengdeMm: (top - yS) * 1000, endeA: ende(0), endeB: ende(0), part: 'stiver', pid: `stiver-${k}`, geom, darken: 0.85, explode: new THREE.Vector3(0, 0, 0.2), kategori: 'konstruksjon' })
  }

  // ── Skråstag på sidene (indre lag, mellom indre lameller) ──
  const { zb, zf, beta, yc0 } = stag(g)
  const cb = Math.cos(beta)
  const sb = Math.sin(beta)
  ;[1, -1].forEach((sx) => {
    const x0 = sx > 0 ? w / 2 - 2 * T : -w / 2 + T
    const x1 = x0 + T
    // Lokal x langs staget (opp/fram), lokal y vinkelrett, lokal z = verdens x.
    const eU: [number, number, number] = [0, sb, cb]
    const eV: [number, number, number] = [0, cb, -sb]
    const geom = plasser(
      prisme(
        [[-W / 2, x0], [W / 2, x0], [W / 2, x1], [-W / 2, x1]],
        (vv) => (vv * sb) / cb,
        (vv) => (zf - zb + vv * sb) / cb,
      ),
      basis(eU, eV, X, [0, yc0, zb]),
    )
    const lengde = ((zf - zb) + (W / 2) * sb * 2) / cb
    add({ navn: 'Skråstag side', profil: v.lektProfil, pris: v.lektPris, lengdeMm: lengde * 1000, endeA: ende((beta * 180) / Math.PI, 'gjaering', 'loddrett kapp mot beinet'), endeB: ende((beta * 180) / Math.PI, 'gjaering', 'loddrett kapp mot beinet'), part: 'stiver', pid: `stag-${sx > 0 ? 'h' : 'v'}`, geom, darken: 0.85, explode: new THREE.Vector3(sx * 0.2, 0, 0), kategori: 'konstruksjon', merknad: `Stagvinkel ${fmtGrader((beta * 180) / Math.PI)} fra vannrett – begge ender kappes loddrett.` })
  })

  // ── Tak ──
  // Skrå ramme: lokal x langs fallet (fram/ned), lokal y vinkelrett opp, origo
  // på L0-linja i frontplanet. Loddrett kapp ved verdens z = Z.
  const eU: [number, number, number] = [0, -sinA, cosA]
  const eV: [number, number, number] = [0, cosA, sinA]
  const O: [number, number, number] = [0, g.h, d / 2]
  const lodd = (Zv: number) => (vv: number) => (Zv - d / 2 - vv * sinA) / cosA
  const skraa = (v0: number, v1: number, x0: number, x1: number, zA0: number, zA1: number) =>
    plasser(prisme([[v0, x0], [v1, x0], [v1, x1], [v0, x1]], lodd(zA0), lodd(zA1)), basis(eU, eV, X, O))
  // Lengde spiss–spiss langs staven (loddkutt gjør den ene kanten lengst).
  const loddLengde = (v0: number, v1: number) => Math.max(lodd(g.zFront)(v0), lodd(g.zFront)(v1)) - Math.min(lodd(g.zBack)(v0), lodd(g.zBack)(v1))

  const hR = st.hR
  const hT = st.hT
  const rProfil = prof(Tmm, Math.round(hR * 1000))
  const tProfil = prof(Tmm, Math.round(hT * 1000))
  ;[1, -1].forEach((sx) => {
    const x0 = sx > 0 ? w / 2 - T : -w / 2
    add({ navn: 'Sidestrekker', profil: rProfil, pris: rammePris(T, hR), lengdeMm: loddLengde(0, hR) * 1000, endeA: ende(g.a, 'gjaering', 'loddkutt'), endeB: ende(g.a, 'gjaering', 'loddkutt'), part: 'tak', pid: `strekker-${sx > 0 ? 'h' : 'v'}`, geom: skraa(0, hR, x0, x0 + T, g.zBack, g.zFront), darken: 0.86, explode: new THREE.Vector3(sx * 0.2, 0.25, 0), kategori: 'tak', merknad: `Loddkutt ${fmtGrader(g.a)} i begge ender. Hviler på ytre beinlamell foran og bak.` })
  })
  // Forsterket strekker: innerlekt i samme høyde, mellom de indre lamellene,
  // limt og skrudd til strekkeren (to lag samvirker).
  if (st.lagR > 1) {
    const zb2 = -d / 2 + T
    const zf2 = d / 2 - T - W
    const lengde = (Math.max(lodd(zf2)(0), lodd(zf2)(hR)) - Math.min(lodd(zb2)(0), lodd(zb2)(hR))) * 1000
    ;[1, -1].forEach((sx) => {
      const x0 = sx > 0 ? w / 2 - 2 * T : -w / 2 + T
      add({ navn: 'Sidestrekker, innerlekt', profil: rProfil, pris: rammePris(T, hR), lengdeMm: lengde, endeA: ende(g.a, 'gjaering', 'loddkutt'), endeB: ende(g.a, 'gjaering', 'loddkutt'), part: 'tak', pid: `strekker-i-${sx > 0 ? 'h' : 'v'}`, geom: skraa(0, hR, x0, x0 + T, zb2, zf2), darken: 0.83, explode: new THREE.Vector3(sx * 0.15, 0.25, 0), kategori: 'tak', merknad: 'Limes og skrus til sidestrekkeren (A4 5,0×50 c/c 150) – sammen bærer de taket.' })
    })
  }
  // Tverrbord på høykant oppå strekkerne. u-posisjoner langs fallet.
  const uFront = lodd(g.zFront)(hR + hT) // topp-forkant flukter med frontenden
  const uBack = lodd(g.zBack)(hR) // bunn-bakkant flukter med veggen
  const nTv = st.nTv
  const uC = Array.from({ length: nTv }, (_, i) => uFront - T / 2 - (i * (uFront - T - uBack)) / (nTv - 1))
  uC.forEach((u, i) => {
    const prof2: V2[] = [
      [hR, u - T / 2],
      [hR + hT, u - T / 2],
      [hR + hT, u + T / 2],
      [hR, u + T / 2],
    ]
    // Tverrbordet går langs verdens x: lokal x = verdens x, profil i (v, u).
    const geom = plasser(prisme(prof2, () => -g.roofW / 2, () => g.roofW / 2), basis(X, eV, eU, O))
    add({ navn: 'Tverrbord (åse)', profil: tProfil, pris: rammePris(T, hT), lengdeMm: g.roofW * 1000, endeA: ende(0), endeB: ende(0), part: 'tak', pid: `tverrbord-${i}`, geom, darken: 0.8, explode: new THREE.Vector3(0, 0.35, 0), kategori: 'tak', merknad: 'På høykant oppå strekkerne, 5 cm utstikk hver side. Skrus ned i strekkeren med 2 skruer.' })
  })
  // Takbord langs fallet, loddrett kapp foran og bak.
  const tk = tekke(c)
  const vB = hR + hT
  const takbord = (navn: string, x0: number, x1: number, v0: number, pid: string, darken: number, merknad?: string) =>
    add({ navn, profil: tk.bord, pris: tk.pris, lengdeMm: loddLengde(v0, v0 + tk.t) * 1000, endeA: ende(g.a, 'gjaering', 'loddkutt'), endeB: ende(g.a, 'gjaering', 'loddkutt'), part: 'tak', pid, geom: skraa(v0, v0 + tk.t, x0, x1, g.zBack, g.zFront), darken, explode: new THREE.Vector3(0, 0.55, 0), kategori: 'tak', merknad })
  const R = g.roofW
  if (c.taktype === 'overunder') {
    const b = 0.098
    const nU = Math.max(2, Math.ceil((R - b) / 0.156 - 1e-9) + 1)
    const P = (R - b) / (nU - 1)
    for (let i = 0; i < nU; i++) takbord('Takbord underligger', -R / 2 + i * P, -R / 2 + i * P + b, vB, `tak-u-${i}`, 0.82)
    for (let i = 0; i < nU - 1; i++) {
      const xc = -R / 2 + b / 2 + (i + 0.5) * P
      takbord('Takbord overligger', xc - b / 2, xc + b / 2, vB + tk.t, `tak-o-${i}`, 1, `Overlapp ${f0(((b - (P - b)) / 2) * 1000)} mm på hver side.`)
    }
  } else {
    const dekk = c.taktype === 'faspanel' ? 0.09 : 0.098 // faspanel: dekkbredde etter not/fjær
    const n = Math.max(1, Math.ceil(R / dekk - 1e-9))
    for (let i = 0; i < n; i++) {
      const x0 = -R / 2 + i * dekk
      const x1 = Math.min(R / 2, x0 + (c.taktype === 'faspanel' ? 0.098 : dekk)) - (c.taktype === 'faspanel' && i < n - 1 ? 0.008 : 0)
      const sist = i === n - 1 && R - i * dekk < dekk - 0.002
      takbord(c.taktype === 'faspanel' ? 'Faspanel (tak)' : 'Takbord (underlag)', x0, Math.max(x0 + 0.01, x1), vB, `tak-${i}`, i % 2 ? 0.97 : 1, sist ? `Siste bord kløyves til ${f0((R - i * dekk) * 1000)} mm.` : undefined)
    }
    if (c.taktype === 'takpapp') {
      const papp = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.95, metalness: 0.02 })
      staver.push({ navn: 'Takpapp', profil: 'takbelegg', lengdeMm: loddLengde(vB + tk.t, vB + tk.t + 0.004) * 1000, part: 'tak', pid: 'tak-papp', geom: skraa(vB + tk.t, vB + tk.t + 0.004, -R / 2, R / 2, g.zBack, g.zFront), materiale: papp, ikkeKapp: true, explode: new THREE.Vector3(0, 0.7, 0) })
    }
  }
  return { staver, g }
}

/** Utedelen (kontekst – medfølger ikke) med vifte, gitter og stativ. */
function byggUtedel(group: THREE.Group, g: Geo) {
  const { B, H, D } = g.ut
  const y0 = g.utMont
  const zc = (g.utZ0 + g.utZ1) / 2
  const kropp = new THREE.MeshStandardMaterial({ color: 0xe6e6e2, roughness: 0.55, metalness: 0.15 })
  const mork = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.7, metalness: 0.2 })
  const stal = new THREE.MeshStandardMaterial({ color: 0x8b9096, roughness: 0.5, metalness: 0.6 })
  const add = (geom: THREE.BufferGeometry, m: THREE.Material, navn: string, pid: string) => {
    const mesh = new THREE.Mesh(geom, m)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.part = 'utedel'
    mesh.userData.pid = pid
    mesh.userData.info = { navn, profil: '', lengdeCm: 0 }
    mesh.userData.kontekst = true // vises i alle byggetrinn, ikke en del av leveransen
    group.add(mesh)
    return mesh
  }
  const k = add(new THREE.BoxGeometry(B, H, D), kropp, 'Utedel varmepumpe (medfølger ikke)', 'utedel')
  k.receiveShadow = false
  k.position.set(0, y0 + H / 2, zc)
  // Viftegitter foran (vifta sitter normalt til venstre, servicedeksel til høyre).
  const r = Math.min(H * 0.4, B * 0.3)
  const gitter = add(new THREE.CylinderGeometry(r, r, 0.006, 40), mork, 'Viftegitter (medfølger ikke)', 'utedel-gitter')
  gitter.rotation.x = Math.PI / 2
  gitter.position.set(-B * 0.12, y0 + H / 2, g.utZ1 + 0.003)
  // Stativ/konsoll ned til bakken.
  if (y0 > 0.02) {
    ;[-1, 1].forEach((s, i) => {
      const fot = add(new THREE.BoxGeometry(0.04, y0, D * 0.9), stal, 'Bakkestativ (medfølger ikke)', `utedel-stativ-${i}`)
      fot.position.set(s * (B / 2 - 0.08), y0 / 2, zc)
    })
  }
}

function buildMesh(c: VarmepumpehusConfig, opts?: BuildOptions): THREE.Group {
  const group = new THREE.Group()
  const { staver, g } = konstruer(c)
  byggMesher(group, staver, lagMatFabrikk(c.treslag, c.farge, opts))
  if (c.visUtedel !== false) byggUtedel(group, g)
  return group
}

// ── Kappliste / materialliste ───────────────────────────────────────

function kappliste(c: VarmepumpehusConfig): KapplisteDelPlan[] {
  return samleKappliste(konstruer(c).staver)
}

function beregn(c: VarmepumpehusConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const { staver, g } = konstruer(c)
  const lm = lmPerPris(staver)
  const rekkefolge = ['stolpe-48x98', 'stolpe-36x48', 'lekt-23x48', 'lekt-23x73', 'lekt-23x98', 'lekt-36x73', 'lekt-36x98', 'bord-21x98', 'bord-19x98', 'lekt-11x36']
  const linjer: BomLine[] = [...lm.entries()]
    .sort((a, b) => rekkefolge.indexOf(a[0]) - rekkefolge.indexOf(b[0]))
    .map(([id, l]) => lmLinje(prisNavn(id), l, SVINN, { spesifikasjon: 'impregnert, C24/NTR AB' }))
  let woodKr = 0
  lm.forEach((l, id) => (woodKr += l * pris(id) * faktor))
  const takArealM2 = c.taktype === 'takpapp' ? g.roofW * ((g.zFront - g.zBack) / g.cosA) : 0
  const antDeler = staver.filter((s) => !s.ikkeKapp).length
  const skruer = Math.ceil((antDeler * 2.4 + 20) / 50) * 50
  const limFlasker = 1
  const veggSkruer = 4
  if (takArealM2 > 0) linjer.push({ navn: PRISER['takpapp'].navn, spesifikasjon: 'underlagsbelegg/takpapp m/ pappspiker', antall: Math.round(takArealM2 * 1.25 * 10) / 10, enhet: 'm²', kommentar: 'inkl. omlegg og brett over kantene' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4, 4,0×40 og 5,0×70', antall: skruer, enhet: 'stk' })
  linjer.push({ navn: PRISER['trelim'].navn, antall: limFlasker, enhet: 'stk', kommentar: 'laminering av hjørnebeina' })
  linjer.push({ navn: PRISER['skrue-6x80'].navn, spesifikasjon: 'eller 6×100 i plugg (mur/betong)', antall: veggSkruer, enhet: 'stk', kommentar: '2 per bak-bein, gjennom ytre lamell inn i veggen' })
  const estimatKr = Math.round(((woodKr + takArealM2 * 1.25 * prisFor('takpapp')) * SVINN + skruer * prisFor('skrue') + limFlasker * prisFor('trelim') + veggSkruer * prisFor('skrue-6x80')) / 10) * 10
  const takNavn = c.taktype === 'takpapp' ? 'takpapp' : c.taktype === 'faspanel' ? 'faspanel' : 'over/underligger'
  return {
    linjer,
    estimatKr,
    sammendrag: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm · ${fmt(c.takvinkel, 1)}° fall framover · ${takNavn} · ${g.ut.navn.toLowerCase()} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`,
    arealM2: (c.bredde * c.dybde) / 10000,
    maal: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm`,
    arbeidstimer: Math.round((3 + antDeler * 0.06) * 2) / 2,
  }
}

// ── Statikkvedlegg ───────────────────────────────────────────────────

function beregningsgrunnlag(c: VarmepumpehusConfig): Beregningsgrunnlag {
  const { staver, g } = konstruer(c)
  const st = g.st
  const vind = vindlast(VB0_STANDARD, 2, Math.max(2, g.L2(g.zBack)))
  // Egenvekt huset (5 kN/m³ impregnert virke).
  const kN = staver.reduce((s, p) => {
    const m = p.profil.match(/(\d+)\s*×\s*(\d+)/)
    if (!m) return s
    return s + (p.lengdeMm / 1000) * (Number(m[1]) / 1000) * (Number(m[2]) / 1000) * 5 * (p.lmFaktor ?? 1)
  }, 0)
  const takA = g.roofW * (g.zFront - g.zBack)
  const oppdrift = vindOppdrift(vind.qp, takA, kN, 1.2)
  return tilPlanVedlegg(
    lagBeregningsrapport({
      produkt: 'varmepumpehus',
      tittel: 'Varmepumpehus – tak og bein',
      snolast: { mark: st.sk, tak: snolastTak(st.sk.sk, g.a) },
      vind,
      forutsetninger: [
        { navn: 'Takvinkel', verdi: fmt(g.a, 1), enhet: '°' },
        { navn: 'Takflate (horisontal)', verdi: fmt(takA, 2), enhet: 'm²' },
        { navn: 'Tverrbord', verdi: `${st.nTv} stk ${prof(Math.round(g.T * 1000), Math.round(st.hT * 1000))}`, kilde: 'Valgt av beregningen' },
        { navn: 'Egenvekt huset', verdi: fmt(kN, 2), enhet: 'kN', kilde: 'Fra kapplista, 5 kN/m³' },
        { navn: 'Tjenesteklasse', verdi: '3 (takbord, bein, strekkere) / 2 (tverrbord under tak)' },
        { navn: 'Knekklengde bein', verdi: '0,5', enhet: 'm', kilde: 'Beina holdes av spjeld og skråstag i begge retninger' },
      ],
      deler: { Takbord: st.bord, 'Tverrbord (åse)': st.tverrbord, Sidestrekker: st.strekker, Hjørnebein: st.bein },
      merknader: [
        `Netto vindoppløft på taket (bruddgrense, cp,net 1,2): ${fmt(Math.max(0, oppdrift), 2)} kN. ${oppdrift > 0 ? 'Huset må forankres: 2 stk 6×80 (6×100 i plugg) gjennom hvert bak-bein inn i veggen, og sålen foran festes til helle/bakke med vinkelbeslag eller bakkeplugg.' : 'Egenvekten er større enn oppløftet, men fest likevel bak-beina til veggen.'}`,
        'Snø og is som raser fra hustaket er IKKE med i beregningen. Plasser ikke huset under takfot uten snøfanger – raset kan gi mange ganger sk.',
        'Spjeld, stivere og skråstag er ikke regnet bærende for snø – de avstiver beina og holder formen.',
      ],
      ekstraAdvarsler: st.ok ? [] : [st.melding],
    }),
  )
}

// ── Byggeregler / klaring ───────────────────────────────────────────

function klaringPunkter(g: Geo): { ok: boolean; punkter: string[] } {
  const k = g.klaring
  const mm = (v: number) => `${f0(v * 1000)} mm`
  const p: string[] = []
  let ok = true
  const sjekk = (navn: string, verdi: number, min: number, anb: number) => {
    if (verdi < min - 1e-6) {
      ok = false
      p.push(`✗ ${navn}: ${mm(verdi)} – under minimum ${mm(min)} (anbefalt ${mm(anb)}).`)
    } else if (verdi < anb - 1e-6) p.push(`! ${navn}: ${mm(verdi)} – OK, men anbefalt er ${mm(anb)}.`)
    else p.push(`✓ ${navn}: ${mm(verdi)} (anbefalt ≥ ${mm(anb)}).`)
  }
  sjekk('Klaring på hver side av utedelen', k.side, KLARING.side.min, KLARING.side.anbefalt)
  sjekk('Klaring fra viftegitteret til frontspjeldene', k.front, KLARING.front.min, KLARING.front.anbefalt)
  sjekk('Klaring over utedelen (til tverrbordet)', k.topp, KLARING.topp.min, KLARING.topp.anbefalt)
  return { ok, punkter: p }
}

function byggeregler(c: VarmepumpehusConfig): Byggeregler {
  const g = geo(c)
  const kl = klaringPunkter(g)
  const fri = (g.gap / g.pitch) * 100
  return {
    sokfri: true,
    tittel: kl.ok ? 'Ikke søknadspliktig – klaringene er OK' : 'Ikke søknadspliktig – men for liten klaring rundt utedelen',
    punkter: [
      `Utedel: ${g.ut.navn}, ${f0(g.ut.B * 1000)} × ${f0(g.ut.H * 1000)} × ${f0(g.ut.D * 1000)} mm (B × H × D), underkant ${f0(g.utMont * 100)} cm over bakken.`,
      ...kl.punkter,
      `Spjeldene har ${f0(fri)} % fri åpning (${f0(g.gap * 1000)} mm spalte, ${f0(g.blad.h * 1000)} mm blad). Hold minst ca. 50 % for å ikke strupe luftmengden.`,
      'Produsentene krever fri utblåsning foran viften (ofte 500 mm uten hindring) og 100–300 mm bak/til siden. Et lamellhus er et hinder – les monteringsanvisningen for DIN modell, og spør installatøren om garantivilkårene før du bygger inn utedelen.',
      'Servicesiden (ventiler/koblinger, normalt til høyre) må være tilgjengelig – huset er laget for å skrus løs fra veggen og løftes av.',
      'Varmepumpehus er ikke søknadspliktig (ikke bygning). Utedelens støy mot nabo vurderes etter kommunens praksis (ofte T-1442: 45 dB(A) om natten utenfor naboens soverom).',
    ],
  }
}

// ── Montering ────────────────────────────────────────────────────────

function monteringPlan(c: VarmepumpehusConfig): MonteringSteg[] {
  const g = geo(c)
  const v = virke(c)
  const Tmm = f0(g.T * 1000)
  const st = g.st
  return [
    {
      tittel: 'Kapp og kløyv',
      trinn: 'fundament',
      tekst: `Kapp alt etter kapplista. Spjeld: kløyv lekt ${v.lektProfil} på langs med sagbladet tiltet 45° og anlegget ${f0(g.blad.a * 1000)} mm fra bladet – to like blad per lekt (${f0(g.blad.a * 1000)} mm foran, ${f0(g.blad.h * 1000)} mm bak). Beinlamellene skråkappes ${fmtGrader(g.a)} i toppen, strekkerne og takbordene får loddkutt ${fmtGrader(g.a)} i begge ender.`,
      verktoy: ['Bordsirkelsag med skråstilling', 'Kapp-/gjæringssag', 'Vinkel og tommestokk'],
      tidTimer: 1.5,
    },
    {
      tittel: 'Legg sålen',
      trinn: 'bjelkelag',
      tekst: `Legg sålen (${v.saaleProfil} flatt) i U-form: front ${f0(g.w * 100)} cm og to sider, gjæret 45° i fronthjørnene og limt/skrudd. Sjekk diagonalene – rammen skal være i vinkel. Sålen står på et drenert grus-/pukklag eller heller, ikke rett på jord.`,
      tidTimer: 0.5,
    },
    {
      tittel: 'Lim hjørnebeina',
      trinn: 'reisverk',
      tekst: `Lim og skru indre lamell til ytre (D4-lim + 4,0×40 A4 c/c 150), forskjøvet ${Tmm} mm så det står en skulder ut mot spjeldene. Bak-beina har to indre lekter side om side. La limet herde.`,
      tidTimer: 0.5,
    },
    {
      tittel: 'Reis beina',
      trinn: 'reisverk',
      tekst: `Skru beina ned i sålen fra undersiden (2 skruer per lamell). Fronthøyden til underkant strekker er ${f0(g.h * 100)} cm; bak-beina er høyest. Bak-beinas bakre lamell står 48 mm bak bakplanet og skal ligge an mot veggen.`,
      tidTimer: 0.5,
    },
    {
      tittel: 'Monter skråstag og stivere',
      trinn: 'reisverk',
      tekst: `Skråstagene (${fmtGrader(stag(g).grader)} fra vannrett) skrus mellom de indre lamellene på hver side, fra bunnen bak til toppen foran. Front: ${Math.max(0, Math.ceil((g.w - 2 * g.T) / STIV_MAKS - 1e-9) - 1)} stiver(e) 11×36 bak frontspjeldene. Kontroller at huset står i lodd og vinkel.`,
      tidTimer: 0.5,
    },
    {
      tittel: 'Tak',
      trinn: 'tak',
      tekst: `Taket legges før spjeldene (lettere å komme til). Legg sidestrekkerne (${prof(Math.round(g.T * 1000), Math.round(st.hR * 1000))}) på de ytre lamellene og skru dem til de indre.${st.lagR > 1 ? ' Lim og skru en innerlekt i samme dimensjon inn mot hver strekker, mellom de indre lamellene.' : ''} Skru ${st.nTv} tverrbord (${prof(Math.round(g.T * 1000), Math.round(st.hT * 1000))}) på høykant oppå strekkerne med 5 cm utstikk hver side – fremste flukter med frontenden, bakerste med veggen. Legg takbordene langs fallet${c.taktype === 'takpapp' ? ', rull ut takpapp med 10 cm omlegg og brett den ned over kantene' : c.taktype === 'overunder' ? ' – underliggere først, så overliggere over hver glipe' : ' med fjæren opp i fallet'}.`,
      tidTimer: 1,
    },
    {
      tittel: 'Skru på spjeldene',
      trinn: 'kledning',
      tekst: `Start nederst på sålen og arbeid oppover med ${f0(g.gap * 1000)} mm spalte (lag en avstandskloss). Skråflaten skal VENDE OPP OG FALLE UTOVER (45°). Forbor og skru 2 skruer i hver ende, og én i hver stiver/skråstag. De øverste sidespjeldene klippes parallelt med takfallet.`,
      verktoy: ['Avstandskloss', 'Drill med forsenker'],
      tidTimer: 1.5,
      advarsel: 'Feil vei montert spjeld leder regn inn mot utedelen.',
    },
    {
      tittel: 'Sett huset over utedelen og fest det',
      trinn: 'ferdig',
      tekst: 'Løft huset over utedelen, skyv bak-beina inntil veggen og fest med 2 stk 6×80 gjennom hvert bak-bein (forbor Ø6 i spalten mellom spjeldene). Fest sålen foran med vinkelbeslag til helle eller bakkeplugg. Sjekk at avrimingsvannet renner fritt ut under utedelen.',
      tidTimer: 0.5,
      advarsel: 'Strømmen til utedelen skal være av når du jobber tett på den.',
    },
  ]
}
/** Skråstaget på sidene: fra bunnen bak (mot sålen) til toppen foran (under strekkeren). */
function stag(g: Geo) {
  const zb = -g.d / 2 + g.T
  const zf = g.d / 2 - g.T - W
  let beta = Math.atan2(g.L0(zf) - g.yS, zf - zb)
  let yc0 = 0
  for (let it = 0; it < 8; it++) {
    const halv = W / (2 * Math.cos(beta))
    yc0 = g.yS + halv + 0.002
    const yc1 = g.L0(zf) - halv - 0.004
    beta = Math.atan2(yc1 - yc0, zf - zb)
  }
  return { zb, zf, beta, yc0, grader: (beta * 180) / Math.PI }
}

// ── 2D-tegning ───────────────────────────────────────────────────────

function tegning2D(c: VarmepumpehusConfig): Tegning2D {
  const g = geo(c)
  const cmv = (m: number) => Math.round(m * 1000) / 10
  const B = cmv(g.w)
  const zF = g.zFront
  const zB = g.zBack
  const topp = (z: number) => g.L2(z) + tekke(c).t / g.cosA
  const Hb = cmv(topp(zB))
  const R = cmv(g.roofW)
  const ox = (R - B) / 2
  // Forfra: y ned fra toppen (Hb).
  const yv = (m: number) => Hb - cmv(m)
  const spjeldLinjer: Tegning2D['riss'][number]['former'] = []
  for (let yb = g.yS; yb + g.blad.a <= g.L1(g.d / 2) - 0.002; yb += g.pitch) {
    spjeldLinjer.push({ type: 'rect', x: ox + cmv(g.T), y: yv(yb + g.blad.a), w: B - 2 * cmv(g.T), h: cmv(g.blad.a), tynn: true })
  }
  const ut = g.ut
  // Utedelen tegnes stiplet bare når den får plass (ellers viser byggereglene ✗).
  const passer = g.klaring.topp > 0 && g.klaring.side > 0 && g.klaring.front > 0
  const forfra = {
    id: 'forfra',
    navn: 'Forfra',
    type: 'fasade' as const,
    bredde: R,
    hoyde: Hb,
    former: [
      // Bein (ytre lamell) – sett forfra skjuler de høyere bak-beina seg bak strekkerne.
      { type: 'rect' as const, x: ox, y: yv(g.L0(g.d / 2)), w: cmv(g.T), h: cmv(g.L0(g.d / 2)) },
      { type: 'rect' as const, x: ox + B - cmv(g.T), y: yv(g.L0(g.d / 2)), w: cmv(g.T), h: cmv(g.L0(g.d / 2)) },
      // Sidestrekkerne stiger bakover – synlige som bånd fra fronten til bakkant.
      { type: 'rect' as const, x: ox, y: yv(g.L1(zB)), w: cmv(g.T), h: cmv(g.L1(zB) - g.L0(g.d / 2)) },
      { type: 'rect' as const, x: ox + B - cmv(g.T), y: yv(g.L1(zB)), w: cmv(g.T), h: cmv(g.L1(zB) - g.L0(g.d / 2)) },
      { type: 'rect' as const, x: ox, y: yv(g.yS), w: B, h: cmv(g.yS) },
      // Fremre tverrbord og takflaten (fra frontkant opp til bakkant).
      { type: 'rect' as const, x: 0, y: yv(g.L2(zF)), w: R, h: cmv(g.L2(zF) - g.L1(zF)) },
      { type: 'poly' as const, points: [[0, yv(g.L2(zF))], [R, yv(g.L2(zF))], [R, yv(topp(zB))], [0, yv(topp(zB))], [0, yv(g.L2(zF))]] as Array<[number, number]>, tynn: true },
      ...spjeldLinjer,
      ...(passer ? [{ type: 'rect' as const, x: R / 2 - cmv(ut.B) / 2, y: yv(g.utMont + ut.H), w: cmv(ut.B), h: cmv(ut.H), dashed: true }] : []),
    ],
    maal: [
      { x1: ox, y1: Hb, x2: ox + B, y2: Hb, label: `${f0(B)} cm`, offset: 22 },
      { x1: 0, y1: yv(topp(zF)), x2: R, y2: yv(topp(zF)), label: `${f0(R)} cm (tak)`, offset: -18 },
      { x1: ox + B, y1: yv(g.h), x2: ox + B, y2: Hb, label: `${f0(cmv(g.h))} cm`, offset: 22 },
      { x1: R / 2 - cmv(ut.B) / 2, y1: yv(g.utMont), x2: R / 2 - cmv(ut.B) / 2, y2: Hb, label: `${f0(cmv(g.utMont))} cm`, offset: -14 },
    ],
    tekster: passer ? [{ x: R / 2 - 18, y: yv(g.utMont + ut.H / 2), tekst: 'utedel (stiplet)' }] : [],
  }
  // Fra siden: z fra veggen (venstre) mot front (høyre).
  const xs = (z: number) => cmv(z - zB)
  const D = cmv(zF - zB)
  const side = {
    id: 'siden',
    navn: 'Fra siden (vegg til venstre)',
    type: 'snitt' as const,
    bredde: D,
    hoyde: Hb,
    former: [
      { type: 'poly' as const, points: [[xs(zB), yv(g.L0(zB))], [xs(zF), yv(g.L0(zF))], [xs(zF), yv(topp(zF))], [xs(zB), yv(topp(zB))], [xs(zB), yv(g.L0(zB))]] as Array<[number, number]> },
      { type: 'rect' as const, x: xs(zB), y: yv(g.L0(zB)), w: cmv(W), h: cmv(g.L0(zB) - g.yS) },
      { type: 'rect' as const, x: xs(g.d / 2 - W), y: yv(g.L0(g.d / 2 - W)), w: cmv(W), h: cmv(g.L0(g.d / 2 - W) - g.yS) },
      { type: 'rect' as const, x: xs(zB), y: yv(g.yS), w: cmv(g.d / 2 - zB), h: cmv(g.yS) },
      { type: 'line' as const, points: [[xs(-g.d / 2 + g.T), yv(g.yS + 0.03)], [xs(g.d / 2 - g.T - W), yv(g.L0(g.d / 2 - g.T - W) - 0.03)]] as Array<[number, number]>, tynn: true },
      ...(passer ? [{ type: 'rect' as const, x: xs(g.utZ0), y: yv(g.utMont + ut.H), w: cmv(ut.D), h: cmv(ut.H), dashed: true }] : []),
      { type: 'line' as const, points: [[0, 0], [0, Hb]] as Array<[number, number]>, dashed: true },
    ],
    maal: [
      { x1: xs(-g.d / 2), y1: Hb, x2: xs(g.d / 2), y2: Hb, label: `${c.dybde} cm`, offset: 22 },
      { x1: xs(zF), y1: yv(g.L0(g.d / 2)), x2: xs(zF), y2: Hb, label: `${f0(cmv(g.h))} cm`, offset: 18 },
      { x1: 0, y1: yv(topp(zB)), x2: 0, y2: Hb, label: `${f0(Hb)} cm`, offset: -18 },
      { x1: xs(g.utZ1), y1: yv(g.utMont + ut.H / 2), x2: xs(g.d / 2 - g.T), y2: yv(g.utMont + ut.H / 2), label: `${f0(g.klaring.front * 1000)} mm`, offset: 0 },
    ],
    tekster: [
      { x: D * 0.35, y: yv(topp(0)) - 4, tekst: `${fmtGrader(g.a)} fall` },
      { x: 1, y: Hb * 0.5, tekst: 'vegg' },
    ],
  }
  // Plan: x mot høyre, z (vegg øverst).
  const plan = {
    id: 'plan',
    navn: 'Ovenfra (plan, uten tak)',
    type: 'plan' as const,
    bredde: B,
    hoyde: D,
    former: [
      { type: 'rect' as const, x: 0, y: 0, w: B, h: cmv(g.d / 2 - zB) },
      { type: 'rect' as const, x: B / 2 - cmv(ut.B) / 2, y: cmv(g.utZ0 - zB), w: cmv(ut.B), h: cmv(ut.D), dashed: true },
      { type: 'line' as const, points: [[0, 0], [B, 0]] as Array<[number, number]>, dashed: true },
      // Takets omriss (stiplet) – utstikk foran og til sidene.
      { type: 'rect' as const, x: -ox, y: 0, w: R, h: D, dashed: true, tynn: true },
    ],
    maal: [
      { x1: 0, y1: D, x2: B, y2: D, label: `${c.bredde} cm`, offset: 18 },
      { x1: -ox, y1: 0, x2: B + ox, y2: 0, label: `${f0(R)} cm (tak)`, offset: -14 },
      { x1: 0, y1: 0, x2: 0, y2: cmv(g.d / 2 - zB), label: `${f0(cmv(g.d / 2 - zB))} cm`, offset: -18 },
      { x1: cmv(2 * g.T), y1: cmv(g.utZ0 - zB + ut.D / 2), x2: B / 2 - cmv(ut.B) / 2, y2: cmv(g.utZ0 - zB + ut.D / 2), label: `${f0(g.klaring.side * 1000)} mm`, offset: 0 },
    ],
    tekster: [{ x: B / 2 - 6, y: -2, tekst: 'vegg' }],
  }
  return { riss: [forfra, side, plan] }
}

// ── Template ─────────────────────────────────────────────────────────

const utedelValg = (id: string) => {
  const u = UTEDELER[id]
  return { id, label: u.navn, note: `${f0(u.B * 1000)} × ${f0(u.H * 1000)} × ${f0(u.D * 1000)} mm – setter anbefalte mål`, patch: { ...anbefalt(u) } }
}
const DEF = anbefalt(UTEDELER.standard)

export const varmepumpehus: ProductTemplate<VarmepumpehusConfig> & {
  beregningsgrunnlag: (c: VarmepumpehusConfig) => Beregningsgrunnlag
  monteringPlan: (c: VarmepumpehusConfig) => MonteringSteg[]
} = {
  id: 'varmepumpehus',
  navn: 'Varmepumpehus',
  ikon: 'faFan',
  beskrivelse: 'Tegn varmepumpehuset i 3D rundt din utedel – skrå 45°-spjeld som slipper luften fritt ut, men skygger for regn og snø. Velg utedel, takvinkel og taktype; klaringen og snølasten sjekkes automatisk.',
  bilde: '/images/products/varmepumpehus-3d.webp',
  tilgjengelig: true,
  fraPris: 199,
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    kvalitet: 'standard',
    bredde: DEF.bredde,
    hoyde: DEF.hoyde,
    dybde: DEF.dybde,
    takvinkel: 22.5,
    spileGap: 4,
    taktype: 'overunder',
    utedel: 'standard',
    utB: 84,
    utH: 65,
    utD: 33,
    utMont: 30,
    visUtedel: true,
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'kompakt', navn: 'Kompakt', beskrivelse: 'Liten utedel, faspanel-tak', config: { utedel: 'kompakt', ...anbefalt(UTEDELER.kompakt), taktype: 'faspanel', kvalitet: 'standard', takvinkel: 22.5 } },
    { id: 'standard', navn: 'Standard', beskrivelse: 'Vanlig 4–6 kW, bordtak', config: { utedel: 'standard', ...DEF, taktype: 'overunder', kvalitet: 'standard', takvinkel: 22.5 } },
    { id: 'stor', navn: 'Stor utedel', beskrivelse: 'Forsterket, takpapp', config: { utedel: 'stor', ...anbefalt(UTEDELER.stor, 0.036), taktype: 'takpapp', kvalitet: 'forsterket', takvinkel: 15 } },
    { id: 'lav', navn: 'Lav takvinkel', beskrivelse: 'Moderne, 10° takpapp, sort', config: { utedel: 'standard', ...anbefalt(UTEDELER.standard, 0.023, 0.3, 10), taktype: 'takpapp', takvinkel: 10, farge: 'sort' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 70, max: 200, step: 5, axis: 'x' },
    { key: 'hoyde', label: 'Fri høyde foran', min: 50, max: 200, step: 5, axis: 'y' },
    { key: 'dybde', label: 'Dybde', min: 40, max: 150, step: 5, axis: 'z' },
    { key: 'takvinkel', label: 'Takvinkel (fall framover)', min: 0, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false, markers: [10, 15, 22.5, 30] },
    { key: 'spileGap', label: 'Spalte mellom spjeld', min: 2, max: 8, step: 0.5, unit: 'cm', axis: 'y', handle: false },
    { key: 'utMont', label: 'Utedel over bakken', min: 0, max: 60, step: 5, axis: 'y', handle: false },
    { key: 'utB', label: 'Utedel bredde', min: 60, max: 130, step: 1, axis: 'x', handle: false, visibleWhen: (c) => c.utedel === 'egen' },
    { key: 'utH', label: 'Utedel høyde', min: 40, max: 140, step: 1, axis: 'y', handle: false, visibleWhen: (c) => c.utedel === 'egen' },
    { key: 'utD', label: 'Utedel dybde', min: 20, max: 60, step: 1, axis: 'z', handle: false, visibleWhen: (c) => c.utedel === 'egen' },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'utedel',
      label: 'Utedel (varmepumpe)',
      choices: [utedelValg('kompakt'), utedelValg('standard'), utedelValg('stor'), { id: 'egen', label: 'Egne mål', note: 'Skriv inn målene fra databladet' }],
    },
    {
      key: 'kvalitet',
      label: 'Kvalitet',
      choices: [
        { id: 'standard', label: 'Standard', note: 'Lekt 23×48, såle 23×48.' },
        { id: 'forsterket', label: 'Forsterket', note: 'Lekt 36×48 og såle 48×98 – for store hus og mye snø.' },
      ],
    },
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'overunder', label: 'Over/underligger', note: 'Tett bordtak, min. ca. 15° fall.' },
        { id: 'faspanel', label: 'Faspanel', note: 'Pent, men bør ha ≥ 20° fall.' },
        { id: 'takpapp', label: 'Takpapp', note: 'Tettest – tåler lav takvinkel.' },
      ],
    },
  ],
  valg: [{ key: 'visUtedel', label: 'Vis utedelen', note: 'Viser utedelen og klaringen rundt den (medfølger ikke).' }],
  parts: [
    { key: 'spiler', label: 'Spjeld' },
    { key: 'ramme', label: 'Bein og såle' },
    { key: 'stiver', label: 'Stivere og skråstag' },
    { key: 'tak', label: 'Tak' },
  ],
  beregn,
  kappliste,
  tegning2D,
  byggeregler,
  beregningsgrunnlag,
  monteringPlan,
  montering: (c) => stegTilTekst(monteringPlan(c)),
  raad: (c) => {
    const g = geo(c)
    const r = [
      `Spjeldene har 45° skråflate som faller utover. Kløyv lekt ${virke(c).lektProfil} med bladet tiltet 45° – to like blad per lekt – og monter med ${f0(g.gap * 1000)} mm spalte (${f0((g.gap / g.pitch) * 100)} % fri åpning).`,
      'Hold utblåsningen fri: viften blåser kald luft rett fram. Ikke plasser noe foran huset, og hold minst 0,5 m fritt foran spjeldene.',
      'Utedelen bør stå på veggkonsoll eller bakkestativ minst 30 cm over bakken (over vanlig snødybde), og avrimingsvannet må kunne renne fritt bort – huset har ingen bunn.',
      'Brøyt/kost bort snø foran og på sidene etter snøfokk – tette spjeld gir dårligere virkningsgrad og kan gi isdannelse.',
      'Plasser ikke huset under takfot uten snøfanger – snø og is som raser fra taket kan knuse taket på huset.',
      'Bruk rustfrie A4-skruer og forbor i endene på spjeldene så de ikke sprekker. Lim beinlamellene med D4-lim.',
      'La 1–2 cm luft mellom takets bakkant og veggen, og fest huset så det kan skrus løs for service.',
      'La impregnert virke tørke noen uker før beis/maling.',
    ]
    if (c.taktype === 'overunder' && c.takvinkel < 15) r.unshift(`Takvinkel ${fmt(c.takvinkel, 1)}° er lav for bordtak – velg takpapp eller øk vinkelen til minst 15°.`)
    if (c.taktype === 'faspanel' && c.takvinkel < 20) r.unshift(`Takvinkel ${fmt(c.takvinkel, 1)}° er lav for faspanel – velg takpapp eller øk vinkelen til minst 20°.`)
    if (c.taktype === 'takpapp' && c.takvinkel < 5) r.unshift('Takpapp trenger minst ca. 5° fall (1:12) – ellers blir vannet stående.')
    if (!g.st.ok) r.unshift(g.st.melding)
    return r
  },
  buildMesh,
  bounds: (c) => {
    const g = new THREE.Group()
    const { staver, g: gg } = konstruer(c)
    byggMesher(g, staver, () => new THREE.MeshBasicMaterial())
    if (c.visUtedel !== false) byggUtedel(g, gg)
    const s = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3())
    return { x: s.x, y: s.y, z: s.z }
  },
}
