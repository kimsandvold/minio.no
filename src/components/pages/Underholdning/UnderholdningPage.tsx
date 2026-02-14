import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import { useSEO } from '../../../hooks/useSEO'
import PageTransition from '../../shared/PageTransition'

const GAMES = [
  {
    href: '/underholdning/tool-quiz.html',
    icon: '🌍',
    title: 'Verktøy Quiz',
    description: 'Vet du hvor de kjente verktøymerkene kommer fra? Pek på riktig land!',
  },
  {
    href: '/underholdning/tool-game.html',
    icon: '🔨',
    title: 'Finn Verktøyet',
    description: 'Trykk på riktig verktøy så fort du kan! Test reaksjonsevnen din.',
  },
  {
    href: '/underholdning/tool-nails.html',
    icon: '🪵',
    title: "Spiker'n",
    description: 'Treff den grønne sonen for å slå spikeren i planken! Timing er alt.',
  },
  {
    href: '/underholdning/tool-saw.html',
    icon: '🪚',
    title: 'Sag Rytme',
    description: 'Sag planker i perfekt rytme! Treff kuttelinjene for combo-bonus.',
  },
  {
    href: '/underholdning/tool-maze.html',
    icon: '👷',
    title: 'Verktøyjakt',
    description: 'Samle verktøy i labyrinten – unngå sinte kunder!',
  },
]

export default function UnderholdningPage() {
  useSEO({
    title: 'Minio Underholdning – Spill og vinn rabattkode',
    description: 'Spill morsomme verktøy-spill og vinn 10% rabattkode på varmepumpehus! Quiz, reaksjonsspill, timing-spill og mer fra Minio i Lillehammer.',
  })

  return (
    <PageTransition>
    <PageWrapper>
      <StarsContainer>
        <Stars />
        <Particles />
      </StarsContainer>

      <MainContent>
        <Container>
          <Logo>
            <img src="/images/branding/logo_white.svg" alt="Minio" />
          </Logo>

          <Title>Underholdning</Title>
          <Subtitle>Morsomme verktøy-spill</Subtitle>

          <RewardBanner>
            🎁 Vinn og få <strong>10% rabattkode</strong> på varmepumpehus!
          </RewardBanner>

          <GamesGrid>
            {GAMES.map((game, i) => (
              <GameCard
                key={game.title}
                href={game.href}
                $index={i}
              >
                <GameIcon>{game.icon}</GameIcon>
                <GameInfo>
                  <GameTitle>{game.title}</GameTitle>
                  <GameDescription>{game.description}</GameDescription>
                </GameInfo>
                <GameArrow>→</GameArrow>
              </GameCard>
            ))}
          </GamesGrid>

          <HomeLink to="/">← Tilbake til minio.no</HomeLink>
        </Container>
      </MainContent>
    </PageWrapper>
    </PageTransition>
  )
}

function Particles() {
  const colors = ['#1da1f2', '#4caf50', '#fff']
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${5 + Math.random() * 5}s`,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: `${2 + Math.random() * 3}px`,
  }))

  return (
    <>
      {particles.map((p) => (
        <Particle
          key={p.id}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </>
  )
}

/* Animations */

const twinkle = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`

const floatParticle = keyframes`
  0% { opacity: 0; transform: translateY(100vh) scale(0); }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { opacity: 0; transform: translateY(-20vh) scale(1); }
`

const rewardPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(29, 161, 242, 0.3); }
  50% { box-shadow: 0 0 20px 5px rgba(29, 161, 242, 0.1); }
`

const fadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`

/* Styled Components */

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #0a0a12;
  color: #f9f9f9;
  overflow-x: hidden;
`

const StarsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
`

const Stars = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at bottom, #1a1a2e 0%, #0a0a12 100%);

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-repeat: repeat;
  }

  &::before {
    background-image:
      radial-gradient(1px 1px at 25px 30px, white, transparent),
      radial-gradient(1px 1px at 50px 120px, white, transparent),
      radial-gradient(1px 1px at 100px 40px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1.5px 1.5px at 150px 80px, white, transparent),
      radial-gradient(1px 1px at 200px 150px, rgba(255,255,255,0.6), transparent),
      radial-gradient(1.5px 1.5px at 250px 60px, white, transparent),
      radial-gradient(1px 1px at 300px 180px, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 350px 20px, white, transparent),
      radial-gradient(1.5px 1.5px at 400px 100px, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 450px 140px, white, transparent);
    background-size: 500px 200px;
    animation: ${twinkle} 4s ease-in-out infinite;
  }

  &::after {
    background-image:
      radial-gradient(1px 1px at 75px 50px, rgba(255,255,255,0.5), transparent),
      radial-gradient(1.5px 1.5px at 125px 90px, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 175px 130px, rgba(255,255,255,0.4), transparent),
      radial-gradient(1px 1px at 225px 170px, rgba(255,255,255,0.6), transparent),
      radial-gradient(1.5px 1.5px at 275px 30px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 325px 70px, rgba(255,255,255,0.5), transparent),
      radial-gradient(1px 1px at 375px 110px, rgba(255,255,255,0.7), transparent),
      radial-gradient(1.5px 1.5px at 425px 160px, rgba(255,255,255,0.6), transparent);
    background-size: 450px 200px;
    animation: ${twinkle} 6s ease-in-out infinite reverse;
  }
`

const Particle = styled.div`
  position: absolute;
  border-radius: 50%;
  opacity: 0;
  filter: blur(1px);
  animation: ${floatParticle} 8s infinite;
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
  background: linear-gradient(135deg, #fff 0%, #1da1f2 100%);
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
  margin-bottom: 1rem;
  animation: ${fadeInDown} 0.4s ease-out 0.1s both;
`

const RewardBanner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, rgba(29, 161, 242, 0.15) 0%, rgba(76, 175, 80, 0.15) 100%);
  border: 1px solid rgba(29, 161, 242, 0.3);
  border-radius: 50px;
  font-size: 0.85rem;
  margin-bottom: 2rem;
  animation: ${fadeInDown} 0.4s ease-out 0.15s both, ${rewardPulse} 2s ease-in-out infinite 0.5s;

  strong {
    color: #4caf50;
  }

  @media (max-width: 500px) {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
  }
`

const GamesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const GameCard = styled.a<{ $index: number }>`
  background: rgba(20, 20, 35, 0.8);
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
    border-color: #1da1f2;
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(29, 161, 242, 0.4);
  }

  @media (max-width: 500px) {
    padding: 1.25rem;
  }
`

const GameIcon = styled.div`
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, rgba(29, 161, 242, 0.2) 0%, rgba(29, 161, 242, 0.05) 100%);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  flex-shrink: 0;
  transition: all 0.3s;
  border: 1px solid rgba(29, 161, 242, 0.2);

  ${GameCard}:hover & {
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 0 20px rgba(29, 161, 242, 0.4);
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
    color: #1da1f2;
  }
`

const HomeLink = styled(Link)`
  margin-top: 2.5rem;
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: rgba(20, 20, 35, 0.8);
  color: #f9f9f9;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
  animation: ${fadeInUp} 0.35s ease-out 0.4s both;

  &:hover {
    background: #1da1f2;
    border-color: #1da1f2;
  }
`
