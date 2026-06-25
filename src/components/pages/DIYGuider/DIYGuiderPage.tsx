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
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'
import {
  guidePhases,
  guideHref,
  guideTopics,
  guideProjects,
  projectHref,
  topicsByPhase,
  topicMatchesQuery,
} from '../../../data/byggeguider'

const ACCENT = '#9c6b3f'
const SITE_URL = 'https://minio.no'

const Hero = styled.section`
  position: relative;
  display: flex;
  align-items: flex-end;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 7rem 2rem 3rem;
  overflow: hidden;
  ${blueprintGrid}

  &::after {
    ${blueprintGridVignette}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 6rem 1.5rem 2.25rem;
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

/* ---------- Prosjekter ---------- */
const Projects = styled.section`
  background: #fff;
  padding: 4rem 2rem 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3rem 1.25rem 0.5rem;
  }
`

const ProjectsHeader = styled.header`
  text-align: center;
  max-width: 640px;
  margin: 0 auto 2.5rem;

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

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const ProjectCard = styled(Link)`
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.28s ease, box-shadow 0.28s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.12);
  }

  &:hover .go {
    gap: 0.7rem;
  }
`

const ProjectThumb = styled.div`
  position: relative;
  aspect-ratio: 16 / 11;
  overflow: hidden;
  background: linear-gradient(135deg, #efe7dd 0%, #e2d4c3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(156, 107, 63, 0.55);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const ProjectBody = styled.div`
  padding: 1.35rem 1.4rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.4rem;
  }

  > p {
    font-size: 0.92rem;
    color: #5f5f5f;
    line-height: 1.55;
    flex: 1;
  }

  .meta {
    display: flex;
    gap: 1.25rem;
    margin: 1rem 0;
    font-size: 0.82rem;
    color: #777;

    strong {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 0.15rem;
    }
  }

  .go {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88rem;
    font-weight: 700;
    color: ${ACCENT};
    transition: gap 0.25s ease;

    svg {
      font-size: 0.72rem;
    }
  }
`

const Featured = styled(Link)`
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 22px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 56px rgba(0, 0, 0, 0.13);
  }

  &:hover .cta {
    gap: 0.75rem;
  }

  &:hover img {
    transform: scale(1.04);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const FeaturedImg = styled.div`
  overflow: hidden;
  background: linear-gradient(135deg, #efe7dd 0%, #e2d4c3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  color: rgba(156, 107, 63, 0.55);
  font-weight: 600;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 240px;
  }
`

const FeaturedBody = styled.div`
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1.5rem;
  }

  .tag {
    display: inline-block;
    align-self: flex-start;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${ACCENT};
    margin-bottom: 0.9rem;
  }

  h3 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.1;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.75rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
    }
  }

  > p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: #5f5f5f;
    margin-bottom: 1.5rem;
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    align-self: flex-start;
    padding: 0.8rem 1.6rem;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    background: ${ACCENT};
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    transition: gap 0.25s ease;

    svg {
      font-size: 0.78rem;
    }
  }
`

const FeaturedFacts = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;

  div {
    min-width: 0;
  }

  strong {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 0.2rem;
  }

  span {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
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
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
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

          <Projects>
            <Container>
              <AnimatedBlock>
                <ProjectsHeader>
                  <span className="eyebrow">Prosjekter</span>
                  <h2>Bygg et prosjekt</h2>
                  <p>Ferdige byggeguider du kan følge fra start til slutt – med mål og materialliste.</p>
                </ProjectsHeader>
              </AnimatedBlock>
              {guideProjects.length === 1 ? (
                <AnimatedBlock>
                  <Featured to={projectHref(guideProjects[0])}>
                    <FeaturedImg>
                      {guideProjects[0].image ? (
                        <img src={guideProjects[0].image} alt={guideProjects[0].title} loading="lazy" />
                      ) : (
                        'Bilde kommer'
                      )}
                    </FeaturedImg>
                    <FeaturedBody>
                      <span className="tag">Prosjekt</span>
                      <h3>{guideProjects[0].title}</h3>
                      <p>{guideProjects[0].teaser}</p>
                      <FeaturedFacts>
                        <div>
                          <strong>Vanskelighet</strong>
                          <span>{guideProjects[0].difficulty}</span>
                        </div>
                        <div>
                          <strong>Tid</strong>
                          <span>{guideProjects[0].time}</span>
                        </div>
                        <div>
                          <strong>Materiale</strong>
                          <span>Terrassebord</span>
                        </div>
                      </FeaturedFacts>
                      <span className="cta">
                        Se hele guiden
                        <Icon name="faArrowRight" />
                      </span>
                    </FeaturedBody>
                  </Featured>
                </AnimatedBlock>
              ) : (
                <ProjectGrid>
                  {guideProjects.map((project, i) => (
                    <AnimatedBlock key={project.slug} delay={i * 50}>
                      <ProjectCard to={projectHref(project)}>
                        <ProjectThumb>
                          {project.image ? (
                            <img src={project.image} alt={project.title} loading="lazy" />
                          ) : (
                            'Bilde kommer'
                          )}
                        </ProjectThumb>
                        <ProjectBody>
                          <h3>{project.title}</h3>
                          <p>{project.teaser}</p>
                          <div className="meta">
                            <span>
                              <strong>Vanskelighet</strong>
                              {project.difficulty}
                            </span>
                            <span>
                              <strong>Tid</strong>
                              {project.time}
                            </span>
                          </div>
                          <span className="go">
                            Se guide
                            <Icon name="faArrowRight" />
                          </span>
                        </ProjectBody>
                      </ProjectCard>
                    </AnimatedBlock>
                  ))}
                </ProjectGrid>
              )}
            </Container>
          </Projects>

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
