import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { LAGRINGSFRIST_MS, medTidsfrist } from '../utils/medTidsfrist'
import {
  kontaktIdForEpost,
  normaliserEpost,
  type Avmelding,
  type Innlogging,
  type Innloggingsmetode,
  type Kontakt,
  type KontaktKilde,
} from '../types/kontakt'

const KONTAKTER = 'kontakter'
const INNLOGGINGER = 'innlogginger'
const AVMELDINGER = 'avmeldinger'

/**
 * Én økt registreres én gang.
 *
 * `onAuthStateChanged` fyrer på hver eneste sidevisning når økta ligger i
 * nettleseren fra før. Uten denne sperra ville «innlogginger per dag» vært
 * «sidevisninger av innloggede per dag», og tallet hadde sagt mer om hvor mye
 * folk klikker rundt enn om hvor mange som kommer innom.
 */
function alleredeRegistrert(uid: string): boolean {
  try {
    const nokkel = `minio:okt:${uid}`
    if (sessionStorage.getItem(nokkel)) return true
    sessionStorage.setItem(nokkel, '1')
    return false
  } catch {
    // Privat modus uten sessionStorage. Da registrerer vi heller én gang for
    // mye enn å miste tallet helt.
    return false
  }
}

/**
 * Registrerer at en konto er i bruk: oppdaterer kontaktraden og legger én
 * øktrad i `innlogginger`.
 *
 * Kaster aldri. Dette er statistikk – det skal ikke kunne velte en innlogging.
 * Samtykkefeltene røres ikke: `nyhetsbrev` settes bare der brukeren haker av.
 */
export async function registrerOkt(
  uid: string,
  epost: string,
  navn: string,
  metode: Innloggingsmetode,
  epostVerifisert: boolean,
): Promise<void> {
  if (!uid || !epost) return
  if (alleredeRegistrert(uid)) return

  const adresse = normaliserEpost(epost)
  const ref = doc(db, KONTAKTER, uid)

  try {
    const fins = await medTidsfrist(getDoc(ref), LAGRINGSFRIST_MS)

    if (fins.exists()) {
      const forrige = (fins.data().antallOkter as number | undefined) ?? 0
      await updateDoc(ref, {
        epost: adresse,
        navn,
        metode,
        epostVerifisert,
        sistSett: serverTimestamp(),
        antallOkter: forrige + 1,
      })
    } else {
      await setDoc(ref, {
        uid,
        epost: adresse,
        navn,
        kilde: 'innlogging' as KontaktKilde,
        metode,
        nyhetsbrev: false,
        epostVerifisert,
        opprettet: serverTimestamp(),
        sistSett: serverTimestamp(),
        antallOkter: 1,
      })
    }

    await setDoc(doc(collection(db, INNLOGGINGER)), {
      uid,
      epost: adresse,
      metode,
      tidspunkt: serverTimestamp(),
    })
  } catch {
    /* Statistikk er ikke verdt en feilmelding til kunden. */
  }
}

/**
 * Melder en adresse på nyhetsbrevet.
 *
 * To veier inn, fordi de har ulik tillit:
 *   innlogget – raden ligger på uid-en, og brukeren eier den selv
 *   anonym    – raden ligger på adressen, og kan bare opprettes, ikke endres
 *
 * Returnerer true når adressen er registrert. En anonym påmelding på en
 * adresse som finnes fra før gir også true: for den som melder seg på er
 * «du står på lista» samme svar uansett om raden ble laget nå eller i fjor,
 * og et «finnes allerede»-svar ville dessuten røpet hvem som står der.
 */
export async function meldPaaNyhetsbrev(
  epost: string,
  navn: string,
  kilde: KontaktKilde,
  uid?: string,
): Promise<boolean> {
  const adresse = normaliserEpost(epost)
  if (!adresse || adresse.length > 200) return false

  try {
    if (uid) {
      const ref = doc(db, KONTAKTER, uid)
      const fins = await medTidsfrist(getDoc(ref), LAGRINGSFRIST_MS)
      const samtykke = {
        nyhetsbrev: true,
        nyhetsbrevKilde: kilde,
        nyhetsbrevDato: serverTimestamp(),
      }
      if (fins.exists()) {
        await updateDoc(ref, { ...samtykke, navn: navn || (fins.data().navn as string) })
      } else {
        await setDoc(ref, {
          uid,
          epost: adresse,
          navn,
          kilde,
          metode: 'ukjent' as Innloggingsmetode,
          ...samtykke,
          epostVerifisert: false,
          opprettet: serverTimestamp(),
          sistSett: serverTimestamp(),
          antallOkter: 0,
        })
      }
      return true
    }

    await medTidsfrist(
      setDoc(doc(db, KONTAKTER, kontaktIdForEpost(adresse)), {
        uid: '',
        epost: adresse,
        navn,
        kilde,
        metode: 'ukjent' as Innloggingsmetode,
        nyhetsbrev: true,
        nyhetsbrevKilde: kilde,
        nyhetsbrevDato: serverTimestamp(),
        epostVerifisert: false,
        opprettet: serverTimestamp(),
        antallOkter: 0,
      }),
      LAGRINGSFRIST_MS,
    )
    return true
  } catch (feil) {
    // En anonym påmelding på en adresse som allerede står der avvises av
    // reglene (`create` på et dokument som finnes). Det er ikke en feil for
    // den som melder seg på – hen står på lista.
    //
    // Prisen er at en feildeployet regel gir samme svar, og da ville skjemaet
    // sagt «påmeldt» uten at noe ble lagret. Det er en deploy-feil som synes
    // med én gang i admin (lista slutter å vokse), og alternativet – å si
    // «noe gikk galt» til en som allerede står der – er både feil og røper
    // hvem som står på lista.
    const kode = (feil as { code?: string } | null)?.code
    return kode === 'permission-denied' && !uid
  }
}

/**
 * Kontoens svar på nyhetsbrevet. `svart` er true både for ja og for et
 * aktivt nei (avmeldtDato), så spørsmålet ikke dukker opp igjen – heller
 * ikke på en annen enhet. `null` når raden ikke lar seg lese (blokkert
 * Firestore); da spør vi heller ikke.
 */
export async function hentNyhetsbrevStatus(
  uid: string,
): Promise<{ nyhetsbrev: boolean; svart: boolean } | null> {
  try {
    const snap = await medTidsfrist(getDoc(doc(db, KONTAKTER, uid)), LAGRINGSFRIST_MS)
    if (!snap.exists()) return { nyhetsbrev: false, svart: false }
    const d = snap.data()
    return { nyhetsbrev: d.nyhetsbrev === true, svart: d.nyhetsbrev === true || Boolean(d.avmeldtDato) }
  } catch {
    return null
  }
}

/**
 * Kontoen sier nei – fra spørsmålet eller ved å melde seg av på profilsiden.
 * Raden beholdes med `avmeldtDato`, så neiet er dokumentert og huskes.
 */
export async function meldAvNyhetsbrev(uid: string, epost: string, navn: string): Promise<boolean> {
  const ref = doc(db, KONTAKTER, uid)
  try {
    const fins = await medTidsfrist(getDoc(ref), LAGRINGSFRIST_MS)
    if (fins.exists()) {
      await updateDoc(ref, { nyhetsbrev: false, avmeldtDato: serverTimestamp() })
    } else {
      await setDoc(ref, {
        uid,
        epost: normaliserEpost(epost),
        navn,
        kilde: 'innlogging' as KontaktKilde,
        metode: 'ukjent' as Innloggingsmetode,
        nyhetsbrev: false,
        avmeldtDato: serverTimestamp(),
        epostVerifisert: false,
        opprettet: serverTimestamp(),
        sistSett: serverTimestamp(),
        antallOkter: 0,
      })
    }
    return true
  } catch {
    return false
  }
}

/**
 * Melder en adresse av uten innlogging (/avmeld). Kaster aldri: svaret til
 * den som melder seg av er det samme uansett, så siden ikke røper hvem som
 * står på lista.
 */
export async function meldAvMedEpost(epost: string): Promise<boolean> {
  const adresse = normaliserEpost(epost)
  if (adresse.length < 5 || adresse.length > 200) return false
  try {
    await medTidsfrist(
      addDoc(collection(db, AVMELDINGER), { epost: adresse, tidspunkt: serverTimestamp() }),
      LAGRINGSFRIST_MS,
    )
    return true
  } catch {
    return false
  }
}

/** Alle avmeldinger fra /avmeld (admin). */
export async function getAvmeldinger(): Promise<Avmelding[]> {
  const snap = await getDocs(collection(db, AVMELDINGER))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Avmelding)
}

/** Alle kontakter (admin). Nyeste først. */
export async function getAlleKontakter(): Promise<Kontakt[]> {
  const snap = await getDocs(query(collection(db, KONTAKTER), orderBy('opprettet', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kontakt)
}

/** Skrur samtykket av eller på fra admin – f.eks. etter en avmelding på e-post. */
export async function settNyhetsbrev(id: string, paa: boolean): Promise<void> {
  await updateDoc(doc(db, KONTAKTER, id), {
    nyhetsbrev: paa,
    ...(paa ? { nyhetsbrevDato: serverTimestamp() } : { avmeldtDato: serverTimestamp() }),
  })
}

/**
 * Øktene de siste `dager` dagene (admin).
 *
 * Avgrenset på tid, ikke på antall: en graf som viser «de siste 2000» er
 * ubrukelig til å sammenligne uker, fordi perioden den dekker krymper etter
 * hvert som trafikken vokser. Taket på 5000 står igjen som en sikring mot at
 * én spørring drar ned hele sida.
 */
export async function getInnlogginger(dager: number): Promise<Innlogging[]> {
  const fra = new Date()
  fra.setDate(fra.getDate() - dager)
  fra.setHours(0, 0, 0, 0)

  const snap = await getDocs(
    query(
      collection(db, INNLOGGINGER),
      where('tidspunkt', '>=', Timestamp.fromDate(fra)),
      orderBy('tidspunkt', 'desc'),
      limit(5000),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Innlogging)
}
