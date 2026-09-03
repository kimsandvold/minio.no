/**
 * POST /api/vipps/create
 *
 * Oppretter en Vipps-betaling for et lagret design og returnerer redirectUrl.
 * Klienten sender brukeren dit (window.location.href = redirectUrl).
 *
 * Body: { prosjektId: string, returnOrigin: string, vare: 'plan'|'soknad'|'cnc'|'bundle' }
 * Auth: Authorization: Bearer <Firebase ID-token>
 */
import type { VercelRequest } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../_lib/firebaseAdmin'
import { HttpError, postHandler } from '../_lib/http'
import { creds } from '../_lib/creds'
import { kanKjopes, normaliserVare, prisFor, type Vare } from '../_lib/pricing'
import { alleredeKjopt, eideKjopt, type ProsjektDoc } from '../_lib/entitlements'
import { createPayment, getAccessToken } from '../_lib/vipps'

const COLLECTION = 'designerProsjekter'

export default postHandler(async (req: VercelRequest, uid: string) => {
  const prosjektId = String(req.body?.prosjektId ?? '')
  const returnOrigin = String(req.body?.returnOrigin ?? 'https://minio.no').replace(/\/$/, '')
  const vare = normaliserVare(req.body?.vare)
  if (!prosjektId) throw new HttpError(400, 'Mangler prosjektId.')
  // Byggesøknad-heftet er tatt av salg (se SOKNAD_SALG i _lib/pricing.ts).
  if (!kanKjopes(vare)) throw new HttpError(400, 'Byggesøknad-heftet er ikke til salgs for øyeblikket.')

  const ref = db.collection(COLLECTION).doc(prosjektId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpError(404, 'Fant ikke designet.')
  const p = snap.data() as ProsjektDoc
  if (p.userId !== uid) throw new HttpError(403, 'Dette designet tilhører ikke deg.')

  if (alleredeKjopt(eideKjopt(p), vare)) return { redirectUrl: null, alleredeBetalt: true }

  const belopKr = prisFor(p.templateId, vare)
  // Unik referanse pr. forsøk (Vipps krever unik reference pr. betaling).
  const reference = `minio-${prosjektId}-${Date.now().toString(36)}`
  const returnUrl = `${returnOrigin}/designverktoy/${p.templateId}?vipps=${prosjektId}`

  const beskrivelse: Record<Vare, string> = {
    plan: `Byggeplan – ${p.navn}`,
    soknad: `Søknadshefte – ${p.navn}`,
    cnc: `Maskinfiler (DXF/SVG) – ${p.navn}`,
    bundle: `Komplett pakke – ${p.navn}`,
  }

  const c = creds()
  const token = await getAccessToken(c)
  const { redirectUrl } = await createPayment(c, token, {
    belopKr,
    reference,
    returnUrl,
    beskrivelse: beskrivelse[vare],
  })

  await ref.update({
    vipps: { status: 'initiated', reference, belop: belopKr, vare },
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { redirectUrl, alleredeBetalt: false }
})
