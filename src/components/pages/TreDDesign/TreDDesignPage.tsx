import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import ZoomableImage from '../../shared/ZoomableImage'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

const SITE_URL = 'https://minio.no'

// Eksempel-renderinger. PLASSHOLDERE inntil ekte SketchUp-renderinger finnes:
// legg dem i /public/images/3d-design/ og bytt ut src + alt under.
interface Render {
  src: string
  alt: string
  caption: string
}

const RENDERS: Render[] = [
  {
    src: '/images/planleggere/pergola-hero.webp',
    alt: '3D-rendering av pergola sett fra hagen',
    caption: 'Pergola – sett fra hagen',
  },
  {
    src: '/images/planleggere/terrasse-inspirasjon.webp',
    alt: '3D-rendering av terrasse med rekkverk',
    caption: 'Terrasse med rekkverk',
  },
  {
    src: '/images/planleggere/pergola-inspirasjon.webp',
    alt: '3D-rendering av pergola med klatreplanter',
    caption: 'Pergola med espalier',
  },
  {
    src: '/images/planleggere/pergola-inspirasjon-2.webp',
    alt: '3D-rendering av pergola i kveldslys',
    caption: 'Detalj – innfesting og bæring',
  },
]

interface Pakke {
  ikon: string
  navn: string
  pris: string
  ingress: string
  punkter: string[]
  kreditt?: string
  fremhevet?: boolean
  kontaktEmne: string
}

const PAKKER: Pakke[] = [
  {
    ikon: 'faCube',
    navn: '3D-skisse',
    pris: 'fra 1 990 kr',
    ingress: 'For deg som vil se idéen visualisert før du bestemmer deg.',
    punkter: [
      'Ett designforslag etter dine mål og ønsker',
      '3D-skisse fra flere vinkler',
      'Én fotorealistisk rendering',
      'Enkel materialoversikt',
    ],
    kreditt: 'Trekkes fra hvis du bestiller bygg eller materialpakke',
    kontaktEmne: '3D-design – 3D-skisse',
  },
  {
    ikon: 'faPalette',
    navn: 'Designpakke',
    pris: 'fra 3 990 kr',
    ingress: 'Det komplette grunnlaget for å bygge – eller bestille bygget hos meg.',
    punkter: [
      'Inntil tre forslag og revisjoner',
      '3D-skisse fra flere vinkler',
      'Én fotorealistisk rendering',
      'Målsatt tegning',
      'Komplett materialliste',
    ],
    fremhevet: true,
    kontaktEmne: '3D-design – Designpakke',
  },
  {
    ikon: 'faRulerCombined',
    navn: 'Prosjektering',
    pris: 'fra 6 900 kr',
    ingress: 'For større eller sammensatte uteprosjekter i tre.',
    punkter: [
      '3D-skisse + én fotorealistisk rendering',
      'Detaljerte byggetegninger',
      'Konstruksjons- og innfestingsdetaljer',
      'Full materialliste',
      'Løpende dialog underveis',
    ],
    kontaktEmne: '3D-design – Prosjektering',
  },
]

const STEG = [
  { ikon: 'faEnvelope', tittel: 'Send meg prosjektet', tekst: 'Mål, bilder av stedet og en idé om hva du ønsker deg. Har du bare en tanke, holder det fint.' },
  { ikon: 'faComments', tittel: 'Vi avklarer', tekst: 'Vi blir enige om stil, omfang og pris før jeg setter i gang.' },
  { ikon: 'faCube', tittel: 'Du får 3D-design', tekst: 'Jeg tegner og renderer prosjektet i SketchUp, så du ser nøyaktig hvordan det blir.' },
  { ikon: 'faHammer', tittel: 'Bygg eller bestill', tekst: 'Bygg selv etter tegningen – eller la meg bygge det for deg.' },
]

const FAQ = [
  {
    q: 'Hva koster en 3D-tegning?',
    a: 'En 3D-skisse starter på 1 990 kr, en komplett designpakke på 3 990 kr. Prosjektering av større prosjekter avtales individuelt. Du får alltid en fast pris før jeg starter.',
  },
  {
    q: 'Trekkes designet fra hvis jeg bestiller bygget?',
    a: 'Bestiller du bygg eller materialpakke etter en 3D-skisse, trekker jeg skisseprisen fra på fakturaen – da blir den i praksis et forskudd. Designpakke og prosjektering er mer omfattende tjenester med fast pris, og kommer i tillegg.',
  },
  {
    q: 'Hva er forskjellen på 3D-skisse og fotorealistisk rendering?',
    a: '3D-skissen er selve modellen av prosjektet, vist fra flere vinkler, så du ser form, mål og plassering. Den fotorealistiske renderingen er ett ferdig, livaktig bilde med materialer, lys og omgivelser – slik prosjektet faktisk vil se ut. Alle pakker inkluderer 3D-skisse og én fotorealistisk rendering.',
  },
  {
    q: 'Hva trenger du fra meg for å komme i gang?',
    a: 'Mål på stedet (gjerne en enkel skisse), noen bilder av området, og hva du ser for deg. Jo mer du sender, jo mer treffsikkert blir første forslag.',
  },
  {
    q: 'Hvor mange endringer er inkludert?',
    a: '3D-skissen inkluderer én revisjonsrunde, designpakken inntil tre. Trenger du flere runder, avtaler vi det – jeg vil at du skal bli fornøyd med resultatet.',
  },
  {
    q: 'Kan du designe uansett hvor jeg bor?',
    a: 'Ja. All design og tegning skjer på nett, så det spiller ingen rolle hvor i landet du bor. Bygg og levering tilbys i Innlandet og store deler av Østlandet.',
  },
]

const TRED_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/3d-design#service`,
    name: '3D-design og tegning av uteprosjekter',
    serviceType: '3D-design, rendering og byggetegning for terrasse, pergola og uteprosjekter i tre',
    description:
      'Få terrassen, pergolaen eller uteprosjektet ditt tegnet og rendret i 3D før du bygger. Designforslag, målsatte tegninger og komplett materialliste.',
    url: `${SITE_URL}/3d-design`,
    areaServed: { '@type': 'Place', name: 'Norge' },
    provider: { '@type': 'Organization', name: 'Minio', url: `${SITE_URL}/` },
    inLanguage: 'nb-NO',
    offers: PAKKER.map((p) => ({
      '@type': 'Offer',
      name: p.navn,
      description: p.ingress,
      priceCurrency: 'NOK',
      category: '3D-design',
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'nb-NO',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: '3D-design', item: `${SITE_URL}/3d-design` },
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

const HeroCtas = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`

const HeroPrimary = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.9rem 1.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  text-decoration: none;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover { background: ${({ theme }) => theme.colors.accentHover}; }
  &:active { transform: translateY(1px); }
`

const HeroSecondary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.9rem 1.2rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  border: 1px solid rgba(255, 255, 255, 0.35);
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.6); }
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

const Gallery = styled.section`
  background: #fff;
  padding: 2.5rem 2rem 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1rem 0.5rem;
  }
`

const GalleryInner = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
`

const Figure = styled.figure`
  margin: 0;

  figcaption {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #777;
    text-align: center;
  }
`

const Packages = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3.5rem 2rem;
  margin-top: 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }
`

const SectionHeading = styled.div`
  max-width: 1000px;
  margin: 0 auto 2rem;
  text-align: center;

  h2 {
    font-size: 1.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.6rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }
`

const Grid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: stretch;
`

const Card = styled.div<{ $fremhevet?: boolean }>`
  position: relative;
  background: #fff;
  border: 1px solid ${({ $fremhevet, theme }) => ($fremhevet ? theme.colors.textDark : '#ececec')};
  border-radius: 16px;
  padding: 1.9rem;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ $fremhevet }) =>
    $fremhevet ? '0 12px 32px rgba(0, 0, 0, 0.12)' : '0 4px 20px rgba(0, 0, 0, 0.04)'};

  .ikon {
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.textDark};
    opacity: 0.7;
    margin-bottom: 0.9rem;
  }

  h3 {
    font-size: 1.3rem;
    margin: 0 0 0.25rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  .pris {
    font-size: 1.05rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.accent};
    margin: 0 0 0.75rem;
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
    margin: 0 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .kreditt {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.success};
    line-height: 1.4;
    margin: 0 0 1.25rem;

    svg {
      margin-top: 0.1rem;
      flex-shrink: 0;
    }
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

const Badge = styled.span`
  position: absolute;
  top: -0.7rem;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.3rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  white-space: nowrap;
`

const CardButton = styled(Link)<{ $fremhevet?: boolean }>`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${({ $fremhevet, theme }) => ($fremhevet ? theme.colors.textDark : '#fff')};
  color: ${({ $fremhevet, theme }) => ($fremhevet ? '#fff' : theme.colors.textDark)};
  border: 1px solid ${({ theme }) => theme.colors.textDark};
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.8rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    color: #fff;
  }
`

const CreditNote = styled.p`
  max-width: 720px;
  margin: 2rem auto 0;
  text-align: center;
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const Steps = styled.section`
  background: #fff;
  padding: 3.5rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }
`

const StepGrid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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

const FaqWrap = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3.5rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }
`

const FaqList = styled.div`
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const FaqItem = styled.div`
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`

const FaqQuestion = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  line-height: 1.4;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
    border-radius: 10px;
  }

  svg {
    flex-shrink: 0;
    margin-left: 1rem;
    font-size: 0.75rem;
    color: ${({ $open, theme }) => ($open ? theme.colors.accent : '#aaa')};
    transition: color 0.2s;
  }
`

const FaqAnswer = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  transition: grid-template-rows 0.3s ease;

  & > div {
    overflow: hidden;
  }

  p {
    font-size: 0.92rem;
    line-height: 1.7;
    color: #555;
    margin: 0;
    padding: 0 1.75rem 1.5rem;
  }
`

const CrossNote = styled.p`
  max-width: 820px;
  margin: 3rem auto 0;
  text-align: center;
  font-size: 1rem;
  color: #555;
  line-height: 1.7;

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
`

export default function TreDDesignPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useSEO({
    title: '3D-design og tegning – se terrassen din før du bygger | Minio',
    description:
      'Få terrasse, pergola eller uteprosjekt tegnet og rendret i 3D før du bygger. Designforslag, målsatt tegning og materialliste – beløpet trekkes fra ved bestilling.',
    keywords:
      '3d design terrasse, pergola tegning, sketchup tegning, 3d rendering hage, byggetegning terrasse, designhjelp uteprosjekt, visualisering pergola',
    ogImage: '/images/planleggere/pergola-hero.webp',
    ogImageAlt: '3D-design av pergola og terrasse fra Minio',
    jsonLd: TRED_JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Se prosjektet ditt i 3D før du bygger</h1>
            <p>
              Usikker på hvordan terrassen eller pergolaen vil se ut? Jeg tegner og renderer
              prosjektet ditt i 3D – så du vet nøyaktig hva du får før du kjøper inn en eneste planke.
            </p>
            <HeroCtas>
              <HeroPrimary to="/designverktoy">
                <Icon name="faCube" /> Design selv – gratis
              </HeroPrimary>
              <HeroSecondary href="#pakker">Eller la meg tegne det <Icon name="faArrowRight" /></HeroSecondary>
            </HeroCtas>
          </Hero>

          <Intro>
            <IntroInner>
              <h2>Fra idé til ferdig tegning</h2>
              <p>
                Det vanskeligste med et uteprosjekt er ofte å se det for seg. En 3D-rendering gjør
                idéen konkret: du ser <strong>proporsjoner, materialer og plassering</strong> på din
                egen tomt, og kan ta valgene trygt – før det koster noe å ombestemme seg.
              </p>
              <p>
                Du får designet som målsatt tegning med komplett materialliste, klart til å bygge
                etter selv. Starter du med en <strong>3D-skisse</strong> og bestiller bygget av meg,
                trekkes skisseprisen fra på fakturaen.
              </p>
            </IntroInner>
          </Intro>

          <Gallery>
            <GalleryInner>
              <GalleryGrid>
                {RENDERS.map((r) => (
                  <Figure key={r.src}>
                    <ZoomableImage src={r.src} alt={r.alt} />
                    <figcaption>{r.caption}</figcaption>
                  </Figure>
                ))}
              </GalleryGrid>
            </GalleryInner>
          </Gallery>

          <Packages id="pakker">
            <SectionHeading>
              <h2>Velg pakke</h2>
              <p>Fast pris avtalt før jeg starter – ingen overraskelser.</p>
            </SectionHeading>
            <Grid>
              {PAKKER.map((p) => (
                <Card key={p.navn} $fremhevet={p.fremhevet}>
                  {p.fremhevet && <Badge>Mest populær</Badge>}
                  <div className="ikon"><Icon name={p.ikon} /></div>
                  <h3>{p.navn}</h3>
                  <p className="pris">{p.pris}</p>
                  <p className="ingress">{p.ingress}</p>
                  <ul>
                    {p.punkter.map((punkt) => (
                      <li key={punkt}><Icon name="faCheck" /> {punkt}</li>
                    ))}
                  </ul>
                  {p.kreditt && (
                    <p className="kreditt"><Icon name="faStar" /> {p.kreditt}</p>
                  )}
                  <CardButton to={`/kontakt?subject=${encodeURIComponent(p.kontaktEmne)}`} $fremhevet={p.fremhevet}>
                    Bestill design <Icon name="faArrowRight" />
                  </CardButton>
                </Card>
              ))}
            </Grid>
            <CreditNote>
              <strong>3D-skissen er et forskudd, ikke en ekstra kostnad.</strong> Bestiller du bygg
              eller materialpakke etter en 3D-skisse, trekkes skisseprisen fra på fakturaen.
              Designpakke og prosjektering er egne tjenester med fast pris.
            </CreditNote>
          </Packages>

          <Steps>
            <SectionHeading>
              <h2>Slik fungerer det</h2>
            </SectionHeading>
            <StepGrid>
              {STEG.map((s) => (
                <Step key={s.tittel}>
                  <Icon name={s.ikon} />
                  <strong>{s.tittel}</strong>
                  <span>{s.tekst}</span>
                </Step>
              ))}
            </StepGrid>
          </Steps>

          <FaqWrap>
            <SectionHeading>
              <h2>Vanlige spørsmål</h2>
            </SectionHeading>
            <FaqList>
              {FAQ.map((f, i) => (
                <FaqItem key={f.q}>
                  <FaqQuestion $open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {f.q}
                    <Icon name={openFaq === i ? 'faMinus' : 'faPlus'} />
                  </FaqQuestion>
                  <FaqAnswer $open={openFaq === i}>
                    <div><p>{f.a}</p></div>
                  </FaqAnswer>
                </FaqItem>
              ))}
            </FaqList>
            <CrossNote>
              Vil du bygge selv? Start med de gratis <Link to="/planleggere">planleggerne</Link> og{' '}
              <Link to="/byggeguider">byggeguidene</Link>. Trenger du en hånd underveis, finnes{' '}
              <Link to="/byggehjelp">byggehjelp på timen</Link> – eller la oss bygge hele prosjektet{' '}
              <Link to="/handlaget-i-tre">håndlaget i tre</Link>.
            </CrossNote>
          </FaqWrap>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
