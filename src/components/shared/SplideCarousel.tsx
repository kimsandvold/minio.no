import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/splide/dist/css/splide.min.css'
import type { Options } from '@splidejs/splide'
import type { ReactNode } from 'react'

interface SplideCarouselProps {
  options?: Options
  children: ReactNode[]
  className?: string
}

const defaultOptions: Options = {
  type: 'fade',
  rewind: true,
  autoplay: true,
  interval: 12000,
  pauseOnHover: true,
  pauseOnFocus: true,
  arrows: true,
  pagination: true,
  speed: 800,
}

export default function SplideCarousel({ options, children, className }: SplideCarouselProps) {
  return (
    <Splide options={{ ...defaultOptions, ...options }} className={className}>
      {children.map((child, i) => (
        <SplideSlide key={i}>{child}</SplideSlide>
      ))}
    </Splide>
  )
}
