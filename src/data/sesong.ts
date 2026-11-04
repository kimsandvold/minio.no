/**
 * Sesong – ett sted som bestemmer hva forsiden fremhever.
 *
 * Minio har to arbeidssesonger: verkstedet graverer om vinteren og bygger i tre
 * om sommeren. Sesongen styrer BARE rekkefølgen og teksten på forsidens
 * gravering-seksjon – aldri hva som finnes. Alle sider er tilgjengelige og indekserbare hele året,
 * ellers mister vi søkerangeringen i halve sesongen vi faktisk skal selge i.
 *
 * Helten på forsiden er bevisst holdt utenfor: bildene der er koblet til hver
 * sin modell i designverktøyet, og den koblingen skal stå hele året.
 *
 * Vil du bytte fokus tidlig (eller teste den andre sesongen), sett
 * `SESONG_OVERSTYRING` til 'vinter' eller 'sommer'. Null = følg kalenderen.
 */

export type Sesong = 'vinter' | 'sommer'

/** Sett til 'vinter' eller 'sommer' for å overstyre kalenderen. */
export const SESONG_OVERSTYRING: Sesong | null = null

/** Oktober–mars er verkstedsesong (gravering), april–september er utesesong (tre). */
export function sesongFor(dato: Date): Sesong {
  const maned = dato.getMonth()
  return maned >= 9 || maned <= 2 ? 'vinter' : 'sommer'
}

export function gjeldendeSesong(dato: Date = new Date()): Sesong {
  return SESONG_OVERSTYRING ?? sesongFor(dato)
}

/**
 * 15. oktober – 20. desember. Styrer «Julegave»-merket i menyen; etter 20.
 * desember rekker vi ikke å levere til jul, og da skal merket vekk.
 */
export function erJulegavesesong(dato: Date = new Date()): boolean {
  const maned = dato.getMonth()
  const dag = dato.getDate()
  if (maned === 9) return dag >= 15
  if (maned === 10) return true
  if (maned === 11) return dag <= 20
  return false
}

interface SesongInnhold {
  /** Rekkefølgen på forsidens seksjoner. Alle vises – bare rekkefølgen endres. */
  forsideRekkefolge: Array<'veier' | 'gravering' | 'produkter' | 'designer' | 'kompass' | 'guider' | 'spill' | 'levering'>
  /** Teksten på gravering-seksjonen når den står øverst vs. lenger ned. */
  gravering: {
    eyebrow: string
    tittel: string
    ingress: string
  }
}

/**
 * Gravering-teksten i julegavesesongen. November og desember er verkstedets
 * viktigste salgsperiode, så da overstyrer dette vintervarianten; resten av
 * vinteren står teksten i `sesongInnhold.vinter`.
 */
export const julegaveInnhold: SesongInnhold['gravering'] = {
  eyebrow: 'Gravering · julegaver',
  tittel: 'Julegaven med navnet på.',
  ingress:
    'Skjærefjøl i bøk, pregekjevle til pepperkakene eller drikkeflaske i stål – med navn, dato eller en hilsen. Du skriver teksten og ser gaven bli til med en gang. Vi graverer i verkstedet på Lillehammer og sender den hjem til deg.',
}

/** Teksten gravering-seksjonen skal ha nå: jul slår vinter, vinter slår sommer. */
export function graveringInnhold(dato: Date = new Date()): SesongInnhold['gravering'] {
  return erJulegavesesong(dato) ? julegaveInnhold : sesongInnhold[gjeldendeSesong(dato)].gravering
}

export const sesongInnhold: Record<Sesong, SesongInnhold> = {
  vinter: {
    forsideRekkefolge: ['gravering', 'veier', 'produkter', 'designer', 'kompass', 'guider', 'spill', 'levering'],
    gravering: {
      eyebrow: 'Gravering',
      tittel: 'Tegn den ferdig før vi graverer.',
      ingress:
        'Skjærefjøl i bøk, pregekjevle til pepperkakene og drikkeflaske i stål. Velg produkt og motiv, skriv inn teksten, og se den bli til mens du skriver.',
    },
  },
  sommer: {
    forsideRekkefolge: ['veier', 'produkter', 'designer', 'kompass', 'gravering', 'guider', 'spill', 'levering'],
    gravering: {
      eyebrow: 'Gravering',
      tittel: 'Sett navnet på det du har bygget.',
      ingress:
        'Husnummer på boden, adresseskilt til postkassestativet, en gravert fjøl til kjøkkenet eller en pregekjevle til julebaksten. Samme verksted – bare med laser i stedet for sag.',
    },
  },
}
