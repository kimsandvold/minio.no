import { useState } from 'react'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimatedBlock from '../../shared/AnimatedBlock'
import Icon from '../../shared/Icon'
import { Link } from 'react-router-dom'
import { useSEO } from '../../../hooks/useSEO'
import { guidePhases, guideHref, guideTopics, topicsByPhase, topicMatchesQuery } from '../../../data/byggeguider'

const ACCENT = '#9c6b3f'
const SITE_URL = 'https://minio.no'

const Hero = styled.section`
  position: relative;
  min-height: 380px;
  display: flex;
  align-items: flex-end;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 8rem 2rem 3rem;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.darkBg};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('/images/diy_header.png');
    background-size: cover;
    background-position: center;
    opacity: 0.6;
    transform: scale(1.02);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(20, 20, 20, 0.35) 0%,
      rgba(20, 20, 20, 0.55) 55%,
      rgba(20, 20, 20, 0.92) 100%
    );
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 300px;
    padding: 6.5rem 1.5rem 2.25rem;
  }
`

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #e8c9a8;
    margin-bottom: 1rem;

    &::before {
      content: '';
      width: 28px;
      height: 1px;
      background: #e8c9a8;
    }
  }

  h1 {
    font-size: 3.1rem;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.01em;
    margin-bottom: 0.7rem;
    max-width: 16ch;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 2.1rem;
    }
  }

  p {
    font-size: 1.18rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.55;
    max-width: 60ch;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.02rem;
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
  max-width: 660px;
  margin: 0 auto;
  text-align: center;

  .eyebrow {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${ACCENT};
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 2.1rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 1.1rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
    }
  }

  p {
    font-size: 1.18rem;
    line-height: 1.7;
    color: #555;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.04rem;
    }
  }
`

/* ---------- "Før du begynner" journey ---------- */
const Journey = styled.section`
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 4rem 2rem 4.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3rem 1.25rem 3.5rem;
  }
`

const JourneyHeader = styled.header`
  text-align: center;
  max-width: 640px;
  margin: 0 auto 2.75rem;

  .eyebrow {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${ACCENT};
    margin-bottom: 0.85rem;
  }

  h2 {
    font-size: 1.9rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    line-height: 1.15;
    margin-bottom: 0.75rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1.05rem;
    color: #666;
    line-height: 1.6;
  }
`

const SearchWrap = styled.div`
  position: relative;
  max-width: 460px;
  margin: 0 auto 2.75rem;

  > svg {
    position: absolute;
    left: 1.15rem;
    top: 50%;
    transform: translateY(-50%);
    color: #b0b0b0;
    font-size: 0.95rem;
    pointer-events: none;
  }
`

const SearchInput = styled.input`
  width: 100%;
  padding: 0.9rem 1.1rem 0.9rem 2.9rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 1rem;
  font-family: inherit;
  color: ${({ theme }) => theme.colors.textDark};
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: #a8a8a8;
  }

  &:focus {
    outline: none;
    border-color: ${ACCENT};
    box-shadow: 0 0 0 3px rgba(156, 107, 63, 0.12);
  }
`

const NoResults = styled.p`
  text-align: center;
  color: #888;
  font-size: 1.02rem;
  padding: 2.5rem 0;

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const Phase = styled.div`
  & + & {
    margin-top: 2.5rem;
  }
`

const PhaseLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 1.1rem;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
  }
`

const TopicGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`

const topicCardStyles = `
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 1.15rem;
  padding: 1.5rem 1.5rem 1.4rem;
  border-radius: 18px;
  text-decoration: none;
  height: 100%;
  overflow: hidden;
`

const Num = styled.span`
  flex-shrink: 0;
  min-width: 2.3rem;
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 0.82;
  font-variant-numeric: tabular-nums;
  color: transparent;
  -webkit-text-stroke: 1.6px rgba(156, 107, 63, 0.5);
  transition: color 0.3s ease, -webkit-text-stroke-color 0.3s ease;
`

const TopicText = styled.div`
  min-width: 0;

  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.3rem;
  }

  p {
    font-size: 0.9rem;
    color: #6a6a6a;
    line-height: 1.55;
    margin-bottom: 0.85rem;
  }

  .go {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.84rem;
    font-weight: 700;
    color: ${ACCENT};
    transition: gap 0.25s ease;

    svg {
      font-size: 0.72rem;
    }
  }

  .soon {
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #9a9a9a;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.3rem 0.65rem;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
  }
`

const TopicLink = styled(Link)`
  ${topicCardStyles}
  background: #fff;
  color: inherit;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #b8895c, ${ACCENT});
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(156, 107, 63, 0.35);
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.11);
  }

  &:hover::before {
    transform: scaleX(1);
  }

  &:hover ${Num} {
    color: ${ACCENT};
    -webkit-text-stroke-color: ${ACCENT};
  }

  &:hover .go {
    gap: 0.7rem;
  }
`

const TopicSoon = styled.div`
  ${topicCardStyles}
  background: ${({ theme }) => theme.colors.lightBg};
  border: 1px dashed rgba(0, 0, 0, 0.14);
  cursor: default;

  h3 {
    color: #7d7d7d;
  }

  ${Num} {
    -webkit-text-stroke-color: rgba(0, 0, 0, 0.16);
  }
`

export default function DIYGuiderPage() {
  useSEO({
    title: 'Byggeguider – bygg det selv | Minio',
    description:
      'Gratis byggeguider for deg som vil bygge selv. Lær planlegging, valg av trevirke og verktøy, byggeteknikk, sliping og overflatebehandling – steg for steg.',
    ogImage: '/images/diy_header.png',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Byggeguider', item: `${SITE_URL}/byggeguider` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Byggeguider fra Minio',
        itemListElement: guideTopics.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t.title,
          url: `${SITE_URL}/byggeguider/${t.slug}`,
        })),
      },
    ],
  })

  const [query, setQuery] = useState('')

  const filteredPhases = guidePhases
    .map((phase) => ({
      phase,
      topics: topicsByPhase(phase.key).filter((t) => topicMatchesQuery(t, query)),
    }))
    .filter((p) => p.topics.length > 0)

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <span className="eyebrow">Gratis byggeguider</span>
              <h1>Bygg det selv</h1>
              <p>Steg-for-steg guider til hage- og uteprosjekter – med mål, materialliste og fremgangsmåte.</p>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              <AnimatedBlock>
                <Intro>
                  <span className="eyebrow">Kom i gang</span>
                  <h2>Det er enklere enn du tror</h2>
                  <p>
                    Du trenger verken proft verktøy eller års erfaring for å lage noe du blir
                    stolt av. Med litt tid, noen enkle materialer og en oppskrift å følge kommer
                    du overraskende langt. Velg et lite prosjekt, ta det steg for steg – og kjenn
                    på følelsen av å ha bygget det selv.
                  </p>
                </Intro>
              </AnimatedBlock>
            </Container>
          </Content>

          <Journey>
            <Container>
              <AnimatedBlock>
                <JourneyHeader>
                  <span className="eyebrow">Før du begynner</span>
                  <h2>Lær det grunnleggende</h2>
                  <p>
                    Litt kunnskap før du starter gjør hele forskjellen. Følg guidene i rekkefølge,
                    eller hopp rett til det du lurer på.
                  </p>
                </JourneyHeader>
              </AnimatedBlock>

              <SearchWrap>
                <Icon name="faSearch" />
                <SearchInput
                  type="search"
                  placeholder="Søk i guidene – f.eks. «skruer», «beis», «sag»…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Søk i byggeguidene"
                />
              </SearchWrap>

              {filteredPhases.length === 0 ? (
                <NoResults>
                  Ingen guider matcher <strong>«{query}»</strong>. Prøv et annet søkeord.
                </NoResults>
              ) : (
                filteredPhases.map(({ phase, topics }) => (
                  <Phase key={phase.key}>
                    <PhaseLabel>{phase.label}</PhaseLabel>
                    <TopicGrid>
                      {topics.map((topic) => (
                        <div key={topic.slug}>
                          {topic.available ? (
                            <TopicLink to={guideHref(topic)}>
                              <Num>{String(topic.number).padStart(2, '0')}</Num>
                              <TopicText>
                                <h3>{topic.title}</h3>
                                <p>{topic.teaser}</p>
                                <span className="go">
                                  Les guide
                                  <Icon name="faArrowRight" />
                                </span>
                              </TopicText>
                            </TopicLink>
                          ) : (
                            <TopicSoon>
                              <Num>{String(topic.number).padStart(2, '0')}</Num>
                              <TopicText>
                                <h3>{topic.title}</h3>
                                <p>{topic.teaser}</p>
                                <span className="soon">Kommer snart</span>
                              </TopicText>
                            </TopicSoon>
                          )}
                        </div>
                      ))}
                    </TopicGrid>
                  </Phase>
                ))
              )}
            </Container>
          </Journey>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
