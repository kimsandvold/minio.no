import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, Form2D, KapplisteDel, ProductTemplate, Riss2D, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'

/**
 * Carport – parametrisk template (migrert fra Carportplanleggeren).
 *
 * Bæringen er stolper i 98×98 eller 148×148 som bærer dragere langs lengden.
 * Spærene ligger på tvers etter takfallet (flatt/pulttak/saltak), med tverr-
 * bjelker (undergurt) og avstiving (kongstolpe/45°-strevere ved saltak, midt-
 * strever ved pulttak) ved hver stolpelinje. Taktekke velges (stålplater,
 * polykarbonat, takpapp, shingel). Veggmontert varianten fester høy side til
 * husveggen (ingen stolper der). Åpen carport uten vegger – TODO: vegger.
 *
 * Konfig-mål er i CENTIMETER (designer-sliderne er cm), men den underliggende
 * geometrien regnes i meter slik Carportplanleggeren gjorde.
 */

export interface CarportConfig {
  montering: string // 'frittstående' | 'veggmontert'
  bredde: number // cm (x – på tvers)
  lengde: number // cm (z – kjøreretning)
  hoyde: number // cm (y – fri høyde, lav side)
  takvinkel: number // grader (pulttak/saltak)
  taktype: string // 'flatt' | 'pulttak' | 'saltak'
  taktekke: string // 'stålplater' | 'polykarbonat' | 'takpapp' | 'shingel'
  stolpeDim: string // '98x98' | '148x148'
  bjelkeDim: string // '48x148' | '48x198' | '48x223'
  veggtype: string // 'ingen' | 'panel' | 'akryl' | 'kombinert'
  veggSider: string // 'ingen' | 'bak' | 'bak+sider' | 'alle'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1 // 10 % kapp/svinn
const cm = (v: number) => v / 100

// Hvilke sider som kles, ut fra det enkle veggSider-valget.
type Side = 'front' | 'bak' | 'venstre' | 'høyre'
const veggSiderListe = (v: string): Side[] =>
  v === 'bak' ? ['bak'] : v === 'bak+sider' ? ['bak', 'venstre', 'høyre'] : v === 'alle' ? ['front', 'bak', 'venstre', 'høyre'] : []
const rad = (deg: number) => (deg * Math.PI) / 180

// Materialdimensjoner (meter).
const BEAM_W = 0.096 // dragerbredde (langs lengden)
const RAFTER_W = 0.048 // spærbredde
const TAKUTSTIKK = 0.3 // fast utstikk på alle kanter (m)
const SPAR_AVSTAND = 0.6 // c/c spæravstand (m)
const STOLPE_AVSTAND = 2.6 // maks senteravstand mellom stolper (m)

const stolpeSize = (dim: string) => (dim === '148x148' ? 0.148 : 0.098)
const bjelkeHoyde = (dim: string) => (dim === '48x223' ? 0.223 : dim === '48x148' ? 0.148 : 0.198)
const stolpePrisId = (dim: string) => (dim === '148x148' ? 'stolpe-148x148' : 'stolpe-98x98')
const bjelkePrisId = (dim: string) => (dim === '48x223' ? 'bjelke-48x223' : dim === '48x148' ? 'bjelke-48x148' : 'bjelke-48x198')

const taktekkePrisId = (t: string): string =>
  t === 'polykarbonat' ? 'taktekke-polykarbonat' : t === 'takpapp' ? 'taktekke-takpapp' : t === 'shingel' ? 'taktekke-shingel' : 'taktekke-stalplater'
const kreverSutak = (t: string) => t === 'takpapp' || t === 'shingel'

const taktekkeNavn = (t: string): string =>
  t === 'polykarbonat' ? 'Polykarbonat' : t === 'takpapp' ? 'Takpapp' : t === 'shingel' ? 'Shingel' : 'Stålplater'

// ── Geometri-hjelpere (samme som Carportplanleggeren) ──────────────

function takFall(c: CarportConfig): number {
  const b = cm(c.bredde)
  if (c.taktype === 'pulttak') return b * Math.tan(rad(c.takvinkel))
  if (c.taktype === 'saltak') return (b / 2) * Math.tan(rad(c.takvinkel))
  return 0
}

function skråfaktor(c: CarportConfig): number {
  return c.taktype === 'flatt' ? 1 : 1 / Math.cos(rad(c.takvinkel))
}

function stolperPerRad(c: CarportConfig): number {
  return Math.max(2, Math.ceil(cm(c.lengde) / Math.max(0.5, STOLPE_AVSTAND)) + 1)
}

function antallStolperader(c: CarportConfig): number {
  return c.montering === 'frittstående' ? 2 : 1
}

function antallSpaer(c: CarportConfig): number {
  return Math.max(2, Math.floor(cm(c.lengde) / Math.max(0.2, SPAR_AVSTAND)) + 1)
}

function spread(lo: number, hi: number, n: number): number[] {
  if (n <= 1) return [(lo + hi) / 2]
  const step = (hi - lo) / (n - 1)
  return Array.from({ length: n }, (_, i) => lo + i * step)
}

interface Eaves {
  left: number
  right: number
  ridge: number
}

function eaves(c: CarportConfig): Eaves {
  const h = cm(c.hoyde)
  const fall = takFall(c)
  if (c.taktype === 'flatt') return { left: h, right: h, ridge: h }
  if (c.taktype === 'pulttak') return { left: h, right: h + fall, ridge: h + fall }
  return { left: h, right: h, ridge: h + fall } // saltak
}

/** Takets underkant-høyde ved en gitt x (modellkoordinat). */
function roofY(c: CarportConfig, e: Eaves, x: number): number {
  const W = cm(c.bredde)
  const h = cm(c.hoyde)
  if (c.taktype === 'flatt') return h
  if (c.taktype === 'pulttak') return e.left + ((e.right - e.left) * x) / W
  const half = W / 2
  return e.left + (e.ridge - e.left) * (1 - Math.abs(x - half) / half)
}

// ── Beregning (materialliste + estimat) ────────────────────────────

function beregn(c: CarportConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const W = cm(c.bredde)
  const L = cm(c.lengde)
  const h = cm(c.hoyde)
  const oh = TAKUTSTIKK
  const bEff = W + 2 * oh
  const lEff = L + 2 * oh
  const sf = skråfaktor(c)
  const fall = takFall(c)

  // Stolper.
  const perRad = stolperPerRad(c)
  const rader = antallStolperader(c)
  const stolpeAntall = rader * perRad
  let stolpeLm: number
  if (c.montering === 'frittstående') {
    stolpeLm = c.taktype === 'pulttak' ? perRad * h + perRad * (h + fall) : stolpeAntall * h
  } else {
    stolpeLm = perRad * h
  }
  const stolpeskoAntall = stolpeAntall

  // Dragere langs lengden.
  const dragerLinjer = c.montering === 'frittstående' ? 2 : 1
  const veggfeste = c.montering === 'veggmontert' ? lEff : 0
  const dragerLm = dragerLinjer * lEff + veggfeste

  // Spær på tvers (følger takfallet → skråfaktor).
  const spaerAntall = antallSpaer(c)
  const spaerLengde = bEff * sf
  const spaerLm = spaerAntall * spaerLengde

  // Tverrbjelker (undergurt) + takstol-avstiving.
  const tverrbjelkeAntall = perRad
  let takstolAvstiving = 0
  if (c.taktype === 'saltak') {
    takstolAvstiving = lEff + perRad * 2 * (fall * 0.9 + 0.15) + perRad * fall // møne + 45°-strevere (2 pr. takstol) + kongstolper
  } else if (c.taktype === 'pulttak') {
    takstolAvstiving = perRad * Math.max(0, fall * 0.5) // midtstrevere
  }
  const tverrbjelkeLm = tverrbjelkeAntall * W + takstolAvstiving

  // Knebånd: to langsgående + ett på tvers pr. stolpe (à 0,7 m).
  const knebandAntall = stolpeAntall * 3
  const knebandLm = knebandAntall * 0.7

  // Takareal (projisert flate × skråfaktor).
  const takAreal = bEff * lEff * sf
  const sutakAreal = kreverSutak(c.taktekke) ? takAreal : 0

  // Løpemeter pr. materialtype.
  const stolpeId = stolpePrisId(c.stolpeDim)
  const bjelkeId = bjelkePrisId(c.bjelkeDim)
  const lmByMat = new Map<string, number>()
  const addLm = (mat: string, lm: number) => lmByMat.set(mat, (lmByMat.get(mat) ?? 0) + lm)
  addLm(stolpeId, stolpeLm + knebandLm) // knebånd i stolpedimensjon
  addLm(bjelkeId, dragerLm + spaerLm + tverrbjelkeLm)

  // Kostnad: trevirke × treslag-faktor + taktekke (+ sutak) + stolpesko + skruer.
  let woodKr = 0
  lmByMat.forEach((lm, mat) => {
    woodKr += lm * prisFor(mat) * faktor
  })
  const skrueAntall = stolpeAntall * 4 + spaerAntall * 8 + knebandAntall * 2 + Math.round(takAreal * 6)
  // Sperrebeslag (takåsanker): ett pr. spær pr. drageropplegg (vindsug, TEK17).
  const sperrebeslagAntall = spaerAntall * dragerLinjer
  const takKr = takAreal * prisFor(taktekkePrisId(c.taktekke)) + sutakAreal * prisFor('sutak')

  // Vegger / kledning (m²) etter valgt type + sider.
  const eV = eaves(c)
  const endeArea =
    c.taktype === 'flatt' ? h * W : c.taktype === 'pulttak' ? ((eV.left + eV.right) / 2) * W : eV.left * W + ((eV.ridge - eV.left) * W) / 2
  let panelM2 = 0
  let akrylM2 = 0
  if (c.veggtype !== 'ingen') {
    veggSiderListe(c.veggSider).forEach((sd) => {
      if (sd === 'venstre' || sd === 'høyre') {
        const topY = roofY(c, eV, sd === 'venstre' ? 0 : W)
        if (c.veggtype === 'panel') panelM2 += L * topY
        else if (c.veggtype === 'akryl') akrylM2 += L * topY
        else {
          const split = 0.6 * topY
          panelM2 += L * split
          akrylM2 += L * (topY - split)
        }
      } else {
        if (c.veggtype === 'panel') panelM2 += endeArea
        else if (c.veggtype === 'akryl') akrylM2 += endeArea
        else {
          const split = 0.6 * Math.min(eV.left, eV.right)
          panelM2 += W * split
          akrylM2 += endeArea - W * split
        }
      }
    })
  }
  const veggKr = panelM2 * prisFor('veggpanel') * faktor + akrylM2 * prisFor('akrylplate')

  const estimatKr =
    Math.round(
      (woodKr * SVINN +
        takKr +
        veggKr * SVINN +
        stolpeskoAntall * prisFor('stolpesko') +
        sperrebeslagAntall * prisFor('vinkelbeslag') +
        skrueAntall * prisFor('skrue')) /
        10,
    ) * 10

  // Materialliste = handleliste inkl. 10 % svinn.
  const rekkefolge = [stolpeId, bjelkeId]
  const linjer: BomLine[] = [...lmByMat.entries()]
    .sort((a, b) => rekkefolge.indexOf(a[0]) - rekkefolge.indexOf(b[0]))
    .map(([mat, lm]) => ({
      navn: PRISER[mat]?.navn ?? mat,
      antall: Math.round(lm * SVINN * 10) / 10,
      enhet: 'lm',
      kommentar: 'inkl. 10 % svinn',
    }))
  linjer.push({ navn: `${taktekkeNavn(c.taktekke)} (taktekke)`, antall: Math.round(takAreal * SVINN * 10) / 10, enhet: 'm²' })
  if (sutakAreal > 0) linjer.push({ navn: PRISER['sutak'].navn, antall: Math.round(sutakAreal * SVINN * 10) / 10, enhet: 'm²', kommentar: 'under tekking' })
  if (panelM2 > 0) linjer.push({ navn: PRISER['veggpanel'].navn, antall: Math.round(panelM2 * SVINN * 10) / 10, enhet: 'm²', kommentar: 'vegger' })
  if (akrylM2 > 0) linjer.push({ navn: PRISER['akrylplate'].navn, antall: Math.round(akrylM2 * SVINN * 10) / 10, enhet: 'm²', kommentar: 'vegger' })
  linjer.push({ navn: PRISER['stolpesko'].navn, antall: stolpeskoAntall, enhet: 'stk', kommentar: 'justerbar, én pr. stolpe' })
  linjer.push({ navn: 'Sperrebeslag (takåsanker)', spesifikasjon: 'forsinket vinkelbeslag', antall: sperrebeslagAntall, enhet: 'stk', kommentar: 'spær → drager (vindsug, TEK17)' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4 / varmforsinket', antall: skrueAntall, enhet: 'stk' })

  const stolpeStr = c.stolpeDim.replace('x', '×')
  const bjelkeStr = c.bjelkeDim.replace('x', '×')
  const sammendrag = `${c.bredde}×${c.lengde} cm · ${c.hoyde} cm fri høyde · ${c.taktype}${c.taktype !== 'flatt' ? ` ${c.takvinkel}°` : ''} · ${taktekkeNavn(c.taktekke)} · stolpe ${stolpeStr}, bjelke ${bjelkeStr} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.lengde) / 10000, maal: `${c.bredde} × ${c.lengde} cm` }
}

// ── Målsatt 2D-tegning (plan + oppriss) ────────────────────────────
// Fronten (gavl) viser takformen: flatt, pulttak (fall mot én side) eller
// saltak (møne på midten). Mål i cm.
function tegning2D(c: CarportConfig): Tegning2D {
  const W = c.bredde
  const L = c.lengde
  const h = c.hoyde // fri høyde, lav side
  const oh = Math.round(TAKUTSTIKK * 100) // takutstikk i cm
  const rad = (c.takvinkel * Math.PI) / 180
  const fall =
    c.taktype === 'pulttak' ? Math.round(W * Math.tan(rad))
    : c.taktype === 'saltak' ? Math.round((W / 2) * Math.tan(rad))
    : 0
  const H = h + fall // maks høyde (y=0 øverst, bakken ved y=H)

  // Forfra (gavl) – her synes takformen.
  const takLinje: Array<[number, number]> =
    c.taktype === 'flatt'
      ? [[-oh, 0], [W + oh, 0]]
      : c.taktype === 'pulttak'
        ? [[-oh, fall + oh * (fall / W)], [W + oh, -oh * (fall / W)]]
        : (() => {
            const s = fall / (W / 2)
            return [[-oh, fall + oh * s], [0, fall], [W / 2, 0], [W, fall], [W + oh, fall + oh * s]]
          })()
  const høyreEave = c.taktype === 'pulttak' ? 0 : fall // y for høyre raft
  const forfra: Tegning2D['riss'][number] = {
    id: 'forfra',
    navn: 'Forfra',
    type: 'fasade',
    bredde: W,
    hoyde: H,
    former: [
      { type: 'poly', points: takLinje },
      { type: 'line', points: [[0, fall], [0, H]] },
      { type: 'line', points: [[W, høyreEave], [W, H]] },
    ],
    maal: [
      { x1: 0, y1: H, x2: W, y2: H, label: `${W} cm`, offset: 26 },
      { x1: 0, y1: fall, x2: 0, y2: H, label: `${h} cm`, offset: 24 },
    ],
    tekster: c.taktype !== 'flatt' ? [{ x: W * 0.5, y: Math.max(6, fall * 0.5), tekst: `${c.takvinkel}°` }] : undefined,
  }

  // Fra siden – lengde + fri høyde. Møne/høy side bak vises stiplet.
  const fraSiden: Tegning2D['riss'][number] = {
    id: 'siden',
    navn: 'Fra siden',
    type: 'fasade',
    bredde: L,
    hoyde: H,
    former: [
      { type: 'line', points: [[-oh, fall], [L + oh, fall]] }, // nær raft
      { type: 'line', points: [[0, fall], [0, H]] },
      { type: 'line', points: [[L, fall], [L, H]] },
      ...(fall > 0 ? [{ type: 'line' as const, points: [[-oh, 0], [L + oh, 0]] as Array<[number, number]>, dashed: true }] : []),
    ],
    maal: [
      { x1: 0, y1: H, x2: L, y2: H, label: `${L} cm`, offset: 26 },
      { x1: 0, y1: fall, x2: 0, y2: H, label: `${h} cm`, offset: 24 },
    ],
  }

  // Ovenfra (plan) – grunnflate. Møne stiplet ved saltak.
  const ovenfra: Tegning2D['riss'][number] = {
    id: 'plan',
    navn: 'Ovenfra (plan)',
    type: 'plan',
    bredde: W,
    hoyde: L,
    former: [
      { type: 'rect', x: 0, y: 0, w: W, h: L },
      ...(c.taktype === 'saltak' ? [{ type: 'line' as const, points: [[W / 2, 0], [W / 2, L]] as Array<[number, number]>, dashed: true }] : []),
    ],
    maal: [
      { x1: 0, y1: L, x2: W, y2: L, label: `${W} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: L, label: `${L} cm`, offset: 24 },
    ],
  }

  return { riss: [forfra, fraSiden, ovenfra] }
}

// ── Søknadsklart tegningssett (plan + 4 fasader + snitt) ───────────
// Komplett tegningsserie til byggesøknad. Bygger rene 2D-riss fra de samme
// parametrene som 3D-modellen, klassifisert med `type` slik at PDF-en tegner
// terrenglinje på fasader/snitt. Snittets høyder (fri høyde, gesims, møne)
// følger samme utregning som `byggeregler()` så tallene stemmer overens. cm.
function soknadTegning(c: CarportConfig): Tegning2D {
  const W = c.bredde
  const L = c.lengde
  const h = c.hoyde
  const oh = Math.round(TAKUTSTIKK * 100)
  const r = (c.takvinkel * Math.PI) / 180
  const fall =
    c.taktype === 'pulttak' ? Math.round(W * Math.tan(r))
    : c.taktype === 'saltak' ? Math.round((W / 2) * Math.tan(r))
    : 0
  const H = h + fall // høyeste roofline over bakken
  const jh = Math.round(bjelkeHoyde(c.bjelkeDim) * 100) // bjelkehøyde i cm

  // Takprofil sett fra gavl (identisk med tegning2D sin «Forfra»).
  const takLinje: Array<[number, number]> =
    c.taktype === 'flatt'
      ? [[-oh, 0], [W + oh, 0]]
      : c.taktype === 'pulttak'
        ? [[-oh, fall + oh * (fall / W)], [W + oh, -oh * (fall / W)]]
        : (() => {
            const s = fall / (W / 2)
            return [[-oh, fall + oh * s], [0, fall], [W / 2, 0], [W, fall], [W + oh, fall + oh * s]]
          })()
  const høyreEave = c.taktype === 'pulttak' ? 0 : fall

  // Gavl-fasade (forfra/bakfra) – her synes takformen.
  const gavl = (id: string, navn: string): Riss2D => ({
    id,
    navn,
    type: 'fasade',
    bredde: W,
    hoyde: H,
    former: [
      { type: 'poly', points: takLinje },
      { type: 'line', points: [[0, fall], [0, H]] },
      { type: 'line', points: [[W, høyreEave], [W, H]] },
    ],
    maal: [
      { x1: 0, y1: H, x2: W, y2: H, label: `${W} cm`, offset: 26 },
      { x1: 0, y1: fall, x2: 0, y2: H, label: `${h} cm`, offset: 24 },
    ],
    tekster: c.taktype !== 'flatt' ? [{ x: W * 0.5, y: Math.max(6, fall * 0.5), tekst: `${c.takvinkel}°` }] : undefined,
  })

  // Langside-fasade (venstre/høyre) – lengde + takets nære raftkant. Høy side
  // bak vises stiplet. Ved pulttak er høyre langside høyere enn venstre.
  const langside = (id: string, navn: string, side: 'venstre' | 'høyre'): Riss2D => {
    const nearH = side === 'høyre' && c.taktype === 'pulttak' ? h + fall : h
    const yNear = H - nearH
    const farH = c.taktype === 'flatt' ? h : h + fall
    const yFar = H - farH
    const former: Form2D[] = [
      { type: 'line', points: [[-oh, yNear], [L + oh, yNear]] },
      { type: 'line', points: [[0, yNear], [0, H]] },
      { type: 'line', points: [[L, yNear], [L, H]] },
    ]
    if (yFar < yNear - 0.5) former.push({ type: 'line', points: [[-oh, yFar], [L + oh, yFar]], dashed: true })
    return {
      id,
      navn,
      type: 'fasade',
      bredde: L,
      hoyde: H,
      former,
      maal: [
        { x1: 0, y1: H, x2: L, y2: H, label: `${L} cm`, offset: 26 },
        { x1: 0, y1: yNear, x2: 0, y2: H, label: `${nearH} cm`, offset: 24 },
      ],
    }
  }

  // Plan (ovenfra) – grunnflate. Møne stiplet ved saltak.
  const plan: Riss2D = {
    id: 'plan',
    navn: 'Plan (ovenfra)',
    type: 'plan',
    bredde: W,
    hoyde: L,
    former: [
      { type: 'rect', x: 0, y: 0, w: W, h: L },
      ...(c.taktype === 'saltak' ? [{ type: 'line' as const, points: [[W / 2, 0], [W / 2, L]] as Array<[number, number]>, dashed: true }] : []),
    ],
    maal: [
      { x1: 0, y1: L, x2: W, y2: L, label: `${W} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: L, label: `${L} cm`, offset: 24 },
    ],
  }

  // Snitt A–A – tverrsnitt med tak-band (bjelkehøyde) og loddrette
  // høydemål fra terreng: fri høyde, gesims og møne (samme tall som byggeregler).
  const snitt: Riss2D = (() => {
    const mone = h + fall + jh
    const gesims = h + (c.taktype === 'pulttak' ? fall : 0) + jh
    const Htot = mone
    const Y = (hgt: number) => Htot - hgt // høyde over bakken → y (y peker ned)
    const under: Array<[number, number]> =
      c.taktype === 'saltak' ? [[0, h], [W / 2, h + fall], [W, h]]
      : c.taktype === 'pulttak' ? [[0, h], [W, h + fall]]
      : [[0, h], [W, h]]
    const topp = under.map(([x, hh]) => [x, hh + jh] as [number, number])
    const band: Array<[number, number]> = [
      ...under.map(([x, hh]) => [x, Y(hh)] as [number, number]),
      ...[...topp].reverse().map(([x, hh]) => [x, Y(hh)] as [number, number]),
      [under[0][0], Y(under[0][1])],
    ]
    const høyreUnder = c.taktype === 'pulttak' ? h + fall : h
    const former: Form2D[] = [
      { type: 'poly', points: band },
      { type: 'line', points: [[0, Y(h)], [0, Y(0)]] },
      { type: 'line', points: [[W, Y(høyreUnder)], [W, Y(0)]] },
    ]
    // Høydemål fordeles på begge sider så de holder seg innenfor margen (66 cm):
    // fri høyde + møne stables til venstre, gesims settes til høyre (ved raftet).
    const maal: Riss2D['maal'] = [
      { x1: 0, y1: Y(0), x2: W, y2: Y(0), label: `${W} cm`, offset: 26 },
      { x1: 0, y1: Y(h), x2: 0, y2: Y(0), label: `Fri ${h} cm`, offset: 26 },
      { x1: W, y1: Y(gesims), x2: W, y2: Y(0), label: `Gesims ${gesims} cm`, offset: 26 },
    ]
    if (mone > gesims + 0.5) maal.push({ x1: 0, y1: Y(mone), x2: 0, y2: Y(0), label: `Møne ${mone} cm`, offset: 52 })
    return { id: 'snitt', navn: 'Snitt A–A', type: 'snitt', bredde: W, hoyde: Htot, former, maal }
  })()

  return {
    riss: [
      plan,
      gavl('fasade-front', 'Fasade forfra'),
      gavl('fasade-bak', 'Fasade bakfra'),
      langside('fasade-venstre', 'Fasade venstre', 'venstre'),
      langside('fasade-hoyre', 'Fasade høyre', 'høyre'),
      snitt,
    ],
  }
}

// ── Kappliste ──────────────────────────────────────────────────────

function kappliste(c: CarportConfig): KapplisteDel[] {
  const e = eaves(c)
  const jh = bjelkeHoyde(c.bjelkeDim)
  const oh = TAKUTSTIKK
  const W = cm(c.bredde)
  const L = cm(c.lengde)
  const stolpeStr = c.stolpeDim.replace('x', '×')
  const bjelkeStr = c.bjelkeDim.replace('x', '×')
  const perRad = stolperPerRad(c)
  const frittstående = c.montering === 'frittstående'

  const map = new Map<string, KapplisteDel>()
  const add = (navn: string, profil: string, lengdeM: number, antall: number) => {
    if (lengdeM <= 0.001 || antall <= 0) return
    const L2 = Math.round(lengdeM * 100)
    const key = `${navn}|${profil}|${L2}`
    const ex = map.get(key)
    if (ex) ex.antall += antall
    else map.set(key, { navn, profil, lengdeCm: L2, antall })
  }

  // Stolper: lav side (høyde h − drager), evt. høy side ved pulttak.
  const postHLeft = Math.max(0.3, e.left - jh)
  add('Stolpe (lav side)', `${stolpeStr} mm`, postHLeft, perRad)
  if (frittstående) {
    const postHRight = Math.max(0.3, e.right - jh)
    add('Stolpe (høy side)', `${stolpeStr} mm`, postHRight, perRad)
  }

  // Dragere langs lengden.
  const beamZLen = L + 2 * oh
  add('Drager (langs lengde)', `${bjelkeStr} mm`, beamZLen, frittstående ? 2 : 1)
  if (!frittstående) add('Vegg-ledger', `${bjelkeStr} mm`, beamZLen, 1)
  if (c.taktype === 'saltak') add('Mønebjelke', `${bjelkeStr} mm`, beamZLen, 1)

  // Spær.
  const spaerLengde = (W + 2 * oh) * skråfaktor(c)
  if (c.taktype === 'saltak') add('Spær (halvtak)', `${bjelkeStr} mm`, spaerLengde / 2 + oh, antallSpaer(c) * 2)
  else add('Spær', `${bjelkeStr} mm`, spaerLengde, antallSpaer(c))

  // Tverrbjelker (undergurt).
  add('Tverrbjelke (undergurt)', `${bjelkeStr} mm`, W, perRad)

  // Avstiving.
  if (c.taktype === 'saltak') {
    add('Takstrever (45°)', `${bjelkeStr} mm`, Math.max(0.3, takFall(c) * 0.9 + 0.15), perRad * 2)
    add('Kongstolpe', `${Math.round(jh * 1000)} × ${Math.round(BEAM_W * 1000)} mm`, Math.max(0.15, takFall(c)), perRad)
  } else if (c.taktype === 'pulttak') {
    add('Midtstrever', '70 × 70 mm', Math.max(0.15, takFall(c) * 0.5), perRad)
  }

  // Knebånd (samme dimensjon som stolpen): langsgående + på tvers.
  add('Knebånd langs (45°)', `${c.stolpeDim.replace('x', '×')} mm`, 0.7, perRad * antallStolperader(c) * 2)
  add('Knebånd tvers (45°)', `${c.stolpeDim.replace('x', '×')} mm`, 0.7, perRad * antallStolperader(c))

  return [...map.values()]
}

// ── 3D-modell ──────────────────────────────────────────────────────

function buildMesh(c: CarportConfig, opts?: BuildOptions): THREE.Group {
  const group = new THREE.Group()
  const tex = opts?.woodTexture ?? null

  const meshMat = (pid: string, darken = 1) => {
    const ov = opts?.overrides?.[pid]
    const treslag = ov?.treslag ?? c.treslag
    const farge = ov?.farge ?? c.farge
    const base = new THREE.Color(resolveColor(treslag, farge)).multiplyScalar(darken)
    const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.82, metalness: 0.03 })
    if (tex) m.map = tex
    return m
  }
  // Taktekke er eget, ikke-malbart materiale (tre males via meshMat).
  const roofColorHex = (t: string): number =>
    t === 'stålplater' ? 0x6b6f74 : t === 'polykarbonat' ? 0xcfe0e6 : t === 'takpapp' ? 0x2c2c2c : 0x4a3b2f
  const roofMat = () => {
    const translucent = c.taktekke === 'polykarbonat'
    return new THREE.MeshStandardMaterial({
      color: roofColorHex(c.taktekke),
      roughness: 0.55,
      metalness: 0.2,
      transparent: translucent,
      opacity: translucent ? 0.5 : 1,
    })
  }

  const W = cm(c.bredde)
  const L = cm(c.lengde)
  const oh = TAKUTSTIKK
  const s = stolpeSize(c.stolpeDim)
  const jh = bjelkeHoyde(c.bjelkeDim)
  const e = eaves(c)
  const frittstående = c.montering === 'frittstående'

  // Sentrer i x/z (gruppen er sentrert; modell-x/z går 0..W / 0..L).
  const wx = (mx: number) => mx - W / 2
  const wz = (mz: number) => mz - L / 2

  const addBox = (
    w: number,
    hgt: number,
    l: number,
    part: string,
    pid: string,
    darken: number,
    px: number,
    py: number,
    pz: number,
    info: { navn: string; profil: string; lengdeCm: number },
    explode: THREE.Vector3,
    mat?: THREE.Material,
  ) => {
    const geom = new THREE.BoxGeometry(Math.max(w, 0.001), Math.max(hgt, 0.001), Math.max(l, 0.001))
    const m = new THREE.Mesh(geom, mat ?? meshMat(pid, darken))
    m.position.set(px, py, pz)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = part
    m.userData.pid = pid
    m.userData.info = info
    m.userData.explode = explode
    group.add(m)
    return m
  }

  const leftX = s / 2
  const rightX = W - s / 2
  const rows: Array<{ x: number; eave: number; side: 'venstre' | 'høyre' }> = frittstående
    ? [
        { x: leftX, eave: e.left, side: 'venstre' },
        { x: rightX, eave: e.right, side: 'høyre' },
      ]
    : [{ x: leftX, eave: e.left, side: 'venstre' }]
  const postZs = spread(s / 2, L - s / 2, stolperPerRad(c))
  const stolpeProfil = `${c.stolpeDim.replace('x', '×')} mm`
  const bjelkeProfil = `${c.bjelkeDim.replace('x', '×')} mm`

  // ── Stolper + stolpesko + knebånd ────────────────────────────────
  rows.forEach((row, r) => {
    const postH = Math.max(0.3, row.eave - jh)
    const beamUnder = row.eave - jh // underkant drager = stolpetopp
    const exDir = row.side === 'venstre' ? -1 : 1
    postZs.forEach((pz, i) => {
      addBox(
        s,
        postH,
        s,
        'stolpe',
        `stolpe-${r}-${i}`,
        1,
        wx(row.x),
        postH / 2,
        wz(pz),
        { navn: `Stolpe ${row.side}`, profil: stolpeProfil, lengdeCm: Math.round(postH * 100) },
        new THREE.Vector3(exDir * 0.35, 0, 0),
      )
      // Knebånd (45°) i stolpens loddplan langs z. Endene kappes i 45° så de
      // sitter flatt: loddrett kutt mot stolpen, vannrett kutt mot drageren.
      const dirs: number[] = []
      if (i > 0) dirs.push(-1)
      if (i < postZs.length - 1) dirs.push(1)
      if (dirs.length === 0) dirs.push(-1, 1)
      const off = 0.5
      const kbThick = s // samme tykkelse som stolpen
      const kbCut = s * Math.SQRT2 // gir båndbredde ≈ stolpedimensjonen vinkelrett
      dirs.forEach((dir, k) => {
        const zP = pz + dir * (s / 2) // stolpens sideflate
        const pts: Array<[number, number]> = [
          [wz(zP), beamUnder - off], // bunn ved stolpen
          [wz(zP + dir * off), beamUnder], // topp ute ved drageren
          [wz(zP + dir * (off - kbCut)), beamUnder], // vannrett kutt mot drager
          [wz(zP), beamUnder - off + kbCut], // loddrett kutt mot stolpe
        ]
        const shape = new THREE.Shape()
        shape.moveTo(pts[0][0], pts[0][1])
        for (let p = 1; p < pts.length; p++) shape.lineTo(pts[p][0], pts[p][1])
        shape.closePath()
        const g = new THREE.ExtrudeGeometry(shape, { depth: kbThick, bevelEnabled: false })
        g.rotateY(-Math.PI / 2) // profil i z-y, ekstrudert i x
        g.translate(wx(row.x) + kbThick / 2, 0, 0)
        const pid = `kneband-${r}-${i}-${k}`
        const mat = meshMat(pid, 0.9)
        mat.side = THREE.DoubleSide
        const m = new THREE.Mesh(g, mat)
        m.castShadow = true
        m.receiveShadow = true
        m.userData.part = 'kneband'
        m.userData.pid = pid
        m.userData.info = { navn: 'Knebånd', profil: stolpeProfil, lengdeCm: Math.round(Math.hypot(off, off) * 100) }
        m.userData.explode = new THREE.Vector3(0, 0, dir * 0.3)
        group.add(m)
      })

      // Knebånd på tvers (i stolpens loddplan langs x) – avstiver rammen mot
      // vindlast på tvers av carporten. Går skrått inn mot midten opp til
      // tverrbjelken (undergurten). Samme 45°-kapp: loddrett mot stolpen,
      // vannrett mot tverrbjelken.
      const inDir = -exDir // inn mot midten
      const tieUnder = e.left - jh // underkant tverrbjelke (undergurt)
      const xP = row.x + inDir * (s / 2) // stolpens innerside
      const cpts: Array<[number, number]> = [
        [wx(xP), tieUnder - off], // bunn ved stolpen
        [wx(xP + inDir * off), tieUnder], // topp inne ved tverrbjelken
        [wx(xP + inDir * (off - kbCut)), tieUnder], // vannrett kutt mot tverrbjelke
        [wx(xP), tieUnder - off + kbCut], // loddrett kutt mot stolpe
      ]
      const cshape = new THREE.Shape()
      cshape.moveTo(cpts[0][0], cpts[0][1])
      for (let p = 1; p < cpts.length; p++) cshape.lineTo(cpts[p][0], cpts[p][1])
      cshape.closePath()
      const cg = new THREE.ExtrudeGeometry(cshape, { depth: kbThick, bevelEnabled: false })
      cg.translate(0, 0, wz(pz) - kbThick / 2)
      const cpid = `kneband-x-${r}-${i}`
      const cmat = meshMat(cpid, 0.9)
      cmat.side = THREE.DoubleSide
      const cm = new THREE.Mesh(cg, cmat)
      cm.castShadow = true
      cm.receiveShadow = true
      cm.userData.part = 'kneband'
      cm.userData.pid = cpid
      cm.userData.info = { navn: 'Knebånd (tvers)', profil: stolpeProfil, lengdeCm: Math.round(Math.hypot(off, off) * 100) }
      cm.userData.explode = new THREE.Vector3(inDir * 0.3, 0, 0)
      group.add(cm)
    })
  })

  // ── Dragere langs lengden (oppå stolpene) ────────────────────────
  const beamZLen = L + 2 * oh
  const dragerX = frittstående ? [leftX, rightX] : [leftX]
  dragerX.forEach((dx, i) => {
    const eave = dx === leftX ? e.left : e.right
    addBox(
      s,
      jh,
      beamZLen,
      'drager',
      `drager-${i}`,
      1,
      wx(dx),
      eave - jh / 2,
      0,
      { navn: 'Drager', profil: bjelkeProfil, lengdeCm: Math.round(beamZLen * 100) },
      new THREE.Vector3(dx === leftX ? -0.3 : 0.3, 0.25, 0),
    )
  })
  if (!frittstående) {
    addBox(
      0.05,
      jh,
      beamZLen,
      'drager',
      'ledger',
      1,
      wx(rightX),
      e.right - jh / 2,
      0,
      { navn: 'Vegg-ledger', profil: bjelkeProfil, lengdeCm: Math.round(beamZLen * 100) },
      new THREE.Vector3(0.3, 0.25, 0),
    )

    // Skyggevegg (ghost): en tynn, halvgjennomsiktig flate på høy side som
    // viser at dette er en vegghengt løsning (huset er ikke en del av leveransen).
    const wallH = Math.max(e.right, e.ridge) + 0.25
    const ghostGeo = new THREE.BoxGeometry(0.04, wallH, beamZLen + 0.6)
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x9fb0c2,
      transparent: true,
      opacity: 0.16,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const ghost = new THREE.Mesh(ghostGeo, ghostMat)
    ghost.position.set(wx(rightX) + s / 2 + 0.02, wallH / 2, 0)
    ghost.castShadow = false
    ghost.receiveShadow = false
    ghost.renderOrder = -1
    ghost.userData.part = 'husvegg'
    ghost.userData.pid = 'husvegg'
    ghost.userData.info = { navn: 'Husvegg (medfølger ikke)', profil: 'eksisterende vegg', lengdeCm: Math.round((beamZLen + 0.6) * 100) }
    ghost.userData.explode = new THREE.Vector3(0.5, 0, 0)
    group.add(ghost)
  }

  // Mønebjelke ved saltak.
  if (c.taktype === 'saltak') {
    addBox(
      BEAM_W,
      jh,
      L + 2 * oh,
      'drager',
      'mone',
      1,
      wx(W / 2),
      e.ridge - jh / 2,
      0,
      { navn: 'Mønebjelke', profil: bjelkeProfil, lengdeCm: Math.round((L + 2 * oh) * 100) },
      new THREE.Vector3(0, 0.4, 0),
    )
  }

  // ── Takstol ved hver stolpelinje: undergurt + avstiving ──────────
  const tieY = e.left - jh / 2 // underkant lav drager = undergurtnivå
  postZs.forEach((pz, i) => {
    addBox(
      W,
      jh,
      BEAM_W,
      'drager',
      `tverrbjelke-${i}`,
      0.95,
      0,
      tieY,
      wz(pz),
      { navn: 'Tverrbjelke (undergurt)', profil: bjelkeProfil, lengdeCm: Math.round(W * 100) },
      new THREE.Vector3(0, -0.2, 0),
    )
    if (c.taktype === 'saltak') {
      const kingBot = tieY + jh / 2
      const kingTop = e.ridge - jh
      const kingSize = jh // kraftig kongstolpe i takstolplanet
      const kingDepth = BEAM_W // passer nøyaktig oppå undergurten (samme dybde)
      const kingProfil = `${Math.round(kingSize * 1000)} × ${Math.round(kingDepth * 1000)} mm`
      if (kingTop - kingBot > 0.15) {
        addBox(
          kingSize,
          kingTop - kingBot,
          kingDepth,
          'kneband',
          `kongstolpe-${i}`,
          0.9,
          wx(W / 2),
          (kingBot + kingTop) / 2,
          wz(pz),
          { navn: 'Kongstolpe', profil: kingProfil, lengdeCm: Math.round((kingTop - kingBot) * 100) },
          new THREE.Vector3(0, 0.3, 0),
        )
      }
      // Skråstrevere: står PÅ tverrbjelken (undergurten) – ikke på kongstolpen
      // – og går opp i 45° til underkant spær. Avstiver takstolen mot nedbøyning.
      const y0 = tieY + jh / 2 // overkant undergurt = strever-fot
      const m = (e.ridge - e.left) / (W / 2)
      const C = e.ridge // underkant spær ved møne (spærets underside = roofY)
      const bo = jh / 2 // fot inntil kongstolpen (halve kongstolpe-bredden ut)
      let xEndR = (C + m * (W / 2) - y0 + (W / 2 + bo)) / (1 + m)
      xEndR = Math.min(Math.max(xEndR, W / 2 + 0.05), W - 0.08)
      ;[-1, 1].forEach((sgn) => {
        const xb = sgn > 0 ? W / 2 + bo : W / 2 - bo // fot på undergurten
        const xEnd = sgn > 0 ? xEndR : W - xEndR // topp mot spæret
        const yEnd = roofY(c, e, xEnd) // helt opp til spærets underside
        const len = Math.hypot(xEnd - xb, yEnd - y0)
        if (len < 0.12) return
        // Flush-kappet strever: vannrett sete på undergurten, skråkutt langs
        // spæret på toppen, sidekantene parallelt med streveraksen. Bygges som
        // polygon i x-y og ekstruderes i z, så begge ender treffer nøyaktig.
        const bx = wx(xb)
        const by = y0
        const tx = wx(xEnd)
        const ty = yEnd
        const al = len
        const ax = (tx - bx) / al
        const ay = (ty - by) / al
        const nx = -ay
        const ny = ax
        const hw = jh / 2 // halv bredde = spærhøyde/2
        const mr = -sgn * m // spærets stigning der streveren møter det
        const corner = (sSide: number, top: boolean): [number, number] => {
          const ox = sSide * hw * nx
          const oy = sSide * hw * ny
          let t: number
          if (!top) {
            t = ay !== 0 ? -oy / ay : 0 // sete: y = by (overkant undergurt)
          } else {
            const denom = ay - mr * ax
            t = Math.abs(denom) > 0.05 ? (ty - by + mr * (bx - tx) + ox * mr - oy) / denom : al // spærlinjen
          }
          return [bx + ox + t * ax, by + oy + t * ay]
        }
        const pts = [corner(-1, false), corner(1, false), corner(1, true), corner(-1, true)]
        const sShape = new THREE.Shape()
        sShape.moveTo(pts[0][0], pts[0][1])
        for (let p = 1; p < pts.length; p++) sShape.lineTo(pts[p][0], pts[p][1])
        sShape.closePath()
        const sg = new THREE.ExtrudeGeometry(sShape, { depth: RAFTER_W, bevelEnabled: false })
        sg.translate(0, 0, wz(pz) - RAFTER_W / 2)
        const spid = `takstrever-${i}-${sgn > 0 ? 'h' : 'v'}`
        const smat = meshMat(spid, 0.9)
        smat.side = THREE.DoubleSide
        const sm = new THREE.Mesh(sg, smat)
        sm.castShadow = true
        sm.receiveShadow = true
        sm.userData.part = 'spaer'
        sm.userData.pid = spid
        sm.userData.info = { navn: 'Takstrever (45°)', profil: bjelkeProfil, lengdeCm: Math.round(len * 100) }
        sm.userData.explode = new THREE.Vector3(sgn * 0.3, 0.2, 0)
        group.add(sm)
      })
    } else if (c.taktype === 'pulttak') {
      const strutBot = tieY + jh / 2
      const strutTop = roofY(c, e, W / 2) - jh
      if (strutTop - strutBot > 0.15) {
        addBox(
          0.07,
          strutTop - strutBot,
          0.07,
          'kneband',
          `strever-${i}`,
          0.9,
          wx(W / 2),
          (strutBot + strutTop) / 2,
          wz(pz),
          { navn: 'Midtstrever', profil: '70 × 70 mm', lengdeCm: Math.round((strutTop - strutBot) * 100) },
          new THREE.Vector3(0, 0.3, 0),
        )
      }
    }
  })

  // ── Spær på tvers (følger takfallet) ─────────────────────────────
  const addRafter = (
    x1: number,
    x2: number,
    z: number,
    thickY: number,
    widthZ: number,
    yOffset: number,
    part: string,
    pid: string,
    info: { navn: string; profil: string; lengdeCm: number },
    explode: THREE.Vector3,
    darken: number,
    mat?: THREE.Material,
    bearings?: number[],
    plumbEnds?: boolean,
  ) => {
    const y1 = roofY(c, e, x1)
    const y2 = roofY(c, e, x2)
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    if ((!bearings || bearings.length === 0) && !plumbEnds) {
      const box = addBox(len, thickY, widthZ, part, pid, darken, wx((x1 + x2) / 2), (y1 + y2) / 2 + yOffset, wz(z), info, explode, mat)
      box.rotation.z = angle
      return len
    }
    // Fugleklo (birdsmouth) bygget i verdenskoordinater slik at setet blir
    // nøyaktig VANNRETT (hviler på drager-toppen) og hælkuttet nøyaktig
    // LODDRETT (mot dragerens nedovervendte flate). Undersiden er referanse-
    // linjen (roofY); toppen ligger thickY vinkelrett over.
    const mm = dx !== 0 ? dy / dx : 0 // stigning (verden)
    const cosT = Math.abs(dx) / (len || 1) // cos(takvinkel)
    const jhV = thickY / Math.max(cosT, 0.2) // loddrett høyde av seksjonen
    const vShift = yOffset - thickY / 2 // samme vertikale plassering som boks-varianten
    const yAt = (xx: number) => y1 + (xx - x1) * mm + vShift // underside-linjen
    const under: Array<[number, number]> = [[wx(x1), y1 + vShift]]
    const sorted = bearings
      ? [...bearings].filter((bx) => bx > Math.min(x1, x2) + 0.001 && bx < Math.max(x1, x2) - 0.001).sort((p, q) => p - q)
      : []
    for (const bx of sorted) {
      const yTop = yAt(bx) // sete-høyde = underside over dragersenter (drager-topp)
      if (Math.abs(mm) < 0.02) continue // flatt tak: ingen fugleklo
      const heel = mm > 0 ? bx - s / 2 : bx + s / 2 // hæl på dragerens nedside-flate
      if (mm > 0) {
        under.push([wx(heel), yAt(heel)]) // ned til underside ved hælen
        under.push([wx(heel), yTop]) // loddrett hælkutt opp
        under.push([wx(bx), yTop]) // vannrett sete inn til der det møter undersiden
      } else {
        under.push([wx(bx), yTop]) // vannrett sete fra undersiden
        under.push([wx(heel), yTop]) // ut til hælen
        under.push([wx(heel), yAt(heel)]) // loddrett hælkutt ned til undersiden
      }
    }
    under.push([wx(x2), y2 + vShift])
    const shape = new THREE.Shape()
    shape.moveTo(under[0][0], under[0][1])
    for (let p = 1; p < under.length; p++) shape.lineTo(under[p][0], under[p][1])
    shape.lineTo(wx(x2), y2 + vShift + jhV) // loddrett endekutt ved fjern ende
    shape.lineTo(wx(x1), y1 + vShift + jhV) // topp (parallelt med undersiden) tilbake til nær ende
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: widthZ, bevelEnabled: false })
    g.translate(0, 0, wz(z) - widthZ / 2)
    const m = new THREE.Mesh(g, mat ?? meshMat(pid, darken))
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = part
    m.userData.pid = pid
    m.userData.info = { ...info, lengdeCm: Math.round(len * 100) }
    m.userData.explode = explode
    group.add(m)
    return len
  }

  // Splittvisning: løftehøyde (m) pr. taklag – gir tydelig lagdeling i
  // eksplosjonsvisningen slik at delene skiller seg fra hverandre
  // (spær < sperrebeslag < taklekt < vindski < tekking).
  const EXP_SPAER = 0.35
  const EXP_BESLAG = 0.46
  const EXP_LEKT = 0.62
  const EXP_VINDSKI = 0.82
  const EXP_TAK = 0.98

  const spaerZs = spread(0.024, L - 0.024, antallSpaer(c))
  spaerZs.forEach((sz, i) => {
    const info = { navn: 'Spær', profil: bjelkeProfil, lengdeCm: 0 }
    if (c.taktype === 'saltak') {
      addRafter(-oh, W / 2, sz, jh, RAFTER_W, jh / 2, 'spaer', `spaer-v-${i}`, info, new THREE.Vector3(0, EXP_SPAER, 0), 1, undefined, [leftX])
      addRafter(W / 2, W + oh, sz, jh, RAFTER_W, jh / 2, 'spaer', `spaer-h-${i}`, info, new THREE.Vector3(0, EXP_SPAER, 0), 1, undefined, [rightX])
    } else {
      addRafter(-oh, W + oh, sz, jh, RAFTER_W, jh / 2, 'spaer', `spaer-${i}`, info, new THREE.Vector3(0, EXP_SPAER, 0), 1, undefined, [leftX, rightX])
    }
  })

  // ── Sperrebeslag / takåsanker (vinkelbeslag) ─────────────────────
  // TEK17 (§10-2, laster etter NS-EN 1991-1-3/-1-4): spærene forankres
  // mekanisk til dragerne mot vindsug. Vist som forsinket vinkelbeslag i
  // hvert spær×drager-opplegg (én pr. kryss).
  const beslagMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.42, metalness: 0.85 })
  const beslagX = frittstående ? [leftX, rightX] : [leftX]
  const PLATE_T = 0.003 // godstykkelse på beslaget
  const BESLAG_X = 0.05 // bredde langs spæret (x)
  const BESLAG_UP = 0.09 // loddrett vinge opp langs spærsiden
  const BESLAG_FOT = 0.055 // vannrett fot på drageren
  spaerZs.forEach((sz, si) => {
    beslagX.forEach((bx, bi) => {
      const yTop = roofY(c, e, bx) // drager-topp = spær-underside (opplegg)
      const g = new THREE.Group()
      const zc = RAFTER_W / 2 + PLATE_T / 2 // sitter mot spærets +z-side
      const vinge = new THREE.Mesh(new THREE.BoxGeometry(BESLAG_X, BESLAG_UP, PLATE_T), beslagMat)
      vinge.position.set(0, BESLAG_UP / 2, zc)
      const fot = new THREE.Mesh(new THREE.BoxGeometry(BESLAG_X, PLATE_T, BESLAG_FOT), beslagMat)
      fot.position.set(0, PLATE_T / 2, zc + BESLAG_FOT / 2 - PLATE_T / 2)
      ;[vinge, fot].forEach((m) => {
        m.castShadow = true
        m.receiveShadow = true
        g.add(m)
      })
      g.position.set(wx(bx), yTop, wz(sz))
      g.userData.part = 'beslag'
      g.userData.pid = `beslag-${si}-${bi}`
      g.userData.info = { navn: 'Sperrebeslag (takåsanker)', profil: 'forsinket vinkelbeslag', lengdeCm: 0 }
      g.userData.explode = new THREE.Vector3(0, EXP_BESLAG, 0)
      group.add(g)
    })
  })

  // ── Taklekter på tvers (sløyfer/lekt) oppå spærene ───────────────
  // Ligger langs lengden (z), oppå spærene og under tekkingen, med c/c ~60 cm
  // opp langs takfallet. På et åpent tak ses de tydelig nedenfra.
  const lektH = 0.036
  const lektW = 0.048
  const lektZ = L + 2 * oh
  const lektInfo = { navn: 'Taklekt', profil: '48 × 36 mm', lengdeCm: Math.round(lektZ * 100) }
  const addLekter = (xa: number, xb: number, tag: string) => {
    const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / 0.6) + 1)
    spread(xa, xb, n).forEach((x, i) => {
      const y = roofY(c, e, x) + jh + lektH / 2
      addBox(lektW, lektH, lektZ, 'lekt', `lekt-${tag}-${i}`, 0.88, wx(x), y, 0, lektInfo, new THREE.Vector3(0, EXP_LEKT, 0))
    })
  }
  if (c.taktype === 'saltak') {
    addLekter(-oh, W / 2, 'v')
    addLekter(W / 2, W + oh, 'h')
  } else {
    addLekter(-oh, W + oh, '')
  }

  // ── Takflate (tekking) ───────────────────────────────────────────
  const roofWidthZ = L + 2 * oh
  const rInfo = { navn: `${taktekkeNavn(c.taktekke)} (taktekke)`, profil: 'plate', lengdeCm: Math.round(roofWidthZ * 100) }
  if (c.taktype === 'saltak') {
    addRafter(-oh, W / 2, L / 2, 0.04, roofWidthZ, jh + 0.04, 'tak', 'tak-v', rInfo, new THREE.Vector3(0, EXP_TAK, 0), 1, roofMat())
    addRafter(W / 2, W + oh, L / 2, 0.04, roofWidthZ, jh + 0.04, 'tak', 'tak-h', rInfo, new THREE.Vector3(0, EXP_TAK, 0), 1, roofMat())
  } else {
    addRafter(-oh, W + oh, L / 2, 0.04, roofWidthZ, jh + 0.04, 'tak', 'tak', rInfo, new THREE.Vector3(0, EXP_TAK, 0), 1, roofMat())
  }

  // ── Vindski langs gavlkantene ────────────────────────────────────
  const gavlInfo = { navn: 'Vindski', profil: '22 × 180 mm', lengdeCm: 0 }
  ;[-oh - 0.011, L + oh + 0.011].forEach((gz, gi) => {
    if (c.taktype === 'saltak') {
      addRafter(-oh, W / 2, gz, 0.18, 0.022, jh + 0.02, 'tak', `vindski-v-${gi}`, gavlInfo, new THREE.Vector3(0, EXP_VINDSKI, 0), 0.9, undefined, undefined, true)
      addRafter(W / 2, W + oh, gz, 0.18, 0.022, jh + 0.02, 'tak', `vindski-h-${gi}`, gavlInfo, new THREE.Vector3(0, EXP_VINDSKI, 0), 0.9, undefined, undefined, true)
    } else {
      addRafter(-oh, W + oh, gz, 0.18, 0.022, jh + 0.02, 'tak', `vindski-${gi}`, gavlInfo, new THREE.Vector3(0, EXP_VINDSKI, 0), 0.9, undefined, undefined, true)
    }
  })

  // (Sperrebeslag vises for TEK17-forankring; renne/nedløp og stolpesko utelates fortsatt visuelt.)

  // ── Vegger / kledning (valgfritt) ────────────────────────────────
  if (c.veggtype !== 'ingen') {
    const WT = 0.02 // kledningstykkelse
    const akrylMat = () => new THREE.MeshStandardMaterial({ color: 0xbcd4dd, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.28 })
    const veggInfo = (navn: string) => ({ navn, profil: 'kledning', lengdeCm: 0 })

    // Side-vegger (venstre/høyre): rektangel, topp = takhøyde ved den siden.
    const sideVegg = (side: 'venstre' | 'høyre') => {
      const sx = side === 'venstre' ? leftX : rightX
      const topY = roofY(c, e, sx)
      const ex = new THREE.Vector3(side === 'venstre' ? -0.4 : 0.4, 0, 0)
      const zc = wz(L / 2)
      const ySplit = 0.6 * topY
      if (c.veggtype === 'panel' || c.veggtype === 'kombinert') {
        const hp = c.veggtype === 'panel' ? topY : ySplit
        addBox(WT, hp, L, 'vegg', `vegg-${side}-panel`, 0.95, wx(sx), hp / 2, zc, veggInfo('Veggpanel'), ex)
      }
      if (c.veggtype === 'akryl' || c.veggtype === 'kombinert') {
        const y0 = c.veggtype === 'akryl' ? 0 : ySplit
        addBox(WT, topY - y0, L, 'vegg', `vegg-${side}-akryl`, 1, wx(sx), (y0 + topY) / 2, zc, veggInfo('Akrylvindu'), ex, akrylMat())
      }
    }

    // Ende-vegger (front/bak): topp følger takflaten over x (trapes/gavl).
    const endeVegg = (side: 'front' | 'bak') => {
      const ez = new THREE.Vector3(0, 0, side === 'front' ? 0.4 : -0.4)
      const addPanel = (yBunn: number, topFn: (x: number) => number, pid: string, navn: string, mat?: THREE.Material) => {
        const shape = new THREE.Shape()
        shape.moveTo(0, yBunn)
        shape.lineTo(W, yBunn)
        shape.lineTo(W, topFn(W))
        if (c.taktype === 'saltak') shape.lineTo(W / 2, topFn(W / 2))
        shape.lineTo(0, topFn(0))
        shape.closePath()
        const g = new THREE.ExtrudeGeometry(shape, { depth: WT, bevelEnabled: false })
        g.translate(-W / 2, 0, side === 'front' ? wz(0) : wz(L) - WT) // profil i x-y, ekstrudert i z
        const m = new THREE.Mesh(g, mat ?? meshMat(pid, 0.95))
        m.castShadow = true
        m.receiveShadow = true
        m.userData.part = 'vegg'
        m.userData.pid = pid
        m.userData.info = veggInfo(navn)
        m.userData.explode = ez
        group.add(m)
      }
      const topAt = (x: number) => roofY(c, e, x)
      if (c.veggtype === 'kombinert') {
        const ySplit = 0.6 * Math.min(e.left, e.right)
        addPanel(0, () => ySplit, `vegg-${side}-panel`, 'Veggpanel')
        addPanel(ySplit, topAt, `vegg-${side}-akryl`, 'Akrylvindu', akrylMat())
      } else if (c.veggtype === 'panel') {
        addPanel(0, topAt, `vegg-${side}-panel`, 'Veggpanel')
      } else {
        addPanel(0, topAt, `vegg-${side}-akryl`, 'Akrylvindu', akrylMat())
      }
    }

    veggSiderListe(c.veggSider).forEach((sd) => (sd === 'venstre' || sd === 'høyre' ? sideVegg(sd) : endeVegg(sd)))
  }

  return group
}

export const carport: ProductTemplate<CarportConfig> = {
  id: 'carport',
  navn: 'Carport',
  ikon: 'faWarehouse',
  beskrivelse: 'Tegn carporten i 3D – frittstående eller inntil huset, med flatt tak, pulttak eller saltak, valgfri taktekke og vegger.',
  bilde: '/images/products/carport-3d.webp',
  tilgjengelig: true,
  fraPris: 449,
  leveranser: ['plan'],
  defaultConfig: {
    // Standard = «Stor carport»-oppsettet (forhåndsvalgt preset).
    montering: 'frittstående',
    bredde: 600,
    lengde: 600,
    hoyde: 240,
    takvinkel: 22,
    taktype: 'saltak',
    taktekke: 'shingel',
    stolpeDim: '148x148',
    bjelkeDim: '48x223',
    veggtype: 'ingen',
    veggSider: 'bak+sider',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'enkel', navn: 'Enkel carport', beskrivelse: 'Én bil, pulttak', config: { montering: 'frittstående', bredde: 300, lengde: 500, hoyde: 220, taktype: 'pulttak', takvinkel: 10, stolpeDim: '98x98', bjelkeDim: '48x198', taktekke: 'stålplater' } },
    { id: 'dobbel', navn: 'Dobbel carport', beskrivelse: 'To biler, saltak', config: { montering: 'frittstående', bredde: 560, lengde: 550, hoyde: 230, taktype: 'saltak', takvinkel: 18, bjelkeDim: '48x223', stolpeDim: '148x148', taktekke: 'stålplater' } },
    { id: 'veggmontert', navn: 'Veggmontert', beskrivelse: 'Pulttak mot huset', config: { montering: 'veggmontert', bredde: 320, lengde: 550, hoyde: 230, taktype: 'pulttak', takvinkel: 8, stolpeDim: '98x98', bjelkeDim: '48x198', taktekke: 'stålplater' } },
    { id: 'stor-saltak', navn: 'Stor carport', beskrivelse: 'Saltak med shingel', config: { montering: 'frittstående', bredde: 600, lengde: 600, hoyde: 240, taktype: 'saltak', takvinkel: 22, bjelkeDim: '48x223', stolpeDim: '148x148', taktekke: 'shingel' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 240, max: 800, step: 10, axis: 'x' },
    { key: 'hoyde', label: 'Fri høyde (lav side)', min: 200, max: 300, step: 5, axis: 'y' },
    { key: 'lengde', label: 'Lengde', min: 300, max: 1200, step: 10, axis: 'z' },
    {
      key: 'takvinkel',
      label: 'Takvinkel',
      min: 3,
      max: 35,
      step: 1,
      unit: '°',
      axis: 'y',
      handle: false,
      visibleWhen: (c) => c.taktype !== 'flatt',
    },
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
        { id: 'frittstående', label: 'Frittstående', note: 'Stolper på alle fire hjørner.' },
        { id: 'veggmontert', label: 'Veggmontert', note: 'Høy side festet til husveggen.' },
      ],
    },
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'flatt', label: 'Flatt', note: 'Tilnærmet flatt tak.' },
        { id: 'pulttak', label: 'Pulttak', note: 'Skrår én vei.' },
        { id: 'saltak', label: 'Saltak', note: 'Møne på midten.' },
      ],
    },
    {
      key: 'taktekke',
      label: 'Taktekke',
      choices: [
        { id: 'stålplater', label: 'Stålplater' },
        { id: 'polykarbonat', label: 'Polykarbonat' },
        { id: 'takpapp', label: 'Takpapp', note: 'Krever sutak/undertak.' },
        { id: 'shingel', label: 'Shingel', note: 'Krever sutak/undertak.' },
      ],
    },
    {
      key: 'stolpeDim',
      label: 'Stolpedimensjon',
      choices: [
        { id: '98x98', label: '98 × 98 mm' },
        { id: '148x148', label: '148 × 148 mm', note: 'Kraftigere – større spenn / høyde.' },
      ],
    },
    {
      key: 'bjelkeDim',
      label: 'Bjelke (drager/spær)',
      choices: [
        { id: '48x148', label: '48 × 148 mm' },
        { id: '48x198', label: '48 × 198 mm' },
        { id: '48x223', label: '48 × 223 mm', note: 'Størst spennvidde.' },
      ],
    },
    {
      key: 'veggtype',
      label: 'Vegger',
      choices: [
        { id: 'ingen', label: 'Åpen', note: 'Ingen vegger.' },
        { id: 'panel', label: 'Panel', note: 'Tett trekledning.' },
        { id: 'akryl', label: 'Akryl', note: 'Klare akrylplater.' },
        { id: 'kombinert', label: 'Panel + akryl', note: 'Panel nede, akryl øverst.' },
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
    { key: 'vegg', label: 'Vegger' },
    { key: 'stolpe', label: 'Stolper' },
    { key: 'drager', label: 'Dragere / bjelker' },
    { key: 'spaer', label: 'Spær' },
    { key: 'kneband', label: 'Avstiving' },
    { key: 'tak', label: 'Tak' },
  ],
  beregn,
  kappliste,
  tegning2D,
  soknadTegning,
  raad: (c) => [
    'Fundament er IKKE inkludert i denne planen. Punktfundamenter/såler må støpes til frostfri dybde og dimensjoneres etter grunnforhold, snø- og vindlast på din tomt (TEK17 / NS-EN 1991) – planen dekker treverket over fundament.',
    'Sett stolpene i justerbare stolpesko på støpte punktfundamenter (frostfri dybde) – aldri direkte i bakken.',
    'Forankre hvert spær til drageren med sperrebeslag (takåsanker) mot vindsug – vist i splittvisningen.',
    'Lodd og avstiv stolpene midlertidig før du fester dragerne, og kontroller at radene er i vater og vinkel før du skrur fast.',
    'Fest dragerne oppå stolpene med gjennomgående bolter eller kraftige bjelkesko, ikke bare skruer.',
    c.taktype === 'saltak'
      ? 'Bind takstolene sammen med undergurt, kongstolpe og 45°-strevere opp mot spærene så saltaket ikke spriker under snølast.'
      : c.taktype === 'pulttak'
        ? 'Pulttaket bør ha minst 6–8° fall så vann og snø renner av; sett midtstrever ved store spenn.'
        : 'Flatt tak må ha litt fall (min. 1:40) mot renna – bruk sutak og membran for å unngå stående vann.',
    'Bruk rustfrie (A4/syrefaste) skruer og varmforsinkede beslag utendørs, og forbor i endene så virket ikke sprekker.',
    'Dimensjoner etter TEK17 og lokal snø-/vindlast: stolpe c/c ≤ 2,6 m, spær c/c ≤ 60 cm og bjelkedimensjon opp mot spennet. Frittstående carport under 50 m² og maks 3 m høyde er normalt unntatt søknadsplikt – sjekk alltid med kommunen.',
    'La impregnert virke tørke noen uker før du eventuelt beiser eller maler.',
  ],
  byggeregler: (c) => {
    const W = cm(c.bredde)
    const L = cm(c.lengde)
    const H = cm(c.hoyde)
    const jh = bjelkeHoyde(c.bjelkeDim)
    const fall = c.taktype === 'pulttak' ? W * Math.tan(rad(c.takvinkel)) : c.taktype === 'saltak' ? (W / 2) * Math.tan(rad(c.takvinkel)) : 0
    const areal = W * L
    const gesims = H + (c.taktype === 'pulttak' ? fall : 0) + jh
    const mone = H + fall + jh
    const arealgrense = c.montering === 'frittstående' ? 50 : 15
    const punkter: string[] = []
    let sokfri = true
    if (areal > arealgrense) {
      sokfri = false
      punkter.push(`Areal ${areal.toFixed(1)} m² er over grensen på ${arealgrense} m² for ${c.montering === 'frittstående' ? 'frittstående bygning' : 'tilbygg'} – søknad kreves.`)
    }
    if (gesims > 3.0) {
      sokfri = false
      punkter.push(`Gesimshøyde ${gesims.toFixed(1)} m er over 3,0 m – søknad kreves.`)
    }
    if (mone > 4.0) {
      sokfri = false
      punkter.push(`Mønehøyde ${mone.toFixed(1)} m er over 4,0 m – søknad kreves.`)
    }
    if (sokfri) punkter.push(`Areal ${areal.toFixed(1)} m², gesims ${gesims.toFixed(1)} m og møne ${mone.toFixed(1)} m er innenfor grensene.`)
    punkter.push('Avstand til nabogrense må være minst 1,0 m for å være unntatt søknad.')
    punkter.push('Veiledende – sjekk alltid lokal snølast og kommunens regler. Du er selv ansvarlig.')
    return { sokfri, tittel: sokfri ? 'Trolig søknadsfri' : 'Søknad kreves trolig', punkter }
  },
  buildMesh,
  bounds: (c) => {
    const e = eaves(c)
    const jh = bjelkeHoyde(c.bjelkeDim)
    const top = Math.max(e.left, e.right, e.ridge) + jh + 0.1
    return {
      x: cm(c.bredde) + 2 * TAKUTSTIKK + 0.2,
      y: top + 0.06,
      z: cm(c.lengde) + 2 * TAKUTSTIKK + 0.2,
    }
  },
  montering: (c) => [
    'Kapp alle materialene etter kapplista, og skjær fugleklo (birdsmouth) i spærene der de hviler på dragerne – sett-dybden bør være maks 1/3 av spærhøyden. Skråkapp spærtoppen i takvinkelen mot møne/mot vegg.',
    'Støp punktfundamenter (frostfri dybde) og sett justerbare stolpesko i vater etter oppmerket rutenett.',
    'Reis stolpene i skoene, lodd dem og avstiv midlertidig. Kontroller diagonalmål så alt er i vinkel.',
    c.montering === 'veggmontert'
      ? 'Fest vegg-ledgeren vannrett til husveggen på høy side (i solide fester/bjelkelag), og legg dragerne på stolpene på lav side.'
      : 'Legg dragerne langs lengden oppå begge stolperadene og fest dem med gjennomgående bolter/bjelkesko.',
    'Fest knebåndene i 45° fra stolpe opp mot drager for stivhet.',
    'Legg tverrbjelkene (undergurt) mellom dragerne ved hver stolpelinje.' +
      (c.taktype === 'saltak'
        ? ' Reis mønebjelken, sett kongstolpe og skråstrevere (45° opp mot spærene) i hver takstol.'
        : c.taktype === 'pulttak'
          ? ' Sett midtstrever der spennet er stort.'
          : ''),
    `Legg spærene på tvers med c/c ${Math.round(SPAR_AVSTAND * 100)} cm etter takfallet, og fest dem til dragere${c.taktype === 'saltak' ? ' og møne' : ''}.`,
    kreverSutak(c.taktekke)
      ? 'Legg sutak/undertak og eventuell membran før tekkingen.'
      : 'Legg lekter/sløyfer om nødvendig som underlag for tekkingen.',
    `Monter ${taktekkeNavn(c.taktekke).toLowerCase()} som taktekke, med vindski langs gavlene og god overlapp.`,
    ...(c.veggtype !== 'ingen'
      ? [
          `Kle de valgte sidene (${c.veggSider}) med ${c.veggtype === 'akryl' ? 'akrylplater' : c.veggtype === 'kombinert' ? 'panel nederst og akrylplater øverst' : 'stående panel'} på lekter mellom stolpene. La panelet ende noen cm over bakken for lufting.`,
        ]
      : []),
  ],
}
