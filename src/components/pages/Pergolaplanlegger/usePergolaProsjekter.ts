import { useProsjekter, type ProsjektStyring as GenerischProsjektStyring, type LagretProsjekt as GenerischLagretProsjekt } from '../../shared/planlegger/useProsjekter'
import { DEFAULT_CONFIG, type PergolaConfig } from './pergolaModel'

export type LagretProsjekt = GenerischLagretProsjekt<PergolaConfig>
export type ProsjektStyring = GenerischProsjektStyring<PergolaConfig>

/**
 * Pergola-spesifikk innpakning av den generiske prosjektstyringen
 * ({@link useProsjekter}) – lagrer pergolaprosjekter under egen localStorage-nøkkel.
 */
export function usePergolaProsjekter() {
  return useProsjekter<PergolaConfig>('pergola-prosjekter', DEFAULT_CONFIG)
}
