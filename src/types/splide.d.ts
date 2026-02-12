declare module '@splidejs/react-splide' {
  import type { ComponentType, ReactNode } from 'react'
  import type { Options } from '@splidejs/splide'

  interface SplideProps {
    options?: Options
    className?: string
    children?: ReactNode
    [key: string]: unknown
  }

  interface SplideSlideProps {
    children?: ReactNode
    className?: string
    [key: string]: unknown
  }

  export const Splide: ComponentType<SplideProps>
  export const SplideSlide: ComponentType<SplideSlideProps>
}

declare module '@splidejs/react-splide/css' {
  const content: string
  export default content
}
