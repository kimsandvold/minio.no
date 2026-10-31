/**
 * Karakteristisk snølast på mark, sk (kN/m²) – NS-EN 1991-1-3 + NA.
 *
 * Norsk NA (tabell NA.4(901)) gir per kommune: sk,0 (snølast på mark opp til
 * høydegrensen Hg), Hg (moh), Δsk (tillegg per 100 m over Hg) og sk,maks:
 *   sk = sk,0                         for H ≤ Hg
 *   sk = sk,0 + n·Δsk ≤ sk,maks       for H > Hg, n = (H − Hg)/100
 *
 * ⚠️ DATAKILDE OG USIKKERHET – LES DETTE
 * Den fullstendige, offisielle tabellen (alle kommuner, 2024-inndeling) er IKKE
 * gjengitt her, fordi vi ikke kunne reprodusere den med sikkerhet. I stedet:
 *
 * 1. Et lite utvalg kommuner med sk,0 (og ev. sk,maks) lest fra et gjengitt
 *    utdrag av NS 3491-3 (forløperen til NS-EN 1991-1-3/NA; NA-tabellen
 *    videreførte i hovedsak disse verdiene). Utdraget er fra før
 *    kommunesammenslåingene (2008–2024). For sammenslåtte kommuner er den
 *    HØYESTE sk,0 blant de gamle kommunene brukt (KONSERVATIV).
 *    Hg/Δsk er bare kjent for Oslo (trinnene 0–150/151–250/251–350/>351 moh =
 *    3,5/4,5/5,5/6,5 kN/m² ⇒ Hg = 150, Δsk = 1,0, sk,maks = 6,5).
 * 2. For de andre kommunene er høydetillegget beregnet KONSERVATIVT med
 *    Hg = 0 moh og Δsk = 1,0 kN/m² per 100 m (USIKKER – faktisk Hg er normalt
 *    høyere, så dette gir for HØY last; Δsk kan i enkelte fjellkommuner være
 *    større enn 1,0).
 * 3. Ukjent kommune → nasjonal reserveverdi `SK_RESERVE` (4,5 kN/m²) + samme
 *    konservative høydetillegg. Dekker IKKE indre Nord-Norge/fjellområder
 *    (sk,0 opptil 7,5–8,0) – derfor alltid advarsel.
 * 4. Manuell overstyring (`skManuell`) har alltid forrang. Den riktige verdien
 *    fås fra kommunen, NS-EN 1991-1-3 NA eller SINTEF Byggforsk 471.041.
 *
 * Verdiene skal ALLTID skrives ut i byggeplanen med kilde og status, slik at
 * kunden kan kontrollere dem.
 */

export interface SnolastKommune {
  kommune: string
  sk0: number
  /** Høydegrense Hg (moh) – utelatt = ukjent. */
  hg?: number
  /** Tillegg per 100 m over Hg – utelatt = ukjent. */
  dsk?: number
  /** Øvre grense – utelatt = ukjent. */
  skMaks?: number
  /** Hvilke (gamle) kommuner verdien bygger på. */
  merknad?: string
}

/** Standard dimensjonerende snølast for ferdige planer når kunden ikke har oppgitt kommune. */
export const SK_STANDARD = 3.5
/** Konservativ reserveverdi for ukjent kommune. */
export const SK_RESERVE = 4.5
/** Konservativt høydetillegg når Hg/Δsk er ukjent: Hg = 0, Δsk = 1,0. */
const HG_UKJENT = 0
const DSK_UKJENT = 1.0

const K = (kommune: string, sk0: number, ekstra: Partial<SnolastKommune> = {}): SnolastKommune => ({ kommune, sk0, ...ekstra })

/**
 * Utvalgte kommuner (2024-navn). Kilde: gjengitt NS 3491-3-tabell (se over).
 * IKKE utvid denne lista med verdier som ikke er kontrollert mot kilde.
 */
export const SNOLAST_KOMMUNER: SnolastKommune[] = [
  K('Oslo', 3.5, { hg: 150, dsk: 1.0, skMaks: 6.5, merknad: 'Trinnvis 3,5/4,5/5,5/6,5 for 0–150/–250/–350/>350 moh' }),
  K('Bergen', 2.0),
  K('Trondheim', 4.0, { merknad: 'Trondheim 3,5, tidl. Klæbu 4,0 → 4,0' }),
  K('Stavanger', 1.5, { merknad: 'inkl. tidl. Finnøy og Rennesøy (1,5)' }),
  K('Sandnes', 1.5, { merknad: 'inkl. tidl. Forsand (1,5)' }),
  K('Haugesund', 1.5),
  K('Kristiansand', 4.5, { merknad: 'Kristiansand 4,0, Søgne 3,5, Songdalen 4,5 → 4,5' }),
  K('Arendal', 4.5),
  K('Grimstad', 4.5),
  K('Drammen', 4.0, { merknad: 'Drammen 3,5, Nedre Eiker 3,5, Svelvik 4,0 → 4,0' }),
  K('Asker', 4.0, { merknad: 'inkl. tidl. Hurum og Røyken (4,0)' }),
  K('Lillestrøm', 4.0, { skMaks: 6.5, merknad: 'Skedsmo, Fet, Sørum (4,0)' }),
  K('Ullensaker', 4.5, { skMaks: 6.5 }),
  K('Fredrikstad', 2.5),
  K('Sarpsborg', 3.0),
  K('Halden', 3.0),
  K('Moss', 3.0, { merknad: 'inkl. tidl. Rygge (3,0)' }),
  K('Hamar', 3.5, { skMaks: 6.5 }),
  K('Lillehammer', 4.5, { skMaks: 6.5 }),
  K('Gjøvik', 4.5, { skMaks: 6.5 }),
  K('Kongsberg', 5.0, { skMaks: 6.5 }),
  K('Tønsberg', 4.5, { merknad: 'Tønsberg 4,0, tidl. Re (Ramnes/Våle) 4,5 → 4,5' }),
  K('Sandefjord', 4.5, { merknad: 'Sandefjord 4,0, Andebu/Stokke 4,5 → 4,5' }),
  K('Larvik', 5.0, { merknad: 'Larvik 4,0, tidl. Lardal 5,0 → 5,0' }),
  K('Skien', 4.0),
  K('Porsgrunn', 4.0),
  K('Ålesund', 4.0, { merknad: 'Ålesund 3,0, Skodje/Ørskog 4,0 → 4,0' }),
  K('Molde', 4.5, { merknad: 'Molde 3,5, Midsund 3,0, Nesset 4,5 → 4,5' }),
  K('Kristiansund', 3.5, { merknad: 'Kristiansund 2,5, tidl. Frei 3,5 → 3,5' }),
  K('Stjørdal', 3.5),
  K('Levanger', 3.5),
  K('Steinkjer', 5.0, { merknad: 'Steinkjer 3,5, tidl. Verran 5,0 → 5,0' }),
  K('Bodø', 4.5, { merknad: 'Bodø 4,0, tidl. Skjerstad 4,5 → 4,5' }),
  K('Narvik', 4.5),
  K('Harstad', 5.0),
  K('Tromsø', 6.0),
  K('Alta', 4.5),
  K('Hammerfest', 5.0),
]

export type SnolastStatus = 'manuell' | 'tabell' | 'tabell-konservativ-hoyde' | 'reserve'

export interface SnolastPaMark {
  sk: number
  status: SnolastStatus
  kommune?: string
  hoydeMoh?: number
  kilde: string
  /** Advarsler som SKAL skrives ut i planen. */
  merknader: string[]
}

const norm = (s: string) => s.trim().toLowerCase().normalize('NFC')

export function finnSnolastKommune(kommune: string): SnolastKommune | undefined {
  const k = norm(kommune)
  return SNOLAST_KOMMUNER.find((e) => norm(e.kommune) === k)
}

/**
 * Karakteristisk snølast på mark for byggestedet.
 *
 * @param inn.skManuell  verdi fra kommunen/NA – har alltid forrang
 * @param inn.kommune    kommunenavn (2024-navn)
 * @param inn.hoydeMoh   byggestedets høyde over havet (m)
 */
export function snolastPaMark(inn: { kommune?: string; hoydeMoh?: number; skManuell?: number } = {}): SnolastPaMark {
  const merknader: string[] = []
  if (inn.skManuell !== undefined && inn.skManuell > 0) {
    return {
      sk: inn.skManuell,
      status: 'manuell',
      kommune: inn.kommune,
      hoydeMoh: inn.hoydeMoh,
      kilde: 'Oppgitt av bruker (kontroller mot kommunen / NS-EN 1991-1-3 NA)',
      merknader,
    }
  }
  const rad = inn.kommune ? finnSnolastKommune(inn.kommune) : undefined
  const H = inn.hoydeMoh
  if (rad) {
    const kjentHoyde = rad.hg !== undefined && rad.dsk !== undefined
    const hg = rad.hg ?? HG_UKJENT
    const dsk = rad.dsk ?? DSK_UKJENT
    let sk = rad.sk0
    if (H === undefined) {
      merknader.push(`Høyde over havet er ikke oppgitt – sk,0 = ${rad.sk0.toFixed(1).replace('.', ',')} kN/m² gjelder bare lavtliggende byggested. Oppgi høyden.`)
    } else if (H > hg) {
      sk = rad.sk0 + ((H - hg) / 100) * dsk
      if (rad.skMaks !== undefined) sk = Math.min(sk, rad.skMaks)
    }
    if (!kjentHoyde && H !== undefined && H > 0) {
      merknader.push('Høydetillegget er beregnet forenklet og konservativt (Hg = 0 moh, Δsk = 1,0 kN/m² per 100 m). Faktisk verdi fra kommunen er normalt lavere.')
    }
    if (rad.merknad) merknader.push(`Tabellgrunnlag: ${rad.merknad}.`)
    merknader.push('Verdien bygger på et gjengitt tabellutdrag (NS 3491-3 / NS-EN 1991-1-3 NA). Kontroller mot kommunen.')
    return {
      sk: rund1(sk),
      status: kjentHoyde ? 'tabell' : 'tabell-konservativ-hoyde',
      kommune: rad.kommune,
      hoydeMoh: H,
      kilde: 'NS-EN 1991-1-3 NA tab. NA.4(901) (utdrag, se merknader)',
      merknader,
    }
  }
  let sk = SK_RESERVE
  if (H !== undefined && H > HG_UKJENT) sk += ((H - HG_UKJENT) / 100) * DSK_UKJENT
  merknader.push(
    `${inn.kommune ? `Kommunen «${inn.kommune}» finnes ikke i det innebygde utdraget` : 'Kommune er ikke oppgitt'} – konservativ reserveverdi ${SK_RESERVE.toFixed(1).replace('.', ',')} kN/m² er brukt. Den dekker IKKE indre Nord-Norge og fjellområder. Hent riktig sk fra kommunen og oppgi den manuelt.`,
  )
  return { sk: rund1(sk), status: 'reserve', kommune: inn.kommune, hoydeMoh: H, kilde: 'Konservativ reserveverdi (ikke tabellverdi)', merknader }
}

/** Avrund OPP til nærmeste 0,1 kN/m² (konservativt). */
function rund1(v: number): number {
  return Math.ceil(v * 10 - 1e-9) / 10
}
