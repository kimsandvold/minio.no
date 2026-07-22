import { auth } from '../lib/firebase'
import type { DesignerProsjekt, Vare } from '../types/designerProsjekt'

/**
 * Vipps-betaling – klientdel.
 *
 * All Vipps-kommunikasjon skjer på serveren (nøklene er hemmelige). Her kaller
 * vi de to serverless-endepunktene på Vercel:
 *  - POST /api/vipps/create → oppretter betaling, returnerer redirectUrl
 *  - POST /api/vipps/status → sjekker status etter retur fra Vipps
 *
 * Innlogging sendes som et Firebase ID-token i Authorization-headeren, som
 * serveren verifiserer med Firebase Admin.
 */

// Tom base = samme origin (API og nettside på samme domene). Sett
// VITE_VIPPS_API_URL hvis API-et kjøres på et eget domene.
const API_BASE = (import.meta.env.VITE_VIPPS_API_URL ?? '').replace(/\/$/, '')

export interface VippsResultat {
  ok: boolean
  redirectUrl?: string
  message: string
}

// Pris (NOK) pr. leveranse pr. produkttype – speiler PRISER/DEFAULT_PRIS i
// api/_lib/pricing.ts. Kun til visning; serveren er autoritativ på pris.
const DEFAULT_PRIS: Record<Vare | 'bundle', number> = { plan: 299, soknad: 990, cnc: 399, bundle: 1490 }
// Byggeplan (`plan`) prises per produkt og speiler `fraPris` i templatene samt
// PRISER i api/_lib/pricing.ts. Byggeplan-raden viser `template.fraPris`
// direkte; dette kartet holder klient-estimatet i tråd med serverprisen.
const VIPPS_BELOP: Record<string, Partial<Record<Vare, number>>> = {
  plantekasse: { plan: 199 },
  pergola: { plan: 249 },
  terrasse: { plan: 349 },
  utekjokken: { plan: 349 },
  carport: { plan: 449 },
  varmepumpehus: { plan: 199 },
  soppelboder: { plan: 349 },
  vedskjul: { plan: 349 },
  postkassestativer: { plan: 249 },
  utedo: { plan: 349 },
}

export function vippsBelopFor(templateId: string, vare: Vare | 'bundle' = 'plan'): number {
  const v = vare === 'bundle' ? 'bundle' : vare
  return (v !== 'bundle' && VIPPS_BELOP[templateId]?.[v]) || DEFAULT_PRIS[v]
}

interface CreatePaymentResp {
  redirectUrl: string | null
  alleredeBetalt: boolean
}

interface StatusResp {
  betalt: boolean
  state: string
  tilgangskode?: string
  vare?: Vare
}

/** Kaller et Vipps-endepunkt med innloggingstoken og returnerer JSON. */
async function kallApi<T>(sti: string, body: Record<string, unknown>): Promise<T> {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Du må være innlogget.')

  const res = await fetch(`${API_BASE}/api/vipps/${sti}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Serverfeil (${res.status})`)
  return data
}

/**
 * Starter betaling. Ved suksess returneres redirectUrl som kalleren skal
 * sende brukeren til (window.location.href = redirectUrl).
 */
export async function startVippsBetaling(
  prosjekt: DesignerProsjekt,
  vare: Vare | 'bundle' = 'plan',
): Promise<VippsResultat> {
  try {
    const data = await kallApi<CreatePaymentResp>('create', {
      prosjektId: prosjekt.id,
      returnOrigin: window.location.origin,
      vare,
    })
    if (data.alleredeBetalt) {
      return { ok: true, message: 'Denne leveransen er allerede betalt.' }
    }
    if (!data.redirectUrl) {
      return { ok: false, message: 'Kunne ikke starte betaling. Prøv igjen.' }
    }
    return { ok: true, redirectUrl: data.redirectUrl, message: 'Sender deg til Vipps …' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ukjent feil'
    return { ok: false, message: `Vipps-betaling feilet: ${msg}` }
  }
}

/**
 * Sjekker betalingsstatus etter retur fra Vipps. Returnerer om designet er
 * betalt (og dermed låst opp). Serveren kaprer beløpet ved autorisering.
 */
export async function sjekkVippsStatus(prosjektId: string): Promise<StatusResp> {
  try {
    return await kallApi<StatusResp>('status', { prosjektId })
  } catch {
    return { betalt: false, state: 'ERROR' }
  }
}
