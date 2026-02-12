import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import { useSEO } from '../../../hooks/useSEO'
import ProcessStep from '../../sections/Process/ProcessStep'
import ServiceCard from '../../sections/Services/ServiceCard'

import Icon from '../../shared/Icon'
import { processSteps } from '../../../data/processSteps'
import { services } from '../../../data/services'

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

const Steps = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 3rem;
  }
`

const ServicesSection = styled.div`
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
    }
  }

  & > p {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #555;
  }
`

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 2rem;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`

const Cta = styled.div`
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    color: #555;
  }
`

const ContactButton = styled.a`
  display: inline-block;
  padding: 0.9rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }
`

export default function ProsessPage() {
  useSEO({
    title: 'Slik jobber vi – Minio',
    description: 'Fra første samtale til ferdig produkt – se hvordan Minio jobber med skreddersydde treløsninger. Kvalitet, presisjon og personlig oppfølging.',
  })

  return (
    <>
      <Navbar />
      <main>
        <Hero>
          <HeroContent>
            <h1>Slik jobber vi</h1>
            <p>Fra idé til ferdig produkt – her er prosessen når du bestiller skreddersydde treprodukter fra Minio.</p>
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            <Steps>
              {processSteps.map(step => (
                <ProcessStep key={step.number} step={step} />
              ))}
            </Steps>
            <ServicesSection>
              <h2>Hva tilbyr Minio?</h2>
              <p>Minio tilbyr skreddersydde treløsninger for uteområdet ditt, samt laserskjæring og gravering av skilt og dekor. Fra varmepumpehus og postkassestativer til personlige nummerskilt – alt lages på bestilling etter dine mål og ønsker.</p>
              <ServiceGrid>
                {services.map((service, i) => (
                  <ServiceCard key={i} service={service} />
                ))}
              </ServiceGrid>
            </ServicesSection>
            <Cta>
              <h3>Klar til å starte ditt prosjekt?</h3>
              <p>Ta kontakt i dag for en uforpliktende samtale om ditt neste treprodukt.</p>
              <ContactButton href="/kontakt">
                <Icon name="faEnvelope" /> Ta kontakt
              </ContactButton>
            </Cta>
          </Container>
        </Content>
      </main>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
