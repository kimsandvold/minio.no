import type { ProductTemplate } from './types'
import { plantekasse } from './templates/plantekasse'
import { varmepumpehus } from './templates/varmepumpehus'
import { carport } from './templates/carport'
import { terrasse } from './templates/terrasse'
import { pergola } from './templates/pergola'
import { utekjokken } from './templates/utekjokken'
import { soppelbod } from './templates/soppelbod'
import { vedskjul } from './templates/vedskjul'
import { postkassestativ } from './templates/postkassestativ'
import { utedo } from './templates/utedo'
import { garasje } from './templates/garasje'

/**
 * Alle produkter i designverktøyet. Nye produkter migreres inn ett om gangen
 * ved å implementere et `ProductTemplate` og legge det til her – skallet
 * trenger ingen endringer.
 *
 * `kommerSnart`-oppføringer vises i produktvelgeren (grået ut) slik at
 * kunden ser hele spekteret som er på vei.
 */

export const TEMPLATES: ProductTemplate[] = [
  plantekasse as unknown as ProductTemplate,
  varmepumpehus as unknown as ProductTemplate,
  carport as unknown as ProductTemplate,
  terrasse as unknown as ProductTemplate,
  pergola as unknown as ProductTemplate,
  utekjokken as unknown as ProductTemplate,
  soppelbod as unknown as ProductTemplate,
  vedskjul as unknown as ProductTemplate,
  postkassestativ as unknown as ProductTemplate,
  utedo as unknown as ProductTemplate,
  garasje as unknown as ProductTemplate,
]

export interface KommerSnart {
  id: string
  navn: string
  ikon: string
  beskrivelse: string
}

// Kun ferdige produkter vises i designverktøyet. «Kommer snart»-oppføringer
// legges tilbake her når de er implementert.
export const KOMMER_SNART: KommerSnart[] = []

export function getTemplate(id: string): ProductTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
