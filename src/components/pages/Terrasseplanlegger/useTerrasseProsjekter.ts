import { useCallback, useMemo, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { DEFAULT_CONFIG, type TerrasseConfig } from './terrasseModel'

export interface LagretProsjekt {
  id: string
  navn: string
  dato: string
  config: TerrasseConfig
}

export interface ProsjektStyring {
  prosjekter: LagretProsjekt[]
  aktivId: string | null
  aktivNavn: string | null
  dirty: boolean
  nytt: () => void
  åpne: (id: string) => void
  lagre: () => void
  lagreSom: (navn: string) => void
  giNyttNavn: (navn: string) => void
  slett: (id: string) => void
}

const iDag = () => new Date().toLocaleDateString('nb-NO')

/**
 * Eier den aktive terrassekonfigurasjonen sammen med lagrede prosjekter i
 * localStorage, og holder rede på om gjeldende konfig avviker fra det lagrede
 * («dirty»). Brukes av planleggersiden og prosjektmenyen over 3D-modellen.
 */
export function useTerrasseProsjekter() {
  const [config, setConfig] = useState<TerrasseConfig>(DEFAULT_CONFIG)
  const [prosjekter, setProsjekter] = useLocalStorage<LagretProsjekt[]>('terrasse-prosjekter', [])
  const [aktivId, setAktivId] = useState<string | null>(null)

  const aktiv = useMemo(() => prosjekter.find((p) => p.id === aktivId) ?? null, [prosjekter, aktivId])

  const dirty = useMemo(() => {
    const referanse = aktiv ? aktiv.config : DEFAULT_CONFIG
    return JSON.stringify(config) !== JSON.stringify(referanse)
  }, [config, aktiv])

  const nytt = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setAktivId(null)
  }, [])

  const åpne = useCallback(
    (id: string) => {
      const p = prosjekter.find((x) => x.id === id)
      if (!p) return
      setConfig({ ...DEFAULT_CONFIG, ...p.config })
      setAktivId(id)
    },
    [prosjekter],
  )

  const lagre = useCallback(() => {
    if (!aktivId) return
    setProsjekter((prev) => prev.map((p) => (p.id === aktivId ? { ...p, config, dato: iDag() } : p)))
  }, [aktivId, config, setProsjekter])

  const lagreSom = useCallback(
    (navn: string) => {
      const trimmet = navn.trim()
      if (!trimmet) return
      const id = `${trimmet}-${Date.now()}`
      const ny: LagretProsjekt = { id, navn: trimmet, dato: iDag(), config }
      setProsjekter((prev) => [ny, ...prev.filter((p) => p.navn !== trimmet)])
      setAktivId(id)
    },
    [config, setProsjekter],
  )

  const giNyttNavn = useCallback(
    (navn: string) => {
      const trimmet = navn.trim()
      if (!trimmet || !aktivId) return
      setProsjekter((prev) => prev.map((p) => (p.id === aktivId ? { ...p, navn: trimmet } : p)))
    },
    [aktivId, setProsjekter],
  )

  const slett = useCallback(
    (id: string) => {
      setProsjekter((prev) => prev.filter((p) => p.id !== id))
      setAktivId((cur) => (cur === id ? null : cur))
    },
    [setProsjekter],
  )

  const prosjekt: ProsjektStyring = {
    prosjekter,
    aktivId,
    aktivNavn: aktiv?.navn ?? null,
    dirty,
    nytt,
    åpne,
    lagre,
    lagreSom,
    giNyttNavn,
    slett,
  }

  return { config, setConfig, prosjekt }
}
