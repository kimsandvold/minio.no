import styled from 'styled-components'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import type { ReactNode } from 'react'

/**
 * Flatene er en bevisst rytme, ikke en fargeliste. Regelen er at to naboseksjoner
 * aldri skal ha samme flate, og at `deep` brukes maks én gang per side — den er
 * pausen som får resten til å puste.
 *
 * paper   – varm grunnflate, standard
 * surface – ren hvit, løfter kortgitter og bildeinnhold
 * sunken  – dempet, for rolige mellomseksjoner
 * deep    – mørk grafitt, ett dramatisk avbrekk
 * warm    – lys terrakotta-tone, for kampanje/fremhevet innhold
 * hero    – fullskjerm med foto
 */
type SectionVariant = 'paper' | 'surface' | 'sunken' | 'deep' | 'warm' | 'hero' | 'default' | 'light' | 'gradient'

interface SectionProps {
  id?: string
  children: ReactNode
  variant?: SectionVariant
}

const DARK_VARIANTS: SectionVariant[] = ['hero', 'deep']

const StyledSection = styled.section<{ $variant: SectionVariant; $visible: boolean }>`
  padding: ${({ theme }) => theme.spacing.sectionPadding};
  display: flex;
  flex-direction: column;
  min-height: auto;
  justify-content: flex-start;
  text-align: left;
  background-color: ${({ theme }) => theme.colors.paper};
  color: ${({ theme }) => theme.colors.ink};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '24px')});
  transition:
    opacity 0.7s ${({ theme }) => theme.easing.soft},
    transform 0.7s ${({ theme }) => theme.easing.soft};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'hero':
        return `
          position: relative;
          overflow: hidden;
          background: ${theme.colors.neutral[900]};
          color: ${theme.colors.inkInverted};
          justify-content: center;
          align-items: center;
          text-align: center;
          min-height: 100svh;
          padding: 0 2rem;
          opacity: 1;
          transform: none;
        `
      case 'surface':
        return `background-color: ${theme.colors.surface};`
      case 'sunken':
        return `background-color: ${theme.colors.sunken};`
      case 'deep':
        return `
          background-color: ${theme.colors.deep};
          color: ${theme.colors.inkInverted};
          h1, h2, h3, h4, h5, h6 { color: ${theme.colors.inkInverted}; }
          p { color: ${theme.colors.inkInvertedMuted}; }
        `
      case 'warm':
        return `background-color: ${theme.colors.accentSoft};`
      /* Bakoverkompatible navn fra før flate-rytmen ble innført. */
      case 'light':
        return `background-color: ${theme.colors.sunken};`
      case 'gradient':
        return `background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.paper} 100%);`
      default:
        return `background-color: ${theme.colors.paper};`
    }
  }}

  @media (min-width: ${({ theme }) => theme.breakpoints.wideDesktop}) {
    padding: ${({ theme, $variant }) => ($variant === 'hero' ? '0 2rem' : theme.spacing.sectionPaddingWide)};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme, $variant }) => ($variant === 'hero' ? '0 1rem' : theme.spacing.sectionPaddingMobile)};
    overflow-x: hidden;
  }

  h2 {
    margin-bottom: 1.25rem;
  }

  & > p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    margin: 0 auto;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

export default function Section({ id, children, variant = 'paper' }: SectionProps) {
  const [ref, isVisible] = useIntersectionObserver()
  const isDark = DARK_VARIANTS.includes(variant)

  return (
    <StyledSection
      id={id}
      $variant={variant}
      $visible={variant === 'hero' || isVisible}
      data-surface={isDark ? 'dark' : undefined}
      ref={ref}
    >
      {children}
    </StyledSection>
  )
}
