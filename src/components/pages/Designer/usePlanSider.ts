import { useEffect, useRef, useState } from 'react'
import type { ForhandsvisningSide, PlanArgs } from '../../../designer/pdf'

export interface PlanSide {
  url: string
  navn: string
  type: ForhandsvisningSide['type']
  /** A4 liggende? */
  liggende: boolean
}

/**
 * Lager byggeplanens sider som SVG-bilder (samme komposisjon som PDF-en) for
 * forhåndsvisning. Regenereres når `nokkel` endres (design/opplåsing), med
 * en liten forsinkelse så slider-dra ikke bygger planen for hvert steg.
 */
export function usePlanSider(lagArgs: () => PlanArgs | null, nokkel: string, laast: boolean, aktiv: boolean, filter?: (s: PlanSide) => boolean) {
  const [sider, setSider] = useState<PlanSide[]>([])
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState(false)
  const lagRef = useRef(lagArgs)
  lagRef.current = lagArgs
  const filterRef = useRef(filter)
  filterRef.current = filter

  useEffect(() => {
    if (!aktiv) return
    let avbrutt = false
    const urls: string[] = []
    setLaster(true)
    const t = window.setTimeout(async () => {
      try {
        const args = lagRef.current()
        if (!args) return
        const { planForhandsvisning } = await import('../../../designer/pdf')
        const res = await planForhandsvisning(args, laast)
        if (avbrutt) return
        const ut = res.map((s) => {
          const url = URL.createObjectURL(new Blob([s.svg], { type: 'image/svg+xml' }))
          urls.push(url)
          return { url, navn: s.navn, type: s.type, liggende: s.type === 'ark' }
        })
        setSider(filterRef.current ? ut.filter(filterRef.current) : ut)
        setFeil(false)
      } catch (e) {
        console.error('Forhåndsvisning feilet', e)
        if (!avbrutt) setFeil(true)
      } finally {
        if (!avbrutt) setLaster(false)
      }
    }, 220)
    return () => {
      avbrutt = true
      window.clearTimeout(t)
      // Gi bildene tid til å bli erstattet før URL-ene frigjøres.
      window.setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 4000)
    }
  }, [nokkel, laast, aktiv])

  return { sider, laster, feil }
}
