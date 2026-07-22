/**
 * Priser og hvilke leveranser et kjøp låser opp. Serveren er autoritativ på
 * pris; klienten viser bare et estimat (se src/services/vippsService.ts).
 */

// Kjøpbare leveranser (SKU-er). Speiler `Vare` i src/types/designerProsjekt.ts,
// men `bundle` legges til som en «kjøpspakke».
export type Vare = 'plan' | 'soknad' | 'cnc' | 'bundle'

// Hvilke tilgangsflagg et kjøp låser opp. Byggeplan og byggesøknad-hefte selges
// hver for seg (byggesøknad er et betalt tillegg); `bundle` gir alt.
export const VARER_FOR_KJOP: Record<Vare, Array<'plan' | 'soknad' | 'cnc'>> = {
  plan: ['plan'],
  soknad: ['soknad'],
  cnc: ['cnc'],
  bundle: ['plan', 'soknad', 'cnc'],
}

// Pris (NOK) pr. leveranse pr. produkttype. Ytre nøkkel = templateId,
// indre = vare. Manglende verdi faller tilbake til DEFAULT_PRIS[vare].
const DEFAULT_PRIS: Record<Vare, number> = { plan: 299, soknad: 990, cnc: 399, bundle: 1490 }
// Byggeplan (`plan`) prises per produkt etter kompleksitet. Disse MÅ speile
// `fraPris` i hvert templat under src/designer/templates/ – det er beløpet
// kunden ser i designverktøyet. Nye templater uten oppføring her arver
// DEFAULT_PRIS.plan (299 kr).
const PRISER: Record<string, Partial<Record<Vare, number>>> = {
  plantekasse: { plan: 199 },
  pergola: { plan: 249 },
  terrasse: { plan: 349 },
  utekjokken: { plan: 349 },
  carport: { plan: 449 },
  varmepumpehus: { plan: 199 },
  soppelboder: { plan: 349 },
  vedskjul: { plan: 349 },
  postkassestativer: { plan: 249 },
  utedo: { plan: 349 },
}

export function normaliserVare(v: unknown): Vare {
  return v === 'soknad' || v === 'cnc' || v === 'bundle' ? v : 'plan'
}

export function prisFor(templateId: string, vare: Vare): number {
  return PRISER[templateId]?.[vare] ?? DEFAULT_PRIS[vare]
}

/** Har designet allerede alle leveransene som dette kjøpet gir? */
export function alleredeKjopt(kjopt: Record<string, boolean> | undefined, vare: Vare): boolean {
  return VARER_FOR_KJOP[vare].every((flag) => kjopt?.[flag] === true)
}
