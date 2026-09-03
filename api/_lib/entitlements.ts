/**
 * Opplåsing av leveranser (entitlements) – server-autoritativt.
 *
 * Klienten kan ikke lenger skrive `betalt`, `kjopt`, `frosset`, `vipps` eller
 * `tilgangskode` (se firestore.rules). All opplåsing går gjennom denne filen,
 * som kalles fra api/vipps/status.ts (etter kapret betaling) og
 * api/vipps/redeem.ts (innløsing av tilgangskode).
 */
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore'
import { VARER_FOR_KJOP, type Vare } from './pricing'

/** Feltene vi bruker fra et designerProsjekter-dokument. */
export interface ProsjektDoc {
  userId: string
  templateId: string
  navn: string
  betalt?: boolean
  kjopt?: Record<string, boolean>
  frosset?: { kjopt?: Record<string, boolean> }
  tilgangskode?: string
  config?: Record<string, unknown>
  overrides?: Record<string, unknown>
  vipps?: { status: string; reference?: string; belop?: number; vare?: Vare }
}

/**
 * Bakoverkompatibel lesing av entitlements: eldre design har bare
 * `betalt: true` uten `kjopt`, og det betydde den gang plan + søknad.
 */
export function eideKjopt(p: ProsjektDoc): Record<string, boolean> {
  return p.kjopt ?? (p.betalt ? { plan: true, soknad: true } : {})
}

/** Har designet allerede alle leveransene dette kjøpet gir? */
export function alleredeKjopt(kjopt: Record<string, boolean> | undefined, vare: Vare): boolean {
  return VARER_FOR_KJOP[vare].every((flag) => kjopt?.[flag] === true)
}

/**
 * Låser opp leveransene for `vare` og fryser designet.
 *
 * Frysningen er kilden for nedlastet plan/søknad, så ett kjøp ikke kan gi flere
 * ulike planer. Den settes ved FØRSTE kjøp og røres ikke siden – senere kjøp
 * (f.eks. søknadshefte i tillegg til planen) utvider bare `frosset.kjopt`, slik
 * at tilleggsleveransen gjelder samme tegning kunden alt har betalt for.
 *
 * @param tilgangskode Settes kun når den mangler (første kjøp).
 */
export async function laasOppLeveranse(
  ref: DocumentReference,
  p: ProsjektDoc,
  vare: Vare,
  tilgangskode?: string,
): Promise<Record<string, boolean>> {
  const kjopt = { ...eideKjopt(p) }
  for (const flag of VARER_FOR_KJOP[vare]) kjopt[flag] = true

  const patch: Record<string, unknown> = {
    betalt: true,
    kjopt,
    'vipps.status': 'paid',
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (p.frosset) {
    // Designet er alt fryst: utvid bare hvilke leveranser frysningen dekker.
    patch['frosset.kjopt'] = kjopt
  } else {
    patch.frosset = {
      config: p.config ?? {},
      overrides: p.overrides ?? {},
      kjopt,
      kjoptAt: FieldValue.serverTimestamp(),
    }
  }

  if (tilgangskode && !p.tilgangskode) patch.tilgangskode = tilgangskode

  await ref.update(patch)
  return kjopt
}
