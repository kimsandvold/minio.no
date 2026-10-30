import { useCallback, useEffect, useState } from 'react'

let maaleflate: CanvasRenderingContext2D | null = null

function kontekst(): CanvasRenderingContext2D | null {
  if (maaleflate) return maaleflate
  if (typeof document === 'undefined') return null
  maaleflate = document.createElement('canvas').getContext('2d')
  return maaleflate
}

/**
 * Måler tekstbredde i en gitt skrift, slik at forhåndsvisningen kan skalere
 * navnet presist i stedet for å gjette på en gjennomsnittlig bokstavbredde.
 *
 * Skriftene lastes fra Google Fonts og kommer altså etter første render. Før de
 * er på plass måler nettleseren i reserveskriften og gir litt feil bredde, så
 * vi venter på `document.fonts` og tvinger en ny måling når skriften er inne.
 */
export function useTekstmaal(font: string): (tekst: string, px: number) => number {
  const [klar, settKlar] = useState(0)

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return
    let avbrutt = false
    // 100px er vilkårlig – `load` bryr seg bare om familien, ikke størrelsen.
    document.fonts
      .load(`100px "${font}"`)
      .then(() => {
        if (!avbrutt) settKlar((n) => n + 1)
      })
      .catch(() => {
        // Skriften finnes ikke hos Google – reserveskriften måles i stedet.
      })
    return () => {
      avbrutt = true
    }
  }, [font])

  return useCallback(
    (tekst: string, px: number) => {
      const ctx = kontekst()
      if (!ctx || !tekst) return 0
      // `klar` leses bevisst her for å knytte målingen til skriftlastingen.
      void klar
      ctx.font = `${px}px "${font}", Georgia, serif`
      return ctx.measureText(tekst).width
    },
    [font, klar],
  )
}
