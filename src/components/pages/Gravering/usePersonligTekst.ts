import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '../../../context/AuthContext'

/**
 * Personlig utfylling av graveringsmalene.
 *
 * En mal som sier «Familien Berg · Lillehammer» er en tom plass kunden må
 * fylle selv. Sier den «Familien Sandvold · Gjøvik» er den nesten ferdig. Derfor
 * skriver malene tokens – `{familie}`, `{sted}`, `{ar}` – som settes inn her.
 *
 * Tre kilder, i denne rekkefølgen:
 *
 * 1. Innlogget bruker (Google-navnet) – navn og initial.
 * 2. Posisjon fra nettleseren, slått opp til stedsnavn hos Nominatim. Vi spør
 *    ALDRI av oss selv: enten har brukeren gitt tillatelse før (da leser vi den
 *    stille), eller så må hen trykke på knappen.
 * 3. Standardverdier – de samme plassholderne som sto i malene før.
 *
 * Nettleserspråket brukes ikke til tekst: sidene er norske uansett, og en
 * engelsk mal ville sett rar ut på et norsk produkt.
 */

export interface Personlig {
  fornavn: string
  etternavn: string
  familie: string
  sted: string
  ar: string
  initial: string
  /** Sant når vi kan be om posisjon uten at det blir påtrengende. */
  kanSpoerreOmSted: boolean
  /** Stedet kom fra nettleserposisjonen, ikke fra standardverdiene. */
  stedErEkte: boolean
  spoerOmSted: () => void
}

const STANDARD_FORNAVN = 'Emma'
const STANDARD_ETTERNAVN = 'Berg'
const STANDARD_STED = 'Lillehammer'

/** Stedsnavnet holder en økt, så vi ikke slår opp på nytt ved hver visning. */
const LAGER = 'minio.gravering.sted'

function navnedeler(fulltNavn: string | undefined): { fornavn: string; etternavn: string } {
  const deler = (fulltNavn ?? '').trim().split(/\s+/).filter(Boolean)
  if (!deler.length) return { fornavn: STANDARD_FORNAVN, etternavn: STANDARD_ETTERNAVN }
  if (deler.length === 1) return { fornavn: deler[0], etternavn: STANDARD_ETTERNAVN }
  return { fornavn: deler[0], etternavn: deler[deler.length - 1] }
}

/** Slår koordinater om til et stedsnavn. Samme tjeneste som leveringskalkulatoren. */
async function stedFraPosisjon(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=12&accept-language=nb`
    const data = await (await fetch(url)).json()
    const a = data?.address ?? {}
    const navn = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.county
    return typeof navn === 'string' && navn.trim() ? navn.trim() : null
  } catch {
    return null
  }
}

export function usePersonligTekst(): Personlig {
  const { user } = useAuthContext()
  const [sted, settSted] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(LAGER)
    } catch {
      return null
    }
  })
  const [kanSpoerre, settKanSpoerre] = useState(false)

  const hentSted = useCallback(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const navn = await stedFraPosisjon(pos.coords.latitude, pos.coords.longitude)
        if (!navn) return
        settSted(navn)
        settKanSpoerre(false)
        try {
          sessionStorage.setItem(LAGER, navn)
        } catch {
          // Privat nettlesing – da slår vi bare opp på nytt neste gang.
        }
      },
      () => settKanSpoerre(false),
      { maximumAge: 600000, timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    if (sted || !('geolocation' in navigator)) return
    let avbrutt = false
    // Har brukeren allerede gitt tillatelse, leser vi posisjonen stille. Hvis
    // ikke, viser vi knappen i stedet for å utløse en dialog ingen har bedt om.
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        if (avbrutt) return
        if (p.state === 'granted') hentSted()
        else if (p.state === 'prompt') settKanSpoerre(true)
      })
      .catch(() => settKanSpoerre(true))
    return () => {
      avbrutt = true
    }
  }, [sted, hentSted])

  const { fornavn, etternavn } = navnedeler(user?.name)

  return {
    fornavn,
    etternavn,
    familie: `Familien ${etternavn}`,
    sted: sted ?? STANDARD_STED,
    ar: String(new Date().getFullYear()),
    initial: etternavn.charAt(0).toUpperCase(),
    kanSpoerreOmSted: kanSpoerre,
    stedErEkte: Boolean(sted),
    spoerOmSted: hentSted,
  }
}

/** Setter inn `{token}`-verdiene i én tekstlinje. Ukjente tokens står igjen. */
export function fyllTekst(tekst: string, p: Personlig): string {
  return tekst.replace(/\{(fornavn|etternavn|familie|sted|ar|initial)\}/g, (_, nokkel: string) => {
    const verdier: Record<string, string> = {
      fornavn: p.fornavn,
      etternavn: p.etternavn,
      familie: p.familie,
      sted: p.sted,
      ar: p.ar,
      initial: p.initial,
    }
    return verdier[nokkel] ?? ''
  })
}

/** Samme for et helt sett tekstlinjer. */
export function fyllLinjer(linjer: [string, string, string], p: Personlig): [string, string, string] {
  return linjer.map((l) => fyllTekst(l, p)) as [string, string, string]
}
