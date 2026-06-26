// Beregningsmodell for utekjøkkenplanleggeren – samme struktur og enheter som
// pergola-/carportmodellen: all geometri er i meter, materialdimensjoner i mm.
// Utekjøkkenet er et frittstående tak-på-stolper over en hevet platting, med
// innredning: benk med vask, underskap og en sittebenk – jf. referanseskissen
// (2,80 × 1,50 m, høyde 2,40 m, 90×90 mm stolper, benkehøyde 90 cm).

// Takform – utekjøkkenet har et enkelt, nesten flatt tak som leder vann vekk.
export type Taktype = 'flatt' | 'pulttak'

// Taktekke (overflate på taket).
export type Taktekke = 'stålplater' | 'bord' | 'shingel'

// Benkeplate-overflate.
export type Benkeplate = 'tre' | 'laminat' | 'rustfritt'

export type Stolpedim = '90x90' | '98x98' | '148x148'
export type Bjelkedimensjon = '48x148' | '48x198' | '48x223'

export interface UtekjokkenConfig {
  // Mål
  bredde: number // m (x – langs forsiden)
  dybde: number // m (z – ut fra baksiden)
  høyde: number // m (fri høyde, lav side under drager)

  // Tak
  taktype: Taktype
  takvinkel: number // grader (pulttak)
  taktekke: Taktekke
  takutstikk: number // m (utstikk på alle kanter)

  // Platting (hevet gulv)
  plattformHøyde: number // m (overkant dekke over bakken)

  // Innredning
  benkehøyde: number // m (overkant benkeplate)
  benkedybde: number // m (benkeplatens dybde)
  benkeplate: Benkeplate
  harVask: boolean
  harSkap: boolean // lukket underskap med dør
  harBenk: boolean // sittebenk langs siden
  harBakvegg: boolean // bakvegg (spiler) bak benken
  harSidevegger: boolean // spilervegger på begge sider for ekstra le
  hyller: number // antall hyller i åpen del under benken (0–3)

  // Stolper og bæring
  stolpeDim: Stolpedim
  bjelkeDim: Bjelkedimensjon // dragere og spær
  spærAvstand: number // m

  // Materialkonfigurasjon
  skruerPerKryss: number
  svinnProsent: number

  // Priser (NOK)
  prisStolpePrLm: number
  prisDragerPrLm: number
  prisSpærPrLm: number
  prisTaktekkePerM2: number
  prisDekkePerM2: number // platting (dekke + bjelkelag)
  prisBenkeplatePrLm: number
  prisVask: number // utslagsvask + kran + avløp (fast)
  prisSkap: number // lukket underskap med dør (per stk)
  prisBenkPrLm: number // sittebenk
  prisPanelPerM2: number // bakvegg / kledning
  prisSkrue: number
  prisStolpesko: number
}

export const TAK_INFO: Record<Taktype, { navn: string; beskrivelse: string }> = {
  flatt: { navn: 'Flatt', beskrivelse: 'Tilnærmet flatt tak med svakt fall' },
  pulttak: { navn: 'Pulttak', beskrivelse: 'Skrår én vei – leder vann bakover' },
}

export const TAKTEKKE_INFO: Record<Taktekke, { navn: string; standardpris: number }> = {
  stålplater: { navn: 'Stålplater', standardpris: 180 },
  bord: { navn: 'Bordtak', standardpris: 240 },
  shingel: { navn: 'Shingel', standardpris: 230 },
}

export const BENKEPLATE_INFO: Record<Benkeplate, { navn: string; standardpris: number }> = {
  tre: { navn: 'Heltre', standardpris: 590 },
  laminat: { navn: 'Laminat', standardpris: 390 },
  rustfritt: { navn: 'Rustfritt', standardpris: 1290 },
}

export const STOLPE_INFO: Record<Stolpedim, { størrelse: number; standardpris: number }> = {
  '90x90': { størrelse: 90, standardpris: 70 },
  '98x98': { størrelse: 98, standardpris: 75 },
  '148x148': { størrelse: 148, standardpris: 135 },
}

export const BJELKE_INFO: Record<Bjelkedimensjon, { høyde: number; standardpris: number }> = {
  '48x148': { høyde: 148, standardpris: 55 },
  '48x198': { høyde: 198, standardpris: 65 },
  '48x223': { høyde: 223, standardpris: 78 },
}

export const DEFAULT_CONFIG: UtekjokkenConfig = {
  bredde: 2.8,
  dybde: 1.5,
  høyde: 2.4,
  taktype: 'pulttak',
  takvinkel: 6,
  taktekke: 'stålplater',
  takutstikk: 0.3,
  plattformHøyde: 0.2,
  benkehøyde: 0.9,
  benkedybde: 0.6,
  benkeplate: 'tre',
  harVask: true,
  harSkap: true,
  harBenk: true,
  harBakvegg: true,
  harSidevegger: false,
  hyller: 2,
  stolpeDim: '90x90',
  bjelkeDim: '48x198',
  spærAvstand: 0.6,
  skruerPerKryss: 4,
  svinnProsent: 10,
  prisStolpePrLm: 70,
  prisDragerPrLm: 65,
  prisSpærPrLm: 55,
  prisTaktekkePerM2: 180,
  prisDekkePerM2: 480,
  prisBenkeplatePrLm: 590,
  prisVask: 2490,
  prisSkap: 2900,
  prisBenkPrLm: 690,
  prisPanelPerM2: 320,
  prisSkrue: 3,
  prisStolpesko: 149,
}

export interface BeregnetResultat {
  areal: number
  arealFormattert: string

  // Bæring
  stolpeAntall: number
  stolpeLøpemeter: number
  stolpeFormattert: string
  stolpeKostnad: number
  stolpeskoAntall: number
  stolpeskoKostnad: number

  dragerLøpemeter: number
  dragerFormattert: string
  dragerKostnad: number

  spærAntall: number
  spærLøpemeter: number
  spærFormattert: string
  spærKostnad: number

  knebåndAntall: number
  knebåndLøpemeter: number
  knebåndKostnad: number

  // Tak
  takAreal: number
  taktekkeFormattert: string
  taktekkeKostnad: number

  // Platting
  plattformAreal: number
  plattformFormattert: string
  plattformKostnad: number

  // Innredning
  benkeLengde: number
  benkeplateFormattert: string
  benkeplateKostnad: number
  vaskKostnad: number
  skapAntall: number
  skapKostnad: number
  benkLengde: number
  benkKostnad: number
  bakveggAreal: number
  bakveggKostnad: number
  sideveggAreal: number
  sideveggKostnad: number
  hyllerLøpemeter: number
  hyllerKostnad: number
  innredningKostnad: number

  skrueAntall: number
  skrueFormattert: string
  skrueKostnad: number

  svinnProsent: number
  svinnKostnad: number

  totalKostnad: number
}

const fmt1 = (v: number) => v.toFixed(1)
const rad = (deg: number) => (deg * Math.PI) / 180

// ── Geometri-hjelpere ─────────────────────────────────────────────────────────

/** Takets fall (høydeforskjell) fra lav til høy side ved pulttak. */
export function takFall(c: UtekjokkenConfig): number {
  return c.taktype === 'pulttak' ? c.dybde * Math.tan(rad(c.takvinkel)) : 0
}

/** Faktor som gjør flatt areal om til skrått takareal. */
export function skråfaktor(c: UtekjokkenConfig): number {
  return c.taktype === 'flatt' ? 1 : 1 / Math.cos(rad(c.takvinkel))
}

/** Antall stolper per rad (forside/bakside) – flere ved stor bredde. */
export function stolperPerRad(c: UtekjokkenConfig): number {
  return c.bredde > 3.6 ? 3 : 2
}

export function antallSpær(c: UtekjokkenConfig): number {
  return Math.max(2, Math.floor(c.bredde / Math.max(0.2, c.spærAvstand)) + 1)
}

/** Lengden på benkeraden langs baksiden (brutto, før moduloppdeling). */
export function benkeradLengde(c: UtekjokkenConfig): number {
  return Math.max(0.6, c.bredde - 0.2)
}

// ── Beregning ──────────────────────────────────────────────────────────────────

export function beregn(c: UtekjokkenConfig): BeregnetResultat {
  const areal = c.bredde * c.dybde
  const svinn = 1 + Math.max(0, c.svinnProsent) / 100

  const bEff = c.bredde + 2 * c.takutstikk
  const dEff = c.dybde + 2 * c.takutstikk
  const sf = skråfaktor(c)
  const fall = takFall(c)

  // Stolper: to rader (front + bak), fra platting opp til drager.
  const perRad = stolperPerRad(c)
  const stolpeAntall = 2 * perRad
  const snittHøyde = c.høyde + fall / 2
  const stolpeLøpemeter = stolpeAntall * snittHøyde * svinn
  const stolpeskoAntall = stolpeAntall

  // Dragere langs forsiden + baksiden, samt sidebjelker (rammer rundt taket).
  const dragerLøpemeter = (2 * (c.bredde + 2 * c.takutstikk) + 2 * c.dybde) * svinn

  // Spær på tvers (langs dybden), følger fallet.
  const spærAntall = antallSpær(c)
  const spærLengde = dEff * sf
  const spærLøpemeter = spærAntall * spærLengde * svinn

  // Knebånd: to skråstivere per stolpe for stivhet.
  const knebåndAntall = stolpeAntall * 2
  const knebåndLøpemeter = knebåndAntall * 0.5 * svinn

  // Tak
  const takAreal = bEff * dEff * sf
  const taktekkeKostnad = takAreal * c.prisTaktekkePerM2
  const taktekkeFormattert = `${TAKTEKKE_INFO[c.taktekke].navn}: ${fmt1(takAreal)} m²`

  // Platting (dekke + bjelkelag)
  const plattformAreal = areal
  const plattformKostnad = plattformAreal * c.prisDekkePerM2
  const plattformFormattert = `${fmt1(plattformAreal)} m² dekke · h ${Math.round(c.plattformHøyde * 100)} cm`

  // ── Innredning ────────────────────────────────────────────────────────────
  // Benkerad deles: vask + (evt.) skap. Sittebenk legges langs én side.
  const skapBredde = c.harSkap ? 0.6 : 0
  const benkeLengde = Math.max(0.6, benkeradLengde(c) - skapBredde)
  const benkeplateKostnad = benkeLengde * c.prisBenkeplatePrLm
  const benkeplateFormattert = `${BENKEPLATE_INFO[c.benkeplate].navn}: ${fmt1(benkeLengde)} lm`

  const vaskKostnad = c.harVask ? c.prisVask : 0
  const skapAntall = c.harSkap ? 1 : 0
  const skapKostnad = skapAntall * c.prisSkap

  // Sittebenk langs siden (dybderetning).
  const benkLengde = c.harBenk ? Math.max(0.6, c.dybde - 0.2) : 0
  const benkKostnad = benkLengde * c.prisBenkPrLm

  // Bakvegg (spiler) bak benkeraden (opp til ~1,2 m).
  const bakveggHøyde = 1.2
  const bakveggAreal = c.harBakvegg ? c.bredde * bakveggHøyde * svinn : 0
  const bakveggKostnad = bakveggAreal * c.prisPanelPerM2

  // Spilervegger på begge sider (opp til ~1,8 m) for ekstra le.
  const sideveggHøyde = Math.min(1.8, c.høyde)
  const sideveggAreal = c.harSidevegger ? 2 * c.dybde * sideveggHøyde * svinn : 0
  const sideveggKostnad = sideveggAreal * c.prisPanelPerM2

  // Hyller i åpen del under benken.
  const hyllerLøpemeter = c.hyller * benkeLengde * svinn
  const hyllerKostnad = hyllerLøpemeter * c.prisDragerPrLm

  const innredningKostnad =
    benkeplateKostnad + vaskKostnad + skapKostnad + benkKostnad + bakveggKostnad + sideveggKostnad + hyllerKostnad

  // Skruer / beslag
  const spk = Math.round(c.skruerPerKryss)
  const skrueAntall =
    stolpeAntall * spk +
    spærAntall * 2 * spk +
    knebåndAntall * 2 +
    Math.round(takAreal * 6) +
    Math.round(plattformAreal * 20) +
    Math.round((benkeLengde + benkLengde) * 12)

  const stolpeKostnad = stolpeLøpemeter * c.prisStolpePrLm
  const stolpeskoKostnad = stolpeskoAntall * c.prisStolpesko
  const dragerKostnad = dragerLøpemeter * c.prisDragerPrLm
  const spærKostnad = spærLøpemeter * c.prisSpærPrLm
  const knebåndKostnad = knebåndLøpemeter * c.prisDragerPrLm
  const skrueKostnad = skrueAntall * c.prisSkrue

  const svinnGrunnlag = stolpeKostnad + dragerKostnad + spærKostnad + knebåndKostnad
  const svinnKostnad = svinn > 1 ? svinnGrunnlag * ((svinn - 1) / svinn) : 0

  const totalKostnad =
    stolpeKostnad +
    stolpeskoKostnad +
    dragerKostnad +
    spærKostnad +
    knebåndKostnad +
    taktekkeKostnad +
    plattformKostnad +
    innredningKostnad +
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

    dragerLøpemeter,
    dragerFormattert: `Dragere + sidebjelker (${bjelkeStr})`,
    dragerKostnad,

    spærAntall,
    spærLøpemeter,
    spærFormattert: `${spærAntall} spær (${bjelkeStr})`,
    spærKostnad,

    knebåndAntall,
    knebåndLøpemeter,
    knebåndKostnad,

    takAreal,
    taktekkeFormattert,
    taktekkeKostnad,

    plattformAreal,
    plattformFormattert,
    plattformKostnad,

    benkeLengde,
    benkeplateFormattert,
    benkeplateKostnad,
    vaskKostnad,
    skapAntall,
    skapKostnad,
    benkLengde,
    benkKostnad,
    bakveggAreal,
    bakveggKostnad,
    sideveggAreal,
    sideveggKostnad,
    hyllerLøpemeter,
    hyllerKostnad,
    innredningKostnad,

    skrueAntall,
    skrueFormattert: `${skrueAntall} stk · inkl. dekke- og innredningsfeste`,
    skrueKostnad,

    svinnProsent: c.svinnProsent,
    svinnKostnad,

    totalKostnad,
  }
}

export const formatKr = (v: number) => Math.round(v).toLocaleString('nb-NO') + ',-'

// Målefelt: [key, label, min, max, step, hjelpetekst?]
export type FieldKey = keyof UtekjokkenConfig
export type MåleFelt = [FieldKey, string, number, number, number, string?]

export const MÅLEFELT: MåleFelt[] = [
  ['bredde', 'Bredde', 1.8, 5, 0.1, 'Langs forsiden'],
  ['dybde', 'Dybde', 1.2, 3, 0.1, 'Ut fra baksiden'],
  ['høyde', 'Høyde', 2.1, 2.8, 0.1, 'Fri høyde under drager'],
]

export const ALLE_TAKTYPER: Taktype[] = ['flatt', 'pulttak']
export const ALLE_TAKTEKKE: Taktekke[] = ['stålplater', 'bord', 'shingel']
export const ALLE_BENKEPLATE: Benkeplate[] = ['tre', 'laminat', 'rustfritt']
export const ALLE_STOLPEDIM: Stolpedim[] = ['90x90', '98x98', '148x148']
export const ALLE_BJELKEDIM: Bjelkedimensjon[] = ['48x148', '48x198', '48x223']

// ── Ferdige oppsett (presets) ─────────────────────────────────────────────────

export interface UtekjokkenPreset {
  id: string
  navn: string
  beskrivelse: string
  config: Partial<UtekjokkenConfig>
}

export const UTEKJOKKEN_PRESETS: UtekjokkenPreset[] = [
  {
    id: 'kompakt',
    navn: 'Kompakt',
    beskrivelse: 'Benk med vask',
    config: { bredde: 2.2, dybde: 1.3, harVask: true, harSkap: false, harBenk: false, hyller: 1 },
  },
  {
    id: 'standard',
    navn: 'Standard',
    beskrivelse: 'Som skissen – 2,8 × 1,5 m',
    config: { bredde: 2.8, dybde: 1.5, harVask: true, harSkap: true, harBenk: true, hyller: 2 },
  },
  {
    id: 'kjokkenhage',
    navn: 'Med sittebenk',
    beskrivelse: 'Benk, skap og sitteplass',
    config: { bredde: 3.2, dybde: 1.8, harVask: true, harSkap: true, harBenk: true, hyller: 2, taktekke: 'bord' },
  },
  {
    id: 'stor',
    navn: 'Stort utekjøkken',
    beskrivelse: 'Bred benk, rustfri plate',
    config: { bredde: 4.0, dybde: 2.0, harVask: true, harSkap: true, harBenk: true, hyller: 3, benkeplate: 'rustfritt', stolpeDim: '98x98', bjelkeDim: '48x223' },
  },
]

export function byggPresetConfig(preset: UtekjokkenPreset): UtekjokkenConfig {
  const merged = { ...DEFAULT_CONFIG, ...preset.config }
  if (preset.config.taktekke) merged.prisTaktekkePerM2 = TAKTEKKE_INFO[preset.config.taktekke].standardpris
  if (preset.config.benkeplate) merged.prisBenkeplatePrLm = BENKEPLATE_INFO[preset.config.benkeplate].standardpris
  return merged
}
