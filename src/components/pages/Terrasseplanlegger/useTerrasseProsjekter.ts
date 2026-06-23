import { useProsjekter, type ProsjektStyring as GenerischProsjektStyring, type LagretProsjekt as GenerischLagretProsjekt } from '../../shared/planlegger/useProsjekter'
import { DEFAULT_CONFIG, type TerrasseConfig } from './terrasseModel'

export type LagretProsjekt = GenerischLagretProsjekt<TerrasseConfig>
export type ProsjektStyring = GenerischProsjektStyring<TerrasseConfig>

/**
 * Terrasse-spesifikk innpakning av den generiske prosjektstyringen
 * ({@link useProsjekter}) – lagrer terrasseprosjekter under egen localStorage-nøkkel.
 */
export function useTerrasseProsjekter() {
  return useProsjekter<TerrasseConfig>('terrasse-prosjekter', DEFAULT_CONFIG)
}
