/**
 * Byggested – felles config-felt som ALLE templater kan lese.
 *
 * Skrives av «Byggested»-seksjonen i designverktøyets sidepanel og lagres med
 * designet (vanlige config-nøkler):
 *   c.kommune   string  – kommunenavn fra SNOLAST_KOMMUNER, ANNEN_KOMMUNE
 *                         («Annen/vet ikke») eller utelatt/'' (ikke valgt)
 *   c.moh       number  – byggestedets høyde over havet (m). Utelatt = ukjent
 *   c.sk        number  – manuell snølast på mark (kN/m²). Utelatt/0 = ingen
 *   c.frostsone string  – manuell frostsone ('kyst' | 'lavland' | 'innland' |
 *                         'kaldt-innland'). Utelatt = avledet fra kommune/moh
 *   c.grunn     string  – grunnforhold ('fjell' | 'grus-sand' | 'morene' |
 *                         'silt-leire' | 'ukjent'; eldre 'silt'/'leire' godtas).
 *                         Utelatt = 'ukjent' (konservativ, telefarlig)
 *
 * Bruk `snolastForConfig(c)`, `frostForConfig(c, { snofri })` og
 * `grunnForConfig(c)` i templatene, så får alle samme standard.
 */
import { SK_STANDARD, snolastPaMark, type SnolastPaMark } from './snolast-data'
import { FROSTSONER, GRUNN, frostdybde, type Frostresultat, type Frostsone, type Grunn } from './fundament'
import type { DesignConfig } from './types'

export const BYGGESTED_NOKLER = ['kommune', 'moh', 'sk', 'frostsone', 'grunn'] as const
/** Verdien som lagres for «Annen kommune / vet ikke». */
export const ANNEN_KOMMUNE = 'annen'

export interface Byggested {
  kommune?: string
  moh?: number
  sk?: number
  /** Manuell frostsone – utelatt = fra kommune. */
  frostsone?: Frostsone
  /** Grunnforhold – utelatt = ukjent. */
  grunn?: Grunn
}

/** Grunnvalgene som vises i Byggested-panelet. */
export const GRUNN_VALG: Array<{ id: Grunn; label: string; note: string }> = [
  { id: 'ukjent', label: 'Vet ikke', note: 'Konservativt: telefarlig grunn' },
  { id: 'fjell', label: 'Fjell', note: 'Fundament boltes til fjell' },
  { id: 'grus-sand', label: 'Grus/sand (drenert)', note: 'Ikke telefarlig' },
  { id: 'morene', label: 'Morene', note: 'Telefarlig' },
  { id: 'silt-leire', label: 'Silt/leire', note: 'Telefarlig, lav bæreevne' },
]

const FROSTSONE_IDER = Object.keys(FROSTSONER) as Frostsone[]
const GRUNN_IDER = Object.keys(GRUNN) as Grunn[]

/** Leser byggestedet defensivt fra en config (tåler manglende/ugyldige felt). */
export function lesByggested(c: Partial<DesignConfig> | undefined): Byggested {
  const k = typeof c?.kommune === 'string' && c.kommune.trim() ? c.kommune.trim() : undefined
  const moh = typeof c?.moh === 'number' && Number.isFinite(c.moh) && c.moh >= 0 ? c.moh : undefined
  const sk = typeof c?.sk === 'number' && Number.isFinite(c.sk) && c.sk > 0 ? c.sk : undefined
  const frostsone = FROSTSONE_IDER.includes(c?.frostsone as Frostsone) ? (c?.frostsone as Frostsone) : undefined
  const grunn = GRUNN_IDER.includes(c?.grunn as Grunn) ? (c?.grunn as Grunn) : undefined
  return { kommune: k, moh, sk, frostsone, grunn }
}

/** Skriv byggestedet inn i en config (tomme felt fjernes, ikke lagret som undefined). */
export function skrivByggested(c: DesignConfig, b: Byggested): DesignConfig {
  const n = { ...c } as DesignConfig
  for (const k of BYGGESTED_NOKLER) delete n[k]
  if (b.kommune) n.kommune = b.kommune
  if (b.moh !== undefined) n.moh = b.moh
  if (b.sk !== undefined) n.sk = b.sk
  if (b.frostsone) n.frostsone = b.frostsone
  if (b.grunn) n.grunn = b.grunn
  return n
}

/** Overfør byggestedet fra én config til en annen (produktbytte / nytt design). */
export function overforByggested(base: DesignConfig, fra: DesignConfig): DesignConfig {
  const b = lesByggested(fra)
  const n = { ...base } as DesignConfig
  if (b.kommune) n.kommune = b.kommune
  if (b.moh !== undefined) n.moh = b.moh
  if (b.sk !== undefined) n.sk = b.sk
  if (b.frostsone) n.frostsone = b.frostsone
  if (b.grunn) n.grunn = b.grunn
  return n
}

/** Snølast på mark for designets byggested (samme standard i alle templater). */
export function snolastForConfig(c: Partial<DesignConfig> | undefined): SnolastPaMark {
  const b = lesByggested(c)
  if (b.sk !== undefined) return snolastPaMark({ kommune: b.kommune === ANNEN_KOMMUNE ? undefined : b.kommune, hoydeMoh: b.moh, skManuell: b.sk })
  if (!b.kommune) {
    return {
      sk: SK_STANDARD,
      status: 'reserve',
      hoydeMoh: b.moh,
      kilde: 'Standardverdi (byggested ikke oppgitt)',
      merknader: [
        `Byggested er ikke oppgitt – planen er dimensjonert for ${SK_STANDARD.toFixed(1).replace('.', ',')} kN/m² snølast på mark. Velg kommune og høyde over havet (eller oppgi snølasten fra kommunen) for å få riktig dimensjonering.`,
      ],
    }
  }
  return snolastPaMark({ kommune: b.kommune === ANNEN_KOMMUNE ? undefined : b.kommune, hoydeMoh: b.moh })
}

// ── Frostsone per kommune ──────────────────────────────────────────

/**
 * Forenklet frostsone for kommunene i SNOLAST_KOMMUNER (se FROSTSONER i
 * fundament.ts). KONSERVATIV: der kommunen spenner over flere klima (kyst +
 * innland, sammenslåtte kommuner) er den kaldeste sonen for vanlig bebyggelse
 * valgt. Grunnlag: Byggforsk 451.021 (F10 per kommune) gjengitt etter beste
 * kunnskap – USIKKER, derfor kan sonen overstyres. Byggesteder over 400 moh
 * flyttes ett trinn kaldere (`frostsoneFor`).
 */
export const FROSTSONE_KOMMUNE: Record<string, Frostsone> = {
  // Vestlandet/Rogaland – mild kyst
  Bergen: 'kyst',
  Stavanger: 'kyst',
  Sandnes: 'kyst',
  Haugesund: 'kyst',
  Ålesund: 'kyst',
  Kristiansund: 'kyst',
  // Sørlandet, Oslofjorden, Trøndelag lavland, Nord-Norge kyst
  Kristiansand: 'lavland',
  Arendal: 'lavland',
  Grimstad: 'lavland',
  Molde: 'lavland',
  Oslo: 'lavland',
  Asker: 'lavland',
  Lillestrøm: 'lavland',
  Drammen: 'lavland',
  Fredrikstad: 'lavland',
  Sarpsborg: 'lavland',
  Halden: 'lavland',
  Moss: 'lavland',
  Tønsberg: 'lavland',
  Sandefjord: 'lavland',
  Larvik: 'lavland',
  Skien: 'lavland',
  Porsgrunn: 'lavland',
  Trondheim: 'lavland',
  Stjørdal: 'lavland',
  Levanger: 'lavland',
  Bodø: 'lavland',
  Harstad: 'lavland',
  Tromsø: 'lavland',
  // Innlandet, indre Østlandet/Trøndelag, indre Nordland/Finnmark-kyst
  Ullensaker: 'innland',
  Hamar: 'innland',
  Lillehammer: 'innland',
  Gjøvik: 'innland',
  Kongsberg: 'innland',
  Steinkjer: 'innland',
  Narvik: 'innland',
  Hammerfest: 'innland',
  // Kaldt innland
  Alta: 'kaldt-innland',
}

/** Standard når kommune ikke er valgt/ukjent (konservativ). */
export const FROSTSONE_STANDARD: Frostsone = 'innland'

export interface FrostsoneValg {
  sone: Frostsone
  kilde: 'manuell' | 'kommune' | 'standard'
  merknad: string
}

/** Frostsone for byggestedet: manuell → kommune (+ høydejustering) → standard. */
export function frostsoneForConfig(c: Partial<DesignConfig> | undefined): FrostsoneValg {
  const b = lesByggested(c)
  if (b.frostsone) return { sone: b.frostsone, kilde: 'manuell', merknad: `Frostsone valgt manuelt: ${FROSTSONER[b.frostsone].navn}.` }
  const fraKommune = b.kommune && b.kommune !== ANNEN_KOMMUNE ? FROSTSONE_KOMMUNE[b.kommune] : undefined
  if (fraKommune) {
    let sone = fraKommune
    let hoy = ''
    if (b.moh !== undefined && b.moh > 400) {
      const i = FROSTSONE_IDER.indexOf(sone)
      sone = FROSTSONE_IDER[Math.min(FROSTSONE_IDER.length - 1, i + 1)]
      hoy = ` (ett trinn kaldere fordi byggestedet ligger over 400 moh)`
    }
    return { sone, kilde: 'kommune', merknad: `Frostsone avledet fra kommune: ${FROSTSONER[sone].navn}${hoy}. Forenklet – kontroller F10 i Byggforsk 451.021.` }
  }
  return {
    sone: FROSTSONE_STANDARD,
    kilde: 'standard',
    merknad: `Frostsone er ikke kjent – konservativ standard «${FROSTSONER[FROSTSONE_STANDARD].navn}» er brukt. Velg kommune eller frostsone.`,
  }
}

/** Grunnforhold for byggestedet (utelatt = 'ukjent', konservativ telefarlig). */
export function grunnForConfig(c: Partial<DesignConfig> | undefined): Grunn {
  return lesByggested(c).grunn ?? 'ukjent'
}

/**
 * Frostdybde for byggestedet. `snofri` velges av templatet: true under tak
 * (carport, garasje, tett pergola), under høye dekker og på flater som måkes.
 */
export function frostForConfig(c: Partial<DesignConfig> | undefined, opts: { snofri?: boolean } = {}): Frostresultat {
  const sv = frostsoneForConfig(c)
  const f = frostdybde({ sone: sv.sone, grunn: grunnForConfig(c), snofri: opts.snofri })
  return { ...f, merknader: [sv.merknad, ...f.merknader] }
}

/** Lesbar linje til PDF/forespørsel, f.eks. «Oslo, 150 moh – sk 3,5 kN/m²». */
export function byggestedTekst(c: Partial<DesignConfig> | undefined): string[] {
  const b = lesByggested(c)
  const s = snolastForConfig(c)
  const sv = frostsoneForConfig(c)
  const g = grunnForConfig(c)
  const sted = b.kommune === ANNEN_KOMMUNE ? 'Annen kommune' : b.kommune ?? 'Ikke oppgitt'
  return [
    `Byggested: ${sted}${b.moh !== undefined ? `, ${b.moh} moh` : ''}`,
    `Snølast på mark: ${s.sk.toFixed(1).replace('.', ',')} kN/m²${s.status === 'manuell' ? ' (oppgitt)' : ''}`,
    `Frostsone: ${FROSTSONER[sv.sone].navn}${sv.kilde === 'manuell' ? ' (valgt)' : sv.kilde === 'standard' ? ' (standard)' : ''}`,
    `Grunnforhold: ${GRUNN[g].navn}`,
  ]
}
