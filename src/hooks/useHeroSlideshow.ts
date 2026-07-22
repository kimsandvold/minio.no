import { useState, useEffect, useCallback, useRef } from 'react'

const HERO_IMAGES = [
  '/images/hero/carport-elbil-forside.webp',
  '/images/hero/utekjokken-hage-forside.webp',
  '/images/hero/forside_8.webp',
  '/images/hero/forside_9.webp',
]

const INTERVAL = 15000

// Full tilfeldig rekkefølge (Fisher–Yates). Rekkefølgen stokkes på nytt ved hver
// sidelast, så helten viser bildene i tilfeldig sekvens.
function shuffle(images: string[]) {
  const order = [...images]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

export function useHeroSlideshow() {
  // Første malte frame må være det forhåndslastede bildet (HERO_IMAGES[0]).
  // Prerenderet HTML og klientens første render må vise SAMME bilde – ellers
  // bytter helten bilde i det React monterer, og siden navbaren er gjennomsiktig
  // med backdrop-blur synes byttet gjennom logoen som en flimring. Etter montering
  // kryssfader vi mykt over til en tilfeldig stokket rekkefølge.
  const [layer1Src, setLayer1Src] = useState(HERO_IMAGES[0])
  const [layer2Src, setLayer2Src] = useState('')
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1)
  const indexRef = useRef(0)
  const orderRef = useRef<string[]>(HERO_IMAGES)

  // Stokk rekkefølgen etter montering og kryssfad mykt inn det første tilfeldige
  // bildet. Kryssfaden (1.5s) gjør at det ikke blir noen hard flimring.
  useEffect(() => {
    const order = shuffle(HERO_IMAGES)
    orderRef.current = order
    indexRef.current = 0

    if (order[0] !== layer1Src) {
      setLayer2Src(order[0])
      setActiveLayer(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const advance = useCallback(() => {
    const order = orderRef.current
    indexRef.current = (indexRef.current + 1) % order.length
    const nextImage = order[indexRef.current]

    if (activeLayer === 1) {
      setLayer2Src(nextImage)
      setActiveLayer(2)
    } else {
      setLayer1Src(nextImage)
      setActiveLayer(1)
    }
  }, [activeLayer])

  useEffect(() => {
    const timer = setInterval(advance, INTERVAL)
    return () => clearInterval(timer)
  }, [advance])

  return {
    layer1Src,
    layer2Src,
    layer1Opacity: activeLayer === 1 ? 1 : 0,
    layer2Opacity: activeLayer === 2 ? 1 : 0,
  }
}
