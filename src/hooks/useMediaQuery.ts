import { useEffect, useState } from 'react'

/**
 * Lytter på en CSS-mediespørring fra React.
 *
 * Brukes der det samme innholdet skal ligge ett sted på desktop og et annet på
 * mobil – da er CSS alene ikke nok, for `display: none` på én kopi betyr at vi
 * må rendre innholdet to ganger. Her flyttes det i stedet.
 *
 * Under prerendering finnes ikke `window`; da svarer hooken `false`, altså
 * desktop-varianten, som er den som skal ligge i HTML-en.
 */
export function useMediaQuery(sporring: string): boolean {
  const [treffer, settTreffer] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(sporring).matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(sporring)
    const oppdater = () => settTreffer(mq.matches)
    oppdater()
    mq.addEventListener('change', oppdater)
    return () => mq.removeEventListener('change', oppdater)
  }, [sporring])

  return treffer
}
