import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import { useSEO } from '../../../hooks/useSEO'
import PageTransition from '../../shared/PageTransition'

const GAMES = [
  {
    href: '/leah-noelle/bananashake.html',
    icon: '🍌',
    title: 'Bananashake',
    description: 'Hjelp bananen å samle truser! Et morsomt spill laget av Leah Noelle.',
  },
  {
    href: '/leah-noelle/kattespill.html',
    icon: '🐱',
    title: 'Kattens hinderløype',
    description: 'Hjelp katten gjennom hinderløypa! Et morsomt spill laget av Leah Noelle.',
  },
  {
    href: '/leah-noelle/spokelseshuset.html',
    icon: '👻',
    title: 'Spøkelseshuset Gjemsel',
    description: 'Gjem deg fra spøkelsene i det skumle huset! Et spill laget av Leah Noelle.',
  },
  {
    href: '/leah-noelle/fangelek.html',
    icon: '🏃‍♀️',
    title: 'Fangelek',
    description: 'Overlev 10 sekunder uten å bli tatt av monsteret! Et spill laget av Leah Noelle.',
  },
]

export default function LeahNoellePage() {
  useSEO({
    title: 'Spill av Leah Noelle – Minio',
    description: 'Spill morsomme spill laget av Leah Noelle. Bananashake og flere spill kommer.',
    noindex: true,
  })

  return (
    <PageTransition>
      <PageWrapper>
        <MainContent>
          <Container>
            <Logo>
              <img src="/images/branding/logo_white.svg" alt="Minio" />
            </Logo>

            <Title>Spill av Leah Noelle</Title>
            <Subtitle>Hjemmelagde spill med masse moro</Subtitle>

            <GamesGrid>
              {GAMES.map((game, i) => (
                <GameCard key={game.title} href={game.href} $index={i}>
                  <GameIcon>{game.icon}</GameIcon>
                  <GameInfo>
                    <GameTitle>{game.title}</GameTitle>
                    <GameDescription>{game.description}</GameDescription>
                  </GameInfo>
                  <GameArrow>→</GameArrow>
                </GameCard>
              ))}
            </GamesGrid>

            <ComingSoon>Flere spill kommer snart …</ComingSoon>

            <HomeLink to="/">← Tilbake til minio.no</HomeLink>
          </Container>
        </MainContent>
      </PageWrapper>
    </PageTransition>
  )
}

const fadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #2a1f0a 0%, #1a1308 60%, #0f0a04 100%);
  color: #f9f9f9;
  overflow-x: hidden;
`

const MainContent = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`

const Container = styled.div`
  max-width: 500px;
  width: 100%;
  text-align: center;
`

const Logo = styled.div`
  margin-bottom: 1rem;
  animation: ${fadeInDown} 0.4s ease-out;

  img {
    height: 45px;
    width: auto;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.1));
  }
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, #FAC775 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInDown} 0.4s ease-out 0.05s both;

  @media (max-width: 500px) {
    font-size: 2rem;
  }
`

const Subtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2rem;
  animation: ${fadeInDown} 0.4s ease-out 0.1s both;
`

const GamesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const GameCard = styled.a<{ $index: number }>`
  background: rgba(35, 25, 10, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  text-decoration: none;
  color: #f9f9f9;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: ${fadeInUp} 0.35s ease-out both;
  animation-delay: ${({ $index }) => 0.2 + $index * 0.08}s;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    border-color: #FAC775;
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(250, 199, 117, 0.4);
  }

  @media (max-width: 500px) {
    padding: 1.25rem;
  }
`

const GameIcon = styled.div`
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, rgba(250, 199, 117, 0.25) 0%, rgba(250, 199, 117, 0.05) 100%);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  flex-shrink: 0;
  transition: all 0.3s;
  border: 1px solid rgba(250, 199, 117, 0.25);

  ${GameCard}:hover & {
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 0 20px rgba(250, 199, 117, 0.4);
  }

  @media (max-width: 500px) {
    width: 60px;
    height: 60px;
    font-size: 1.8rem;
  }
`

const GameInfo = styled.div`
  text-align: left;
  flex: 1;
`

const GameTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.3rem;

  @media (max-width: 500px) {
    font-size: 1.1rem;
  }
`

const GameDescription = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;

  @media (max-width: 500px) {
    font-size: 0.8rem;
  }
`

const GameArrow = styled.span`
  font-size: 1.5rem;
  opacity: 0.3;
  transition: all 0.3s;
  flex-shrink: 0;

  ${GameCard}:hover & {
    opacity: 1;
    transform: translateX(5px);
    color: #FAC775;
  }
`

const ComingSoon = styled.p`
  margin-top: 2rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  animation: ${fadeInUp} 0.35s ease-out 0.4s both;
`

const HomeLink = styled(Link)`
  margin-top: 1.5rem;
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: rgba(35, 25, 10, 0.8);
  color: #f9f9f9;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
  animation: ${fadeInUp} 0.35s ease-out 0.5s both;

  &:hover {
    background: #FAC775;
    color: #1a1308;
    border-color: #FAC775;
  }
`
