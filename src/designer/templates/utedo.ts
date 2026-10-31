import type { ProductTemplate } from '../types'
import type { PlanUtvidelser } from '../plan-typer'
import { treslagValg, fargeValg } from '../materials'
import { basisInn, FALL_VALG, FELLES_PARTS, GULV_VALG, KLEDNING_VALG, MONE_VALG, smahusMetoder, TAK_DIMENSJONER, TAKTYPE_VALG, type SmahusConfig } from './smahus/template'
import type { ApningInn } from './smahus/modell'

/**
 * Utedo – lite, luftet uthus med sittebenk, toalettsete, lufterør gjennom
 * taket og tømmeluke i bakveggen. Felles småhus-modell (`smahus/`) gir
 * stenderverk, tak, kledning, statikk, kappliste og tegninger.
 */
export interface UtedoConfig extends SmahusConfig {
  dorbredde: number // cm (60–90)
}

export function tilInn(c: UtedoConfig) {
  const b = basisInn(c)
  const dor = Math.max(600, Math.min(900, (typeof c.dorbredde === 'number' ? c.dorbredde : 70) * 10))
  const maksDor = b.B - 2 * (48 + 96) - 40
  const apninger: ApningInn[] = [{ side: 'front', navn: 'Dør', senter: 0, bredde: Math.min(dor, maksDor), bunn: 0, topp: 2000, terskel: true, blad: 'dor', hengsel: 'venstre', bladSpalte: 3 }]
  if (b.B >= 900) apninger.push({ side: 'bak', navn: 'Tømmeluke', senter: 0, bredde: Math.min(600, b.B - 2 * (48 + 96) - 100), bunn: 0, topp: 380, terskel: true, blad: 'luke', hengsel: 'topp', bladSpalte: 3 })
  return {
    ...b,
    produkt: 'utedo',
    spalte: 8,
    dekkeSprekk: 6,
    fundSynlig: 200,
    bruk: 'bod' as const,
    apninger,
    utstyr: { benk: true },
    config: c,
    lufting: true,
  }
}

const metoder = smahusMetoder<UtedoConfig>({
  produktNavn: 'Utedo',
  tilInn,
  raad: (m) => [
    'Lufting er alt i et utedo: insektnett i sperrefeltene gir tverrlufting under taket, og lufterøret (Ø110) fra beholderen opp over taket trekker lukt ut. Sørg for at røret går rett, uten vannlommer.',
    'Bruk en tett latrinebeholder eller et godkjent biologisk toalett. Utslipp av latrine/gråvann krever tillatelse fra kommunen (forurensningsforskriften) – ikke grav ned.',
    'Tømmeluken i bakveggen gjør det lett å bytte/tømme beholderen; benkefronten er skrudd så den også kan tas av.',
    `Strø (bark/torvstrø) etter hvert besøk reduserer lukt. Seteplaten er 18 mm kryssfiner – mal/lakk den, og avrund hullkanten.`,
    m.inn.kledning === 'lekt' || m.inn.kledning === '19x98' ? 'Spalte-/spilekledning gir innsyn på nært hold – vurder tømmermannskledning for et tettere utedo.' : 'Tømmermannskledningen er tett; luftingen skjer via nettet i takfoten og lufterøret.',
  ],
  ekstraSteg: (m) => [
    {
      trinn: 'kledning',
      tittel: 'Benk, sete og lufterør',
      tekst: `Skru benkelister 48 × 98 til stenderne i bak- og sideveggene med overkant ${450 - 18} mm over gulvet, og legg benkeremmen i fremkant. Skjær hull for toalettsetet i 18 mm kryssfiner (sjablong følger setet) og hull Ø120 for lufterøret, og skru seteplaten fast. Før lufterøret Ø110 fra beholderen rett opp mellom sperrene og ut gjennom taket med takmansjett, ca. 400 mm over takflaten. Benkefronten (19 × 98) skrus, så den kan tas av ved tømming.`,
      tidTimer: 3,
      advarsel: m.advarsler.some((a) => a.includes('lufterøret')) ? 'Lufterøret fikk ikke automatisk plass mellom sperrene – plasser det mellom to sperrer på stedet.' : undefined,
    },
  ],
})

export const utedo: ProductTemplate<UtedoConfig> & PlanUtvidelser<UtedoConfig> = {
  id: 'utedo',
  navn: 'Utedo',
  ikon: 'faToilet',
  bilde: '/images/products/utedo-3d.webp',
  beskrivelse: 'Tegn utedoen i 3D – med benk, toalettsete, lufterør, tømmeluke og lufting, dimensjonert for snølasten der du bor.',
  tilgjengelig: true,
  fraPris: 349,
  leveranser: ['plan'],
  defaultConfig: {
    bredde: 120,
    dybde: 130,
    hoyde: 210,
    gulvbord: '28x120',
    kledningsbord: '19x148',
    dorbredde: 70,
    taktype: 'pulttak',
    takvinkel: 12,
    takutstikk: 20,
    takretning: 'bak',
    moneretning: 'dybde',
    takpapp: true,
    treslag: 'impregnert',
    farge: 'morkegra',
  },
  presets: [
    {
      id: 'pulttak-120',
      navn: 'Pulttak 120 cm',
      beskrivelse: 'Moderne, tett tømmermannskledning',
      config: { bredde: 120, dybde: 130, hoyde: 210, taktype: 'pulttak', takretning: 'bak', takvinkel: 12, takutstikk: 20, takpapp: true, kledningsbord: '19x148', dorbredde: 70, treslag: 'impregnert', farge: 'morkegra' },
    },
    {
      id: 'saltak-130',
      navn: 'Saltak 130 cm',
      beskrivelse: 'Tradisjonelt, rødt og med gavl mot front',
      config: { bredde: 130, dybde: 140, hoyde: 200, taktype: 'saltak', moneretning: 'dybde', takvinkel: 35, takutstikk: 20, takpapp: true, kledningsbord: '19x148', dorbredde: 70, treslag: 'gran', farge: 'brun' },
    },
    {
      id: 'valmtak-140',
      navn: 'Valmtak 140 cm',
      beskrivelse: 'Lerk med spaltekledning',
      config: { bredde: 140, dybde: 140, hoyde: 210, taktype: 'valmtak', takvinkel: 27, takutstikk: 20, takpapp: true, kledningsbord: '19x98', dorbredde: 80, treslag: 'lerk', farge: 'ubehandlet' },
    },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 100, max: 180, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 110, max: 180, step: 5, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 190, max: 240, step: 5, axis: 'y' },
    { key: 'dorbredde', label: 'Dørbredde', min: 60, max: 90, step: 5, axis: 'x', handle: false },
    ...TAK_DIMENSJONER,
  ],
  alternativer: [TAKTYPE_VALG, FALL_VALG, MONE_VALG, KLEDNING_VALG, GULV_VALG],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  valg: [{ key: 'takpapp', label: 'Takpapp', note: 'To-lags takpapp på 18 mm kryssfiner' }],
  parts: [...FELLES_PARTS, { key: 'dor', label: 'Dør og luke' }, { key: 'benk', label: 'Benk og utstyr' }],
  ...metoder,
}
