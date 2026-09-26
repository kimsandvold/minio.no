import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/splide/dist/css/splide.min.css'
import type { Options } from '@splidejs/splide'
import type { ReactNode } from 'react'

interface SplideCarouselProps {
  options?: Options
  children: ReactNode[]
  className?: string
  /**
   * Hva karusellen viser, f.eks. «Bilder av varmepumpehus». Brukes som
   * tilgjengelig navn. Uten dette annonserer skjermlesere bare «karusell»,
   * og flere karuseller på samme side blir umulige å skille fra hverandre.
   */
  label?: string
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
  /**
   * Splide setter `role="region"` som standard, noe som gjør hver karusell til
   * et landemerke. Med flere navnløse karuseller på samme side blir
   * landemerkelista ubrukelig — `group` gir samme semantikk uten støyen.
   */
  role: 'group',
}

export default function SplideCarousel({ options, children, className, label }: SplideCarouselProps) {
  return (
    <Splide
      options={{ ...defaultOptions, ...(label ? { label } : {}), ...options }}
      className={className}
    >
      {children.map((child, i) => (
        <SplideSlide key={i}>{child}</SplideSlide>
      ))}
    </Splide>
  )
}
