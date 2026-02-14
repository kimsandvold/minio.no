import type { ReactNode } from 'react'
import styled from 'styled-components'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

interface AnimatedBlockProps {
  children: ReactNode
  delay?: number
}

const Wrapper = styled.div<{ $visible: boolean; $delay: number }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? 0 : 24)}px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  transition-delay: ${({ $delay }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`

export default function AnimatedBlock({ children, delay = 0 }: AnimatedBlockProps) {
  const [ref, isVisible] = useIntersectionObserver()

  return (
    <Wrapper ref={ref} $visible={isVisible} $delay={delay}>
      {children}
    </Wrapper>
  )
}
