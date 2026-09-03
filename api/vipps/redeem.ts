/**
 * POST /api/vipps/redeem
 *
 * Løser inn en 6-sifret tilgangskode og låser opp leveransene server-side.
 * Klienten kan ikke lenger skrive `betalt`/`kjopt` selv (se firestore.rules),
 * så dette er den ENESTE veien til opplåsing utenom en kapret Vipps-betaling.
 *
 * Brukes til:
 *  - Å låse opp igjen hvis noe gikk galt mellom betaling og skriving.
 *  - Manuelle salg: sett `tilgangskode` (og evt. `vipps.vare`) på designet i
 *    Firebase-konsollen, og gi koden til kunden.
 *
 * Body: { prosjektId: string, kode: string }
 * Auth: Authorization: Bearer <Firebase ID-token>
 */
import type { VercelRequest } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../_lib/firebaseAdmin'
import { HttpError, postHandler } from '../_lib/http'
import { normaliserVare, VARER_FOR_KJOP } from '../_lib/pricing'
import { eideKjopt, laasOppLeveranse, type ProsjektDoc } from '../_lib/entitlements'
import { kodeMatcher } from '../_lib/kode'

const COLLECTION = 'designerProsjekter'
const FORESPORSLER = 'designForesporsler'
// Koden har bare 10^6 muligheter, og eieren kan prøve seg fram på sitt eget
// design. Etter dette antallet bomforsøk er koden død for godt.
const MAKS_FORSOK = 10

interface KodeDoc extends ProsjektDoc {
  kodeForsok?: number
}

export default postHandler(async (req: VercelRequest, uid: string) => {
  const prosjektId = String(req.body?.prosjektId ?? '')
  const kode = String(req.body?.kode ?? '').trim()
  if (!prosjektId) throw new HttpError(400, 'Mangler prosjektId.')
  if (!/^\d{6}$/.test(kode)) throw new HttpError(400, 'Koden er 6 siffer.')

  const ref = db.collection(COLLECTION).doc(prosjektId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpError(404, 'Fant ikke designet.')
  const p = snap.data() as KodeDoc
  if (p.userId !== uid) throw new HttpError(403, 'Dette designet tilhører ikke deg.')

  const forsok = p.kodeForsok ?? 0
  if (forsok >= MAKS_FORSOK) {
    throw new HttpError(429, 'For mange forsøk på denne koden. Ta kontakt via kontaktskjemaet på minio.no/kontakt.')
  }

  // Koden kan ligge to steder:
  //  1. På designet – satt ved kapret Vipps-betaling, eller manuelt av admin.
  //  2. På en 'byggeplan'-forespørsel – den manuelle salgsveien, der koden
  //     bevisst holdes utenfor dokumentet kunden selv kan lese.
  let gyldig = !!p.tilgangskode && kodeMatcher(kode, p.tilgangskode)
  if (!gyldig) {
    const fores = await db
      .collection(FORESPORSLER)
      .where('designId', '==', prosjektId)
      .where('type', '==', 'byggeplan')
      .limit(5)
      .get()
    gyldig = fores.docs.some((d) => {
      const lagret = d.get('tilgangskode')
      return typeof lagret === 'string' && lagret.length === 6 && kodeMatcher(kode, lagret)
    })
    // Marker forespørselen som gjort opp, så admin ser at koden er brukt.
    if (gyldig) {
      await Promise.all(
        fores.docs.map((d) => d.ref.update({ status: 'lukket', innlostAt: FieldValue.serverTimestamp() })),
      )
    }
  }

  if (!gyldig) {
    await ref.update({ kodeForsok: FieldValue.increment(1) })
    const igjen = MAKS_FORSOK - forsok - 1
    throw new HttpError(
      403,
      igjen > 0 ? `Feil kode. ${igjen} forsøk igjen.` : 'Feil kode. Ingen forsøk igjen.',
    )
  }

  const vare = normaliserVare(p.vipps?.vare)
  const kjopt = await laasOppLeveranse(ref, p, vare)
  if (forsok > 0) await ref.update({ kodeForsok: 0 })

  return { ok: true, kjopt, leveranser: VARER_FOR_KJOP[vare], vare, eide: eideKjopt(p) }
})
