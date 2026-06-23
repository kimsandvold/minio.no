import { useCallback, useMemo, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

export interface LagretProsjekt<T> {
  id: string
  navn: string
  dato: string
  config: T
}

export interface ProsjektStyring<T> {
  prosjekter: LagretProsjekt<T>[]
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
 * Generisk prosjektstyring for planleggerne (terrasse, pergola …). Eier den aktive
 * konfigurasjonen sammen med lagrede prosjekter i localStorage, og holder rede på
 * om gjeldende konfig avviker fra det lagrede («dirty»). Brukes av planleggersidene
 * og prosjektmenyen over 3D-modellen.
 */
export function useProsjekter<T extends object>(storageKey: string, defaultConfig: T) {
  const [config, setConfig] = useState<T>(defaultConfig)
  const [prosjekter, setProsjekter] = useLocalStorage<LagretProsjekt<T>[]>(storageKey, [])
  const [aktivId, setAktivId] = useState<string | null>(null)

  const aktiv = useMemo(() => prosjekter.find((p) => p.id === aktivId) ?? null, [prosjekter, aktivId])

  const dirty = useMemo(() => {
    const referanse = aktiv ? aktiv.config : defaultConfig
    return JSON.stringify(config) !== JSON.stringify(referanse)
  }, [config, aktiv, defaultConfig])

  const nytt = useCallback(() => {
    setConfig(defaultConfig)
    setAktivId(null)
  }, [defaultConfig])

  const åpne = useCallback(
    (id: string) => {
      const p = prosjekter.find((x) => x.id === id)
      if (!p) return
      setConfig({ ...defaultConfig, ...p.config })
      setAktivId(id)
    },
    [prosjekter, defaultConfig],
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
      const ny: LagretProsjekt<T> = { id, navn: trimmet, dato: iDag(), config }
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

  const prosjekt: ProsjektStyring<T> = {
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
