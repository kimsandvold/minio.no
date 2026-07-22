/**
 * Leser Vipps-nøklene fra miljøet. På Vercel settes disse som Environment
 * Variables (dashboardet) – lokalt i en .env-fil. De er hemmelige og skal
 * ALDRI eksponeres i frontend-bundelen.
 */
import type { VippsCreds } from './vipps'

function reqEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Miljøvariabelen ${key} mangler.`)
  return value
}

export function creds(): VippsCreds {
  return {
    clientId: reqEnv('VIPPS_CLIENT_ID'),
    clientSecret: reqEnv('VIPPS_CLIENT_SECRET'),
    subscriptionKey: reqEnv('VIPPS_SUBSCRIPTION_KEY'),
    msn: reqEnv('VIPPS_MSN'),
    // 'test' (apitest.vipps.no) eller 'production' (api.vipps.no).
    env: process.env.VIPPS_ENV ?? 'test',
  }
}
