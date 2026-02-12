import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import ServiceCard from './ServiceCard'
import FeaturedCreations from './FeaturedCreations'
import { services } from '../../../data/services'

const Grid = styled.div`
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

const StyledSection = styled(Section)`
  background: linear-gradient(135deg, #f9f9f7 0, #f1f1ef 100%);
`

export default function Services() {
  return (
    <StyledSection id="tjenester">
      <Container>
        <h2>Hva tilbyr minio?</h2>
        <p>Minio tilbyr skreddersydde treløsninger for uteområdet ditt, samt laserskjæring og gravering av skilt og dekor. Fra varmepumpehus og postkassestativer til personlige nummerskilt – alt lages på bestilling etter dine mål og ønsker.</p>
        <Grid>
          {services.map((service, i) => (
            <ServiceCard key={i} service={service} />
          ))}
        </Grid>
        <FeaturedCreations />
      </Container>
    </StyledSection>
  )
}
