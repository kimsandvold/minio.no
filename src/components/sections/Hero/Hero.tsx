import styled from 'styled-components'
import Section from '../../layout/Section'
import HeroSlideshow from './HeroSlideshow'
import ShareButtons from '../../shared/ShareButtons'

import Button from '../../shared/Button'
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

const HeroText = styled.p`
  font-size: 1.2rem;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  margin: 0 auto;
`

const NewsletterWrap = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`

export default function Hero() {
  const { openNewsletter } = useModalContext()

  return (
    <Section id="hjem" variant="hero">
      <HeroSlideshow />
      <HeroOverlay />
      <HeroContent>
        <HeroText>
          Vi lager varmepumpehus, søppelboder, postkassestativer, levegger, plantekasser og robotklippergarasjer – alt i tre, tilpasset dine mål. Håndlaget i Lillehammer.
        </HeroText>
        <div style={{ marginTop: '2rem' }}>
          <ShareButtons variant="hero" context="hero" />
        </div>
        <NewsletterWrap>
          <Button variant="ghost" onClick={openNewsletter} style={{ background: '#2f2f2f' }}>
            <Icon name="faEnvelope" /> Abonner på nyhetsbrev
          </Button>
        </NewsletterWrap>
      </HeroContent>
    </Section>
  )
}
