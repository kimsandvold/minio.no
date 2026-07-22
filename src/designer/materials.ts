import type { MaterialChoice } from './types'

/**
 * Delt materialpalett for hele designverktøyet. Templatene plukker de
 * relevante valgene herfra, slik at treslag og farger ser like ut på tvers
 * av alle produkter (og enkelt kan utvides ett sted).
 *
 * `hex` er fargen brukt i 3D-modellen. `note` er kort forklaring til kunden.
 */

/** Treslag – påvirker både 3D-farge og materialkostnad (via prisfaktor). */
export const TRESLAG: Record<string, MaterialChoice & { prisFaktor: number }> = {
  impregnert: {
    id: 'impregnert',
    label: 'Trykkimpregnert furu',
    hex: 0x9c7b52,
    note: 'Rimelig og råtebestandig. Klassisk grønnstikk som gråner.',
    prisFaktor: 1,
  },
  gran: {
    id: 'gran',
    label: 'Gran (ubehandlet)',
    hex: 0xd8bd93,
    note: 'Lys og lett. Bør beises for utebruk.',
    prisFaktor: 0.85,
  },
  royal: {
    id: 'royal',
    label: 'Royalimpregnert brun',
    hex: 0x6e4a2c,
    note: 'Oljeimpregnert, mørk og vedlikeholdsvennlig.',
    prisFaktor: 1.35,
  },
  lerk: {
    id: 'lerk',
    label: 'Sibirsk lerk',
    hex: 0xc99a67,
    note: 'Hardt, tett tre. Gråner vakkert uten behandling.',
    prisFaktor: 1.7,
  },
  kebony: {
    id: 'kebony',
    label: 'Kebony',
    hex: 0x5a3d29,
    note: 'Premium, formstabilt og vedlikeholdsfritt.',
    prisFaktor: 2.6,
  },
}

/** Overflatebehandling / farge – multipliserer 3D-fargen. */
export const FARGER: Record<string, MaterialChoice> = {
  ubehandlet: { id: 'ubehandlet', label: 'Ubehandlet', hex: 0x000000, swatch: 'transparent', note: 'Treets naturlige farge.' },
  klar: { id: 'klar', label: 'Klar olje', hex: 0xb98c56, swatch: '#b98c56', note: 'Fremhever åren, holder treet varmt.' },
  hvit: { id: 'hvit', label: 'Hvit', hex: 0xf2f0ea, swatch: '#f2f0ea' },
  lysgra: { id: 'lysgra', label: 'Lys grå', hex: 0xb9b6ae, swatch: '#b9b6ae' },
  morkegra: { id: 'morkegra', label: 'Mørk grå', hex: 0x5c5c58, swatch: '#5c5c58' },
  sort: { id: 'sort', label: 'Sort', hex: 0x2a2a28, swatch: '#2a2a28' },
  brun: { id: 'brun', label: 'Brun', hex: 0x5a3a22, swatch: '#5a3a22' },
  gronn: { id: 'gronn', label: 'Skoggrønn', hex: 0x3c4a3a, swatch: '#3c4a3a' },
}

/** Bland grunnfarge (treslag) med valgt overflatefarge for 3D-modellen. */
export function resolveColor(treslagId: string, fargeId: string): number {
  const tre = TRESLAG[treslagId]?.hex ?? 0xb08d5f
  const farge = FARGER[fargeId]
  if (!farge || farge.id === 'ubehandlet') return tre

  // Bland treslagets varme inn i fargen slik at maling/beis fortsatt leser som tre.
  const fr = (farge.hex >> 16) & 0xff
  const fg = (farge.hex >> 8) & 0xff
  const fb = farge.hex & 0xff
  const tr = (tre >> 16) & 0xff
  const tg = (tre >> 8) & 0xff
  const tb = tre & 0xff
  const mix = farge.id === 'klar' ? 0.55 : 0.82 // hvor mye fargen dominerer
  const r = Math.round(fr * mix + tr * (1 - mix))
  const g = Math.round(fg * mix + tg * (1 - mix))
  const b = Math.round(fb * mix + tb * (1 - mix))
  return (r << 16) | (g << 8) | b
}

/** Bygg materialvalg-lister til et template fra utvalgte id-er. */
export function treslagValg(ids: (keyof typeof TRESLAG)[]): MaterialChoice[] {
  return ids.map((id) => {
    const { prisFaktor: _prisFaktor, ...choice } = TRESLAG[id]
    void _prisFaktor
    return choice
  })
}

export function fargeValg(ids: (keyof typeof FARGER)[]): MaterialChoice[] {
  return ids.map((id) => FARGER[id])
}
