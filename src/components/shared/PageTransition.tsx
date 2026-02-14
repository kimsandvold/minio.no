import { useEffect, useState, type ReactNode } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div<{ $mounted: boolean }>`
  opacity: ${({ $mounted }) => ($mounted ? 1 : 0)};
  transform: translateY(${({ $mounted }) => ($mounted ? 0 : 8)}px);
  transition: opacity 0.35s ease, transform 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`

export default function PageTransition({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return <Wrapper $mounted={mounted}>{children}</Wrapper>
}
