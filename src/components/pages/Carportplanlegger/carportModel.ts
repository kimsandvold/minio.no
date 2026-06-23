// Beregningsmodell for carportplanleggeren – samme struktur og enheter som
// pergola-/terrassemodellen: all geometri er i meter, materialdimensjoner i mm.
// Konstruksjonen er dimensjonert for å være solid (knebånd/avstiving) og gir
// veiledende status mot norske byggeregler (søknadsplikt, høyder, snølast).

export type Montering = 'frittstående' | 'veggmontert'

// Takform.
export type Taktype = 'flatt' | 'pulttak' | 'saltak'

// Taktekke (overflate på taket).
export type Taktekke = 'stålplater' | 'polykarbonat' | 'takpapp' | 'shingel'

// Vegg / kledning på sidene (med akrylvindu-alternativer).
export type Veggtype = 'ingen' | 'panel' | 'akryl' | 'kombinert'

export type Carportside = 'front' | 'bak' | 'venstre' | 'høyre'

export type Stolpedim = '98x98' | '148x148'
export type Bjelkedimensjon = '48x148' | '48x198' | '48x223'

export interface CarportConfig {
  montering: Montering

  // Mål
  bredde: number // m (x – på tvers)
  lengde: number // m (z – kjøreretning)
  høyde: number // m (fri høyde, lav side)

  // Tak
  taktype: Taktype
  takvinkel: number // grader (pulttak/saltak)
  taktekke: Taktekke
  takutstikk: number // m (utstikk på alle kanter)

  // Vegger / kledning
  veggtype: Veggtype
  veggSider: Carportside[]

  // Stolper og bæring
  stolpeAvstand: number // m – maks senteravstand mellom stolper
  stolpeDim: Stolpedim
  bjelkeDim: Bjelkedimensjon // dragere og spær
  spærAvstand: number // m

  // Last / dimensjonering
  snølast: number // kN/m² (snølast på mark, lokal verdi)

  // Materialkonfigurasjon
  skruerPerKryss: number
  svinnProsent: number

  // Priser (NOK)
  prisStolpePrLm: number
  prisDragerPrLm: number
  prisSpærPrLm: number
  prisTaktekkePerM2: number
  prisSutakPerM2: number
  prisTakrennePrLm: number
  prisNedløp: number
  prisVindskiPrLm: number
  prisVeggpanelPerM2: number
  prisAkrylPerM2: number
  prisSkrue: number
  prisStolpesko: number
}

export const MONTERING_INFO: Record<Montering, { navn: string; beskrivelse: string }> = {
  frittstående: { navn: 'Frittstående', beskrivelse: 'Stolper på alle fire hjørner' },
  veggmontert: { navn: 'Veggmontert', beskrivelse: 'Høy side festet til husveggen' },
}

export const TAK_INFO: Record<Taktype, { navn: string; beskrivelse: string }> = {
  flatt: { navn: 'Flatt', beskrivelse: 'Tilnærmet flatt tak' },
  pulttak: { navn: 'Pulttak', beskrivelse: 'Skrår én vei' },
  saltak: { navn: 'Saltak', beskrivelse: 'Møne på midten' },
}

export const TAKTEKKE_INFO: Record<Taktekke, { navn: string; standardpris: number; kreverSutak: boolean }> = {
  stålplater: { navn: 'Stålplater', standardpris: 180, kreverSutak: false },
  polykarbonat: { navn: 'Polykarbonat', standardpris: 320, kreverSutak: false },
  takpapp: { navn: 'Takpapp', standardpris: 150, kreverSutak: true },
  shingel: { navn: 'Shingel', standardpris: 230, kreverSutak: true },
}

export const VEGG_INFO: Record<Veggtype, { navn: string; beskrivelse: string }> = {
  ingen: { navn: 'Åpen', beskrivelse: 'Ingen vegger' },
  panel: { navn: 'Panel', beskrivelse: 'Tett trekledning' },
  akryl: { navn: 'Akrylvindu', beskrivelse: 'Klare akrylplater' },
  kombinert: { navn: 'Panel + akryl', beskrivelse: 'Panel nede, akryl øverst' },
}

export const SIDE_INFO: Record<Carportside, string> = {
  front: 'Front',
  bak: 'Bak',
  venstre: 'Venstre',
  høyre: 'Høyre',
}

export const STOLPE_INFO: Record<Stolpedim, { størrelse: number; standardpris: number }> = {
  '98x98': { størrelse: 98, standardpris: 75 },
  '148x148': { størrelse: 148, standardpris: 135 },
}

export const BJELKE_INFO: Record<Bjelkedimensjon, { høyde: number; standardpris: number }> = {
  '48x148': { høyde: 148, standardpris: 55 },
  '48x198': { høyde: 198, standardpris: 65 },
  '48x223': { høyde: 223, standardpris: 78 },
}

// Veiledende maks spennvidde for spær (c/c 600 mm, snølast 3,5 kN/m²).
// Skaleres etter faktisk snølast og spæravstand i dimensjoneringsrådet.
const SPÆR_BASIS_SPENN: Record<Bjelkedimensjon, number> = {
  '48x148': 2.5,
  '48x198': 3.3,
  '48x223': 3.8,
}

export const DEFAULT_CONFIG: CarportConfig = {
  montering: 'frittstående',
  bredde: 3.0,
  lengde: 5.0,
  høyde: 2.2,
  taktype: 'pulttak',
  takvinkel: 10,
  taktekke: 'stålplater',
  takutstikk: 0.3,
  veggtype: 'ingen',
  veggSider: [],
  stolpeAvstand: 2.6,
  stolpeDim: '98x98',
  bjelkeDim: '48x198',
  spærAvstand: 0.6,
  snølast: 4.5,
  skruerPerKryss: 4,
  svinnProsent: 10,
  prisStolpePrLm: 75,
  prisDragerPrLm: 65,
  prisSpærPrLm: 55,
  prisTaktekkePerM2: 180,
  prisSutakPerM2: 95,
  prisTakrennePrLm: 89,
  prisNedløp: 249,
  prisVindskiPrLm: 39,
  prisVeggpanelPerM2: 320,
  prisAkrylPerM2: 690,
  prisSkrue: 3,
  prisStolpesko: 149,
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

  // Tverrbjelker (strekkbånd som binder dragerne sammen)
  tverrbjelkeAntall: number
  tverrbjelkeLøpemeter: number
  tverrbjelkeFormattert: string
  tverrbjelkeKostnad: number

  // Avstiving / knebånd
  knebåndAntall: number
  knebåndLøpemeter: number
  knebåndKostnad: number

  takAreal: number
  taktekkeFormattert: string
  taktekkeKostnad: number

  sutakAreal?: number
  sutakKostnad?: number

  takrenneLøpemeter: number
  nedløpAntall: number
  vindskiLøpemeter: number
  avvanningFormattert: string
  avvanningKostnad: number

  // Vegger
  veggPanelAreal?: number
  veggAkrylAreal?: number
  veggFormattert?: string
  veggKostnad?: number

  skrueAntall: number
  skrueFormattert: string
  skrueKostnad: number

  svinnProsent: number
  svinnKostnad: number

  totalKostnad: number
}

export interface Byggeregler {
  areal: number
  gesimshøyde: number
  mønehøyde: number
  søknadsfri: boolean
  merknader: string[]
}

export interface Dimensjonering {
  ok: boolean
  spennvidde: number
  maksSpenn: number
  melding: string
}

const fmt1 = (v: number) => v.toFixed(1)
const rad = (deg: number) => (deg * Math.PI) / 180

// ── Geometri-hjelpere ─────────────────────────────────────────────────────────

/** Takets fall (høydeforskjell) fra lav til høy side / til møne. */
export function takFall(c: CarportConfig): number {
  if (c.taktype === 'pulttak') return c.bredde * Math.tan(rad(c.takvinkel))
  if (c.taktype === 'saltak') return (c.bredde / 2) * Math.tan(rad(c.takvinkel))
  return 0
}

/** Faktor som gjør flatt areal om til skrått takareal. */
export function skråfaktor(c: CarportConfig): number {
  if (c.taktype === 'flatt') return 1
  return 1 / Math.cos(rad(c.takvinkel))
}

/** Spennvidde for spær (avstand mellom bæredragere) – halv bredde ved saltak. */
export function spærSpenn(c: CarportConfig): number {
  return c.taktype === 'saltak' ? c.bredde / 2 : c.bredde
}

export function stolperPerRad(c: CarportConfig): number {
  return Math.max(2, Math.ceil(c.lengde / Math.max(0.5, c.stolpeAvstand)) + 1)
}

export function antallStolperader(c: CarportConfig): number {
  return c.montering === 'frittstående' ? 2 : 1
}

export function antallSpær(c: CarportConfig): number {
  return Math.max(2, Math.floor(c.lengde / Math.max(0.2, c.spærAvstand)) + 1)
}

function sideLengde(c: CarportConfig, side: Carportside): number {
  return side === 'front' || side === 'bak' ? c.bredde : c.lengde
}

// ── Byggeregler (veiledende) ──────────────────────────────────────────────────

/**
 * Veiledende vurdering mot byggesaksforskriften (SAK10 §4-1). Frittstående
 * bygning (carport/garasje) inntil 50 m² kan være unntatt søknadsplikt, tilbygg
 * (veggmontert) inntil 15 m². Høydekrav: gesims ≤ 3,0 m, møne ≤ 4,0 m.
 */
export function byggeregler(c: CarportConfig): Byggeregler {
  const areal = c.bredde * c.lengde
  const takBygg = 0.2 // tak-/bjelkelagstykkelse lagt til høydene
  const fall = takFall(c)
  const gesimshøyde = c.høyde + (c.taktype === 'pulttak' ? fall : 0) + takBygg
  const mønehøyde = c.høyde + fall + takBygg

  const merknader: string[] = []
  const arealgrense = c.montering === 'frittstående' ? 50 : 15
  let søknadsfri = true

  if (areal > arealgrense) {
    søknadsfri = false
    merknader.push(
      `Areal ${fmt1(areal)} m² er over grensen på ${arealgrense} m² for ${c.montering === 'frittstående' ? 'frittstående bygning' : 'tilbygg'} – søknad kreves.`,
    )
  }
  if (gesimshøyde > 3.0) {
    søknadsfri = false
    merknader.push(`Gesimshøyde ${fmt1(gesimshøyde)} m er over 3,0 m – søknad kreves.`)
  }
  if (mønehøyde > 4.0) {
    søknadsfri = false
    merknader.push(`Mønehøyde ${fmt1(mønehøyde)} m er over 4,0 m – søknad kreves.`)
  }

  merknader.push('Avstand til nabogrense må være minst 1,0 m for å være unntatt søknad.')
  merknader.push('Sjekk alltid lokal snølast og kommunens regler – du er selv ansvarlig.')

  return { areal, gesimshøyde, mønehøyde, søknadsfri, merknader }
}

/**
 * Enkelt dimensjoneringsråd for spær ut fra snølast og spæravstand. Veiledende –
 * erstatter ikke statisk beregning, men flagger åpenbart underdimensjonerte valg.
 */
export function dimensjonering(c: CarportConfig): Dimensjonering {
  const basis = SPÆR_BASIS_SPENN[c.bjelkeDim]
  // Skaler etter snølast (basis 3,5 kN/m²) og spæravstand (basis 0,6 m).
  const maksSpenn = basis * (3.5 / Math.max(1, c.snølast)) * (0.6 / Math.max(0.3, c.spærAvstand))
  const spennvidde = spærSpenn(c)
  const ok = spennvidde <= maksSpenn
  const melding = ok
    ? `Spær ${c.bjelkeDim.replace('x', '×')} tåler spenn på ${fmt1(spennvidde)} m ved ${fmt1(c.snølast)} kN/m² snølast.`
    : `Spennet på ${fmt1(spennvidde)} m er i overkant for ${c.bjelkeDim.replace('x', '×')} ved ${fmt1(c.snølast)} kN/m². Velg kraftigere dimensjon, tettere spær eller ekstra bæring.`
  return { ok, spennvidde, maksSpenn, melding }
}

// ── Beregning ──────────────────────────────────────────────────────────────────

export function beregn(c: CarportConfig): BeregnetResultat {
  const areal = c.bredde * c.lengde
  const svinn = 1 + Math.max(0, c.svinnProsent) / 100

  const bEff = c.bredde + 2 * c.takutstikk
  const lEff = c.lengde + 2 * c.takutstikk
  const sf = skråfaktor(c)
  const fall = takFall(c)

  // Stolper. Høy side blir høyere ved pulttak; ved veggmontering bærer veggen
  // den høye siden (ingen stolper der).
  const perRad = stolperPerRad(c)
  const rader = antallStolperader(c)
  const stolpeAntall = rader * perRad

  let stolpeLøpemeter: number
  if (c.montering === 'frittstående') {
    stolpeLøpemeter =
      c.taktype === 'pulttak'
        ? perRad * c.høyde + perRad * (c.høyde + fall)
        : stolpeAntall * c.høyde
  } else {
    stolpeLøpemeter = perRad * c.høyde
  }
  stolpeLøpemeter *= svinn
  const stolpeskoAntall = stolpeAntall

  // Dragere (langs lengden, oppå stolperadene)
  const dragerLinjer = c.montering === 'frittstående' ? 2 : 1
  const veggfeste = c.montering === 'veggmontert' ? lEff : 0
  const dragerLøpemeter = (dragerLinjer * lEff + veggfeste) * svinn

  // Spær (på tvers, følger takfallet → bruker skråfaktor)
  const spærAntall = antallSpær(c)
  const spærLengde = bEff * sf
  const spærLøpemeter = spærAntall * spærLengde * svinn

  // Tverrbjelker (undergurt) + takstol-avstiving: møne, hanebjelker (kryssbjelker)
  // og kongstolper/strevere som binder takstolen sammen ved hver stolpelinje.
  const tverrbjelkeAntall = perRad
  let takstolAvstiving = 0
  if (c.taktype === 'saltak') {
    takstolAvstiving = lEff + perRad * (c.bredde * 0.45) + perRad * fall // møne + hanebjelker + kongstolper
  } else if (c.taktype === 'pulttak') {
    takstolAvstiving = perRad * Math.max(0, fall * 0.5) // midtstrevere
  }
  const tverrbjelkeLøpemeter = (tverrbjelkeAntall * c.bredde + takstolAvstiving) * svinn
  const tverrbjelkeKostnad = tverrbjelkeLøpemeter * c.prisDragerPrLm

  // Knebånd / avstiving for stivhet: to skråstivere per stolpe (à 0,7 m)
  const knebåndAntall = stolpeAntall * 2
  const knebåndLøpemeter = knebåndAntall * 0.7 * svinn
  const knebåndKostnad = knebåndLøpemeter * c.prisDragerPrLm

  // Takareal (projisert flate ganget med skråfaktor)
  const takAreal = bEff * lEff * sf

  // Taktekke
  const taktekkeKostnad = takAreal * c.prisTaktekkePerM2
  const taktekkeFormattert = `${TAKTEKKE_INFO[c.taktekke].navn}: ${fmt1(takAreal)} m²`

  // Sutak / undertak (kun for takpapp og shingel)
  let sutakAreal: number | undefined
  let sutakKostnad: number | undefined
  if (TAKTEKKE_INFO[c.taktekke].kreverSutak) {
    sutakAreal = takAreal
    sutakKostnad = sutakAreal * c.prisSutakPerM2
  }

  // Avvanning: takrenne langs raftene + nedløp + vindski langs gavl/skråkant
  const renneLinjer = c.taktype === 'saltak' ? 2 : 1
  const takrenneLøpemeter = renneLinjer * lEff
  const nedløpAntall = renneLinjer * Math.max(1, Math.ceil(c.lengde / 10))
  const gavlKanter = c.taktype === 'saltak' ? 4 : 2
  const vindskiLøpemeter = gavlKanter * spærLengde * (c.taktype === 'saltak' ? 0.5 : 1)
  const avvanningKostnad =
    takrenneLøpemeter * c.prisTakrennePrLm + nedløpAntall * c.prisNedløp + vindskiLøpemeter * c.prisVindskiPrLm
  const avvanningFormattert = `${fmt1(takrenneLøpemeter)} lm renne, ${nedløpAntall} nedløp, ${fmt1(vindskiLøpemeter)} lm vindski`

  // Vegger med eventuelle akrylvinduer
  let veggPanelAreal: number | undefined
  let veggAkrylAreal: number | undefined
  let veggFormattert: string | undefined
  let veggKostnad: number | undefined
  if (c.veggtype !== 'ingen' && c.veggSider.length > 0) {
    const veggHøyde = c.høyde
    let panelAreal = 0
    let akrylAreal = 0
    for (const side of c.veggSider) {
      const len = sideLengde(c, side)
      const areal = len * veggHøyde
      if (c.veggtype === 'panel') panelAreal += areal
      else if (c.veggtype === 'akryl') akrylAreal += areal
      else {
        // kombinert: 1,0 m panel nederst, resten akryl
        panelAreal += len * Math.min(1.0, veggHøyde)
        akrylAreal += len * Math.max(0, veggHøyde - 1.0)
      }
    }
    veggPanelAreal = panelAreal > 0 ? panelAreal * svinn : undefined
    veggAkrylAreal = akrylAreal > 0 ? akrylAreal : undefined
    veggKostnad = (veggPanelAreal ?? 0) * c.prisVeggpanelPerM2 + (veggAkrylAreal ?? 0) * c.prisAkrylPerM2
    const deler = [
      veggPanelAreal ? `${fmt1(veggPanelAreal)} m² panel` : '',
      veggAkrylAreal ? `${fmt1(veggAkrylAreal)} m² akryl` : '',
    ].filter(Boolean)
    veggFormattert = `${VEGG_INFO[c.veggtype].navn} (${c.veggSider.length} sider): ${deler.join(' + ')}`
  }

  // Skruer / beslag: stolpe→drager, spær→drager, knebånd og takfeste pr. m²
  const spk = Math.round(c.skruerPerKryss)
  const skrueAntall =
    stolpeAntall * spk + spærAntall * 2 * spk + knebåndAntall * 2 + Math.round(takAreal * 6)

  const stolpeKostnad = stolpeLøpemeter * c.prisStolpePrLm
  const stolpeskoKostnad = stolpeskoAntall * c.prisStolpesko
  const dragerKostnad = dragerLøpemeter * c.prisDragerPrLm
  const spærKostnad = spærLøpemeter * c.prisSpærPrLm
  const skrueKostnad = skrueAntall * c.prisSkrue

  const svinnGrunnlag = stolpeKostnad + dragerKostnad + spærKostnad + tverrbjelkeKostnad + knebåndKostnad
  const svinnKostnad = svinn > 1 ? svinnGrunnlag * ((svinn - 1) / svinn) : 0

  const totalKostnad =
    stolpeKostnad +
    stolpeskoKostnad +
    dragerKostnad +
    spærKostnad +
    tverrbjelkeKostnad +
    knebåndKostnad +
    taktekkeKostnad +
    (sutakKostnad ?? 0) +
    avvanningKostnad +
    (veggKostnad ?? 0) +
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

    dragerAntall: dragerLinjer + (veggfeste > 0 ? 1 : 0),
    dragerLøpemeter,
    dragerFormattert:
      c.montering === 'veggmontert'
        ? `${dragerLinjer} drager + veggfeste (${bjelkeStr})`
        : `${dragerLinjer} dragere (${bjelkeStr})`,
    dragerKostnad,

    spærAntall,
    spærLøpemeter,
    spærFormattert: `${spærAntall} spær (${bjelkeStr})`,
    spærKostnad,

    tverrbjelkeAntall,
    tverrbjelkeLøpemeter,
    tverrbjelkeFormattert:
      c.taktype === 'flatt'
        ? `${tverrbjelkeAntall} tverrbjelker (${bjelkeStr})`
        : `${tverrbjelkeAntall} tverrbjelker + møne/avstiving (${bjelkeStr})`,
    tverrbjelkeKostnad,

    knebåndAntall,
    knebåndLøpemeter,
    knebåndKostnad,

    takAreal,
    taktekkeFormattert,
    taktekkeKostnad,

    sutakAreal,
    sutakKostnad,

    takrenneLøpemeter,
    nedløpAntall,
    vindskiLøpemeter,
    avvanningFormattert,
    avvanningKostnad,

    veggPanelAreal,
    veggAkrylAreal,
    veggFormattert,
    veggKostnad,

    skrueAntall,
    skrueFormattert: `${skrueAntall} stk · inkl. takfeste`,
    skrueKostnad,

    svinnProsent: c.svinnProsent,
    svinnKostnad,

    totalKostnad,
  }
}

export const formatKr = (v: number) => Math.round(v).toLocaleString('nb-NO') + ',-'

// Målefelt: [key, label, min, max, step, hjelpetekst?]
export type FieldKey = keyof CarportConfig
export type MåleFelt = [FieldKey, string, number, number, number, string?]

export const MÅLEFELT: MåleFelt[] = [
  ['bredde', 'Bredde', 2.4, 8, 0.1, 'På tvers'],
  ['lengde', 'Lengde', 3, 12, 0.1, 'Kjøreretning'],
  ['høyde', 'Høyde', 2, 3, 0.1, 'Fri høyde (lav side)'],
]

export const ALLE_MONTERING: Montering[] = ['frittstående', 'veggmontert']
export const ALLE_TAKTYPER: Taktype[] = ['flatt', 'pulttak', 'saltak']
export const ALLE_TAKTEKKE: Taktekke[] = ['stålplater', 'polykarbonat', 'takpapp', 'shingel']
export const ALLE_VEGGTYPER: Veggtype[] = ['ingen', 'panel', 'akryl', 'kombinert']
export const ALLE_SIDER: Carportside[] = ['front', 'bak', 'venstre', 'høyre']
export const ALLE_STOLPEDIM: Stolpedim[] = ['98x98', '148x148']
export const ALLE_BJELKEDIM: Bjelkedimensjon[] = ['48x148', '48x198', '48x223']

// ── Ferdige oppsett (presets) ─────────────────────────────────────────────────

export interface CarportPreset {
  id: string
  navn: string
  beskrivelse: string
  config: Partial<CarportConfig>
}

export const CARPORT_PRESETS: CarportPreset[] = [
  {
    id: 'enkel',
    navn: 'Enkel carport',
    beskrivelse: 'Én bil, pulttak',
    config: { montering: 'frittstående', bredde: 3.0, lengde: 5.0, høyde: 2.2, taktype: 'pulttak', taktekke: 'stålplater' },
  },
  {
    id: 'dobbel',
    navn: 'Dobbel carport',
    beskrivelse: 'To biler, saltak',
    config: { montering: 'frittstående', bredde: 5.6, lengde: 5.5, høyde: 2.3, taktype: 'saltak', takvinkel: 18, bjelkeDim: '48x223', stolpeDim: '148x148', taktekke: 'stålplater' },
  },
  {
    id: 'veggmontert',
    navn: 'Veggmontert carport',
    beskrivelse: 'Pulttak mot huset',
    config: { montering: 'veggmontert', bredde: 3.2, lengde: 5.5, høyde: 2.3, taktype: 'pulttak', takvinkel: 8, taktekke: 'stålplater' },
  },
  {
    id: 'lukket-akryl',
    navn: 'Lukket carport',
    beskrivelse: 'Akrylvegger, polykarbonat',
    config: {
      montering: 'frittstående',
      bredde: 3.2,
      lengde: 5.5,
      høyde: 2.3,
      taktype: 'pulttak',
      takvinkel: 10,
      taktekke: 'polykarbonat',
      veggtype: 'kombinert',
      veggSider: ['bak', 'venstre', 'høyre'],
    },
  },
  {
    id: 'stor-saltak',
    navn: 'Stor carport',
    beskrivelse: 'Saltak med shingel',
    config: { montering: 'frittstående', bredde: 6.0, lengde: 6.0, høyde: 2.4, taktype: 'saltak', takvinkel: 22, bjelkeDim: '48x223', stolpeDim: '148x148', taktekke: 'shingel' },
  },
]

export function byggPresetConfig(preset: CarportPreset): CarportConfig {
  const merged = { ...DEFAULT_CONFIG, ...preset.config }
  if (preset.config.taktekke) merged.prisTaktekkePerM2 = TAKTEKKE_INFO[preset.config.taktekke].standardpris
  return merged
}
