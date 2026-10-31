/**
 * Beregningsgrunnlag – strukturert vedlegg til byggeplanen (PDF).
 *
 * Templatet bygger én `Beregningsrapport` per design (via
 * `lagBeregningsrapport`) fra resultatene i `dimensjonering.ts`, `laster.ts`,
 * `snolast-data.ts`, `fundament.ts` og `byggesak.ts`, og konverterer den med
 * `tilPlanVedlegg()` til PDF-motorens format (`Beregningsgrunnlag` i
 * `plan-typer.ts`). Typisk i et template:
 *
 *   beregningsgrunnlag: (c) => tilPlanVedlegg(lagBeregningsrapport({ … }))
 *
 * Rapporten beholder alle detaljer (delkontroller, snølast-status,
 * fundament) slik at UI-et også kan vise dem direkte.
 */
import type { ByggesakResultat } from './byggesak'
import type { Dimensjonering, Medlemskontroll } from './dimensjonering'
import { UTNYTTELSE_FORKLARING, forklarKontroll } from './dimensjonering'
import type { Frostresultat, Fundamentresultat } from './fundament'
import type { SnolastPaMark } from './snolast-data'
import type { SnolastTak, Vindlast } from './laster'
import { fmt } from './laster'
import type { Beregningsgrunnlag as PlanBeregningsgrunnlag, BeregningKontroll, BeregningLast } from './plan-typer'

export const KJERNE_VERSJON = '1.0'

export const ANSVARSFRASKRIVELSE =
  'Beregningene er veiledende og bygger på forenklede, konservative forutsetninger etter NS-EN 1990, NS-EN 1991 og NS-EN 1995-1-1 med norske nasjonale tillegg. De erstatter ikke prosjektering og kontroll utført av kvalifisert rådgivende ingeniør (RIB). For søknadspliktige tiltak er det tiltakshaver/ansvarlig foretak som står ansvarlig for at konstruksjonen oppfyller TEK17. Snølast, vindlast og grunnforhold må kontrolleres for din tomt.'

export interface Standard {
  kode: string
  tittel: string
}

export const STANDARDER = {
  NS_EN_1990: { kode: 'NS-EN 1990:2002+A1:2005+NA:2016', tittel: 'Grunnlag for prosjektering av konstruksjoner' },
  NS_EN_1991_1_1: { kode: 'NS-EN 1991-1-1:2002+NA:2019', tittel: 'Laster – tetthet, egenvekt og nyttelaster' },
  NS_EN_1991_1_3: { kode: 'NS-EN 1991-1-3:2003+A1:2015+NA:2018', tittel: 'Laster – snølaster' },
  NS_EN_1991_1_4: { kode: 'NS-EN 1991-1-4:2005+NA:2009', tittel: 'Laster – vindlaster' },
  NS_EN_1995_1_1: { kode: 'NS-EN 1995-1-1:2004+A1:2008+A2:2014+NA:2010', tittel: 'Prosjektering av trekonstruksjoner' },
  NS_EN_338: { kode: 'NS-EN 338:2016', tittel: 'Konstruksjonstrevirke – fasthetsklasser' },
  NS_EN_14080: { kode: 'NS-EN 14080:2013', tittel: 'Limtre og limt massivtre' },
  TEK17: { kode: 'TEK17', tittel: 'Byggteknisk forskrift' },
  SAK10: { kode: 'SAK10', tittel: 'Byggesaksforskriften' },
  BYGGFORSK: { kode: 'SINTEF Byggforskserien', tittel: '451.021, 471.041, 521.111, 522.351 m.fl.' },
} as const satisfies Record<string, Standard>

/** Én forutsetning (inngangsverdi) med kilde og usikkerhetsflagg. */
export interface Forutsetning {
  navn: string
  verdi: string | number
  enhet?: string
  kilde?: string
  /** Verdien er antatt/usikker og bør kontrolleres av kunden. */
  usikker?: boolean
}

/** Last – samme form som PDF-motorens `BeregningLast`. */
export type LastPost = BeregningLast

export interface Beregningsrapport {
  produkt: string
  tittel: string
  versjon: string
  forutsetninger: Forutsetning[]
  laster: LastPost[]
  snolast?: { mark: SnolastPaMark; tak?: SnolastTak }
  vind?: Vindlast
  kontroller: Medlemskontroll[]
  frost?: Frostresultat
  fundament?: Fundamentresultat
  byggesak?: ByggesakResultat
  standarder: Standard[]
  /** Må fremheves (usikre data, ikke-OK deler). */
  advarsler: string[]
  /** Korte forklaringer i klartekst. */
  forklaringer: string[]
  /** Utførelsesmerknader (forankring, frost …). */
  merknader: string[]
  ok: boolean
  maksUtnyttelse: number
  ansvarsfraskrivelse: string
}

export interface BeregningsrapportInput {
  produkt: string
  tittel: string
  forutsetninger?: Forutsetning[]
  laster?: LastPost[]
  snolast?: { mark: SnolastPaMark; tak?: SnolastTak }
  vind?: Vindlast
  /** Navngitte deler, f.eks. `{ Sperre: dimensjonerSperre(…), Stolpe: dimensjonerStolpe(…) }`. Nøkkelen blir komponentnavnet. */
  deler: Record<string, Dimensjonering | Medlemskontroll>
  /** Posisjonsmerker per del (som i kapplista), f.eks. `{ Sperre: 'C' }`. */
  pos?: Record<string, string>
  frost?: Frostresultat
  fundament?: Fundamentresultat
  byggesak?: ByggesakResultat
  merknader?: string[]
  ekstraStandarder?: Standard[]
  ekstraAdvarsler?: string[]
}

const erDim = (d: Dimensjonering | Medlemskontroll): d is Dimensjonering => 'valgt' in d

/** Sett sammen rapporten og utled advarsler/forklaringer automatisk. */
export function lagBeregningsrapport(inn: BeregningsrapportInput): Beregningsrapport {
  const advarsler = [...(inn.ekstraAdvarsler ?? [])]
  const kontroller: Medlemskontroll[] = []
  for (const [navn, d] of Object.entries(inn.deler)) {
    const k: Medlemskontroll = { ...(erDim(d) ? d.kontroll : d), navn, pos: inn.pos?.[navn] }
    kontroller.push(k)
    if (erDim(d) && !d.ok) advarsler.push(`${navn}: ${d.melding}`)
    else if (!k.ok) advarsler.push(`${navn}: ${k.tverrsnitt.profil} holder ikke (utnyttelse ${fmt(k.maksUtnyttelse, 2)}).`)
  }
  if (inn.snolast && inn.snolast.mark.status !== 'manuell') advarsler.push(...inn.snolast.mark.merknader)
  if (inn.fundament && !inn.fundament.ok) advarsler.push(...inn.fundament.merknader)
  const forutsetninger = [...(inn.forutsetninger ?? [])]
  for (const f of forutsetninger) if (f.usikker) advarsler.push(`Kontroller forutsetning: ${f.navn} = ${f.verdi}${f.enhet ? ` ${f.enhet}` : ''}${f.kilde ? ` (${f.kilde})` : ''}.`)
  const laster: LastPost[] = []
  if (inn.snolast) {
    const sm = inn.snolast.mark
    laster.push({ navn: 'Snølast på mark', symbol: 'sk', verdi: sm.sk, enhet: 'kN/m²', kommentar: `${sm.kilde}${sm.kommune ? ` – ${sm.kommune}` : ''}${sm.hoydeMoh !== undefined ? `, ${Math.round(sm.hoydeMoh)} moh` : ''}` })
    const st = inn.snolast.tak
    if (st) laster.push({ navn: 'Snølast på tak', symbol: 's', verdi: st.s, enhet: 'kN/m²', uttrykk: st.forklaring })
  }
  laster.push(...(inn.laster ?? []))
  if (inn.vind) laster.push({ navn: 'Vindkasthastighetstrykk', symbol: 'qp', verdi: inn.vind.qp, enhet: 'kN/m²', uttrykk: inn.vind.forklaring })
  const merknader = [...(inn.merknader ?? [])]
  if (inn.frost) merknader.push(inn.frost.forklaring, `Anbefalt fundamentdybde: ${fmt(inn.frost.anbefaltDybdeM, 1)} m.`, ...inn.frost.merknader)
  if (inn.fundament) merknader.push(`Fundament: ${inn.fundament.valgt.navn}.`, ...inn.fundament.forklaring)
  const maks = kontroller.reduce((m, k) => Math.max(m, k.maksUtnyttelse), 0)
  const forklaringer = [UTNYTTELSE_FORKLARING, ...kontroller.map(forklarKontroll)]
  if (inn.snolast) forklaringer.push(`Taket er dimensjonert for snølast på mark sk = ${fmt(inn.snolast.mark.sk, 1)} kN/m². Har din kommune/tomt høyere verdi, må dimensjonene økes.`)
  const S = STANDARDER
  const standarder: Standard[] = [
    S.NS_EN_1990,
    S.NS_EN_1991_1_1,
    ...(inn.snolast ? [S.NS_EN_1991_1_3] : []),
    ...(inn.vind ? [S.NS_EN_1991_1_4] : []),
    S.NS_EN_1995_1_1,
    S.NS_EN_338,
    ...(kontroller.some((k) => k.tverrsnitt.materiale.startsWith('GL')) ? [S.NS_EN_14080] : []),
    ...(inn.byggesak ? [S.SAK10, S.TEK17] : []),
    S.BYGGFORSK,
    ...(inn.ekstraStandarder ?? []),
  ]
  return {
    produkt: inn.produkt,
    tittel: inn.tittel,
    versjon: KJERNE_VERSJON,
    forutsetninger,
    laster,
    snolast: inn.snolast,
    vind: inn.vind,
    kontroller,
    frost: inn.frost,
    fundament: inn.fundament,
    byggesak: inn.byggesak,
    standarder,
    advarsler,
    forklaringer,
    merknader,
    ok: kontroller.every((k) => k.ok) && (inn.fundament?.ok ?? true),
    maksUtnyttelse: maks,
    ansvarsfraskrivelse: ANSVARSFRASKRIVELSE,
  }
}

/** «48 × 198 mm» → «48×198» (PDF-format). */
const kortProfil = (p: string) => p.replace(/\s*mm$/, '').replace(/\s*×\s*/g, '×')

/**
 * Konverter rapporten til PDF-motorens `Beregningsgrunnlag` (plan-typer.ts).
 * Én `BeregningKontroll`-rad per delkontroll (bøying, skjær, nedbøyning …).
 */
export function tilPlanVedlegg(r: Beregningsrapport): PlanBeregningsgrunnlag {
  const kontroller: BeregningKontroll[] = []
  for (const k of r.kontroller) {
    for (const d of k.kontroller) {
      kontroller.push({
        pos: k.pos,
        komponent: k.navn ?? 'Del',
        tverrsnitt: kortProfil(k.tverrsnitt.profil),
        kvalitet: k.tverrsnitt.materiale,
        spennMm: Math.round(k.spennMm),
        ccMm: k.ccMm !== undefined ? Math.round(k.ccMm) : undefined,
        kontroll: d.navn,
        utnyttelse: Math.round(d.utnyttelse * 100) / 100,
        detalj: d.detalj,
        kommentar: d === k.kontroller[0] ? `Styrende lastkombinasjon: ${k.lastkombinasjon}` : undefined,
      })
    }
  }
  const b = r.byggesak
  return {
    versjon: r.versjon,
    forutsetninger: r.forutsetninger.map((f) => ({ navn: f.navn, verdi: f.verdi, enhet: f.enhet, kilde: `${f.kilde ?? ''}${f.usikker ? `${f.kilde ? ' – ' : ''}KONTROLLER` : ''}` || undefined })),
    laster: r.laster,
    kontroller,
    standarder: r.standarder.map((s) => ({ kode: s.kode, tittel: s.tittel })),
    byggesak: b
      ? { tittel: b.tittel, sokfri: b.sokfri, punkter: [...b.punkter, ...(b.rekkverk?.tekst ?? []), ...b.merknader], hjemmel: [b.regel] }
      : undefined,
    merknader: [...r.advarsler.map((a) => `OBS: ${a}`), ...r.forklaringer, ...r.merknader],
    forbehold: r.ansvarsfraskrivelse,
  }
}
