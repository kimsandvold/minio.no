/**
 * Vipps ePayment API-klient (server-side).
 *
 * All kommunikasjon med Vipps skjer herfra – aldri fra klienten, siden
 * nøklene er hemmelige. Kjører mot testmiljøet (apitest.vipps.no) så lenge
 * VIPPS_ENV != 'production'.
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 */

export interface VippsCreds {
  clientId: string
  clientSecret: string
  subscriptionKey: string
  msn: string
  /** 'test' (apitest.vipps.no) eller 'production' (api.vipps.no). */
  env: string
}

const SYSTEM_NAME = 'minio'
const SYSTEM_VERSION = '1.0.0'

function baseUrl(env: string): string {
  return env === 'production' ? 'https://api.vipps.no' : 'https://apitest.vipps.no'
}

/** Felles headers for ePayment-kall (uten Authorization). */
function apiHeaders(creds: VippsCreds): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': creds.subscriptionKey,
    'Merchant-Serial-Number': creds.msn,
    'Vipps-System-Name': SYSTEM_NAME,
    'Vipps-System-Version': SYSTEM_VERSION,
    'Vipps-System-Plugin-Name': 'minio-designverktoy',
    'Vipps-System-Plugin-Version': SYSTEM_VERSION,
  }
}

/** Henter et OAuth-token. Token varer ~1t; vi henter et ferskt pr. kall (enkelt). */
export async function getAccessToken(creds: VippsCreds): Promise<string> {
  const res = await fetch(`${baseUrl(creds.env)}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      'Ocp-Apim-Subscription-Key': creds.subscriptionKey,
      'Merchant-Serial-Number': creds.msn,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vipps accesstoken feilet (${res.status}): ${body}`)
  }
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export interface CreatePaymentInput {
  /** Beløp i kroner (heltall/ører håndteres her). */
  belopKr: number
  /** Unik referanse for betalingen (8–50 tegn, a–z 0–9 - _). */
  reference: string
  /** Hvor Vipps sender brukeren tilbake etter betaling. */
  returnUrl: string
  /** Vises i Vipps-appen. */
  beskrivelse: string
}

/**
 * Oppretter en betaling (WEB_REDIRECT) og returnerer redirect-URL som
 * klienten skal sende brukeren til.
 */
export async function createPayment(
  creds: VippsCreds,
  token: string,
  input: CreatePaymentInput,
): Promise<{ redirectUrl: string; reference: string }> {
  const res = await fetch(`${baseUrl(creds.env)}/epayment/v1/payments`, {
    method: 'POST',
    headers: {
      ...apiHeaders(creds),
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': input.reference,
    },
    body: JSON.stringify({
      amount: { currency: 'NOK', value: Math.round(input.belopKr * 100) },
      paymentMethod: { type: 'WALLET' },
      reference: input.reference,
      returnUrl: input.returnUrl,
      userFlow: 'WEB_REDIRECT',
      paymentDescription: input.beskrivelse,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vipps createPayment feilet (${res.status}): ${body}`)
  }
  const data = (await res.json()) as { redirectUrl: string; reference: string }
  return { redirectUrl: data.redirectUrl, reference: data.reference }
}

export type VippsState = 'CREATED' | 'AUTHORIZED' | 'TERMINATED' | 'ABORTED' | 'EXPIRED'

/** Henter betalingsstatus for en referanse. */
export async function getPayment(
  creds: VippsCreds,
  token: string,
  reference: string,
): Promise<{ state: VippsState; aggregate?: { authorizedAmount?: { value: number } } }> {
  const res = await fetch(`${baseUrl(creds.env)}/epayment/v1/payments/${reference}`, {
    method: 'GET',
    headers: { ...apiHeaders(creds), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vipps getPayment feilet (${res.status}): ${body}`)
  }
  return (await res.json()) as { state: VippsState; aggregate?: { authorizedAmount?: { value: number } } }
}

/**
 * Kaprer (trekker) et autorisert beløp. For digitalt salg (byggeplan)
 * kaprer vi hele beløpet umiddelbart etter autorisering.
 */
export async function capturePayment(
  creds: VippsCreds,
  token: string,
  reference: string,
  belopKr: number,
): Promise<void> {
  const res = await fetch(`${baseUrl(creds.env)}/epayment/v1/payments/${reference}/capture`, {
    method: 'POST',
    headers: {
      ...apiHeaders(creds),
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': `${reference}-capture`,
    },
    body: JSON.stringify({ modificationAmount: { currency: 'NOK', value: Math.round(belopKr * 100) } }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vipps capture feilet (${res.status}): ${body}`)
  }
}
