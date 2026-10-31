/**
 * Byggesak – veiledende vurdering av søknadsplikt (plan- og bygningsloven
 * § 20-5 / byggesaksforskriften SAK10 § 4-1) og sikkerhetskrav i TEK17.
 *
 * ALT her er VEILEDNING. Kommunen avgjør. Reguleringsplan/kommuneplan kan ha
 * strengere bestemmelser (byggegrenser, utnyttelsesgrad %-BYA, høyder), og
 * vegloven, strandsonen (PBL § 1-8), kulturminner og ledninger i grunnen kan
 * gjøre et ellers søknadsfritt tiltak søknadspliktig.
 *
 * Regler (sjekket etter beste kunnskap, versjon 2024 – VERIFISER):
 * - SAK10 § 4-1 første ledd bokstav a – frittliggende bygning på bebygd
 *   eiendom, ikke til beboelse: BYA og BRA ≤ 50 m², mønehøyde ≤ 4,0 m,
 *   gesimshøyde ≤ 3,0 m, minst 1,0 m fra nabogrense, minst 1,0 m fra annen
 *   bygning, ikke kjeller. Over 15 m² skal tiltaket meldes til kommunen for
 *   registrering i matrikkelen.
 * - SAK10 § 4-1 første ledd bokstav b – tilbygg (inkl. carport/overbygd
 *   terrasse inntil bolig): BYA og BRA ≤ 15 m², mønehøyde ≤ 4,0 m,
 *   gesimshøyde ≤ 3,0 m, minst 4,0 m fra nabogrense, ikke beboelse.
 * - SAK10 § 4-1 første ledd bokstav c – mindre tiltak utendørs, bl.a. platting
 *   ≤ 0,5 m over planert terreng (ikke nærmere nabogrense enn 1,0 m – sjekk).
 * - SAK10 § 3-1 – søknad uten krav om ansvarsrett (tiltakshaver selv):
 *   tilbygg ≤ 50 m² og frittliggende uthus/garasje ≤ 70 m² (ikke beboelse).
 * - TEK17 § 11-6: avstand < 8 m til annen bygning → krav om brannskille
 *   (forenklinger finnes for små bygg – sjekk veiledningen).
 * - TEK17 § 12-17 rekkverk: kreves ved nivåforskjell > 0,5 m. Høyde min.
 *   1,0 m (terrasse/balkong), åpninger maks 100 mm, ikke klatrevennlig.
 * - TEK17 § 12-16 trapp: veiledende stigning ≤ 180 mm, inntrinn ≥ 250 mm.
 */
import { REKKVERK_LAST_KAT_A, fmt } from './laster'

export type Tiltakstype =
  /** Frittliggende bod/garasje/carport/vedskjul/utedo. */
  | 'frittliggende'
  /** Tilbygg/påbygg inntil bolig (veggmontert carport, overbygd terrasse). */
  | 'tilbygg'
  /** Platting/terrasse uten tak. */
  | 'terrasse'
  /** Åpen pergola uten tett tak. */
  | 'pergola'
  /** Små konstruksjoner: plantekasse, postkassestativ, utekjøkken uten tak. */
  | 'smatiltak'

export interface ByggesakInput {
  tiltak: Tiltakstype
  /** Bebygd areal (BYA), m² – for tak: takets horisontale projeksjon (utstikk > 1 m teller). */
  byaM2: number
  /** Bruksareal (BRA), m² (utelatt = lik BYA). */
  braM2?: number
  /** Mønehøyde over gjennomsnittlig planert terreng, m. */
  moneHoydeM?: number
  /** Gesimshøyde over gjennomsnittlig planert terreng, m. */
  gesimsHoydeM?: number
  /** Terrasse: høyde fra planert terreng til overkant dekke, m. */
  hoydeOverTerrengM?: number
  /** Avstand til nabogrense, m (utelatt = ukjent → advarsel). */
  avstandNabogrenseM?: number
  /** Avstand til annen bygning, m. */
  avstandAnnenBygningM?: number
  beboelse?: boolean
  kjeller?: boolean
  /** Største fallhøyde fra gangflate (terrasse, trapp), m. */
  fallhoydeM?: number
  /** Rekkverkshøyde i modellen, m (0/utelatt = ingen). */
  rekkverkHoydeM?: number
}

export interface RekkverkKrav {
  paakrevd: boolean
  minHoydeM: number
  maksAapningMm: number
  tekst: string[]
}

export interface ByggesakResultat {
  /** true = trolig søknadsfritt, false = trolig søknadspliktig. */
  sokfri: boolean
  tittel: string
  /** Hjemmel som er vurdert, f.eks. «SAK10 § 4-1 første ledd bokstav a». */
  regel: string
  /** Hvorfor (oppfylte/brutte vilkår). */
  punkter: string[]
  /** Hva som gjelder videre (ansvarsrett, matrikkel, brann …). */
  merknader: string[]
  rekkverk?: RekkverkKrav
  sjekkMedKommunen: string
}

export const SJEKK_MED_KOMMUNEN =
  'Veiledende vurdering – sjekk alltid reguleringsplan og kommunens regler før du bygger. Søknadsfrie tiltak må likevel følge plan, TEK17 og avstandskrav, og du er selv ansvarlig for at tiltaket er i tråd med regelverket.'

const m = (v: number) => `${fmt(v, 1)} m`
const m2 = (v: number) => `${fmt(v, 1)} m²`

/** Rekkverkskrav etter TEK17 § 12-17 (veiledende). */
export function rekkverkKrav(fallhoydeM: number, rekkverkHoydeM = 0): RekkverkKrav {
  const paakrevd = fallhoydeM > 0.5
  const tekst: string[] = []
  if (paakrevd) {
    tekst.push(`Fallhøyde ${m(fallhoydeM)} > 0,5 m: rekkverk kreves (TEK17 § 12-17).`)
    tekst.push('Rekkverk min. 1,0 m høyt målt fra gangflaten, åpninger maks 100 mm, og uten horisontale deler som gjør det lett å klatre (barnesikkert).')
    tekst.push(`Rekkverket skal tåle horisontal last ${fmt(REKKVERK_LAST_KAT_A, 1)} kN/m i håndlisthøyde (NS-EN 1991-1-1, kat. A – øvre verdi) – fest stolpene i bjelkelaget med bolter, ikke bare skruer i endeved.`)
    if (rekkverkHoydeM > 0 && rekkverkHoydeM < 1.0) tekst.push(`Valgt rekkverkshøyde ${m(rekkverkHoydeM)} er LAVERE enn 1,0 m – øk høyden.`)
    if (rekkverkHoydeM <= 0) tekst.push('Modellen har ikke rekkverk – legg til rekkverk.')
  } else {
    tekst.push(`Fallhøyde ${m(fallhoydeM)} ≤ 0,5 m: rekkverk er ikke påkrevd, men kan være lurt (barn).`)
  }
  return { paakrevd, minHoydeM: 1.0, maksAapningMm: 100, tekst }
}

/** Veiledende vurdering av søknadsplikt. */
export function vurderByggesak(inn: ByggesakInput): ByggesakResultat {
  const bra = inn.braM2 ?? inn.byaM2
  const areal = Math.max(inn.byaM2, bra)
  const punkter: string[] = []
  const merknader: string[] = []
  let sokfri = true
  const brudd = (t: string) => {
    sokfri = false
    punkter.push(t)
  }
  const nabo = (krav: number) => {
    if (inn.avstandNabogrenseM === undefined) punkter.push(`Avstand til nabogrense må være minst ${m(krav)}.`)
    else if (inn.avstandNabogrenseM < krav) brudd(`Avstand til nabogrense ${m(inn.avstandNabogrenseM)} er under ${m(krav)}.`)
    else punkter.push(`Avstand til nabogrense ${m(inn.avstandNabogrenseM)} ≥ ${m(krav)} – OK.`)
  }
  const hoyder = () => {
    if (inn.moneHoydeM !== undefined) {
      if (inn.moneHoydeM > 4.0) brudd(`Mønehøyde ${m(inn.moneHoydeM)} er over 4,0 m.`)
      else punkter.push(`Mønehøyde ${m(inn.moneHoydeM)} ≤ 4,0 m – OK.`)
    }
    if (inn.gesimsHoydeM !== undefined) {
      if (inn.gesimsHoydeM > 3.0) brudd(`Gesimshøyde ${m(inn.gesimsHoydeM)} er over 3,0 m.`)
      else punkter.push(`Gesimshøyde ${m(inn.gesimsHoydeM)} ≤ 3,0 m – OK.`)
    }
  }
  let regel = ''
  let rekkverk: RekkverkKrav | undefined

  switch (inn.tiltak) {
    case 'frittliggende': {
      regel = 'SAK10 § 4-1 første ledd bokstav a'
      if (areal > 50) brudd(`Areal ${m2(areal)} er over 50 m² (BYA/BRA).`)
      else punkter.push(`Areal ${m2(areal)} ≤ 50 m² – OK.`)
      hoyder()
      nabo(1.0)
      if (inn.avstandAnnenBygningM !== undefined && inn.avstandAnnenBygningM < 1.0) brudd(`Avstand til annen bygning ${m(inn.avstandAnnenBygningM)} er under 1,0 m.`)
      if (inn.beboelse) brudd('Bygningen skal brukes til beboelse – ikke søknadsfritt.')
      if (inn.kjeller) brudd('Bygningen har kjeller – ikke søknadsfritt.')
      if (sokfri && areal > 15) merknader.push('Over 15 m²: send opplysninger om plassering til kommunen for registrering i matrikkelen (kartet).')
      if (!sokfri && areal <= 70 && !inn.beboelse) merknader.push('Frittliggende uthus/garasje inntil 70 m² kan normalt søkes om av deg selv uten ansvarsrett (SAK10 § 3-1). Konstruksjonen må likevel oppfylle TEK17.')
      merknader.push('Står bygget nærmere enn 8 m fra annen bygning, gjelder brannkrav om avstand/brannskille (TEK17 § 11-6) – sjekk veiledningen for små bygg.')
      break
    }
    case 'tilbygg': {
      regel = 'SAK10 § 4-1 første ledd bokstav b'
      if (areal > 15) brudd(`Areal ${m2(areal)} er over 15 m² for tilbygg.`)
      else punkter.push(`Areal ${m2(areal)} ≤ 15 m² – OK.`)
      hoyder()
      nabo(4.0)
      if (inn.beboelse) brudd('Tilbygget skal brukes til beboelse – ikke søknadsfritt.')
      if (!sokfri && areal <= 50 && !inn.beboelse) merknader.push('Tilbygg inntil 50 m² kan normalt søkes om uten ansvarsrett (SAK10 § 3-1).')
      merknader.push('Tilbygg må ikke svekke brannsikkerheten til boligen (TEK17 kap. 11) – f.eks. ikke dekke over rømningsvindu.')
      break
    }
    case 'terrasse': {
      regel = 'SAK10 § 4-1 første ledd bokstav c'
      const h = inn.hoydeOverTerrengM ?? 0
      if (h > 0.5) brudd(`Dekket står ${m(h)} over terreng – over 0,5 m er terrassen søknadspliktig og teller i BYA.`)
      else punkter.push(`Dekket står ${m(h)} over terreng (≤ 0,5 m) – åpen platting er normalt søknadsfri.`)
      nabo(1.0)
      if (!sokfri && !inn.beboelse) merknader.push('Hevet terrasse er et tilbygg/frittstående tiltak – inntil 50 m² kan normalt søkes om uten ansvarsrett (SAK10 § 3-1).')
      rekkverk = rekkverkKrav(inn.fallhoydeM ?? h, inn.rekkverkHoydeM)
      break
    }
    case 'pergola': {
      regel = 'SAK10 § 4-1 (mindre tiltak) – USIKKER klassifisering'
      punkter.push('Åpen pergola uten tett tak regnes normalt ikke som bygning. Med tett tak (polykarbonat o.l.) vurderes den som tilbygg/frittliggende bygning med areal- og avstandsgrenser.')
      if (areal > 15) punkter.push(`Areal ${m2(areal)}: med tett tak inntil bolig gjelder 15 m²-grensen for tilbygg.`)
      hoyder()
      nabo(1.0)
      break
    }
    case 'smatiltak': {
      regel = 'Ikke bygning – normalt ikke søknadspliktig'
      punkter.push('Små frittstående konstruksjoner (plantekasse, postkassestativ o.l.) er normalt ikke søknadspliktige.')
      merknader.push('Postkassestativ: følg Postens krav til plassering/høyde. Ved avkjørsel: ikke hindre sikt (vegloven/kommunens sikttrekant).')
      break
    }
  }

  merknader.push(SJEKK_MED_KOMMUNEN)
  return {
    sokfri,
    tittel: sokfri ? 'Trolig søknadsfritt' : 'Trolig søknadspliktig',
    regel,
    punkter,
    merknader,
    rekkverk,
    sjekkMedKommunen: SJEKK_MED_KOMMUNEN,
  }
}

/** Konverter til `Byggeregler` (types.ts) slik at templatets `byggeregler()` kan returnere det direkte. */
export function tilByggeregler(r: ByggesakResultat): { sokfri: boolean; tittel: string; punkter: string[] } {
  return { sokfri: r.sokfri, tittel: r.tittel, punkter: [`Vurdert etter ${r.regel}.`, ...r.punkter, ...(r.rekkverk?.tekst ?? []), ...r.merknader] }
}
