// Beregningsmodell for pergolaplanleggeren – samme struktur og enheter som
// terrassemodellen: all geometri er i meter, materialdimensjoner i mm.

export type Montering = 'frittstående' | 'veggmontert'

// Tak / solskjerm på toppen av spærene.
export type Taktype = 'åpen' | 'lekter' | 'spjeld' | 'tett'

// Sideskjerm / spalér på valgte sider.
export type Skjermtype = 'ingen' | 'spalér' | 'horisontal' | 'tett'

export type Pergolaside = 'front' | 'bak' | 'venstre' | 'høyre'

export type Stolpedim = '98x98' | '148x148'
export type Bjelkedimensjon = '48x148' | '48x198' | '48x223'

export interface PergolaConfig {
  montering: Montering

  // Mål
  bredde: number // m (x – langs huset)
  dybde: number // m (z – ut fra huset)
  høyde: number // m (stolpehøyde til underkant drager)

  // Stolper og bæring
  stolpeAvstand: number // m – maks senteravstand mellom stolper
  stolpeDim: Stolpedim
  bjelkeDim: Bjelkedimensjon // dragere og spær

  // Spær (takbjelker på tvers)
  spærAvstand: number // m

  // Tak / solskjerm
  taktype: Taktype
  lektAvstand: number // m – avstand mellom takslekter (lekter/spjeld)

  // Sideskjerm
  skjermtype: Skjermtype
  skjermSider: Pergolaside[]

  // Materialkonfigurasjon
  skruerPerKryss: number
  svinnProsent: number // kapp og svinn på løpemeter (heltall, %)

  // Priser (NOK)
  prisStolpePrLm: number
  prisDragerPrLm: number
  prisSpærPrLm: number
  prisLektPrLm: number
  prisTakplatePerM2: number
  prisSkrue: number
  prisStolpesko: number
}

export const MONTERING_INFO: Record<Montering, { navn: string; beskrivelse: string }> = {
  frittstående: { navn: 'Frittstående', beskrivelse: 'Stolper på alle fire hjørner' },
  veggmontert: { navn: 'Veggmontert', beskrivelse: 'Festet til husveggen på baksiden' },
}

export const TAK_INFO: Record<Taktype, { navn: string; beskrivelse: string }> = {
  åpen: { navn: 'Åpen', beskrivelse: 'Kun spær – helt åpent' },
  lekter: { navn: 'Lekter', beskrivelse: 'Solskjerm med luft mellom' },
  spjeld: { navn: 'Spjeld', beskrivelse: 'Skråstilte lameller' },
  tett: { navn: 'Tett tak', beskrivelse: 'Plater / takduk' },
}

export const SKJERM_INFO: Record<Skjermtype, { navn: string; beskrivelse: string }> = {
  ingen: { navn: 'Ingen', beskrivelse: 'Helt åpne sider' },
  spalér: { navn: 'Spalér', beskrivelse: 'Klatreplanter / rutenett' },
  horisontal: { navn: 'Vannrett', beskrivelse: 'Vannrette bord' },
  tett: { navn: 'Tett', beskrivelse: 'Sammenhengende panel' },
}

export const SIDE_INFO: Record<Pergolaside, string> = {
  front: 'Front',
  bak: 'Bak',
  venstre: 'Venstre',
  høyre: 'Høyre',
}

export const BJELKE_INFO: Record<Bjelkedimensjon, { høyde: number; standardpris: number }> = {
  '48x148': { høyde: 148, standardpris: 55 },
  '48x198': { høyde: 198, standardpris: 65 },
  '48x223': { høyde: 223, standardpris: 78 },
}

export const STOLPE_INFO: Record<Stolpedim, { størrelse: number; standardpris: number }> = {
  '98x98': { størrelse: 98, standardpris: 75 },
  '148x148': { størrelse: 148, standardpris: 135 },
}

export const DEFAULT_CONFIG: PergolaConfig = {
  montering: 'frittstående',
  bredde: 3.6,
  dybde: 3.0,
  høyde: 2.4,
  stolpeAvstand: 3.0,
  stolpeDim: '98x98',
  bjelkeDim: '48x198',
  spærAvstand: 0.6,
  taktype: 'lekter',
  lektAvstand: 0.2,
  skjermtype: 'ingen',
  skjermSider: [],
  skruerPerKryss: 4,
  svinnProsent: 10,
  prisStolpePrLm: 75,
  prisDragerPrLm: 65,
  prisSpærPrLm: 55,
  prisLektPrLm: 17,
  prisTakplatePerM2: 320,
  prisSkrue: 3,
  prisStolpesko: 129,
}

export interface BeregnetResultat {
  areal: number
  arealFormattert: string

  stolpeAntall: number
  stolpeLøpemeter: number
  stolpeFormattert: string
  stolpeKostnad: number
  stolpeskoAntall: number
  stolpeskoKostnad: number

  dragerAntall: number
  dragerLøpemeter: number
  dragerFormattert: string
  dragerKostnad: number

  spærAntall: number
  spærLøpemeter: number
  spærFormattert: string
  spærKostnad: number

  // Tak (lekter/spjeld → løpemeter, tett → m²)
  lektAntall?: number
  lektLøpemeter?: number
  takAreal?: number
  takFormattert?: string
  takKostnad?: number

  // Sideskjerm
  skjermLøpemeter?: number
  skjermAreal?: number
  skjermFormattert?: string
  skjermKostnad?: number

  skrueAntall: number
  skrueFormattert: string
  skrueKostnad: number

  svinnProsent: number
  svinnKostnad: number

  totalKostnad: number
}

const fmt1 = (v: number) => v.toFixed(1)

// ── Geometri-hjelpere ─────────────────────────────────────────────────────────

/** Antall stolper per rad langs bredden. */
export function stolperPerRad(c: PergolaConfig): number {
  return Math.max(2, Math.ceil(c.bredde / Math.max(0.5, c.stolpeAvstand)) + 1)
}

/** Antall stolperader (front + bak, eller bare front ved veggmontering). */
export function antallStolperader(c: PergolaConfig): number {
  return c.montering === 'frittstående' ? 2 : 1
}

/** Antall spær (takbjelker på tvers, langs bredden). */
export function antallSpær(c: PergolaConfig): number {
  return Math.max(2, Math.floor(c.bredde / Math.max(0.2, c.spærAvstand)) + 1)
}

/** Antall takslekter (langs dybden) når taktypen har lekter/spjeld. */
export function antallLekter(c: PergolaConfig): number {
  if (c.taktype !== 'lekter' && c.taktype !== 'spjeld') return 0
  return Math.max(2, Math.floor(c.dybde / Math.max(0.05, c.lektAvstand)) + 1)
}

function sideLengde(c: PergolaConfig, side: Pergolaside): number {
  return side === 'front' || side === 'bak' ? c.bredde : c.dybde
}

// ── Beregning ──────────────────────────────────────────────────────────────────

export function beregn(c: PergolaConfig): BeregnetResultat {
  const areal = c.bredde * c.dybde
  const svinn = 1 + Math.max(0, c.svinnProsent) / 100

  // Stolper
  const rader = antallStolperader(c)
  const perRad = stolperPerRad(c)
  const stolpeAntall = rader * perRad
  const stolpeLøpemeter = stolpeAntall * c.høyde * svinn
  const stolpeskoAntall = stolpeAntall

  // Dragere (bæredragere langs bredden, oppå stolpene). Frittstående har drager
  // på begge sider; veggmontert har én drager foran + veggfeste/ledger i bak.
  const dragerAntall = c.montering === 'frittstående' ? 2 : 1
  const veggfesteLøpemeter = c.montering === 'veggmontert' ? c.bredde : 0
  const dragerLøpemeter = (dragerAntall * c.bredde + veggfesteLøpemeter) * svinn

  // Spær (på tvers, langs dybden)
  const spærAntall = antallSpær(c)
  const spærLøpemeter = spærAntall * c.dybde * svinn

  // Tak / solskjerm
  let lektAntall: number | undefined
  let lektLøpemeter: number | undefined
  let takAreal: number | undefined
  let takFormattert: string | undefined
  let takKostnad: number | undefined

  if (c.taktype === 'lekter' || c.taktype === 'spjeld') {
    lektAntall = antallLekter(c)
    lektLøpemeter = lektAntall * c.bredde * svinn
    takFormattert = `${TAK_INFO[c.taktype].navn}: ${lektAntall} lekter, ${fmt1(lektLøpemeter)} lm`
    takKostnad = lektLøpemeter * c.prisLektPrLm
  } else if (c.taktype === 'tett') {
    takAreal = areal
    takFormattert = `Tett tak: ${fmt1(takAreal)} m² plater`
    takKostnad = takAreal * c.prisTakplatePerM2
  }

  // Sideskjerm
  let skjermLøpemeter: number | undefined
  let skjermAreal: number | undefined
  let skjermFormattert: string | undefined
  let skjermKostnad: number | undefined

  if (c.skjermtype !== 'ingen' && c.skjermSider.length > 0) {
    const totalSideLengde = c.skjermSider.reduce((sum, s) => sum + sideLengde(c, s), 0)
    const skjermHøyde = Math.max(0.5, c.høyde - 0.1)
    const flate = totalSideLengde * skjermHøyde

    if (c.skjermtype === 'tett') {
      skjermAreal = flate
      skjermKostnad = flate * c.prisTakplatePerM2
      skjermFormattert = `${SKJERM_INFO.tett.navn}: ${fmt1(flate)} m² panel (${c.skjermSider.length} sider)`
    } else {
      // spalér ≈ rutenett (bord hver 12 cm i én retning), vannrett ≈ rader hver 12 cm
      const radavstand = 0.12
      const løpemeter =
        c.skjermtype === 'spalér'
          ? (totalSideLengde / radavstand) * skjermHøyde + (skjermHøyde / radavstand) * totalSideLengde
          : Math.ceil(skjermHøyde / radavstand) * totalSideLengde
      skjermLøpemeter = løpemeter * svinn
      skjermKostnad = skjermLøpemeter * c.prisLektPrLm
      skjermFormattert = `${SKJERM_INFO[c.skjermtype].navn}: ${fmt1(skjermLøpemeter)} lm (${c.skjermSider.length} sider)`
    }
  }

  // Skruer / beslag-festepunkter
  const spk = Math.round(c.skruerPerKryss)
  let skrueAntall = stolpeAntall * spk // stolpe→drager
  skrueAntall += spærAntall * dragerAntall * spk // spær→drager
  if (lektAntall) skrueAntall += lektAntall * spærAntall // lekt→spær (1 per kryss)

  const stolpeKostnad = stolpeLøpemeter * c.prisStolpePrLm
  const stolpeskoKostnad = stolpeskoAntall * c.prisStolpesko
  const dragerKostnad = dragerLøpemeter * c.prisDragerPrLm
  const spærKostnad = spærLøpemeter * c.prisSpærPrLm
  const skrueKostnad = skrueAntall * c.prisSkrue

  // Andelen av trevirkekostnaden som skyldes kapp og svinn (allerede innbakt).
  const svinnGrunnlag =
    stolpeKostnad + dragerKostnad + spærKostnad + (lektLøpemeter ? lektLøpemeter * c.prisLektPrLm : 0) + (skjermLøpemeter ? skjermLøpemeter * c.prisLektPrLm : 0)
  const svinnKostnad = svinn > 1 ? svinnGrunnlag * ((svinn - 1) / svinn) : 0

  const totalKostnad =
    stolpeKostnad +
    stolpeskoKostnad +
    dragerKostnad +
    spærKostnad +
    (takKostnad ?? 0) +
    (skjermKostnad ?? 0) +
    skrueKostnad

  const stolpeStr = c.stolpeDim.replace('x', '×')
  const bjelkeStr = c.bjelkeDim.replace('x', '×')

  return {
    areal,
    arealFormattert: `${areal.toFixed(2)} m²`,

    stolpeAntall,
    stolpeLøpemeter,
    stolpeFormattert: `${stolpeAntall} stk · ${stolpeStr} mm`,
    stolpeKostnad,
    stolpeskoAntall,
    stolpeskoKostnad,

    dragerAntall: dragerAntall + (veggfesteLøpemeter > 0 ? 1 : 0),
    dragerLøpemeter,
    dragerFormattert:
      c.montering === 'veggmontert'
        ? `${dragerAntall} drager + veggfeste (${bjelkeStr})`
        : `${dragerAntall} dragere (${bjelkeStr})`,
    dragerKostnad,

    spærAntall,
    spærLøpemeter,
    spærFormattert: `${spærAntall} spær (${bjelkeStr})`,
    spærKostnad,

    lektAntall,
    lektLøpemeter,
    takAreal,
    takFormattert,
    takKostnad,

    skjermLøpemeter,
    skjermAreal,
    skjermFormattert,
    skjermKostnad,

    skrueAntall,
    skrueFormattert: `${skrueAntall} stk · ${spk} per kryss`,
    skrueKostnad,

    svinnProsent: c.svinnProsent,
    svinnKostnad,

    totalKostnad,
  }
}

export const formatKr = (v: number) => Math.round(v).toLocaleString('nb-NO') + ',-'

// Målefelt: [key, label, min, max, step, hjelpetekst?]
export type FieldKey = keyof PergolaConfig
export type MåleFelt = [FieldKey, string, number, number, number, string?]

export const MÅLEFELT: MåleFelt[] = [
  ['bredde', 'Bredde', 1.5, 10, 0.1, 'Langs huset'],
  ['dybde', 'Dybde', 1.5, 8, 0.1, 'Ut fra huset'],
  ['høyde', 'Høyde', 2, 3.2, 0.1, 'Til underkant drager'],
]

export const ALLE_MONTERING: Montering[] = ['frittstående', 'veggmontert']
export const ALLE_TAKTYPER: Taktype[] = ['åpen', 'lekter', 'spjeld', 'tett']
export const ALLE_SKJERMTYPER: Skjermtype[] = ['ingen', 'spalér', 'horisontal', 'tett']
export const ALLE_SIDER: Pergolaside[] = ['front', 'bak', 'venstre', 'høyre']
export const ALLE_STOLPEDIM: Stolpedim[] = ['98x98', '148x148']
export const ALLE_BJELKEDIM: Bjelkedimensjon[] = ['48x148', '48x198', '48x223']

// ── Ferdige oppsett (presets) ─────────────────────────────────────────────────

export interface PergolaPreset {
  id: string
  navn: string
  beskrivelse: string
  config: Partial<PergolaConfig>
}

export const PERGOLA_PRESETS: PergolaPreset[] = [
  {
    id: 'klassisk',
    navn: 'Klassisk pergola',
    beskrivelse: 'Frittstående med lekter',
    config: {
      montering: 'frittstående',
      bredde: 3.0,
      dybde: 3.0,
      høyde: 2.4,
      taktype: 'lekter',
      skjermtype: 'ingen',
      skjermSider: [],
    },
  },
  {
    id: 'solskjerm-vegg',
    navn: 'Veggmontert solskjerm',
    beskrivelse: 'Lekter mot terrassen',
    config: {
      montering: 'veggmontert',
      bredde: 4.0,
      dybde: 3.0,
      høyde: 2.5,
      taktype: 'lekter',
      lektAvstand: 0.15,
      skjermtype: 'ingen',
      skjermSider: [],
    },
  },
  {
    id: 'lukket-tak',
    navn: 'Pergola med tett tak',
    beskrivelse: 'Tørr uteplass hele året',
    config: {
      montering: 'veggmontert',
      bredde: 4.0,
      dybde: 3.5,
      høyde: 2.6,
      bjelkeDim: '48x223',
      taktype: 'tett',
      skjermtype: 'ingen',
      skjermSider: [],
    },
  },
  {
    id: 'med-skjerm',
    navn: 'Pergola med spalér',
    beskrivelse: 'Le og klatreplanter',
    config: {
      montering: 'frittstående',
      bredde: 3.6,
      dybde: 3.0,
      høyde: 2.4,
      taktype: 'spjeld',
      skjermtype: 'spalér',
      skjermSider: ['bak', 'venstre'],
    },
  },
  {
    id: 'stor-uteplass',
    navn: 'Stor uteplass-pergola',
    beskrivelse: 'Plass til langbord',
    config: {
      montering: 'frittstående',
      bredde: 6.0,
      dybde: 4.0,
      høyde: 2.6,
      stolpeDim: '148x148',
      bjelkeDim: '48x223',
      taktype: 'lekter',
      skjermtype: 'ingen',
      skjermSider: [],
    },
  },
]

/** Bygg en fullstendig konfigurasjon fra et oppsett. */
export function byggPresetConfig(preset: PergolaPreset): PergolaConfig {
  return { ...DEFAULT_CONFIG, ...preset.config }
}
