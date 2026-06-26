import { useProsjekter, type ProsjektStyring as GenerischProsjektStyring, type LagretProsjekt as GenerischLagretProsjekt } from '../../shared/planlegger/useProsjekter'
import { DEFAULT_CONFIG, type UtekjokkenConfig } from './utekjokkenModel'

export type LagretProsjekt = GenerischLagretProsjekt<UtekjokkenConfig>
export type ProsjektStyring = GenerischProsjektStyring<UtekjokkenConfig>

/**
 * Utekjøkken-spesifikk innpakning av den generiske prosjektstyringen
 * ({@link useProsjekter}) – lagrer utekjøkkenprosjekter under egen localStorage-nøkkel.
 */
export function useUtekjokkenProsjekter() {
  return useProsjekter<UtekjokkenConfig>('utekjokken-prosjekter', DEFAULT_CONFIG)
}
