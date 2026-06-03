import styled from 'styled-components'
import Section from '../../layout/Section'
import HeroSlideshow from './HeroSlideshow'
import ShareButtons from '../../shared/ShareButtons'

const HeroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0, rgba(0, 0, 0, 0.3) 100%);
  z-index: ${({ theme }) => theme.zIndex.heroOverlay};
  pointer-events: none;
`

const HeroContent = styled.div`
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.heroContent};
  display: flex;
  flex-direction: column;
  align-items: center;
`

const HeroLogo = styled.img`
  width: 64px;
  margin-bottom: 3rem;
  margin-top: -30px;
  opacity: 0.35;
  filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.2));

  @media (max-width: 768px) {
    width: 54px;
    margin-bottom: 1.2rem;
  }
`

const HeroText = styled.p`
  font-size: 0.95rem;
  font-weight: 300;
  letter-spacing: 0.3px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  max-width: 460px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    max-width: 340px;
  }
`

const VisuallyHiddenH1 = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

export default function Hero() {
  return (
    <Section id="hjem" variant="hero">
      <HeroSlideshow />
      <HeroOverlay />
      <HeroContent>
        <VisuallyHiddenH1>Hageprodukter i tre, skreddersydd etter dine mål</VisuallyHiddenH1>
        <HeroLogo src="/images/branding/logo_icon_white.svg" alt="Minio logo" />
        <HeroText>
          Drømmer du om et uteprodukt som er helt unikt for ditt hjem? Vi bygger det etter dine mål og preferanser.
        </HeroText>
        <div style={{ marginTop: '3rem' }}>
          <ShareButtons variant="hero" context="hero" />
        </div>
      </HeroContent>
    </Section>
  )
}
