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
import { alleredeKjopt, normaliserVare, prisFor, type Vare } from '../_lib/pricing'
import { createPayment, getAccessToken } from '../_lib/vipps'

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
  const returnOrigin = String(req.body?.returnOrigin ?? 'https://minio.no').replace(/\/$/, '')
  const vare = normaliserVare(req.body?.vare)
  if (!prosjektId) throw new HttpError(400, 'Mangler prosjektId.')

  const ref = db.collection(COLLECTION).doc(prosjektId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpError(404, 'Fant ikke designet.')
  const p = snap.data() as ProsjektDoc
  if (p.userId !== uid) throw new HttpError(403, 'Dette designet tilhører ikke deg.')

  // Bakoverkompatibelt: eldre `betalt` uten `kjopt` = plan + søknad kjøpt.
  const eideKjopt = p.kjopt ?? (p.betalt ? { plan: true, soknad: true } : {})
  if (alleredeKjopt(eideKjopt, vare)) return { redirectUrl: null, alleredeBetalt: true }

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
