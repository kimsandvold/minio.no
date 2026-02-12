import styled from 'styled-components'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  children: ReactNode
  variant?: 'default' | 'hero' | 'light' | 'gradient' | 'warm'
}

const StyledSection = styled.section<{ $variant: string; $visible: boolean }>`
  padding: ${({ theme }) => theme.spacing.sectionPadding};
  display: flex;
  flex-direction: column;
  min-height: auto;
  background-color: rgba(255, 255, 255, 0.9);
  justify-content: flex-start;
  text-align: left;
  color: ${({ theme }) => theme.colors.textDark};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '30px')});
  transition: opacity 0.6s ease, transform 0.6s ease;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'hero':
        return `
          position: relative;
          overflow: hidden;
          background: #000;
          color: #fff;
          justify-content: center;
          align-items: center;
          text-align: center;
          min-height: 100vh;
          padding: 0 2rem;
          opacity: 1;
          transform: none;
        `
      case 'light':
        return `background-color: ${theme.colors.lightBg};`
      case 'gradient':
        return `background: linear-gradient(135deg, #fff 0, ${theme.colors.lightBg} 100%);`
      case 'warm':
        return `background-color: #fff4ec;`
      default:
        return `background-color: #fff;`
    }
  }}

  @media (min-width: ${({ theme }) => theme.breakpoints.wideDesktop}) {
    padding: ${({ theme, $variant }) => $variant === 'hero' ? '0 2rem' : theme.spacing.sectionPaddingWide};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme, $variant }) => $variant === 'hero' ? '0 1rem' : theme.spacing.sectionPaddingMobile};
    overflow-x: hidden;
  }

  h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  & > p {
    font-size: 1.05rem;
    margin: 0 auto;
    line-height: 1.7;
  }
`

export default function Section({ id, children, variant = 'default' }: SectionProps) {
  const [ref, isVisible] = useIntersectionObserver()

  return (
    <StyledSection id={id} $variant={variant} $visible={variant === 'hero' || isVisible} ref={ref}>
      {children}
    </StyledSection>
  )
}
