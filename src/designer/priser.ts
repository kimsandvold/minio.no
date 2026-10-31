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
  'stolpe-90x90': { id: 'stolpe-90x90', navn: 'Limtresøyle GL30c 90×90 mm', enhet: 'lm', pris: 150 },
  'taktekke-bord': { id: 'taktekke-bord', navn: 'Bordtak', enhet: 'm²', pris: 240 },
  'platting-dekke': { id: 'platting-dekke', navn: 'Platting (dekke + bjelkelag)', enhet: 'm²', pris: 480 },
  'benkeplate-tre': { id: 'benkeplate-tre', navn: 'Benkeplate heltre', enhet: 'lm', pris: 590 },
  'benkeplate-laminat': { id: 'benkeplate-laminat', navn: 'Benkeplate laminat', enhet: 'lm', pris: 390 },
  'benkeplate-rustfritt': { id: 'benkeplate-rustfritt', navn: 'Benkeplate rustfritt', enhet: 'lm', pris: 1290 },
  utslagsvask: { id: 'utslagsvask', navn: 'Utslagsvask + kran + avløp', enhet: 'stk', pris: 2490 },
  underskap: { id: 'underskap', navn: 'Underskap med dør', enhet: 'stk', pris: 2900 },
  sittebenk: { id: 'sittebenk', navn: 'Sittebenk', enhet: 'lm', pris: 690 },
  postkasse: { id: 'postkasse', navn: 'Postkasse', enhet: 'stk', pris: 690 },

  // ── Limtre GL30c (bjelker/dragere/søyler) ──────────────────────────
  // Veiledende utsalgspris hos norske byggevarehus (Byggmax/Maxbo/Obs Bygg),
  // 2026-nivå. Limtre prises i praksis etter volum: ca. 16 000 kr/m³ for
  // standard GL30c-bjelker (90/115/140 mm bredde) og ca. 18 000 kr/m³ for
  // søyler (kvadratiske). Pris per lm = b · h · kr/m³, avrundet til nærmeste 10 kr.
  // Ikke impregnert – limtre ute skal stå under tak/beskyttes (tjenesteklasse 2).
  'limtre-90x225': { id: 'limtre-90x225', navn: 'Limtre GL30c 90×225 mm', enhet: 'lm', pris: 330 },
  'limtre-90x270': { id: 'limtre-90x270', navn: 'Limtre GL30c 90×270 mm', enhet: 'lm', pris: 390 },
  'limtre-90x315': { id: 'limtre-90x315', navn: 'Limtre GL30c 90×315 mm', enhet: 'lm', pris: 450 },
  'limtre-115x270': { id: 'limtre-115x270', navn: 'Limtre GL30c 115×270 mm', enhet: 'lm', pris: 500 },
  'limtre-115x315': { id: 'limtre-115x315', navn: 'Limtre GL30c 115×315 mm', enhet: 'lm', pris: 580 },
  'limtre-115x360': { id: 'limtre-115x360', navn: 'Limtre GL30c 115×360 mm', enhet: 'lm', pris: 660 },
  'limtre-115x405': { id: 'limtre-115x405', navn: 'Limtre GL30c 115×405 mm', enhet: 'lm', pris: 750 },
  'limtre-140x360': { id: 'limtre-140x360', navn: 'Limtre GL30c 140×360 mm', enhet: 'lm', pris: 810 },
  'limtre-140x405': { id: 'limtre-140x405', navn: 'Limtre GL30c 140×405 mm', enhet: 'lm', pris: 910 },
  'limtre-140x450': { id: 'limtre-140x450', navn: 'Limtre GL30c 140×450 mm', enhet: 'lm', pris: 1010 },
  'limtre-140x495': { id: 'limtre-140x495', navn: 'Limtre GL30c 140×495 mm', enhet: 'lm', pris: 1110 },
  'stolpe-115x115': { id: 'stolpe-115x115', navn: 'Limtresøyle GL30c 115×115 mm', enhet: 'lm', pris: 240 },
  'stolpe-140x140': { id: 'stolpe-140x140', navn: 'Limtresøyle GL30c 140×140 mm', enhet: 'lm', pris: 350 },

  // ── Takkonstruksjon, tekking og avvanning ─────────────────────────
  'taklekt-36x48': { id: 'taklekt-36x48', navn: 'Taklekt 36×48 mm (C24/impregnert)', enhet: 'lm', pris: 14 },
  'taklekt-48x48': { id: 'taklekt-48x48', navn: 'Taklekt 48×48 mm', enhet: 'lm', pris: 18 },
  'vindskibord-22x148': { id: 'vindskibord-22x148', navn: 'Vindski-/raftebord 22×148 mm (grunnet)', enhet: 'lm', pris: 34 },
  'vindskibord-22x198': { id: 'vindskibord-22x198', navn: 'Vindski-/raftebord 22×198 mm (grunnet)', enhet: 'lm', pris: 44 },
  'kryssfiner-18-plate': { id: 'kryssfiner-18-plate', navn: 'Takplate kryssfiner 18 mm 1200×2400 (not og fjær)', enhet: 'stk', pris: 545 },
  'undertaksbelegg': { id: 'undertaksbelegg', navn: 'Underlagsbelegg for shingel (rull 1×15 m)', enhet: 'rull', pris: 1190 },
  'monebeslag': { id: 'monebeslag', navn: 'Mønebeslag/mønekappe (stål)', enhet: 'lm', pris: 160 },
  'vindskibeslag': { id: 'vindskibeslag', navn: 'Vindskibeslag (stål, 2 m)', enhet: 'lm', pris: 95 },
  takrenne: { id: 'takrenne', navn: 'Takrenne 125 mm stål (lakkert)', enhet: 'lm', pris: 129 },
  nedlop: { id: 'nedlop', navn: 'Nedløpsrør 87 mm stål inkl. bend', enhet: 'lm', pris: 159 },
  rennekrok: { id: 'rennekrok', navn: 'Rennekrok (fotkrok) for 125 mm renne', enhet: 'stk', pris: 29 },
  'renne-ende': { id: 'renne-ende', navn: 'Renneløp/endebunn-sett', enhet: 'stk', pris: 149 },

  // ── Beslag og festemidler ─────────────────────────────────────────
  'stolpesko-innstop': { id: 'stolpesko-innstop', navn: 'Stolpesko for innstøping, justerbar (varmforsinket)', enhet: 'stk', pris: 189 },
  stolpehodebeslag: { id: 'stolpehodebeslag', navn: 'Stolpehodebeslag/U-beslag for drager (varmforsinket)', enhet: 'stk', pris: 139 },
  'bolt-m12': { id: 'bolt-m12', navn: 'Bolt M12 varmforsinket m/ mutter og 2 skiver', enhet: 'stk', pris: 32 },
  'franskskrue-12': { id: 'franskskrue-12', navn: 'Franskskrue 12×200 mm m/ skive (varmforsinket)', enhet: 'stk', pris: 18 },
  bjelkesko: { id: 'bjelkesko', navn: 'Bjelkesko 48 mm (varmforsinket)', enhet: 'stk', pris: 29 },
  spikerplate: { id: 'spikerplate', navn: 'Spikerplate/takstolplate 100×200 mm', enhet: 'stk', pris: 22 },
  kamspiker: { id: 'kamspiker', navn: 'Kamspiker 40×4,0 mm varmforsinket (pk 250)', enhet: 'stk', pris: 189 },
  betongskrue: { id: 'betongskrue', navn: 'Betongskrue/ekspansjonsbolt M10×120 for svill', enhet: 'stk', pris: 16 },
  hulband: { id: 'hulband', navn: 'Hullbånd/vindkryss stål 40×2 mm (rull 10 m)', enhet: 'rull', pris: 249 },
  'bandstrammer': { id: 'bandstrammer', navn: 'Båndstrammer for vindkryss', enhet: 'stk', pris: 89 },

  // ── Fundament ─────────────────────────────────────────────────────
  'pilarror-250': { id: 'pilarror-250', navn: 'Pilarrør (forskalingsrør) Ø250 mm, 1,2 m', enhet: 'stk', pris: 189 },
  'pilarror-300': { id: 'pilarror-300', navn: 'Pilarrør (forskalingsrør) Ø300 mm, 1,2 m', enhet: 'stk', pris: 249 },
  'betong-sekk': { id: 'betong-sekk', navn: 'Ferdigbetong B30, sekk 25 kg', enhet: 'stk', pris: 109 },
  'betong-m3': { id: 'betong-m3', navn: 'Ferdigbetong B30 levert (bil), per m³', enhet: 'stk', pris: 2650 },
  armeringsnett: { id: 'armeringsnett', navn: 'Armeringsnett K131 (5×2 m)', enhet: 'stk', pris: 349 },
  'markisolasjon-xps': { id: 'markisolasjon-xps', navn: 'Markisolasjon XPS 50 mm', enhet: 'm²', pris: 155 },
  'grus-pukk': { id: 'grus-pukk', navn: 'Pukk/kult 16–32 mm (drenerende), per m³ levert', enhet: 'stk', pris: 590 },
  svillmembran: { id: 'svillmembran', navn: 'Svillmembran (fuktsperre) 150 mm', enhet: 'lm', pris: 14 },
  radonsperre: { id: 'radonsperre', navn: 'Radon-/fuktsperre 0,2 mm PE', enhet: 'm²', pris: 22 },

  // ── Terrasse/pergola (veiledende 2026, byggevarehus): impregnert terrassebord ca. 260 kr/m² ved
  // 28 mm, 48×248 trappevangeemne ca. 115 kr/lm. Alias-nøkler beholdes for templater med egne navn.
  'terrassebord-28x145': { id: 'terrassebord-28x145', navn: 'Terrassebord 28×145 mm', enhet: 'lm', pris: 38 },
  'terrassebord-21x95': { id: 'terrassebord-21x95', navn: 'Terrassebord 21×95 mm', enhet: 'lm', pris: 19 },
  pilarror: { id: 'pilarror', navn: 'Pilarrør (forskalingsrør) Ø200 mm, 1,2 m', enhet: 'stk', pris: 140 },
  'betong-25kg': { id: 'betong-25kg', navn: 'Ferdigbetong B30, sekk 25 kg', enhet: 'stk', pris: 95 },
  'bjelke-48x248': { id: 'bjelke-48x248', navn: 'Bjelke 48×248 mm (trappevange)', enhet: 'lm', pris: 115 },

  // ── Lekter/bord til varmepumpehus o.l. (veiledende 2026) ──
  'lekt-23x73': { id: 'lekt-23x73', navn: 'Lekt 23×73 mm', enhet: 'lm', pris: 13 },
  'lekt-23x98': { id: 'lekt-23x98', navn: 'Bord 23×98 mm', enhet: 'lm', pris: 17 },
  'lekt-36x73': { id: 'lekt-36x73', navn: 'Lekt 36×73 mm', enhet: 'lm', pris: 18 },
  'lekt-36x98': { id: 'lekt-36x98', navn: 'Lekt 36×98 mm', enhet: 'lm', pris: 24 },

  // ── Bod/utedo/vedskjul (småhus) – veiledende 2026, byggevarehus inkl. mva ──
  'bord-19x198': { id: 'bord-19x198', navn: 'Bord 19×198 mm (impregnert)', enhet: 'lm', pris: 34 },
  'bord-19x223': { id: 'bord-19x223', navn: 'Bord 19×223 mm (impregnert)', enhet: 'lm', pris: 39 },
  stolpefot: { id: 'stolpefot', navn: 'Vinkelbeslag/forankring m/ betongskrue', enhet: 'stk', pris: 49 },
  hengsel: { id: 'hengsel', navn: 'T-hengsel 400 mm, varmforsinket', enhet: 'stk', pris: 129 },
  vrider: { id: 'vrider', navn: 'Vrider/hasp med overfall', enhet: 'stk', pris: 149 },
  hasp: { id: 'hasp', navn: 'Hasp med krok', enhet: 'stk', pris: 79 },
  insektnett: { id: 'insektnett', navn: 'Insektnett (glassfiber/alu)', enhet: 'm²', pris: 59 },
  toalettsete: { id: 'toalettsete', navn: 'Toalettsete med lokk', enhet: 'stk', pris: 449 },
  lufteror: { id: 'lufteror', navn: 'Lufterør Ø110 m/ hatt og takmansjett', enhet: 'stk', pris: 690 },
  dorullholder: { id: 'dorullholder', navn: 'Dorullholder', enhet: 'stk', pris: 129 },
  pukk: { id: 'pukk', navn: 'Pukk 0–32 (sekk 40 kg)', enhet: 'stk', pris: 89 },

  // ── Vegg og garasje ───────────────────────────────────────────────
  vindsperre: { id: 'vindsperre', navn: 'Vindsperre (diffusjonsåpen duk)', enhet: 'm²', pris: 22 },
  'garasjeport-2500': { id: 'garasjeport-2500', navn: 'Leddport/seksjonsport 2500 mm bred inkl. motor', enhet: 'stk', pris: 18900 },
  'garasjeport-3000': { id: 'garasjeport-3000', navn: 'Leddport/seksjonsport 3000 mm bred inkl. motor', enhet: 'stk', pris: 22900 },
  'garasjeport-2400': { id: 'garasjeport-2400', navn: 'Leddport/seksjonsport 2400 mm bred inkl. motor', enhet: 'stk', pris: 17900 },
  'garasjeport-2700': { id: 'garasjeport-2700', navn: 'Leddport/seksjonsport 2700 mm bred inkl. motor', enhet: 'stk', pris: 19900 },
  'beslag-port': { id: 'beslag-port', navn: 'Beslag/foring rundt port (vannbrett + listverk)', enhet: 'stk', pris: 690 },
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
