/**
 * Sentral prisliste for designverktøyet. Alle produkter/templater bruker
 * disse ca-prisene som grunnlag for materialliste og kostnad. Prisene er
 * veiledende (hentet fra norske byggevarehus, juli 2026) og kan justeres av
 * kunden når butikken deres har andre priser. Objektet er bevisst mutbart slik
 * at UI-et kan endre en pris live; templatene leser gjeldende verdi.
 *
 * Treslag-faktor (impregnert/gran/lerk/kebony) ligger i materials.ts og
 * multipliseres på trevirke-postene.
 */

export type PrisEnhet = 'lm' | 'stk' | 'rull' | 'm²'

export interface PrisPost {
  id: string
  navn: string
  enhet: PrisEnhet
  pris: number // NOK per enhet (impregnert som basis)
}

export const PRISER: Record<string, PrisPost> = {
  'bord-21x98': { id: 'bord-21x98', navn: 'Kledningsbord 21×98 mm', enhet: 'lm', pris: 15 },
  'bord-28x120': { id: 'bord-28x120', navn: 'Kledningsbord 28×120 mm', enhet: 'lm', pris: 20 },
  'bord-19x98': { id: 'bord-19x98', navn: 'Kledning 19×98 mm', enhet: 'lm', pris: 17 },
  'bord-19x148': { id: 'bord-19x148', navn: 'Kledning 19×148 mm', enhet: 'lm', pris: 25 },
  'stolpe-23x48': { id: 'stolpe-23x48', navn: 'Lekt 23×48 mm', enhet: 'lm', pris: 9 },
  'lekt-11x36': { id: 'lekt-11x36', navn: 'Lekt 11×36 mm', enhet: 'lm', pris: 5 },
  'lekt-23x48': { id: 'lekt-23x48', navn: 'Lekt 23×48 mm', enhet: 'lm', pris: 9 },
  'lekt-36x63': { id: 'lekt-36x63', navn: 'Lekt 36×63 mm', enhet: 'lm', pris: 16 },
  'stolpe-36x48': { id: 'stolpe-36x48', navn: 'Stolpe 36×48 mm', enhet: 'lm', pris: 12 },
  'stolpe-48x48': { id: 'stolpe-48x48', navn: 'Stolpe 48×48 mm', enhet: 'lm', pris: 15 },
  'stolpe-48x98': { id: 'stolpe-48x98', navn: 'Stolpe 48×98 mm', enhet: 'lm', pris: 22 },
  'espalier-28x48': { id: 'espalier-28x48', navn: 'Espalierspile 28×48 mm', enhet: 'lm', pris: 12 },
  'spile-28x48': { id: 'spile-28x48', navn: 'Spile 28×48 mm', enhet: 'lm', pris: 12 },
  'spile-34x48': { id: 'spile-34x48', navn: 'Spile 34×48 mm (forsterket)', enhet: 'lm', pris: 15 },
  skrue: { id: 'skrue', navn: 'Skrue rustfri A4', enhet: 'stk', pris: 1.5 },
  trelim: { id: 'trelim', navn: 'Trelim utendørs (D4)', enhet: 'stk', pris: 89 },
  'skrue-6x80': { id: 'skrue-6x80', navn: 'Treskrue 6 × 80 mm (vegg)', enhet: 'stk', pris: 4 },
  fiberduk: { id: 'fiberduk', navn: 'Fiberduk', enhet: 'rull', pris: 149 },
  takpapp: { id: 'takpapp', navn: 'Takpapp', enhet: 'm²', pris: 79 },
  // Carport: stolper, dragere/spær (48-serien), taktekke pr. m², sutak og stolpesko.
  'stolpe-98x98': { id: 'stolpe-98x98', navn: 'Stolpe 98×98 mm', enhet: 'lm', pris: 75 },
  'stolpe-148x148': { id: 'stolpe-148x148', navn: 'Stolpe 148×148 mm', enhet: 'lm', pris: 135 },
  'bjelke-48x98': { id: 'bjelke-48x98', navn: 'Bjelke 48×98 mm', enhet: 'lm', pris: 40 },
  'bjelke-48x148': { id: 'bjelke-48x148', navn: 'Bjelke 48×148 mm', enhet: 'lm', pris: 55 },
  'terrassebord-28x120': { id: 'terrassebord-28x120', navn: 'Terrassebord 28×120 mm', enhet: 'lm', pris: 30 },
  trappevange: { id: 'trappevange', navn: 'Trappevange (ferdig utfrest)', enhet: 'stk', pris: 349 },
  'bjelke-48x198': { id: 'bjelke-48x198', navn: 'Bjelke 48×198 mm', enhet: 'lm', pris: 65 },
  'bjelke-48x223': { id: 'bjelke-48x223', navn: 'Bjelke 48×223 mm', enhet: 'lm', pris: 78 },
  'taktekke-stalplater': { id: 'taktekke-stalplater', navn: 'Taktekke stålplater', enhet: 'm²', pris: 180 },
  'taktekke-polykarbonat': { id: 'taktekke-polykarbonat', navn: 'Taktekke polykarbonat', enhet: 'm²', pris: 320 },
  'taktekke-takpapp': { id: 'taktekke-takpapp', navn: 'Taktekke takpapp', enhet: 'm²', pris: 150 },
  'taktekke-shingel': { id: 'taktekke-shingel', navn: 'Taktekke shingel', enhet: 'm²', pris: 230 },
  sutak: { id: 'sutak', navn: 'Sutak / undertak', enhet: 'm²', pris: 95 },
  'kryssfiner-18': { id: 'kryssfiner-18', navn: 'Takplate 18 mm kryssfiner', enhet: 'm²', pris: 189 },
  stolpesko: { id: 'stolpesko', navn: 'Stolpesko (justerbar)', enhet: 'stk', pris: 149 },
  vinkelbeslag: { id: 'vinkelbeslag', navn: 'Sperrebeslag / vinkelbeslag (forsinket)', enhet: 'stk', pris: 19 },
  veggpanel: { id: 'veggpanel', navn: 'Veggpanel / kledning', enhet: 'm²', pris: 230 },
  akrylplate: { id: 'akrylplate', navn: 'Akrylplate (klar)', enhet: 'm²', pris: 450 },
  'stolpe-90x90': { id: 'stolpe-90x90', navn: 'Stolpe 90×90 mm', enhet: 'lm', pris: 70 },
  'taktekke-bord': { id: 'taktekke-bord', navn: 'Bordtak', enhet: 'm²', pris: 240 },
  'platting-dekke': { id: 'platting-dekke', navn: 'Platting (dekke + bjelkelag)', enhet: 'm²', pris: 480 },
  'benkeplate-tre': { id: 'benkeplate-tre', navn: 'Benkeplate heltre', enhet: 'lm', pris: 590 },
  'benkeplate-laminat': { id: 'benkeplate-laminat', navn: 'Benkeplate laminat', enhet: 'lm', pris: 390 },
  'benkeplate-rustfritt': { id: 'benkeplate-rustfritt', navn: 'Benkeplate rustfritt', enhet: 'lm', pris: 1290 },
  utslagsvask: { id: 'utslagsvask', navn: 'Utslagsvask + kran + avløp', enhet: 'stk', pris: 2490 },
  underskap: { id: 'underskap', navn: 'Underskap med dør', enhet: 'stk', pris: 2900 },
  sittebenk: { id: 'sittebenk', navn: 'Sittebenk', enhet: 'lm', pris: 690 },
  postkasse: { id: 'postkasse', navn: 'Postkasse', enhet: 'stk', pris: 690 },
}

export function prisFor(id: string): number {
  return PRISER[id]?.pris ?? 0
}

export function settPris(id: string, pris: number) {
  if (PRISER[id]) PRISER[id].pris = Math.max(0, pris)
}

/** Alle poster som liste (til redigerings-UI). */
export function alleprisposter(): PrisPost[] {
  return Object.values(PRISER)
}
