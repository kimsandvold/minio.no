/**
 * POST /api/vipps/status
 *
 * Sjekker Vipps-status for et design. Ved AUTHORIZED kaprer den beløpet og
 * setter betalt=true + vipps.status='paid'. Kalles fra retur-siden (polling).
 *
 * Body: { prosjektId: string }
 * Auth: Authorization: Bearer <Firebase ID-token>
 */
import type { VercelRequest } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../_lib/firebaseAdmin'
import { HttpError, postHandler } from '../_lib/http'
import { creds } from '../_lib/creds'
import { alleredeKjopt, normaliserVare, prisFor, VARER_FOR_KJOP, type Vare } from '../_lib/pricing'
import { capturePayment, getAccessToken, getPayment } from '../_lib/vipps'

const COLLECTION = 'designerProsjekter'

interface ProsjektDoc {
  userId: string
  templateId: string
  navn: string
  betalt: boolean
  kjopt?: Record<string, boolean>
  tilgangskode: string
  vipps?: { status: string; reference?: string; belop?: number; vare?: Vare }
}

export default postHandler(async (req: VercelRequest, uid: string) => {
  const prosjektId = String(req.body?.prosjektId ?? '')
  if (!prosjektId) throw new HttpError(400, 'Mangler prosjektId.')

  const ref = db.collection(COLLECTION).doc(prosjektId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpError(404, 'Fant ikke designet.')
  const p = snap.data() as ProsjektDoc
  if (p.userId !== uid) throw new HttpError(403, 'Dette designet tilhører ikke deg.')

  const vare = normaliserVare(p.vipps?.vare)
  const eideKjopt = p.kjopt ?? (p.betalt ? { plan: true, soknad: true } : {})
  // Leveransene fra det siste betalingsforsøket er allerede låst opp.
  if (alleredeKjopt(eideKjopt, vare)) {
    return { betalt: true, state: 'AUTHORIZED', tilgangskode: p.tilgangskode, vare }
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
    const patch: Record<string, unknown> = {
      betalt: true,
      'vipps.status': 'paid',
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const flag of VARER_FOR_KJOP[vare]) patch[`kjopt.${flag}`] = true
    await ref.update(patch)
    // TODO: send tilgangskode på e-post når e-postleverandør er koblet på.
    return { betalt: true, state: payment.state, tilgangskode: p.tilgangskode, vare }
  }

  const failed = payment.state === 'TERMINATED' || payment.state === 'ABORTED' || payment.state === 'EXPIRED'
  if (failed && p.vipps?.status !== 'failed') {
    await ref.update({ 'vipps.status': 'failed', updatedAt: FieldValue.serverTimestamp() })
  }
  return { betalt: false, state: payment.state }
})
