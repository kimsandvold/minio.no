import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimatedBlock from '../../shared/AnimatedBlock'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { inspirationCourses } from '../../../data/inspirationCourses'
import { faqItems } from '../../../data/faqData'
import CourseCard from './CourseCard'
import FaqSection from './FaqSection'
import LevelSelector from './LevelSelector'
import type { UserLevel } from '../../../types/product'

const Page = styled.main`
  display: flex;
  flex-direction: column;
`

const Hero = styled.section`
  min-height: 30vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 4.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/images/diy_header.png') center / cover no-repeat;
    opacity: 0.4;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 25vh;
    padding: 5rem 1.5rem 3.5rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;
  position: relative;
  z-index: 1;

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

const Section = styled.section<{ $alt?: boolean }>`
  background: ${({ $alt, theme }) =>
    $alt ? theme.colors.lightBg : '#fff'};
  padding: 4rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const SectionHeader = styled.div`
  margin-bottom: 2.5rem;
  text-align: center;

  h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
    }
  }

  p {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #555;
    max-width: 600px;
    margin: 0 auto;
  }
`

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const FaqWrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
`

const Cta = styled.div`
  text-align: center;
  max-width: 600px;
  margin: 0 auto;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    color: #555;
    line-height: 1.6;
  }
`

const ContactButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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

const LevelInfo = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #888;
  margin: 0 0 1.5rem;
`

type FilterLevel = UserLevel | 'all'
const validLevels: FilterLevel[] = ['beginner', 'intermediate', 'advanced', 'all']

function parseLevel(raw: string | null): FilterLevel {
  if (raw && validLevels.includes(raw as FilterLevel)) return raw as FilterLevel
  const stored = localStorage.getItem('diyLevel')
  if (stored && validLevels.includes(stored as FilterLevel)) return stored as FilterLevel
  return 'all'
}

export default function InspirasjonOgGuiderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [level, setLevel] = useState<FilterLevel>(() => parseLevel(searchParams.get('niva')))

  useSEO({
    title: 'Treskolen – Minio',
    description: 'En nettskole i trearbeid – lær om materialvalg, verktøy, byggeteknikker og vedlikehold. Velg ditt nivå og følg læreplanen.',
  })

  useEffect(() => {
    localStorage.setItem('diyLevel', level)
    const current = searchParams.get('niva')
    if (current !== level) {
      setSearchParams({ niva: level }, { replace: true })
    }
  }, [level])

  const handleLevelChange = (newLevel: FilterLevel) => {
    setLevel(newLevel)
  }

  const filteredCourses = inspirationCourses.filter((c) => {
    if (level === 'all') return true
    if (level === 'beginner') return c.level === 'beginner'
    if (level === 'intermediate') return c.level === 'beginner' || c.level === 'intermediate'
    return true
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <Page>
          <Hero>
            <HeroContent>
              <h1>Treskolen</h1>
              <p>Bli en treskalle – gå Treskolen. Velg et kurs og følg læreplanen.</p>
            </HeroContent>
          </Hero>

          <LevelSelector value={level} onChange={handleLevelChange} />

          <Section $alt>
            <Container>
              <AnimatedBlock>
                <SectionHeader>
                  <h2>Kurs</h2>
                  <p>Strukturerte læringsløp med teori og praktiske byggeoppgaver – tilpasset ditt nivå.</p>
                </SectionHeader>
              </AnimatedBlock>
              <LevelInfo>
                Viser {filteredCourses.length} av {inspirationCourses.length} kurs for ditt nivå
              </LevelInfo>
              <CourseGrid>
                {filteredCourses.map((course, i) => (
                  <AnimatedBlock key={course.slug} delay={i * 60}>
                    <CourseCard course={course} />
                  </AnimatedBlock>
                ))}
              </CourseGrid>
            </Container>
          </Section>

          <Section>
            <Container>
              <AnimatedBlock>
                <SectionHeader>
                  <h2>Spørsmål om skolen</h2>
                  <p>Svar på det vi ofte blir spurt om – fra materialvalg og verktøy til byggesøknad og vedlikehold.</p>
                </SectionHeader>
              </AnimatedBlock>
              <FaqWrap>
                <FaqSection items={faqItems} />
              </FaqWrap>
            </Container>
          </Section>

          <Section $alt>
            <Container>
              <AnimatedBlock>
                <Cta>
                  <h3>Klar for neste trinn?</h3>
                  <p>Enten du bygger selv eller vil ha et skreddersydd produkt – vi hjelper deg hele veien.</p>
                  <ContactButton href="/kontakt">
                    <Icon name="faEnvelope" /> Ta kontakt
                  </ContactButton>
                </Cta>
              </AnimatedBlock>
            </Container>
          </Section>
        </Page>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
