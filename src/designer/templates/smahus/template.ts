/**
 * Felles template-oppsett for småhus (vedskjul, utedo, søppelbod). Hvert
 * produkt leverer bare sin config → `SmahusInput`, egne råd/monteringssteg og
 * UI-valg; alt annet (3D, materialliste, kappliste, tegninger, statikk,
 * byggeregler, bounds) kommer fra den samme modellen.
 */
import type * as THREE from 'three'
import type { Bom, BuildOptions, Bounds, Byggeregler, DesignConfig, DimensionSpec, KapplisteDel, OptionGroup, Tegning2D } from '../../types'
import type { Beregningsgrunnlag, MonteringSteg } from '../../plan-typer'
import { byggMesh } from './mesh'
import { beregningsgrunnlag, byggeregler, felleRaad, grenser, kappliste, materialliste, modellFor, monteringPlan, monteringTekst, tegninger } from './plan'
import type { Modell, SmahusInput } from './modell'

export interface SmahusConfig {
  bredde: number
  dybde: number
  hoyde: number
  gulvbord: string
  kledningsbord: string
  taktype: string
  takvinkel: number
  takutstikk: number
  takretning: string
  moneretning: string
  takpapp: boolean
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

export interface SmahusSpec<C extends SmahusConfig> {
  produktNavn: string
  tilInn: (c: C) => SmahusInput
  raad: (m: Modell, c: C) => string[]
  ekstraSteg?: (m: Modell, c: C) => MonteringSteg[]
  arbeidstimer?: (c: C) => number | undefined
}

/** Grunnleggende innstillinger felles for alle tre (mm). */
export function basisInn(c: SmahusConfig): Omit<SmahusInput, 'produkt' | 'spalte' | 'fundSynlig' | 'bruk' | 'apninger' | 'config' | 'lufting' | 'dekkeSprekk'> {
  const tall = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  const taktype = c.taktype === 'saltak' || c.taktype === 'valmtak' ? c.taktype : 'pulttak'
  return {
    B: Math.round(tall(c.bredde, 300) * 10),
    D: Math.round(tall(c.dybde, 200) * 10),
    H: Math.round(tall(c.hoyde, 200) * 10),
    taktype,
    vinkel: Math.max(3, Math.min(45, tall(c.takvinkel, 15))),
    utstikk: Math.max(80, Math.min(500, tall(c.takutstikk, 20) * 10)),
    retning: String(c.takretning ?? 'bak'),
    moneretning: String(c.moneretning ?? 'bredde'),
    takpapp: c.takpapp !== false,
    gulvbord: c.gulvbord === '21x98' ? '21x98' : '28x120',
    kledning: c.kledningsbord === '19x148' || c.kledningsbord === '19x98' ? c.kledningsbord : 'lekt',
  }
}

export function smahusMetoder<C extends SmahusConfig>(spec: SmahusSpec<C>) {
  const M = (c: C) => modellFor(spec.tilInn(c))
  const steg = (c: C) => {
    const m = M(c)
    return monteringPlan(m, spec.produktNavn, spec.ekstraSteg?.(m, c) ?? [])
  }
  return {
    beregn: (c: C): Bom => materialliste(M(c), c, spec.arbeidstimer?.(c)),
    kappliste: (c: C): KapplisteDel[] => kappliste(M(c)),
    tegning2D: (c: C): Tegning2D => tegninger(M(c)),
    soknadTegning: (c: C): Tegning2D => tegninger(M(c)),
    montering: (c: C): string[] => monteringTekst(steg(c)),
    monteringPlan: (c: C): MonteringSteg[] => steg(c),
    raad: (c: C): string[] => {
      const m = M(c)
      return [...spec.raad(m, c), ...felleRaad(m)]
    },
    byggeregler: (c: C): Byggeregler => byggeregler(M(c)),
    beregningsgrunnlag: (c: C): Beregningsgrunnlag => beregningsgrunnlag(M(c), `${spec.produktNavn} ${c.bredde} × ${c.dybde} cm`),
    buildMesh: (c: C, opts?: BuildOptions): THREE.Group => byggMesh(M(c), c, opts),
    bounds: (c: C): Bounds => grenser(M(c)),
  }
}

/** Felles UI-valg. */
export const TAK_DIMENSJONER: DimensionSpec[] = [
  { key: 'takvinkel', label: 'Takvinkel', min: 5, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false, markers: [10, 15, 22.5, 27, 30, 35, 45] },
  { key: 'takutstikk', label: 'Takutstikk (fra kledning)', min: 10, max: 40, step: 1, axis: 'y', handle: false, markers: [15, 20, 30] },
]

export const KLEDNING_VALG: OptionGroup = {
  key: 'kledningsbord',
  label: 'Kledning (vegg)',
  choices: [
    { id: '19x148', label: 'Tømmermann 19 × 148', note: 'Tett: underligger 19 × 148 + overligger 19 × 98' },
    { id: '19x98', label: 'Spaltekledning 19 × 98', note: 'Stående bord med luftespalte' },
    { id: 'lekt', label: 'Spilekledning 23 × 48', note: 'Moderne spiler med luft' },
  ],
}

export const GULV_VALG: OptionGroup = {
  key: 'gulvbord',
  label: 'Gulvbord',
  choices: [
    { id: '28x120', label: '28 × 120 mm', note: 'Bjelker c/c 600' },
    { id: '21x98', label: '21 × 98 mm', note: 'Bjelker c/c 450' },
  ],
}

export const TAKTYPE_VALG: OptionGroup = {
  key: 'taktype',
  label: 'Taktype',
  choices: [
    { id: 'pulttak', label: 'Pulttak', patch: { takvinkel: 10 } },
    { id: 'saltak', label: 'Saltak', patch: { takvinkel: 27 } },
    { id: 'valmtak', label: 'Valmtak', patch: { takvinkel: 22.5 } },
  ],
}

export const FALL_VALG: OptionGroup = {
  key: 'takretning',
  label: 'Fallretning',
  visibleWhen: (c) => c.taktype === 'pulttak',
  choices: [
    { id: 'bak', label: 'Bakover' },
    { id: 'front', label: 'Framover' },
    { id: 'venstre', label: 'Venstre' },
    { id: 'hoyre', label: 'Høyre' },
  ],
}

export const MONE_VALG: OptionGroup = {
  key: 'moneretning',
  label: 'Møneretning',
  visibleWhen: (c) => c.taktype === 'saltak',
  choices: [
    { id: 'bredde', label: 'Langs bredden', note: 'Gavler på sidene' },
    { id: 'dybde', label: 'Langs dybden', note: 'Gavl mot front' },
  ],
}

export const FELLES_PARTS = [
  { key: 'fundament', label: 'Fundament' },
  { key: 'konstruksjon', label: 'Reisverk og sperrer' },
  { key: 'gulv', label: 'Gulv' },
  { key: 'kledning', label: 'Kledning' },
  { key: 'tak', label: 'Tak og vindski' },
  { key: 'beslag', label: 'Beslag' },
]
