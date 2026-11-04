/**
 * Kundeopplysninger som ALLTID skal fanges opp når noe skal faktureres.
 *
 * Bakgrunnen: en faktura må kunne sendes og en vare må kunne leveres. Da
 * holder det ikke med e-posten Google gir oss – vi trenger fullt navn, mobil
 * og leveringsadresse. Alle betalingsbelagte veier bruker denne blokka, slik
 * at ingen bestilling havner i /admin uten at vi kan nå kunden.
 */
export interface Kundeopplysninger {
  fulltNavn: string
  epost: string
  mobil: string
  adresse: string
  postnr: string
  poststed: string
}

export const TOM_KUNDE: Kundeopplysninger = {
  fulltNavn: '',
  epost: '',
  mobil: '',
  adresse: '',
  postnr: '',
  poststed: '',
}

/** Norsk mobilnummer: 8 siffer, kan skrives med mellomrom eller +47 foran. */
export function gyldigMobil(v: string): boolean {
  const rent = v.replace(/[\s-]/g, '').replace(/^\+?47/, '')
  return /^[49]\d{7}$/.test(rent)
}

export function gyldigPostnr(v: string): boolean {
  return /^\d{4}$/.test(v.trim())
}

export function gyldigEpost(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

/**
 * Returnerer en feilmelding per felt som ikke holder mål, eller null når alt
 * er på plass. Brukes både til å sperre innsending og til å vise hva som
 * mangler – aldri bare «fyll ut skjemaet».
 */
export function validerKunde(k: Kundeopplysninger): Partial<Record<keyof Kundeopplysninger, string>> | null {
  const feil: Partial<Record<keyof Kundeopplysninger, string>> = {}
  if (k.fulltNavn.trim().split(/\s+/).length < 2) feil.fulltNavn = 'Skriv både fornavn og etternavn.'
  if (!gyldigEpost(k.epost)) feil.epost = 'Skriv en gyldig e-postadresse.'
  if (!gyldigMobil(k.mobil)) feil.mobil = 'Åtte siffer, norsk mobilnummer.'
  if (k.adresse.trim().length < 4) feil.adresse = 'Gateadresse med husnummer.'
  if (!gyldigPostnr(k.postnr)) feil.postnr = 'Fire siffer.'
  if (k.poststed.trim().length < 2) feil.poststed = 'Fyll inn poststed.'
  return Object.keys(feil).length ? feil : null
}

/** Normaliserer før lagring, så /admin slipper å se på rot. */
export function ryddKunde(k: Kundeopplysninger): Kundeopplysninger {
  return {
    fulltNavn: k.fulltNavn.trim().replace(/\s+/g, ' '),
    epost: k.epost.trim().toLowerCase(),
    mobil: k.mobil.replace(/[\s-]/g, '').replace(/^\+?47/, ''),
    adresse: k.adresse.trim().replace(/\s+/g, ' '),
    postnr: k.postnr.trim(),
    poststed: k.poststed.trim().replace(/\s+/g, ' '),
  }
}
