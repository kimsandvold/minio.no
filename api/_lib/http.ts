/**
 * Felles HTTP-hjelpere for Vipps-endepunktene: CORS, metode-sjekk og
 * verifisering av Firebase-innlogging (ID-token i Authorization-headeren).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminAuth } from './firebaseAdmin'

// Tillatt opphav for CORS. Samme-origin-deploy trenger det ikke, men det gjør
// det trygt å kjøre API-et på et eget subdomene om ønskelig.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'https://minio.no'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/** Verifiserer ID-tokenet og returnerer uid. Kaster HttpError(401) ellers. */
export async function requireUid(req: VercelRequest): Promise<string> {
  const header = String(req.headers.authorization ?? '')
  const match = header.match(/^Bearer (.+)$/)
  if (!match) throw new HttpError(401, 'Du må være innlogget.')
  try {
    const decoded = await adminAuth.verifyIdToken(match[1])
    return decoded.uid
  } catch {
    throw new HttpError(401, 'Ugyldig eller utløpt innlogging.')
  }
}

/**
 * Kjører en POST-handler med CORS, OPTIONS-preflight, metode-sjekk og felles
 * feilhåndtering. Handleren returnerer et objekt som sendes som JSON.
 */
export function postHandler(
  fn: (req: VercelRequest, uid: string) => Promise<unknown>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    applyCors(res)
    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Kun POST er støttet.' })
    try {
      const uid = await requireUid(req)
      const data = await fn(req, uid)
      return res.status(200).json(data)
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500
      const message = e instanceof Error ? e.message : 'Ukjent feil'
      if (status >= 500) console.error('[vipps]', message)
      return res.status(status).json({ error: message })
    }
  }
}
