/**
 * POST /api/vipps/status
 *
 * Sjekker Vipps-status for et design. Ved AUTHORIZED kaprer den beløpet, låser
 * opp leveransene server-side (betalt + kjopt + frosset), lager tilgangskoden
 * og sender den på e-post. Kalles fra retur-siden (polling).
 *
 * Body: { prosjektId: string }
 * Auth: Authorization: Bearer <Firebase ID-token>
 */
import type { VercelRequest } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, db } from '../_lib/firebaseAdmin'
import { HttpError, postHandler } from '../_lib/http'
import { creds } from '../_lib/creds'
import { normaliserVare, prisFor, VARER_FOR_KJOP } from '../_lib/pricing'
import { alleredeKjopt, eideKjopt, laasOppLeveranse, type ProsjektDoc } from '../_lib/entitlements'
import { nyTilgangskode } from '../_lib/kode'
import { sendTilgangskode } from '../_lib/email'
import { capturePayment, getAccessToken, getPayment } from '../_lib/vipps'

const COLLECTION = 'designerProsjekter'
const SITE_URL = (process.env.SITE_URL ?? 'https://minio.no').replace(/\/$/, '')

export default postHandler(async (req: VercelRequest, uid: string) => {
  const prosjektId = String(req.body?.prosjektId ?? '')
  if (!prosjektId) throw new HttpError(400, 'Mangler prosjektId.')

  const ref = db.collection(COLLECTION).doc(prosjektId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpError(404, 'Fant ikke designet.')
  const p = snap.data() as ProsjektDoc
  if (p.userId !== uid) throw new HttpError(403, 'Dette designet tilhører ikke deg.')

  const vare = normaliserVare(p.vipps?.vare)
  // Leveransene fra det siste betalingsforsøket er allerede låst opp.
  if (alleredeKjopt(eideKjopt(p), vare)) {
    return { betalt: true, state: 'AUTHORIZED', tilgangskode: p.tilgangskode ?? '', vare }
  }

  const reference = p.vipps?.reference
  if (!reference) return { betalt: false, state: 'NONE' }

  const c = creds()
  const token = await getAccessToken(c)
  const payment = await getPayment(c, token, reference)

  if (payment.state === 'AUTHORIZED') {
    const belopKr = p.vipps?.belop ?? prisFor(p.templateId, vare)
    // Kapre beløpet (trekk pengene). Idempotent på Vipps-siden.
    await capturePayment(c, token, reference, belopKr)

    // Koden lages her, aldri på klienten, og settes bare ved første kjøp.
    const tilgangskode = p.tilgangskode || nyTilgangskode()
    await laasOppLeveranse(ref, p, vare, tilgangskode)

    // E-posten skal ikke kunne velte et gjennomført kjøp: feil logges i
    // sendEpost og ignoreres her.
    const epost = await adminAuth
      .getUser(uid)
      .then((u) => u.email)
      .catch(() => undefined)
    if (epost) {
      await sendTilgangskode({
        til: epost,
        designNavn: p.navn,
        tilgangskode,
        leveranser: VARER_FOR_KJOP[vare],
        belopKr,
        designUrl: `${SITE_URL}/designverktoy/${p.templateId}`,
      })
    } else {
      console.warn(`[vipps] Ingen e-postadresse på bruker ${uid} – tilgangskode ikke sendt.`)
    }

    return { betalt: true, state: payment.state, tilgangskode, vare }
  }

  const failed = payment.state === 'TERMINATED' || payment.state === 'ABORTED' || payment.state === 'EXPIRED'
  if (failed && p.vipps?.status !== 'failed') {
    await ref.update({ 'vipps.status': 'failed', updatedAt: FieldValue.serverTimestamp() })
  }
  return { betalt: false, state: payment.state }
})
