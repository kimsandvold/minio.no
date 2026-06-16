// Beregningsmodell for terrasseplanleggeren – portert fra TerrassePlan (iOS / SwiftUI).
// All geometri er i meter, materialdimensjoner i mm.

export type TerrasseForm = 'rektangel' | 'lForm' | 'uForm'

export type Gjerdetype = 'ingen' | 'vannrett' | 'loddrett' | 'spiler' | 'hel'

export type Terrasseside = 'front' | 'bak' | 'venstre' | 'høyre'

export type Bjelkedimensjon = '48x98' | '48x148' | '48x198'

export interface Trapp {
  id: string
  side: Terrasseside
  posisjon: number // 0…1 langs kanten
  bredde: number // meter
  antallTrinn: number
}

export interface TerrasseConfig {
  form: TerrasseForm

  // Rektangel
  lengde: number
  bredde: number
  // L-form (og speilvendt L) – rundt to sider av huset
  hovedLengde: number
  hovedBredde: number
  fløyLengde: number
  fløyBredde: number
  // U-form (hestesko) – rundt tre sider av huset
  ytreLengde: number
  ytreBredde: number
  armBredde: number

  // Materialkonfigurasjon
  bordbredde: number // mm
  bordavstand: number // mm
  bjelkeavstand: number // mm
  skruerPerKryss: number
  bjelkeDimensjon: Bjelkedimensjon
  svinnProsent: number // kapp og svinn lagt til løpemeter (heltall, %)

  // Priser (NOK)
  prisBordPrLm: number
  prisBjelkePrLm: number
  prisSkrue: number
  prisGjerdeBord: number
  prisLekt: number
  prisStolpe: number

  // Gjerde
  gjerdeType: Gjerdetype
  gjerdeHøyde: number
  gjerdePåAlleSider: boolean
  stolpeAvstand: number

  // Trapp
  trapper: Trapp[]
  trappInntrinn: number
  trappOpptrinn: number
}

export const FORM_INFO: Record<TerrasseForm, { navn: string; beskrivelse: string }> = {
  rektangel: { navn: 'Rektangel', beskrivelse: 'Langs én husvegg' },
  lForm: { navn: 'L-form', beskrivelse: 'Rundt to sider' },
  uForm: { navn: 'U-form', beskrivelse: 'Hestesko – tre sider' },
}

export const GJERDE_INFO: Record<Gjerdetype, { navn: string; beskrivelse: string }> = {
  ingen: { navn: 'Ingen', beskrivelse: 'Ingen gjerde' },
  vannrett: { navn: 'Vannrett', beskrivelse: 'Vannrette bord' },
  loddrett: { navn: 'Loddrett', beskrivelse: 'Loddrette bord' },
  spiler: { navn: 'Spiler', beskrivelse: 'Spiler med luft' },
  hel: { navn: 'Hel', beskrivelse: 'Sammenhengende panel' },
}

export const SIDE_INFO: Record<Terrasseside, string> = {
  front: 'Front',
  bak: 'Bak',
  venstre: 'Venstre',
  høyre: 'Høyre',
}

export const BJELKE_INFO: Record<Bjelkedimensjon, { høyde: number; standardpris: number }> = {
  '48x98': { høyde: 98, standardpris: 40 },
  '48x148': { høyde: 148, standardpris: 55 },
  '48x198': { høyde: 198, standardpris: 65 },
}

export const DEFAULT_CONFIG: TerrasseConfig = {
  form: 'rektangel',
  lengde: 5.0,
  bredde: 3.0,
  hovedLengde: 5.0,
  hovedBredde: 3.0,
  fløyLengde: 2.5,
  fløyBredde: 2.0,
  ytreLengde: 3.0,
  ytreBredde: 4.0,
  armBredde: 1.0,
  bordbredde: 120,
  bordavstand: 3,
  bjelkeavstand: 600,
  skruerPerKryss: 2,
  bjelkeDimensjon: '48x148',
  svinnProsent: 10,
  prisBordPrLm: 17,
  prisBjelkePrLm: 55,
  prisSkrue: 3,
  prisGjerdeBord: 17,
  prisLekt: 14,
  prisStolpe: 89,
  gjerdeType: 'ingen',
  gjerdeHøyde: 0.9,
  gjerdePåAlleSider: true,
  stolpeAvstand: 2.0,
  trapper: [],
  trappInntrinn: 0.3,
  trappOpptrinn: 0.18,
}

export interface BeregnetResultat {
  areal: number
  arealFormattert: string

  bordAntall: number
  bordLøpemeter: number
  bordFormattert: string
  bordKostnad: number

  bjelkeAntall: number
  bjelkeLøpemeter: number
  bjelkeFormattert: string
  bjelkeKostnad: number
  tverrBjelkeAntall: number
  tverrBjelkeLøpemeter: number
  sideBjelkeAntall: number
  sideBjelkeLøpemeter: number

  skrueAntall: number
  skrueFormattert: string
  skrueKostnad: number

  gjerdeBordAntall?: number
  gjerdeStolper?: number
  gjerdeLekt?: number
  gjerdeFormattert?: string
  gjerdeKostnad?: number

  trappTrinnAntall?: number
  trappFormattert?: string
  trappKostnad?: number

  svinnProsent: number
  svinnKostnad: number

  totalKostnad: number
}

export interface Rekt {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

const fmt1 = (v: number) => v.toFixed(1)

// ── Geometri ────────────────────────────────────────────────────────────────

export function normalizedDimensions(c: TerrasseConfig): Size {
  switch (c.form) {
    case 'rektangel':
      return { width: c.bredde, height: c.lengde }
    case 'lForm':
      return { width: c.hovedBredde + c.fløyBredde, height: c.hovedLengde }
    case 'uForm':
      return { width: c.ytreBredde, height: c.ytreLengde }
  }
}

/** Terrasseformen dekomponert til aksejusterte rektangler (modellkoordinater). */
export function modellRekter(c: TerrasseConfig): Rekt[] {
  switch (c.form) {
    case 'rektangel':
      return [{ x: 0, y: 0, width: c.bredde, height: c.lengde }]
    case 'lForm':
      return [
        { x: 0, y: 0, width: c.hovedBredde, height: c.hovedLengde },
        { x: c.hovedBredde, y: c.hovedLengde - c.fløyLengde, width: c.fløyBredde, height: c.fløyLengde },
      ]
    case 'uForm': {
      const w = c.ytreBredde
      const h = c.ytreLengde
      const a = c.armBredde
      return [
        { x: 0, y: 0, width: w, height: a },
        { x: 0, y: a, width: a, height: h - a },
        { x: w - a, y: a, width: a, height: h - a },
      ]
    }
  }
}

/** Ytterkontur (polygon) i modellkoordinater – brukes til gjerde/rekkverk. */
export function formOutline(c: TerrasseConfig): Array<[number, number]> {
  switch (c.form) {
    case 'rektangel':
      return [
        [0, 0],
        [c.bredde, 0],
        [c.bredde, c.lengde],
        [0, c.lengde],
      ]
    case 'lForm': {
      const w1 = c.hovedBredde
      const h1 = c.hovedLengde
      const w2 = c.fløyBredde
      const h2 = c.fløyLengde
      return [
        [0, 0],
        [w1, 0],
        [w1, h1 - h2],
        [w1 + w2, h1 - h2],
        [w1 + w2, h1],
        [0, h1],
      ]
    }
    case 'uForm': {
      const w = c.ytreBredde
      const h = c.ytreLengde
      const a = c.armBredde
      return [
        [0, 0],
        [w, 0],
        [w, h],
        [w - a, h],
        [w - a, a],
        [a, a],
        [a, h],
        [0, h],
      ]
    }
  }
}

/** Trappens fotavtrykk i modellkoordinater (rektangel utenfor terrassekanten). */
export function trappRektModell(c: TerrasseConfig, trapp: Trapp, size: Size): Rekt {
  const dybde = Math.max(0.1, trapp.antallTrinn * c.trappInntrinn)
  const w = size.width
  const h = size.height
  const p = Math.min(Math.max(trapp.posisjon, 0), 1)
  switch (trapp.side) {
    case 'front': {
      const x = (w - trapp.bredde) * p
      return { x, y: h, width: trapp.bredde, height: dybde }
    }
    case 'bak': {
      const x = (w - trapp.bredde) * p
      return { x, y: -dybde, width: trapp.bredde, height: dybde }
    }
    case 'venstre': {
      const y = (h - trapp.bredde) * p
      return { x: -dybde, y, width: dybde, height: trapp.bredde }
    }
    case 'høyre': {
      const y = (h - trapp.bredde) * p
      return { x: w, y, width: dybde, height: trapp.bredde }
    }
  }
}

// ── Beregning ───────────────────────────────────────────────────────────────

function beregnAreal(c: TerrasseConfig): number {
  switch (c.form) {
    case 'rektangel':
      return c.lengde * c.bredde
    case 'lForm':
      return c.hovedLengde * c.hovedBredde + c.fløyLengde * c.fløyBredde
    case 'uForm':
      return c.ytreLengde * c.ytreBredde - (c.ytreLengde - 2 * c.armBredde) * (c.ytreBredde - c.armBredde)
  }
}

function beregnOmkrets(c: TerrasseConfig): number {
  switch (c.form) {
    case 'rektangel':
      return 2 * (c.lengde + c.bredde)
    case 'lForm':
      return 2 * (c.hovedLengde + c.hovedBredde + c.fløyBredde)
    case 'uForm':
      return c.ytreLengde + 2 * c.ytreBredde + (c.ytreLengde - 2 * c.armBredde)
  }
}

export function beregn(c: TerrasseConfig): BeregnetResultat {
  const areal = beregnAreal(c)
  const omkrets = beregnOmkrets(c)
  const effBoardB = (c.bordbredde + c.bordavstand) / 1000
  const dj = Math.max(0.1, c.bjelkeavstand / 1000)

  // Summer materialer per delrektangel slik at L- og U-form (og kantbjelker) blir
  // korrekt – stemmer overens med 3D-modellen.
  const rekter = modellRekter(c)
  let antallBord = 0
  let bordLøpemeter = 0
  let tverrBjelkeAntall = 0
  let tverrBjelkeLøpemeter = 0
  let sideBjelkeAntall = 0
  let sideBjelkeLøpemeter = 0
  let skrueAntall = 0

  for (const r of rekter) {
    const boardsAcross = Math.max(1, Math.ceil(r.width / effBoardB))
    antallBord += boardsAcross
    bordLøpemeter += boardsAcross * r.height

    const joists = Math.floor(r.height / dj) + 1 // tverrgående bjelker
    tverrBjelkeAntall += joists
    tverrBjelkeLøpemeter += joists * r.width

    sideBjelkeAntall += 2 // kantbjelker langs hver langside
    sideBjelkeLøpemeter += 2 * r.height

    skrueAntall += boardsAcross * joists * Math.round(c.skruerPerKryss)
  }

  // Kapp og svinn – legg margin på det du faktisk bestiller (løpemeter av kappet
  // trevirke). Antall bord/bjelker er konstruksjonsbestemt og holdes eksakt;
  // skruer og stolper kjøpes i enheter og påvirkes ikke av kapp.
  const svinn = 1 + Math.max(0, c.svinnProsent) / 100
  bordLøpemeter *= svinn
  tverrBjelkeLøpemeter *= svinn
  sideBjelkeLøpemeter *= svinn

  const antallBjelker = tverrBjelkeAntall + sideBjelkeAntall
  const bjelkeLøpemeter = tverrBjelkeLøpemeter + sideBjelkeLøpemeter

  const bordKostnad = bordLøpemeter * c.prisBordPrLm
  const bjelkeKostnad = bjelkeLøpemeter * c.prisBjelkePrLm
  const skrueKostnad = skrueAntall * c.prisSkrue
  let svinnGrunnlag = bordKostnad + bjelkeKostnad

  // Gjerde
  const gjerdeLengde = c.gjerdePåAlleSider ? omkrets : omkrets / 2
  let gjerdeBordAntall: number | undefined
  let gjerdeStolper: number | undefined
  let gjerdeLekt: number | undefined
  let gjerdeFormattert: string | undefined
  let gjerdeKostnad: number | undefined

  if (c.gjerdeType !== 'ingen') {
    gjerdeStolper = Math.max(4, Math.ceil(gjerdeLengde / c.stolpeAvstand) + 1)

    switch (c.gjerdeType) {
      case 'vannrett': {
        const rader = Math.max(1, Math.ceil(c.gjerdeHøyde / 0.12))
        gjerdeBordAntall = rader * Math.ceil(gjerdeLengde / effBoardB)
        break
      }
      case 'loddrett':
        gjerdeBordAntall = Math.ceil(gjerdeLengde / (c.bordbredde / 1000))
        break
      case 'spiler':
        gjerdeBordAntall = Math.ceil(gjerdeLengde / 0.1)
        break
      case 'hel':
        gjerdeBordAntall = Math.ceil(gjerdeLengde / 1.8) * Math.ceil(c.gjerdeHøyde / 1.8)
        break
    }

    const lektRader = (() => {
      switch (c.gjerdeType) {
        case 'vannrett':
          return Math.max(1, Math.ceil(c.gjerdeHøyde / 0.6))
        default:
          return 2
      }
    })()

    // Kapp og svinn på gjerdebord (kappes til lengde) og lekt (løpemeter)
    gjerdeBordAntall = Math.ceil((gjerdeBordAntall ?? 0) * svinn)
    const lektLøpemeter = lektRader * gjerdeLengde * svinn
    gjerdeLekt = lektLøpemeter
    gjerdeFormattert = `${GJERDE_INFO[c.gjerdeType].beskrivelse}: ${gjerdeBordAntall} bord, ${fmt1(lektLøpemeter)} lm lekt, ${gjerdeStolper ?? 0} stolper`
    const gjerdeBordKostnad = gjerdeBordAntall * c.prisGjerdeBord
    const gjerdeLektKostnad = lektLøpemeter * c.prisLekt
    gjerdeKostnad = gjerdeBordKostnad + gjerdeLektKostnad + (gjerdeStolper ?? 0) * c.prisStolpe
    svinnGrunnlag += gjerdeBordKostnad + gjerdeLektKostnad
  }

  // Trapp
  let trappTrinnAntall: number | undefined
  let trappFormattert: string | undefined
  let trappKostnad: number | undefined

  if (c.trapper.length > 0) {
    const totalTrinn = c.trapper.reduce((sum, t) => sum + t.antallTrinn, 0)
    trappTrinnAntall = totalTrinn
    if (c.trapper.length === 1) {
      const t = c.trapper[0]
      trappFormattert = `${t.antallTrinn} trinn, ${fmt1(t.bredde)}m bredde (${SIDE_INFO[t.side].toLowerCase()})`
    } else {
      trappFormattert = `${c.trapper.length} trapper, ${totalTrinn} trinn totalt`
    }
    trappKostnad = totalTrinn * 500
  }

  // Hvor mye av kostnaden som skyldes kapp og svinn (allerede innbakt i tallene over)
  const svinnKostnad = svinn > 1 ? svinnGrunnlag * ((svinn - 1) / svinn) : 0

  const totalKostnad =
    bordKostnad + bjelkeKostnad + skrueKostnad + (gjerdeKostnad ?? 0) + (trappKostnad ?? 0)

  return {
    areal,
    arealFormattert: `${areal.toFixed(2)} m²`,
    bordAntall: antallBord,
    bordLøpemeter,
    bordFormattert: `${antallBord} bord · ${c.bordbredde}×28 mm`,
    bordKostnad,
    bjelkeAntall: antallBjelker,
    bjelkeLøpemeter,
    bjelkeFormattert: `${tverrBjelkeAntall} tverrbjelker + ${sideBjelkeAntall} kantbjelker (${c.bjelkeDimensjon.replace('x', '×')})`,
    bjelkeKostnad,
    tverrBjelkeAntall,
    tverrBjelkeLøpemeter,
    sideBjelkeAntall,
    sideBjelkeLøpemeter,
    skrueAntall,
    skrueFormattert: `${skrueAntall} stk · ${Math.round(c.skruerPerKryss)} per kryss`,
    skrueKostnad,
    gjerdeBordAntall,
    gjerdeStolper,
    gjerdeLekt,
    gjerdeFormattert,
    gjerdeKostnad,
    trappTrinnAntall,
    trappFormattert,
    trappKostnad,
    svinnProsent: c.svinnProsent,
    svinnKostnad,
    totalKostnad,
  }
}

export const formatKr = (v: number) => Math.round(v).toLocaleString('nb-NO') + ',-'

// Målefelt per form: [key, label, min, max, step, hjelpetekst?]
export type FieldKey = keyof TerrasseConfig
export type MåleFelt = [FieldKey, string, number, number, number, string?]

export const MÅLEFELT: Record<TerrasseForm, MåleFelt[]> = {
  rektangel: [
    ['lengde', 'Lengde', 1, 30, 0.5],
    ['bredde', 'Bredde', 1, 30, 0.5],
  ],
  lForm: [
    ['hovedLengde', 'Hovedlengde', 1, 30, 0.5],
    ['hovedBredde', 'Hovedbredde', 1, 30, 0.5],
    ['fløyLengde', 'Fløylengde', 1, 30, 0.5],
    ['fløyBredde', 'Fløybredde', 1, 30, 0.5],
  ],
  uForm: [
    ['ytreLengde', 'Ytre lengde', 1, 30, 0.5, 'Total lengde på U-en'],
    ['ytreBredde', 'Ytre bredde', 1, 30, 0.5, 'Total bredde på U-en'],
    ['armBredde', 'Armbredde', 0.5, 5, 0.5, 'Bredde på hver arm'],
  ],
}

export const ALLE_FORMER: TerrasseForm[] = ['rektangel', 'lForm', 'uForm']
export const ALLE_GJERDETYPER: Gjerdetype[] = ['ingen', 'vannrett', 'loddrett', 'spiler']
export const ALLE_SIDER: Terrasseside[] = ['front', 'bak', 'venstre', 'høyre']
export const ALLE_BJELKEDIM: Bjelkedimensjon[] = ['48x98', '48x148', '48x198']

let trappCounter = 0
export function nyTrapp(): Trapp {
  trappCounter += 1
  return {
    id: `trapp-${trappCounter}-${trappCounter * 7919}`,
    side: 'front',
    posisjon: 0.5,
    bredde: 1.0,
    antallTrinn: 3,
  }
}

// ── Ferdige oppsett (presets) ─────────────────────────────────────────────────
// Startpunkter brukeren kan velge for å komme raskt i gang. Hvert oppsett er en
// delkonfigurasjon som flettes inn i DEFAULT_CONFIG; trapper angis uten id.

export interface TerrassePreset {
  id: string
  navn: string
  beskrivelse: string
  config: Partial<Omit<TerrasseConfig, 'trapper'>> & { trapper?: Omit<Trapp, 'id'>[] }
}

export const TERRASSE_PRESETS: TerrassePreset[] = [
  {
    id: 'liten-uteplass',
    navn: 'Liten uteplass',
    beskrivelse: '3 × 3 m – kompakt sittehjørne',
    config: {
      form: 'rektangel',
      lengde: 3,
      bredde: 3,
      gjerdeType: 'ingen',
      trapper: [{ side: 'front', posisjon: 0.5, bredde: 1.0, antallTrinn: 2 }],
    },
  },
  {
    id: 'klassisk-terrasse',
    navn: 'Klassisk terrasse',
    beskrivelse: '5 × 3 m – rekkverk langs ytterkant',
    config: {
      form: 'rektangel',
      lengde: 5,
      bredde: 3,
      gjerdeType: 'spiler',
      gjerdeHøyde: 0.9,
      gjerdePåAlleSider: false,
      trapper: [{ side: 'front', posisjon: 0.5, bredde: 1.2, antallTrinn: 3 }],
    },
  },
  {
    id: 'familieterrasse',
    navn: 'Stor familieterrasse',
    beskrivelse: '7 × 4 m – rekkverk rundt, bred trapp',
    config: {
      form: 'rektangel',
      lengde: 7,
      bredde: 4,
      bjelkeDimensjon: '48x198',
      gjerdeType: 'spiler',
      gjerdeHøyde: 0.9,
      gjerdePåAlleSider: true,
      trapper: [{ side: 'front', posisjon: 0.5, bredde: 2.0, antallTrinn: 4 }],
    },
  },
  {
    id: 'hjorneterrasse',
    navn: 'Hjørneterrasse',
    beskrivelse: 'L-form rundt to vegger',
    config: {
      form: 'lForm',
      hovedLengde: 6,
      hovedBredde: 3,
      fløyLengde: 3,
      fløyBredde: 2.5,
      gjerdeType: 'loddrett',
      gjerdeHøyde: 0.9,
      gjerdePåAlleSider: false,
      trapper: [{ side: 'front', posisjon: 0.7, bredde: 1.2, antallTrinn: 3 }],
    },
  },
  {
    id: 'hesteskoterrasse',
    navn: 'Hesteskoterrasse',
    beskrivelse: 'U-form rundt tre vegger',
    config: {
      form: 'uForm',
      ytreLengde: 6,
      ytreBredde: 7,
      armBredde: 2,
      gjerdeType: 'spiler',
      gjerdeHøyde: 0.9,
      gjerdePåAlleSider: false,
      trapper: [{ side: 'høyre', posisjon: 0.8, bredde: 1.4, antallTrinn: 3 }],
    },
  },
]

/** Bygg en fullstendig konfigurasjon fra et oppsett (stabile trapp-id-er). */
export function byggPresetConfig(preset: TerrassePreset): TerrasseConfig {
  const { trapper, ...rest } = preset.config
  return {
    ...DEFAULT_CONFIG,
    ...rest,
    trapper: (trapper ?? []).map((t, i) => ({ id: `${preset.id}-trapp-${i}`, ...t })),
  }
}
