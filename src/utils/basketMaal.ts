import type { BasketItem } from '../types/product'

type Slot = NonNullable<BasketItem['slotDimensions']>[number]

/**
 * Mål i handlekurven, i samme rekkefølge som kalkulatorene viser dem
 * (bredde × dybde × høyde) og med bokstav foran, så kunden kjenner igjen
 * tallene og de stemmer med e-posten verkstedet får. Dybde 0 betyr et flatt
 * produkt (levegg) og utelates.
 */
export function maalKort(item: BasketItem): string | null {
  const { width, height, depth } = item.dimensions
  if (!width && !height && !depth) return null
  if (item.armThickness !== undefined) {
    return `A ${width} × B ${depth} × D ${item.armThickness} × H ${height} cm`
  }
  return depth ? `B ${width} × D ${depth} × H ${height} cm` : `B ${width} × H ${height} cm`
}

/** Mål for én enhet i et sett (pidestaller, levegger). */
export function slotMaalKort(s: Slot): string {
  if (s.widthB) return `A ${s.width} + B ${s.widthB} × H ${s.height} cm`
  return s.depth ? `B ${s.width} × D ${s.depth} × H ${s.height} cm` : `B ${s.width} × H ${s.height} cm`
}
