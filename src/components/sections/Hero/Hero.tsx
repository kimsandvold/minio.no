import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Section from '../../layout/Section'
import HeroSlideshow from './HeroSlideshow'
import ShareButtons from '../../shared/ShareButtons'
import Icon from '../../shared/Icon'

/**
 * Scrim-en er varm, ikke nøytralt svart. En flat rgba(0,0,0,.55) nøytraliserer
 * høstlyset i fotoene; denne mørkner mot en brunsvart i bunn og lar toppen av
 * bildet beholde kulør. Gradienten er også tettere der teksten står, slik at
 * kontrasten holder uansett hvilket bilde som vises i slideshowet.
 */
const HeroScrim = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(20, 15, 11, 0.55) 0%, rgba(20, 15, 11, 0.2) 32%, rgba(20, 15, 11, 0.72) 100%),
    radial-gradient(90% 65% at 50% 55%, rgba(20, 15, 11, 0.45) 0%, transparent 75%);
  z-index: ${({ theme }) => theme.zIndex.heroOverlay};
  pointer-events: none;
`

const HeroContent = styled.div`
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.heroContent};
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 44rem;
  padding-bottom: 3rem;
`

const HeroLogo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 2.25rem;
  opacity: 0.9;
  filter: drop-shadow(0 2px 16px rgba(0, 0, 0, 0.45));

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 84px;
    margin-bottom: 1.5rem;
  }
`

/** H1 var visuelt skjult før — nå bærer den heroen. */
const HeroTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: 600;
  line-height: 1.08;
  color: #fff;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
  margin: 0;
  text-wrap: balance;
`

const HeroText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 400;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
  max-width: 34rem;
  margin: 1.25rem auto 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.85rem;
  margin-top: 2.25rem;

  /* På mobil stables knappene — da skal de ha samme bredde, ellers ser de
     ut som to tilfeldig klipte bokser under hverandre. */
  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    flex-direction: column;
    align-items: stretch;
    width: min(20rem, 100%);
  }
`

const ctaBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.95rem 1.7rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  text-decoration: none;
  cursor: pointer;
`

const PrimaryCta = styled(Link)`
  ${ctaBase}
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: 1px solid transparent;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default},
    box-shadow ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.38);
  }

  &:active {
    transform: translateY(0);
  }
`

const SecondaryCta = styled(Link)`
  ${ctaBase}
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`

/** Liten trygghetslinje under CTA-ene — svarer på «hvem er dette» før scroll. */
const TrustLine = styled.p`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-top: 1.75rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
`

const ShareWrap = styled.div`
  margin-top: 2.5rem;
  opacity: 0.75;
  transition: opacity ${({ theme }) => theme.transitions.default};

  &:hover {
    opacity: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 2rem;
  }
`

export default function Hero() {
  return (
    <Section id="hjem" variant="hero">
      <HeroSlideshow />
      <HeroScrim />
      <HeroContent>
        <HeroLogo src="/images/branding/logo_icon_white.webp" alt="Minio" width={120} height={120} />
        <HeroTitle>Hageprodukter i tre, bygget etter dine mål</HeroTitle>
        <HeroText>
          Tegn prosjektet ditt i 3D med dine egne mål – helt gratis. Så bygger vi det
          for deg, eller du får byggeplan og materialliste og bygger selv.
        </HeroText>
        <Actions>
          <PrimaryCta to="/designverktoy">
            <Icon name="faCube" /> Design ditt eget
          </PrimaryCta>
          <SecondaryCta to="/produkter">Se produktene</SecondaryCta>
        </Actions>
        <TrustLine>
          <span><Icon name="faCheck" /> Gratis å designe</span>
          <span><Icon name="faCheck" /> Egne mål</span>
          <span><Icon name="faCheck" /> Håndlaget i Lillehammer</span>
        </TrustLine>
        <ShareWrap>
          <ShareButtons variant="hero" context="hero" />
        </ShareWrap>
      </HeroContent>
    </Section>
  )
}
