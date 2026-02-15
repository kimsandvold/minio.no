import styled from 'styled-components'
import Section from '../../layout/Section'
import HeroSlideshow from './HeroSlideshow'
import ShareButtons from '../../shared/ShareButtons'

import Icon from '../../shared/Icon'
import { useModalContext } from '../../../context/ModalContext'

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

const NewsletterFab = styled.button`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  z-index: ${({ theme }) => theme.zIndex.heroContent};
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 46px;
    height: 46px;
    font-size: 1rem;
  }
`

export default function Hero() {
  const { openNewsletter } = useModalContext()

  return (
    <Section id="hjem" variant="hero">
      <HeroSlideshow />
      <HeroOverlay />
      <HeroContent>
        <HeroLogo src="/images/branding/logo_icon_white.svg" alt="Minio logo" />
        <HeroText>
          Drømmer du om et uteprodukt som er helt unikt for ditt hjem? Vi bygger det etter dine mål og preferanser.
        </HeroText>
        <div style={{ marginTop: '3rem' }}>
          <ShareButtons variant="hero" context="hero" />
        </div>
      </HeroContent>
      <NewsletterFab onClick={openNewsletter} aria-label="Abonner på nyhetsbrev">
        <Icon name="faEnvelope" />
      </NewsletterFab>
    </Section>
  )
}
