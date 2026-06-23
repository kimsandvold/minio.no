import { useProsjekter, type ProsjektStyring as GenerischProsjektStyring, type LagretProsjekt as GenerischLagretProsjekt } from '../../shared/planlegger/useProsjekter'
import { DEFAULT_CONFIG, type CarportConfig } from './carportModel'

export type LagretProsjekt = GenerischLagretProsjekt<CarportConfig>
export type ProsjektStyring = GenerischProsjektStyring<CarportConfig>

/**
 * Carport-spesifikk innpakning av den generiske prosjektstyringen
 * ({@link useProsjekter}) – lagrer carportprosjekter under egen localStorage-nøkkel.
 */
export function useCarportProsjekter() {
  return useProsjekter<CarportConfig>('carport-prosjekter', DEFAULT_CONFIG)
}
