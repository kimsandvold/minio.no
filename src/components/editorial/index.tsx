import type { ReactNode } from 'react'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Icon from '../shared/Icon'

/**
 * Redaksjonelle byggeklosser for hele siden. Ett gitter (1240 px), én overskriftsstil
 * og én lenkestil – så sidene leser som ett system. Brukes av forsiden og undersidene.
 */

export const Wrap = styled.div`
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 1rem;
  }
`

export const Seksjon = styled.section<{ $flate?: 'paper' | 'surface' | 'deep' }>`
  padding: clamp(4.5rem, 9vw, 8rem) 0;
  background: ${({ theme, $flate = 'paper' }) =>
    $flate === 'deep' ? theme.colors.deep : $flate === 'surface' ? theme.colors.surface : theme.colors.paper};
  color: ${({ theme, $flate }) => ($flate === 'deep' ? theme.colors.inkInverted : theme.colors.ink)};
`

export const Eyebrow = styled.p<{ $lys?: boolean }>`
  margin: 0 0 1rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  letter-spacing: 0;
  color: ${({ theme, $lys }) => ($lys ? theme.colors.accentLight : theme.colors.accent)};
`

export const Tittel = styled.h2`
  margin: 0;
  font-size: clamp(2.2rem, 4.6vw, 3.9rem);
  font-weight: 600;
  line-height: 1.02;
  letter-spacing: -0.04em;
  max-width: 16ch;
`

export const Ingress = styled.p<{ $lys?: boolean }>`
  margin: 1.25rem 0 0;
  max-width: 52ch;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.55;
  color: ${({ theme, $lys }) => ($lys ? theme.colors.inkInvertedMuted : theme.colors.inkMuted)};
`

export const Hode = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: clamp(2.25rem, 4vw, 3.5rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }
`

const pilLenkeStil = css<{ $lys?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme, $lys }) => ($lys ? theme.colors.inkInverted : theme.colors.ink)};
  text-decoration: none;

  svg {
    font-size: 0.8em;
    transition: transform ${({ theme }) => theme.transitions.default};
  }

  &:hover svg {
    transform: translateX(4px);
  }
`

const PilLenkeStyled = styled(Link)<{ $lys?: boolean }>`
  ${pilLenkeStil}
`

export function PilLenke({ til, children, lys }: { til: string; children: ReactNode; lys?: boolean }) {
  return (
    <PilLenkeStyled to={til} $lys={lys}>
      {children} <Icon name="faArrowRight" />
    </PilLenkeStyled>
  )
}

/** Knapper – hvit (på mørkt), mørk (på lyst) eller glass (over foto). */
export const Knapp = styled(Link)<{ $variant?: 'hvit' | 'mork' | 'glass' | 'aksent' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.default}, transform ${({ theme }) => theme.transitions.default};

  &:active {
    transform: scale(0.98);
  }

  ${({ theme, $variant = 'mork' }) => {
    switch ($variant) {
      case 'hvit':
        return css`
          background: ${theme.colors.surface};
          color: ${theme.colors.ink};
          &:hover { background: ${theme.colors.neutral[200]}; }
        `
      case 'glass':
        return css`
          background: rgba(255, 255, 255, 0.14);
          color: ${theme.colors.inkInverted};
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
          &:hover { background: rgba(255, 255, 255, 0.24); }
        `
      case 'aksent':
        return css`
          background: ${theme.colors.accent};
          color: #fff;
          &:hover { background: ${theme.colors.accentHover}; }
        `
      default:
        return css`
          background: ${theme.colors.ink};
          color: ${theme.colors.inkInverted};
          &:hover { background: ${theme.colors.neutral[700]}; }
        `
    }
  }}
`

const RevealBoks = styled.div<{ $synlig: boolean; $forsinkelse: number }>`
  opacity: ${({ $synlig }) => ($synlig ? 1 : 0)};
  transform: translateY(${({ $synlig }) => ($synlig ? '0' : '28px')});
  transition:
    opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${({ $forsinkelse }) => $forsinkelse}ms,
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${({ $forsinkelse }) => $forsinkelse}ms;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`

/** Myk inntoning når innholdet ruller inn i bildet. */
export function Reveal({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
  const [ref, synlig] = useIntersectionObserver({ threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
  return (
    <RevealBoks ref={ref} $synlig={synlig} $forsinkelse={forsinkelse}>
      {children}
    </RevealBoks>
  )
}

interface SideHodeProps {
  eyebrow?: ReactNode
  tittel: ReactNode
  ingress?: ReactNode
  /** Knapper/lenker under ingressen. */
  handlinger?: ReactNode
  /** Fullbredde innhold nederst i headeren (faner, søk, nøkkeltall …). */
  children?: ReactNode
}

/**
 * Standard sidehode for undersidene: mørk flate (navbaren står skarpt mot den),
 * venstrejustert stor tittel, ingress til høyre på brede skjermer. Samme
 * typografi som forsidens helt – bare uten foto.
 */
export function SideHode({ eyebrow, tittel, ingress, handlinger, children }: SideHodeProps) {
  return (
    <HodeFlate data-surface="dark">
      <Wrap>
        <HodeGrid>
          <div>
            {eyebrow && <Eyebrow $lys>{eyebrow}</Eyebrow>}
            <h1>{tittel}</h1>
          </div>
          {(ingress || handlinger) && (
            <HodeSide>
              {ingress && <Ingress $lys>{ingress}</Ingress>}
              {handlinger && <HodeHandlinger>{handlinger}</HodeHandlinger>}
            </HodeSide>
          )}
        </HodeGrid>
        {children && <HodeBunn>{children}</HodeBunn>}
      </Wrap>
    </HodeFlate>
  )
}

const HodeFlate = styled.header`
  position: relative;
  overflow: hidden;
  padding: clamp(8.5rem, 14vw, 11rem) 0 clamp(3rem, 6vw, 5rem);
  color: ${({ theme }) => theme.colors.inkInverted};
  background:
    radial-gradient(90% 120% at 0% 0%, rgba(168, 81, 44, 0.22), transparent 55%),
    radial-gradient(60% 80% at 100% 100%, rgba(224, 137, 95, 0.08), transparent 60%),
    ${({ theme }) => theme.colors.deep};

  h1 {
    margin: 0;
    font-size: clamp(2.8rem, 6.6vw, 5.75rem);
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.05em;
    max-width: 13ch;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 7rem 0 2.75rem;
  }
`

const HodeGrid = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 2.5rem 4rem;
  align-items: end;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const HodeSide = styled.div`
  ${Ingress} {
    margin-top: 0;
  }
`

const HodeHandlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
`

const HodeBunn = styled.div`
  margin-top: clamp(2.5rem, 5vw, 4rem);
`
