import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

const SITE_URL = 'https://minio.no'

interface Tjeneste {
  ikon: string
  navn: string
  ingress: string
  punkter: string[]
  kontaktEmne: string
}

const TJENESTER: Tjeneste[] = [
  {
    ikon: 'faHammer',
    navn: 'Rådgivning og hjelp på stedet',
    ingress:
      'Jeg kommer hjem til deg og hjelper deg i gang – eller blir med på den vanskelige delen. Vi planlegger, måler opp og bygger sammen, så du kommer trygt videre på egen hånd.',
    punkter: [
      'Oppstartshjelp: oppmåling, fundament og første rad',
      'Hjelp med de kritiske detaljene – innfesting, vinkler og bæring',
      'Veiledning mens du jobber, så du lærer underveis',
      'Timebasert + kjøring. Innlandet og store deler av Østlandet',
    ],
    kontaktEmne: 'Byggehjelp – rådgivning og hjelp på stedet',
  },
  {
    ikon: 'faPencilRuler',
    navn: 'Gjennomgang av tegning og materialliste',
    ingress:
      'Send meg skissen din, tegningen eller materiallista fra planleggeren – så går jeg gjennom den og gir deg konkrete tilbakemeldinger før du kjøper inn og bygger.',
    punkter: [
      'Sjekk av mål, dimensjoner og bæreevne',
      'Kontroll av materialliste og festemidler',
      'Forslag til enklere eller rimeligere løsninger',
      'Skriftlig svar – helt uavhengig av hvor du bor',
    ],
    kontaktEmne: 'Byggehjelp – gjennomgang av tegning og materialliste',
  },
]

const STEG = [
  { ikon: 'faEnvelope', tittel: 'Ta kontakt', tekst: 'Fortell kort om prosjektet ditt og hva du står fast på.' },
  { ikon: 'faComments', tittel: 'Vi avklarer', tekst: 'Vi blir enige om omfang, timer og hva du trenger hjelp til.' },
  { ikon: 'faClipboardList', tittel: 'Du får hjelpen', tekst: 'Gjennomgang på nett, eller jeg kommer på stedet og hjelper deg.' },
]

const BYGGEHJELP_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/byggehjelp#service`,
    name: 'Byggehjelp og rådgivning',
    serviceType: 'Byggerådgivning og praktisk byggehjelp på timen',
    description:
      'Leie en erfaren byggekyndig på timen: rådgivning og praktisk hjelp på stedet, eller gjennomgang av tegning og materialliste for ditt uteprosjekt i tre.',
    url: `${SITE_URL}/byggehjelp`,
    areaServed: { '@type': 'Place', name: 'Innlandet og Østlandet, Norge' },
    provider: { '@type': 'Organization', name: 'Minio', url: `${SITE_URL}/` },
    inLanguage: 'nb-NO',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'nb-NO',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Hva koster byggehjelp?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hjelpen er timebasert. Hjelp på stedet kommer i tillegg kjøring. Ta kontakt med en kort beskrivelse av prosjektet, så får du et estimat på antall timer og en pris før vi starter.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hvor kan du komme på stedet?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hjelp på stedet tilbys i Innlandet og store deler av Østlandet. Bor du lenger unna, kan vi ta gjennomgang av tegning og materialliste på nett uansett hvor du er.',
        },
      },
      {
        '@type': 'Question',
        name: 'Må jeg ha tegninger klare?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nei. Har du bare en idé, hjelper jeg deg i gang. Har du tegninger eller en materialliste fra planleggeren, går vi gjennom dem sammen.',
        },
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Byggehjelp', item: `${SITE_URL}/byggehjelp` },
    ],
  },
]

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  ${blueprintGrid}
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  &::after {
    ${blueprintGridVignette}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 5rem 1rem 2rem;
  }

  h1 {
    position: relative;
    z-index: 1;
    font-size: 2.6rem;
    margin: 0 0 1rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    position: relative;
    z-index: 1;
    font-size: 1.15rem;
    max-width: 680px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Intro = styled.section`
  background: #fff;
  padding: 4rem 2rem 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem 0.5rem;
  }
`

const IntroInner = styled.div`
  max-width: 820px;
  margin: 0 auto;

  h2 {
    font-size: 1.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 1.25rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1.08rem;
    line-height: 1.75;
    color: #3f3f3f;
    margin: 0 0 1.1rem;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const Services = styled.section`
  background: #fff;
  padding: 2.5rem 2rem 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1rem 0.5rem;
  }
`

const Grid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`

const Card = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 1.9rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);

  .ikon {
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.textDark};
    opacity: 0.7;
    margin-bottom: 0.9rem;
  }

  h3 {
    font-size: 1.3rem;
    margin: 0 0 0.65rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  .ingress {
    font-size: 0.96rem;
    line-height: 1.6;
    color: #555;
    margin: 0 0 1.1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.9rem;
    color: #444;
    line-height: 1.45;

    svg {
      margin-top: 0.15rem;
      color: ${({ theme }) => theme.colors.accent};
      flex-shrink: 0;
    }
  }
`

const CardButton = styled(Link)`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.8rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

const Steps = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3.5rem 2rem;
  margin-top: 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }
`

const StepsInner = styled.div`
  max-width: 1000px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 2rem;
  }
`

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const Step = styled.div`
  text-align: center;

  svg {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    opacity: 0.7;
    margin-bottom: 0.75rem;
  }

  strong {
    display: block;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.35rem;
  }

  span {
    font-size: 0.92rem;
    color: #666;
    line-height: 1.55;
  }
`

const CrossNote = styled.p`
  max-width: 820px;
  margin: 2.5rem auto 0;
  text-align: center;
  font-size: 1rem;
  color: #555;
  line-height: 1.6;

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
`

export default function ByggehjelpPage() {
  useSEO({
    title: 'Byggehjelp og rådgivning – leie byggekyndig på timen | Minio',
    description:
      'Står du fast på uteprosjektet? Leie en erfaren byggekyndig på timen – praktisk hjelp og rådgivning på stedet, eller gjennomgang av tegning og materialliste.',
    keywords:
      'byggehjelp, byggerådgivning, hjelp til å bygge terrasse, leie snekker, byggeveiledning, hjelp til byggeprosjekt, rådgivning bygging',
    ogImage: '/images/byggeguider/hagebenk.webp',
    ogImageAlt: 'Byggehjelp og rådgivning fra Minio',
    jsonLd: BYGGEHJELP_JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Byggehjelp og rådgivning – på timen</h1>
            <p>
              Vil du bygge selv, men står fast eller vil være trygg på at du gjør det riktig?
              Leie meg som rådgiver eller ekstra hånd – betal kun for timene du trenger.
            </p>
          </Hero>

          <Intro>
            <IntroInner>
              <h2>Få en erfaren byggekyndig på laget</h2>
              <p>
                De fleste uteprosjekter går fint helt til man treffer den ene detaljen man er
                usikker på – fundamentet, bæringen, en vinkel som ikke stemmer. Da er det godt å
                ha noen å spørre. Jeg hjelper deg <strong>i gang, gjennom det vanskelige, eller
                hele veien</strong> – akkurat så mye eller lite du trenger.
              </p>
              <p>
                Vil du prøve selv først? Start med de gratis{' '}
                <Link to="/byggeguider">byggeguidene</Link> og{' '}
                <Link to="/planleggere">planleggerne</Link> – og hent meg inn når du står fast.
              </p>
            </IntroInner>
          </Intro>

          <Services>
            <Grid>
              {TJENESTER.map((t) => (
                <Card key={t.navn}>
                  <div className="ikon"><Icon name={t.ikon} /></div>
                  <h3>{t.navn}</h3>
                  <p className="ingress">{t.ingress}</p>
                  <ul>
                    {t.punkter.map((p) => (
                      <li key={p}><Icon name="faCheck" /> {p}</li>
                    ))}
                  </ul>
                  <CardButton to={`/kontakt?subject=${encodeURIComponent(t.kontaktEmne)}`}>
                    Be om tilbud <Icon name="faArrowRight" />
                  </CardButton>
                </Card>
              ))}
            </Grid>
          </Services>

          <Steps>
            <StepsInner>
              <h2>Slik fungerer det</h2>
              <StepGrid>
                {STEG.map((s) => (
                  <Step key={s.tittel}>
                    <Icon name={s.ikon} />
                    <strong>{s.tittel}</strong>
                    <span>{s.tekst}</span>
                  </Step>
                ))}
              </StepGrid>
              <CrossNote>
                Vil du heller at vi bygger hele produktet for deg? Se alt vi lager{' '}
                <Link to="/handlaget-i-tre">håndlaget i tre</Link>.
              </CrossNote>
            </StepsInner>
          </Steps>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
