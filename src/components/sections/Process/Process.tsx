import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import ProcessStep from './ProcessStep'
import { processSteps } from '../../../data/processSteps'

const Intro = styled.div`
  margin-bottom: 3rem;
  text-align: center;
`

const Steps = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 3rem;
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

const ContactButton = styled.button`
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
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }
`

function navigateToContact(subject: string) {
  window.location.href = `/kontakt?subject=${encodeURIComponent(subject)}`
}

export default function Process() {
  return (
    <Section id="prosess" variant="gradient">
      <Container>
        <h2>Slik jobber vi</h2>
        <Intro>
          <p>Fra idé til ferdig produkt – her er prosessen når du bestiller skreddersydde treprodukter fra Minio.</p>
        </Intro>
        <Steps>
          {processSteps.map(step => (
            <ProcessStep key={step.number} step={step} />
          ))}
        </Steps>
        <Cta>
          <h3>Klar til å starte ditt prosjekt?</h3>
          <p>Ta kontakt i dag for en uforpliktende samtale om ditt neste treprodukt.</p>
          <ContactButton onClick={() => navigateToContact('Jeg er interessert i tjenesten: Bestilling av skreddersydd treprodukt')}>
            Ta kontakt
          </ContactButton>
        </Cta>
      </Container>
    </Section>
  )
}
