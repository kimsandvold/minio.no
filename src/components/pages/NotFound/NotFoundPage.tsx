import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { rockGently, fadeIn } from '../../../styles/animations'

const Wrapper = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;
`

const Content = styled.div`
  max-width: 560px;
`

const HammerIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  display: inline-block;
  animation: ${rockGently} 2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Title = styled.h1`
  font-size: 6rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  line-height: 1;
  animation: ${fadeIn} 0.6s ease both;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 4rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.2rem;
  }
`

const Description = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0 0 2.5rem;
`

const SuggestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`

const SuggestionCard = styled(Link)<{ $delay: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textLight};
  transition: background 0.2s, transform 0.2s;
  animation: ${fadeIn} 0.5s ease both;
  animation-delay: ${({ $delay }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  svg {
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.accent};
  }

  span {
    font-size: 0.9rem;
    font-weight: 600;
  }
`

const HomeButton = styled(Link)`
  display: inline-block;
  padding: 0.85rem 2rem;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(29, 161, 242, 0.35);
  }
`

export default function NotFoundPage() {
  useSEO({
    title: 'Siden ble ikke funnet – Minio',
    description: 'Beklager, denne siden finnes ikke. Gå tilbake til forsiden.',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <Wrapper>
          <Content>
            <HammerIcon>
              <Icon name="faHammer" />
            </HammerIcon>
            <Title>404</Title>
            <Subtitle>Her var det tomt for materialer</Subtitle>
            <Description>
              Siden du leter etter finnes ikke, eller har blitt flyttet til et nytt verksted.
            </Description>
            <SuggestionGrid>
              <SuggestionCard to="/" $delay={100}>
                <Icon name="faHome" />
                <span>Hjem</span>
              </SuggestionCard>
              <SuggestionCard to="/produkter" $delay={200}>
                <Icon name="faCube" />
                <span>Produkter</span>
              </SuggestionCard>
              <SuggestionCard to="/kontakt" $delay={300}>
                <Icon name="faEnvelope" />
                <span>Kontakt</span>
              </SuggestionCard>
            </SuggestionGrid>
            <HomeButton to="/">Tilbake til forsiden</HomeButton>
          </Content>
        </Wrapper>
      </PageTransition>
      <Footer />
    </>
  )
}
