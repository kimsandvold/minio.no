import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimatedBlock from '../../shared/AnimatedBlock'
import { useSEO } from '../../../hooks/useSEO'

const Hero = styled.section`
  min-height: 30vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 25vh;
    padding: 5rem 1.5rem 2rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Content = styled.section`
  background: linear-gradient(135deg, #fff 0, ${({ theme }) => theme.colors.lightBg} 100%);
  padding: 3rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const Intro = styled.div`
  margin-bottom: 3rem;

  p {
    font-size: 1.05rem;
    line-height: 1.8;
    color: #444;
  }
`

const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`

const GuideCard = styled.a`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`

const GuideImage = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) => theme.colors.lightBg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: rgba(0, 0, 0, 0.2);
`

const GuideBody = styled.div`
  padding: 1.25rem;
`

const GuideTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const GuideDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
`

export default function DIYGuiderPage() {
  useSEO({
    title: 'DIY guider – Minio',
    description: 'Bygg det selv med våre gratis byggeguider. Lær hvordan du lager benker, plantekasser, postkassestativer og mer – steg for steg.',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <h1>DIY guider</h1>
              <p>Bygg det selv – gratis steg-for-steg guider til hage- og uteprosjekter.</p>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              <AnimatedBlock>
                <Intro>
                  <p>
                    Her finner du en samling byggeguider for deg som liker å lage ting selv. 
                    Guiden inneholder mål, materialliste og fremgangsmåte – alt du trenger for å komme i gang. 
                    Følg med, flere guider legges til fortløpende!
                  </p>
                </Intro>
              </AnimatedBlock>
              <GuideGrid>
                <AnimatedBlock delay={50}>
                  <GuideCard href="#">
                    <GuideImage>🌿</GuideImage>
                    <GuideBody>
                      <GuideTitle>Hagebenk</GuideTitle>
                      <GuideDescription>Bygg en solid og stilren hagebenk i trykkimpregnert tre. Perfekt for uteserveringen.</GuideDescription>
                    </GuideBody>
                  </GuideCard>
                </AnimatedBlock>
                <AnimatedBlock delay={100}>
                  <GuideCard href="#">
                    <GuideImage>🪴</GuideImage>
                    <GuideBody>
                      <GuideTitle>Plantekasse</GuideTitle>
                      <GuideDescription>Lag din egen plantekasse i størrelsen du trenger. Enkel og grei – godt resultat.</GuideDescription>
                    </GuideBody>
                  </GuideCard>
                </AnimatedBlock>
                <AnimatedBlock delay={150}>
                  <GuideCard href="#">
                    <GuideImage>📮</GuideImage>
                    <GuideBody>
                      <GuideTitle>Postkassestativ</GuideTitle>
                      <GuideDescription>Bygg et solid stativ til postkassen din. Flere designvarianter å velge mellom.</GuideDescription>
                    </GuideBody>
                  </GuideCard>
                </AnimatedBlock>
                <AnimatedBlock delay={200}>
                  <GuideCard href="#">
                    <GuideImage>🏠</GuideImage>
                    <GuideBody>
                      <GuideTitle>Varmepumpehus</GuideTitle>
                      <GuideDescription>Skjul varmepumpen med et pent og funksjonelt hus. Inneholder mål og monteringsanvisning.</GuideDescription>
                    </GuideBody>
                  </GuideCard>
                </AnimatedBlock>
                <AnimatedBlock delay={250}>
                  <GuideCard href="#">
                    <GuideImage>🗑️</GuideImage>
                    <GuideBody>
                      <GuideTitle>Søppelbod</GuideTitle>
                      <GuideDescription>En praktisk og pen bod til søppelkassene. Tilpasset norske standardmål.</GuideDescription>
                    </GuideBody>
                  </GuideCard>
                </AnimatedBlock>
                <AnimatedBlock delay={300}>
                  <GuideCard href="#">
                    <GuideImage>🪵</GuideImage>
                    <GuideBody>
                      <GuideTitle>Vedskjul</GuideTitle>
                      <GuideDescription>Bygg et enkelt vedskjul som holder veden tørr og luftig gjennom hele vinteren.</GuideDescription>
                    </GuideBody>
                  </GuideCard>
                </AnimatedBlock>
              </GuideGrid>
            </Container>
          </Content>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
