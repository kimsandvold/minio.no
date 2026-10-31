import type { ProductTemplate } from '../types'
import type { PlanUtvidelser } from '../plan-typer'
import { treslagValg, fargeValg } from '../materials'
import { basisInn, FALL_VALG, FELLES_PARTS, GULV_VALG, KLEDNING_VALG, MONE_VALG, smahusMetoder, TAK_DIMENSJONER, TAKTYPE_VALG, type SmahusConfig } from './smahus/template'
import type { ApningInn } from './smahus/modell'

/**
 * Søppelbod – åpen front for dunkene (overligger med mellomstolper ved behov),
 * valgfri åpning i bakveggen, luftet kledning. Felles småhus-modell (`smahus/`).
 */
export interface SoppelbodConfig extends SmahusConfig {
  bakvegapning: boolean
}

export function tilInn(c: SoppelbodConfig) {
  const b = basisInn(c)
  const apninger: ApningInn[] = [{ side: 'front', navn: 'Åpning', full: true, bunn: 0, topp: 1250, terskel: false, blad: null, splitt: true }]
  if (c.bakvegapning === true) apninger.push({ side: 'bak', navn: 'Lufteåpning', full: true, bunn: 1000, topp: 5000, terskel: true, blad: null, splitt: true })
  return {
    ...b,
    produkt: 'soppelbod',
    spalte: 12,
    dekkeSprekk: 6,
    fundSynlig: 100,
    bruk: 'bod' as const,
    apninger,
    utstyr: { dunker: true },
    config: c,
    lufting: true,
  }
}

const metoder = smahusMetoder<SoppelbodConfig>({
  produktNavn: 'Søppelbod',
  tilInn,
  raad: (m) => [
    'Dunkene trilles inn over et lavt gulv: legg en kort rampe (skråbord) eller heller i flukt foran åpningen, og kapp gulvbordene rett i front.',
    `Fronten er åpen; overliggeren ${m.apninger[0]?.dim.valgt.profil ?? ''} bærer taket${m.apninger.filter((o) => o.side === 'front').length > 1 ? ' og er delt med mellomstolper' : ''}. Ikke fjern bærestenderne i sidene.`,
    'Luftespalter i kledningen og nett i takfoten holder lukt og fukt nede. Vask gulvet med såpevann og la det tørke – terrassebordene drenerer.',
    'Står boden nærmere enn 1 m fra nabogrensen eller bolighuset? Sjekk kommunens regler – søppelbod kan ha egne plasskrav (renovasjonsforskrift).',
  ],
  arbeidstimer: (c) => {
    const area = (c.bredde * c.dybde) / 10000
    const sizeN = Math.min(1, Math.max(0, (area - 0.5) / (5.0 - 0.5)))
    let t = 12 + sizeN * 16
    if (c.taktype === 'valmtak') t += 5
    else if (c.taktype === 'saltak') t += 2.5
    if (c.bakvegapning) t += 1.5
    return Math.round(Math.min(35, Math.max(12, t)))
  },
})

export const soppelbod: ProductTemplate<SoppelbodConfig> & PlanUtvidelser<SoppelbodConfig> = {
  id: 'soppelboder',
  navn: 'Søppelbod',
  ikon: 'faDumpster',
  beskrivelse: 'Tegn søppelboden i 3D – åpen front for dunkene, luftet kledning og tak dimensjonert for snølasten der du bor.',
  bilde: '/images/products/soppelbod-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    bredde: 300,
    dybde: 90,
    hoyde: 160,
    gulvbord: '28x120',
    kledningsbord: 'lekt',
    taktype: 'valmtak',
    takvinkel: 22.5,
    takutstikk: 15,
    takretning: 'bak',
    moneretning: 'bredde',
    takpapp: true,
    bakvegapning: false,
    treslag: 'lerk',
    farge: 'ubehandlet',
  },
  presets: [
    {
      id: 'pulttak-300',
      navn: 'Pulttak 300 cm',
      beskrivelse: 'Moderne, mørk grå spaltekledning',
      config: { bredde: 300, dybde: 90, hoyde: 160, taktype: 'pulttak', takretning: 'bak', takvinkel: 10, takutstikk: 15, takpapp: true, kledningsbord: '19x98', bakvegapning: false, treslag: 'impregnert', farge: 'morkegra' },
    },
    {
      id: 'saltak-300',
      navn: 'Saltak 300 cm',
      beskrivelse: 'Klassisk, sort tømmermann',
      config: { bredde: 300, dybde: 90, hoyde: 160, taktype: 'saltak', moneretning: 'bredde', takvinkel: 27, takutstikk: 15, takpapp: true, kledningsbord: '19x148', bakvegapning: false, treslag: 'gran', farge: 'sort' },
    },
    {
      id: 'valmtak-300',
      navn: 'Valmtak 300 cm',
      beskrivelse: 'Lerk med spiler og lufting bak',
      config: { bredde: 300, dybde: 90, hoyde: 160, taktype: 'valmtak', takvinkel: 22.5, takutstikk: 15, takpapp: true, kledningsbord: 'lekt', bakvegapning: true, treslag: 'lerk', farge: 'ubehandlet' },
    },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 90, max: 400, step: 5, axis: 'x', markers: [150, 220, 300, 370] },
    { key: 'dybde', label: 'Dybde', min: 80, max: 150, step: 5, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 150, max: 220, step: 5, axis: 'y' },
    ...TAK_DIMENSJONER,
  ],
  alternativer: [TAKTYPE_VALG, FALL_VALG, MONE_VALG, KLEDNING_VALG, GULV_VALG],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  valg: [
    { key: 'takpapp', label: 'Takpapp', note: 'To-lags takpapp på 18 mm kryssfiner' },
    { key: 'bakvegapning', label: 'Lufteåpning i bakvegg', note: 'Full bredde fra 1 m over gulvet' },
  ],
  parts: [...FELLES_PARTS, { key: 'bins', label: 'Søppeldunker' }],
  ...metoder,
}
