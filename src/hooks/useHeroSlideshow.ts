import { useState, useEffect, useCallback, useRef } from 'react'

const HERO_IMAGES = [
  '/images/hero/forside_8.webp',
  '/images/hero/forside_9.webp',
  '/images/hero/forside_4.webp',
  '/images/hero/forside_5.webp',
  '/images/hero/forside_6.webp',
  '/images/hero/forside_7.webp',
  '/images/hero/mail_box_2.webp',
]

const INTERVAL = 15000

export function useHeroSlideshow() {
  const initialIndex = useRef(Math.floor(Math.random() * HERO_IMAGES.length))
  const [layer1Src, setLayer1Src] = useState(HERO_IMAGES[initialIndex.current])
  const [layer2Src, setLayer2Src] = useState('')
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1)
  const indexRef = useRef(initialIndex.current)

  const advance = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % HERO_IMAGES.length
    const nextImage = HERO_IMAGES[indexRef.current]

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
