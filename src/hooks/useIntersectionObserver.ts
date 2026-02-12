import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver(
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(element)
      }
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return [ref, isVisible]
}
