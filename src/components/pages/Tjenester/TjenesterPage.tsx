import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimatedBlock from '../../shared/AnimatedBlock'
import Icon from '../../shared/Icon'
import Leveringskart from '../../shared/Leveringskart/Leveringskart'
import { useSEO } from '../../../hooks/useSEO'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

/**
 * Samleside for alt Minio gjør *for* kunden, i motsetning til verktøyene
 * kunden bruker selv. Tjenestene lå tidligere bare i footeren, så den som
 * ville at noen andre skulle gjøre jobben hadde ingen inngang i toppmenyen.
 */

interface Tjeneste {
  id: string
  ikon: string
  tittel: string
  ingress: string
  punkter: string[]
  til: string
  lenketekst: string
  ekstern?: boolean
}

const TJENESTER: Tjeneste[] = [
  {
    id: 'prosjekthjelp',
    ikon: 'faLightbulb',
    tittel: 'Prosjekthjelp – helt gratis',
    ingress:
      'Har du en idé til et uteprosjekt, men vet ikke hvor du skal starte? Fortell om den, så får du et personlig svar på e-post – uforpliktende.',
    punkter: [
      'Ærlig svar om kostnad og materialer',
      'Ingen konto eller innlogging',
      'Du bestemmer om det blir noe mer',
    ],
    til: '/prosjekthjelp',
    lenketekst: 'Fortell om idéen din',
  },
  {
    id: 'ferdig',
    ikon: 'faHammer',
    tittel: 'Vi bygger de små tingene',
    ingress:
      'Plantekasser, varmepumpehus, søppelboder, vedskjul, postkassestativ, utedo og utekjøkken bygger vi ferdig i verkstedet på Lillehammer.',
    punkter: [
      'Massivt tre, håndlaget på bestilling',
      'Ubehandlet, grunnet eller ferdig malt',
      'Levert innenfor 200 km kjørevei',
    ],
    til: '/produkter',
    lenketekst: 'Se hva vi bygger',
  },
  {
    id: '3d-design',
    ikon: 'faPalette',
    tittel: '3D-design — vi tegner det for deg',
    ingress:
      'Har du en idé som ikke finnes i designverktøyet? Send mål og bilder, så tegner og renderer vi prosjektet i 3D.',
    punkter: [
      '3D-skisse og fotorealistisk rendering',
      'Målsatt tegning og materialliste',
      'Skisseprisen trekkes fra ved bygg',
    ],
    til: '/3d-design',
    lenketekst: 'Se 3D-design',
  },
  {
    id: 'byggehjelp',
    ikon: 'faComments',
    tittel: 'Byggehjelp og rådgivning',
    ingress:
      'Står du fast? Leie en erfaren byggekyndig på timen — på stedet, eller til gjennomgang av tegning og materialliste.',
    punkter: [
      'Gjennomgang av tegning og mål',
      'Praktisk hjelp på byggeplassen',
      'Svar før du kjøper materialer',
    ],
    til: '/byggehjelp',
    lenketekst: 'Les om byggehjelp',
  },
  {
    id: 'skilt',
    ikon: 'faPencilRuler',
    tittel: 'Skilt og gravering',
    ingress:
      'Husskilt, hytteskilt, adresseskilt eller gravering på et produkt — designet i nettleseren og laserskåret hos oss.',
    punkter: [
      'Over 100 symboler og flere skrifttyper',
      'Lagre og del designet med oss',
      'Eksporteres som SVG for laserskjæring',
    ],
    til: '/skilt-og-gravering',
    lenketekst: 'Åpne skiltdesigneren',
  },
]

const TJENESTER_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://minio.no/tjenester#page',
    name: 'Tjenester – Minio',
    url: 'https://minio.no/tjenester',
    description:
      'Minios tjenester: ferdig bygde små treprodukter, 3D-design, byggehjelp og rådgivning, samt skilt og gravering.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: TJENESTER.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.tittel,
      url: `https://minio.no${t.til}`,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
      { '@type': 'ListItem', position: 2, name: 'Tjenester', item: 'https://minio.no/tjenester' },
    ],
  },
]

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  min-height: 30vh;
  ${blueprintGrid}
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.inkInverted};
  text-align: center;
  padding: 7rem 2rem 3.5rem;

  &::after {
    ${blueprintGridVignette}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 6rem 1.5rem 2.5rem;
  }
`

const HeroInnhold = styled.div`
  position: relative;
  z-index: 1;
  max-width: 46rem;

  h1 {
    margin-bottom: 0.9rem;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.7;
    margin: 0;
  }
`

const Innhold = styled.section`
  background: ${({ theme }) => theme.colors.paper};
  padding: 4.5rem 2rem 5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3rem 1rem 3.5rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 1.5rem;
  align-items: stretch;

  > * {
    display: flex;
  }
`

const Kort = styled.article`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2rem 1.75rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition:
    transform ${({ theme }) => theme.transitions.soft},
    box-shadow ${({ theme }) => theme.transitions.soft};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin: 0 0 0.75rem;
  }
`

const IkonFlate = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: 1.1rem;
  margin-bottom: 1.25rem;
`

const Ingress = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: 0 0 1.25rem;
`

const Punkter = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.ink};

    svg {
      margin-top: 0.3rem;
      flex-shrink: 0;
      font-size: 0.7rem;
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const Handling = styled(Link)`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.ink};
    border-color: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};
  }
`

const SelvBanner = styled.div`
  margin-top: 3.5rem;
  padding: 2rem 2.25rem;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;

  h2 {
    color: ${({ theme }) => theme.colors.inkInverted};
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin: 0 0 0.5rem;
  }

  p {
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin: 0;
    max-width: 44ch;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.75rem 1.5rem;
  }
`

const SelvCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.9rem 1.6rem;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

const KartSeksjon = styled.div`
  margin-top: 4.5rem;
  padding-top: 4rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 3rem;
    padding-top: 2.5rem;
  }
`

export default function TjenesterPage() {
  useSEO({
    title: 'Tjenester – ferdig bygget, 3D-design, byggehjelp og gravering | Minio',
    description:
      'Skal noen andre gjøre jobben? Vi bygger de små treproduktene ferdig, tegner prosjektet ditt i 3D, gir byggehjelp på timen og lager skilt med gravering.',
    keywords:
      'tjenester, få bygget plantekasse, varmepumpehus på bestilling, 3D-design, byggehjelp, rådgivning, skilt og gravering, snekker Lillehammer',
    ogImage: '/images/byggeguider/hagebenk.webp',
    ogImageAlt: 'Minios tjenester',
    jsonLd: TJENESTER_JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroInnhold>
              <h1>Skal noen andre gjøre jobben?</h1>
              <p>
                Designverktøyet og byggeguidene er til deg som bygger selv. Her er det
                motsatte: vi tegner prosjektet ditt, går gjennom tegningen din, graverer
                skiltet — og bygger de små produktene ferdig.
              </p>
            </HeroInnhold>
          </Hero>

          <Innhold>
            <Container>
              <Grid>
                {TJENESTER.map((t, i) => (
                  <AnimatedBlock key={t.id} delay={i * 80}>
                    <Kort>
                      <IkonFlate aria-hidden="true">
                        <Icon name={t.ikon} />
                      </IkonFlate>
                      <h2>{t.tittel}</h2>
                      <Ingress>{t.ingress}</Ingress>
                      <Punkter>
                        {t.punkter.map((p) => (
                          <li key={p}>
                            <Icon name="faCheck" /> {p}
                          </li>
                        ))}
                      </Punkter>
                      <Handling to={t.til}>
                        {t.lenketekst} <Icon name="faArrowRight" />
                      </Handling>
                    </Kort>
                  </AnimatedBlock>
                ))}
              </Grid>

              <AnimatedBlock>
                <SelvBanner data-surface="dark">
                  <div>
                    <h2>Vil du heller bygge selv?</h2>
                    <p>
                      Tegn prosjektet i 3D med dine egne mål — gratis — og kjøp byggeplanen
                      med materialliste, kappliste og arbeidstegninger når du er klar.
                    </p>
                  </div>
                  <SelvCta to="/designverktoy">
                    <Icon name="faCube" /> Åpne designverktøyet
                  </SelvCta>
                </SelvBanner>
              </AnimatedBlock>

              <AnimatedBlock>
                <KartSeksjon>
                  <Leveringskart />
                </KartSeksjon>
              </AnimatedBlock>
            </Container>
          </Innhold>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
