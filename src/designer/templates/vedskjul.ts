import type { ProductTemplate } from '../types'
import type { PlanUtvidelser } from '../plan-typer'
import { treslagValg, fargeValg } from '../materials'
import { fmt, vedlast } from '../laster'
import { basisInn, FALL_VALG, FELLES_PARTS, GULV_VALG, KLEDNING_VALG, MONE_VALG, smahusMetoder, TAK_DIMENSJONER, TAKTYPE_VALG, type SmahusConfig } from './smahus/template'
import type { ApningInn } from './smahus/modell'

/**
 * Vedskjul – stenderverk på punktfundament med 0–3 dører i fronten og
 * bærende skillevegger mellom vedrommene. Spaltekledning, luftet gulv og
 * åpne, nettede sperrefelt gir gjennomlufting så veden tørker.
 * All geometri/statikk kommer fra den felles småhus-modellen (`smahus/`).
 */
export interface VedskjulConfig extends SmahusConfig {
  dorer: string // '0' (åpen front) | '1' | '2' | '3'
}

/** Antall dører som faktisk får plass (min. 60 cm åpning per dør). */
export function antallDorer(c: Pick<VedskjulConfig, 'dorer' | 'bredde'>): number {
  const n = parseInt(String(c.dorer ?? '2'), 10)
  const onsket = Number.isFinite(n) ? Math.min(3, Math.max(0, n)) : 2
  let k = onsket
  while (k > 1 && (c.bredde * 10) / k < 600 + 2 * 96 + 72) k--
  return k
}

export function tilInn(c: VedskjulConfig) {
  const b = basisInn(c)
  const n = antallDorer(c)
  const apninger: ApningInn[] = []
  const skillevegger: number[] = []
  if (n === 0) apninger.push({ side: 'front', navn: 'Åpning', full: true, bunn: 0, topp: 5000, terskel: false, blad: null, splitt: true })
  else
    for (let i = 0; i < n; i++) {
      apninger.push({ side: 'front', navn: n > 1 ? `Dør ${i + 1}` : 'Dør', fag: { i, n }, bredde: 1000, bunn: 0, topp: 5000, terskel: false, blad: 'dor', hengsel: i % 2 === 0 ? 'venstre' : 'hoyre', bladSpalte: 12 })
      if (i > 0) skillevegger.push(-b.B / 2 + (i * b.B) / n)
    }
  const stabel = Math.max(0.5, b.H / 1000 - 0.2)
  return {
    ...b,
    produkt: 'vedskjul',
    spalte: 20,
    dekkeSprekk: 10,
    fundSynlig: 150,
    bruk: 'bod' as const,
    lagerKN: vedlast(stabel),
    apninger,
    skillevegger,
    utstyr: { ved: c.visVed !== false },
    config: c,
    lufting: true,
  }
}

const metoder = smahusMetoder<VedskjulConfig>({
  produktNavn: 'Vedskjul',
  tilInn,
  raad: (m, c) => [
    'Veden tørker av luft, ikke sol: hold spaltekledningen åpen (ikke tett den igjen), og la 5–10 cm luft mellom vedstabelen og veggen.',
    `Gulvet er dimensjonert for stablet ved ${fmt(m.inn.lagerKN ?? 0, 1)} kN/m² (≈ ${fmt((m.inn.lagerKN ?? 0) / 5, 1)} m stabelhøyde) – det tåler fullt vedrom.`,
    'Stable veden med barken opp og kappflaten mot spaltene. Fersk ved trenger én sommer – stable den gjerne ute først.',
    antallDorer(c) === 0 ? 'Åpen front: plasser vedskjulet med åpningen bort fra rådende vær-/slagregnsretning.' : 'Dørene har spaltebord og Z-skråbånd. Heng dem slik at de slår ut og kan låses åpne i tørkesesongen.',
  ],
  ekstraSteg: () => [],
  arbeidstimer: (c) => {
    const area = (c.bredde * c.dybde) / 10000
    const sizeN = Math.min(1, Math.max(0, (area - 0.6) / (16 - 0.6)))
    let t = 16 + sizeN * 48
    if (c.taktype === 'valmtak') t += 12
    else if (c.taktype === 'saltak') t += 6
    t += Math.max(0, antallDorer(c) - 1) * 4
    return Math.round(Math.min(80, Math.max(16, t)))
  },
})

export const vedskjul: ProductTemplate<VedskjulConfig> & PlanUtvidelser<VedskjulConfig> = {
  id: 'vedskjul',
  navn: 'Vedskjul',
  ikon: 'faFireBurner',
  beskrivelse: 'Tegn vedskjulet i 3D – luftet spaltekledning, dører og skillevegger, dimensjonert for snølast og full vedstabel.',
  seoBeskrivelse: 'Tegn vedskjulet i 3D – luftet spaltekledning, dører og skillevegger. Få materialliste, prisestimat og byggeplan for snølast og full vedstabel.',
  bilde: '/images/products/vedskjul-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  leveranser: ['plan'],
  defaultConfig: {
    bredde: 360,
    dybde: 150,
    hoyde: 200,
    gulvbord: '28x120',
    kledningsbord: 'lekt',
    taktype: 'pulttak',
    takvinkel: 10,
    takutstikk: 25,
    takretning: 'bak',
    moneretning: 'bredde',
    takpapp: true,
    dorer: '2',
    treslag: 'impregnert',
    farge: 'morkegra',
    visVed: true,
  },
  presets: [
    {
      id: 'pulttak-360',
      navn: 'Pulttak 360 cm',
      beskrivelse: 'To vedrom, moderne spiler',
      config: { bredde: 360, dybde: 150, hoyde: 200, taktype: 'pulttak', takretning: 'bak', takvinkel: 10, takutstikk: 25, takpapp: true, kledningsbord: 'lekt', dorer: '2', treslag: 'impregnert', farge: 'morkegra' },
    },
    {
      id: 'apen-300',
      navn: 'Åpent vedskjul 300 cm',
      beskrivelse: 'Åpen front, pulttak bakover',
      config: { bredde: 300, dybde: 120, hoyde: 190, taktype: 'pulttak', takretning: 'bak', takvinkel: 12, takutstikk: 30, takpapp: true, kledningsbord: '19x98', dorer: '0', treslag: 'impregnert', farge: 'brun' },
    },
    {
      id: 'saltak-300',
      navn: 'Saltak 300 cm',
      beskrivelse: 'Klassisk, gavl mot front',
      config: { bredde: 300, dybde: 200, hoyde: 190, taktype: 'saltak', moneretning: 'dybde', takvinkel: 30, takutstikk: 25, takpapp: true, kledningsbord: '19x98', dorer: '2', treslag: 'gran', farge: 'sort' },
    },
    {
      id: 'valmtak-420',
      navn: 'Valmtak 420 cm',
      beskrivelse: 'Tre vedrom i lerk',
      config: { bredde: 420, dybde: 200, hoyde: 200, taktype: 'valmtak', takvinkel: 22.5, takutstikk: 25, takpapp: true, kledningsbord: 'lekt', dorer: '3', treslag: 'lerk', farge: 'ubehandlet' },
    },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 120, max: 500, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 80, max: 300, step: 5, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 160, max: 240, step: 5, axis: 'y' },
    ...TAK_DIMENSJONER,
  ],
  alternativer: [
    {
      key: 'dorer',
      label: 'Front',
      choices: [
        { id: '0', label: 'Åpen' },
        { id: '1', label: '1 dør' },
        { id: '2', label: '2 dører' },
        { id: '3', label: '3 dører' },
      ],
    },
    TAKTYPE_VALG,
    FALL_VALG,
    MONE_VALG,
    KLEDNING_VALG,
    GULV_VALG,
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  valg: [
    { key: 'takpapp', label: 'Takpapp', note: 'To-lags takpapp på 18 mm kryssfiner' },
    { key: 'visVed', label: 'Vis vedstabel', note: 'Kun illustrasjon' },
  ],
  parts: [...FELLES_PARTS, { key: 'dor', label: 'Dører' }, { key: 'bins', label: 'Vedstabel' }],
  ...metoder,
}
