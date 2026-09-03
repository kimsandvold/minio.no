import type { Timestamp } from 'firebase/firestore'

export type VippsStatus = 'none' | 'initiated' | 'paid' | 'failed'

/**
 * En kjøpbar leveranse (SKU) for et design. Hvert design kan låse opp disse
 * uavhengig av hverandre:
 *  - `plan`   → byggeplan-PDF (materialliste, kappliste, mål, montering)
 *  - `soknad` → søknadsklart tegningshefte (plan, fasader, snitt)
 *  - `cnc`    → maskinfiler (DXF/SVG) – kommer med Tier 2
 */
export type Vare = 'plan' | 'soknad' | 'cnc'

/** Hvilke leveranser som er betalt/låst opp for et design. */
export interface Kjopt {
  plan?: boolean
  soknad?: boolean
  cnc?: boolean
}

/**
 * Fryst kopi av designet slik det var da det ble kjøpt. Nedlasting av
 * byggeplan/søknad genereres alltid fra denne – ikke fra det redigerbare,
 * «levende» designet. Slik hindres at ett kjøp gir ubegrenset antall ulike
 * planer: endrer kunden målene etterpå, er de «utenfor planen» og må kjøpe på
 * nytt for en oppdatert plan, mens den kjøpte planen fortsatt kan lastes ned.
 */
export interface Frosset {
  /** Designvalgene som ble kjøpt (fryst). */
  config: Record<string, number | string | boolean>
  /** Materialoverstyringer som ble kjøpt (fryst). */
  overrides?: Record<string, { treslag: string; farge: string }>
  /** Hvilke leveranser frysningen dekker. */
  kjopt: Kjopt
  /** Når frysningen ble gjort (ved betaling). */
  kjoptAt?: Timestamp
}

/**
 * Hvilke `Vare`-flagg et kjøp låser opp. Byggeplan og byggesøknad-hefte selges
 * hver for seg (byggesøknad er et betalt tillegg til planen); `bundle` gir alt.
 */
export const VARER_FOR_KJOP: Record<Vare | 'bundle', Vare[]> = {
  plan: ['plan'],
  soknad: ['soknad'],
  cnc: ['cnc'],
  bundle: ['plan', 'soknad', 'cnc'],
}

/** Et lagret design fra det parametriske designverktøyet (Firestore). */
export interface DesignerProsjekt {
  id: string
  userId: string
  templateId: string
  navn: string
  /** Alle designvalg (mål, treslag, farge, tilvalg …). */
  config: Record<string, number | string | boolean>
  /** Per-del materialoverstyringer (paint bucket). */
  overrides?: Record<string, { treslag: string; farge: string }>
  /**
   * Bakoverkompatibelt totalflagg: sant når kunden har betalt for noe.
   * Ny, granulær tilgang ligger i `kjopt`. Beholdes for eldre design og
   * enkle «er dette betalt»-sjekker.
   */
  betalt: boolean
  /** Per-leveranse-tilgang (entitlements). Utelatt på eldre design. */
  kjopt?: Kjopt
  /** Fryst kopi av designet ved kjøp – kilden for nedlastet plan/søknad. */
  frosset?: Frosset
  /**
   * 6-sifret tilgangskode. Genereres på serveren ved kapret betaling
   * (api/_lib/kode.ts) og finnes derfor ikke på ubetalte design. Klienten kan
   * ikke skrive den – se firestore.rules.
   */
  tilgangskode?: string
  /** Vipps-betaling (forberedt – kobles til når merchant-nøkler finnes). */
  vipps?: { status: VippsStatus; orderId?: string; belop?: number; vare?: Vare }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/**
 * Normaliserer et design til hvilke leveranser som faktisk er låst opp.
 * Bakoverkompatibel: eldre design har kun `betalt: boolean` (som i den gamle
 * flyten låste opp både byggeplan og søknadshefte) og ingen `kjopt`.
 */
export function entitlements(p: { betalt?: boolean; kjopt?: Kjopt }): Kjopt {
  const k = p.kjopt ?? {}
  // Eldre design uten `kjopt`: `betalt` gjaldt plan + søknad.
  if (p.betalt && !p.kjopt) return { plan: true, soknad: true }
  return k
}

/** Har designet betalt tilgang til en bestemt leveranse? */
export function harTilgang(p: { betalt?: boolean; kjopt?: Kjopt }, vare: Vare): boolean {
  return entitlements(p)[vare] === true
}

/** Stabil, nøkkel-sortert streng av config + overrides for likhetssjekk. */
function konfigNokkel(
  config: Record<string, number | string | boolean>,
  overrides?: Record<string, { treslag: string; farge: string }>,
): string {
  const sortert = (o: Record<string, unknown>) =>
    Object.keys(o).sort().reduce<Record<string, unknown>>((a, k) => ((a[k] = o[k]), a), {})
  return JSON.stringify({ c: sortert(config), o: sortert(overrides ?? {}) })
}

/**
 * Er det levende designet fortsatt identisk med den kjøpte, fryste planen?
 * Brukes til å avgjøre om nedlasting er åpen: kun når kunden ikke har endret
 * noe siden kjøpet. Design uten frysning regnes som «på plan» (ingen kjøpt
 * plan å avvike fra).
 */
export function paaFrossenPlan(
  frosset: Frosset | undefined,
  config: Record<string, number | string | boolean>,
  overrides?: Record<string, { treslag: string; farge: string }>,
): boolean {
  if (!frosset) return true
  return konfigNokkel(config, overrides) === konfigNokkel(frosset.config, frosset.overrides)
}

/** Maks antall lagrede design per produkttype per bruker. */
export const MAKS_DESIGN_PER_TYPE = 2
