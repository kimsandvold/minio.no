import styled from 'styled-components'
import { useRef } from 'react'
import UtekjokkenVisualizer from './UtekjokkenVisualizer'
import UtekjokkenCalculator from './UtekjokkenCalculator'
import { useUtekjokkenProsjekter } from './useUtekjokkenProsjekter'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PlannerDisclaimer from '../../shared/planlegger/PlannerDisclaimer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import ZoomableImage from '../../shared/ZoomableImage'
import { useSEO } from '../../../hooks/useSEO'
import { MINIO_PUBLISHER } from '../../../utils/seo'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

const UTEKJOKKEN_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hva kan jeg sette sammen i utekjøkkenplanleggeren?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Du tegner et frittstående utekjøkken med tak i 3D: hevet platting, stolper og tak, og innredning langs baksiden. Slå av og på vask med kran, lukket underskap med dør, sittebenk, bakvegg og hyller – og velg benkeplate i heltre, laminat eller rustfritt. Planleggeren regner ut materialliste og prisestimat fortløpende.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hvor høy bør benken på et utekjøkken være?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard arbeidshøyde er rundt 90 cm, som på et innekjøkken. I planleggeren kan du justere benkehøyden mellom 75 og 100 cm, slik at den passer din høyde og bruk – for eksempel litt lavere ved en grill eller litt høyere for stående matlaging.',
      },
    },
    {
      '@type': 'Question',
      name: 'Tåler utekjøkkenet å stå ute hele året?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Konstruksjonen bygges i trykkimpregnert tre med stolpesko, knebånd for stivhet og et tak som leder vann vekk. Den hevede plattingen holder innredningen unna bakkefukt. Vi anbefaler å dekke til vask og hvitevarer om vinteren.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg få vann og avløp til vasken?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Planleggeren tar med utslagsvask, kran og avløp som en fast post i materiallisten. Selve tilkoblingen til vann og avløp må gjøres lokalt – en frostsikker løsning eller en enkel hageslange-tilkobling fungerer for de fleste utekjøkken.',
      },
    },
  ],
}

const UTEKJOKKEN_APP = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://minio.no/planleggere/utekjokken#app',
  name: 'Utekjøkkenplanlegger',
  alternateName: ['Utekjøkkendesigner', 'Utekjøkkenkalkulator', 'Hagekjøkkenplanlegger'],
  url: 'https://minio.no/planleggere/utekjokken',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: 'nb-NO',
  description:
    'Gratis utekjøkkenplanlegger som lar deg tegne utekjøkkenet i 3D: hevet platting, tak på stolper, benk med vask, underskap, sittebenk og hyller. Velg benkeplate og få komplett materialliste med prisestimat og PDF.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
  featureList: [
    '3D-visualisering i sanntid',
    'Hevet platting med tak på stolper',
    'Benk med vask, underskap og sittebenk',
    'Benkeplate i heltre, laminat eller rustfritt',
    'Flatt tak eller pulttak med valgfri taktekke',
    'Materialliste med prisestimat og PDF',
  ],
  publisher: MINIO_PUBLISHER,
}

const UTEKJOKKEN_HOWTO = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Slik planlegger du utekjøkkenet i 3D',
  description: 'Sett mål, velg tak og innredning, og få materialliste til utekjøkkenet med Minios gratis utekjøkkenplanlegger.',
  inLanguage: 'nb-NO',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Sett mål', text: 'Velg bredde, dybde og høyde på utekjøkkenet.' },
    { '@type': 'HowToStep', position: 2, name: 'Velg tak', text: 'Velg flatt tak eller pulttak, og hvilken taktekke du vil ha.' },
    { '@type': 'HowToStep', position: 3, name: 'Velg innredning', text: 'Slå på vask, underskap, sittebenk og hyller, og velg benkeplate.' },
    { '@type': 'HowToStep', position: 4, name: 'Få materialliste', text: 'Se materialliste med bæring, platting og innredning, og last ned PDF.' },
  ],
}

const UTEKJOKKEN_BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
    { '@type': 'ListItem', position: 2, name: 'Planleggere', item: 'https://minio.no/planleggere' },
    { '@type': 'ListItem', position: 3, name: 'Utekjøkkenplanlegger', item: 'https://minio.no/planleggere/utekjokken' },
  ],
}

// ── Blåkopi-hero ──────────────────────────────────────────────────────────────

const Hero = styled.section`
  position: relative;
  ${blueprintGrid}
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 5.5rem 2rem 3rem;
  overflow: hidden;

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
    margin: 0 0 0.75rem;
    font-weight: 700;
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.9rem;
    }
  }
  p {
    position: relative;
    z-index: 1;
    font-size: 1.15rem;
    max-width: 640px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.6;
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Chips = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1.5rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;

    svg {
      opacity: 0.8;
    }
  }
`

const Content = styled.section`
  padding: 4rem 2rem;
  background: ${({ theme }) => theme.colors.lightBg};
  position: relative;
  z-index: 10;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem;
    overflow-x: hidden;
  }
`

const Layout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 420px;
  grid-template-areas:
    'viz sidebar'
    'article sidebar';
  gap: 0 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'viz'
      'sidebar'
      'article';
    gap: 0.5rem;
  }
`

const VisualizerWrap = styled.div`
  grid-area: viz;
  margin-bottom: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    position: sticky;
    top: 56px;
    z-index: 5;
    margin: 0 -1rem;
    padding: 0.25rem 1rem 0.5rem;
    background: ${({ theme }) => theme.colors.lightBg};
    box-shadow: 0 6px 10px -8px rgba(0, 0, 0, 0.25);
  }
`

const Article = styled.article`
  grid-area: article;

  h2 {
    font-size: 1.85rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.01em;
    margin: 0 0 1.25rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  h3 {
    font-size: 1.3rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 2.25rem 0 0.85rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.2rem;
    }
  }

  p {
    font-size: 1.08rem;
    line-height: 1.75;
    margin-bottom: 1.1rem;
    color: #3f3f3f;

    a {
      color: ${({ theme }) => theme.colors.accent};
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: rgba(0, 0, 0, 0.3);
      text-decoration-thickness: 1px;
      text-underline-offset: 0.18em;
      transition: text-decoration-color 0.2s ease;
    }

    a:hover {
      text-decoration-color: ${({ theme }) => theme.colors.accent};
    }
  }

  strong {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
  }

  ul {
    margin: 0 0 1.2rem;
    padding-left: 1.3rem;
  }

  li {
    font-size: 1.06rem;
    line-height: 1.7;
    color: #3f3f3f;
    margin-bottom: 0.5rem;

    &::marker {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
  }
`

const Sidebar = styled.aside`
  grid-area: sidebar;
  padding: 0 0 0 2rem;
  height: fit-content;
  position: sticky;
  top: 100px;
  border-left: 1px solid #e0e0e0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    position: static;
    padding: 0 0 2rem;
    border-left: none;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
`

const SidebarHeading = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const TechBand = styled.section`
  background: #1c2530;
  color: #fff;
  padding: 3.5rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }

  .inner {
    max-width: 1100px;
    margin: 0 auto;
  }
  h2 {
    font-size: 1.8rem;
    margin: 0 0 0.5rem;
    text-align: center;
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.4rem;
    }
  }
  .lead {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    max-width: 620px;
    margin: 0 auto 2.5rem;
    line-height: 1.6;
  }
`

const TechGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const TechCard = styled.div`
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);

  .ico {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    font-size: 1.05rem;
  }
  .tag {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.45);
  }
  h3 {
    font-size: 1.1rem;
    margin: 0.2rem 0 0.6rem;
    color: #fff;
  }
  p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.72);
    margin: 0;
  }
`

const FaqList = styled.div`
  margin-top: 1rem;

  details {
    border-bottom: 1px solid #e0e0e0;
    padding: 1rem 0;
  }
  details:first-of-type {
    border-top: 1px solid #e0e0e0;
  }
  summary {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::after {
    content: '+';
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 1;
    color: ${({ theme }) => theme.colors.accent};
  }
  details[open] summary::after {
    content: '−';
  }
  details p {
    margin: 1rem 0 0;
    line-height: 1.8;
    color: #333;
  }
`

const Figure = styled.figure`
  margin: 0 0 1.75rem;

  figcaption {
    margin-top: 0.6rem;
    font-size: 0.8rem;
    color: #888;
    line-height: 1.4;
    text-align: center;
  }
`

const FigureZoom = styled(ZoomableImage)`
  border-radius: 14px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.16);
`

const TECH = [
  {
    icon: 'faTools',
    tag: 'Innredning',
    navn: 'Benk, vask og skap',
    tekst: 'Sett sammen kjøkkenet slik du vil ha det: benkeplate med utslagsvask og kran, lukket underskap med dør, åpne hyller og en sittebenk – alt tegnet i 3D mens du justerer.',
  },
  {
    icon: 'faHammer',
    tag: 'Konstruksjon',
    navn: 'Tak og hevet platting',
    tekst: 'Et tak på solide stolper med knebånd holder regnet ute, og den hevede plattingen løfter innredningen unna bakkefukt – bygget for å stå ute hele året.',
  },
  {
    icon: 'faDownload',
    tag: 'Materialliste',
    navn: 'Komplett liste og PDF',
    tekst: 'Planleggeren regner ut bæring, platting og innredning med prisestimat, og lar deg laste ned alt som PDF eller legge det rett i forespørselen.',
  },
]

export default function UtekjokkenPlanleggerPage() {
  const { config, setConfig, prosjekt } = useUtekjokkenProsjekter()
  const snapshotRef = useRef<(() => string | null) | null>(null)

  useSEO({
    title: 'Utekjøkkenplanlegger – tegn utekjøkken i 3D med tak, benk og vask | Minio',
    description:
      'Gratis utekjøkkenplanlegger fra Minio. Tegn utekjøkkenet i 3D: hevet platting, tak på stolper, benk med vask, underskap, sittebenk og hyller. Velg benkeplate og få komplett materialliste med prisestimat og PDF.',
    keywords:
      'utekjøkkenplanlegger, utekjøkken planlegger, bygge utekjøkken, utekjøkken tegning, hagekjøkken, utekjøkken med tak, utekjøkken benk, utekjøkken vask, materialliste utekjøkken',
    ogImage: '/images/planleggere/utekjokken-foto.webp',
    ogImageAlt: 'Utekjøkken i tre med tak, grill, benk og spilervegger på en hevet platting',
    jsonLd: [UTEKJOKKEN_APP, UTEKJOKKEN_HOWTO, UTEKJOKKEN_FAQ, UTEKJOKKEN_BREADCRUMB],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Utekjøkkenplanlegger</h1>
            <p>Tegn utekjøkkenet i 3D – tak på stolper over en hevet platting, med benk, vask, skap og sittebenk akkurat slik du vil ha det.</p>
            <Chips>
              <span><Icon name="faTools" /> Benk · vask · skap</span>
              <span><Icon name="faHammer" /> Tak og platting</span>
              <span><Icon name="faDownload" /> Materialliste som PDF</span>
            </Chips>
          </Hero>

          <Content>
            <Layout>
              <VisualizerWrap>
                <UtekjokkenVisualizer config={config} onConfigChange={setConfig} prosjekt={prosjekt} snapshotRef={snapshotRef} />
              </VisualizerWrap>

              <Article>
                <h2>Planlegg drømmeutekjøkkenet i tre</h2>
                <p>
                  Med utekjøkkenplanleggeren tegner du et frittstående utekjøkken med tak i 3D og ser det
                  umiddelbart fra alle kanter. Sett <strong>bredde, dybde og høyde</strong>, velg tak og
                  benkeplate, og bygg opp innredningen langs baksiden. Veksle mellom <strong>ferdig</strong>,{' '}
                  <strong>konstruksjon</strong> (stolper, dragere, spær og knebånd) og <strong>begge samtidig</strong>{' '}
                  for å se bæringen under taket.
                </p>

                <Figure>
                  <FigureZoom
                    src="/images/planleggere/utekjokken-foto.webp"
                    alt="Utekjøkken i tre med pulttak, integrert grill, benk med stålplate, spilervegger og hevet platting, opplyst i skumringen i en norsk hage"
                    width={1471}
                    height={1069}
                  />
                  <figcaption>Utekjøkken i tre med tak, grill og spilervegger – bygget for norske uteplasser.</figcaption>
                </Figure>

                <h3>Innredning du kan tilpasse</h3>
                <ul>
                  <li><strong>Benk med vask</strong> – utslagsvask, kran og avløp i ønsket benkehøyde.</li>
                  <li><strong>Underskap med dør</strong> – lukket oppbevaring i ly for vær.</li>
                  <li><strong>Sittebenk</strong> – en plass å sitte mens maten lages.</li>
                  <li><strong>Åpne hyller og bakvegg</strong> – plass til redskap, krydder og kledning bak benken.</li>
                </ul>

                <h3>Tak, platting og benkeplate</h3>
                <p>
                  Velg <strong>flatt tak</strong> eller <strong>pulttak</strong> som leder regnet vekk, og taktekke i
                  stålplater, bord eller shingel. Den hevede <strong>plattingen</strong> løfter kjøkkenet opp fra
                  bakken, og benkeplaten kan være <strong>heltre</strong>, <strong>laminat</strong> eller{' '}
                  <strong>rustfritt</strong> stål – planleggeren oppdaterer materialliste og pris for hvert valg.
                </p>

                <h3>Bygget for norsk vær</h3>
                <p>
                  Utekjøkkenet bygges i trykkimpregnert tre med <strong>stolpesko</strong> og <strong>knebånd</strong>{' '}
                  for stivhet, og et tak som holder regn og snø ute. Vil du ha hjelp til byggingen?{' '}
                  Legg konfigurasjonen i forespørselen, så gir vi deg et konkret tilbud på et ferdig utekjøkken.
                </p>

                <h3>Vanlige spørsmål</h3>
                <FaqList>
                  {UTEKJOKKEN_FAQ.mainEntity.map((item) => (
                    <details key={item.name}>
                      <summary>{item.name}</summary>
                      <p>{item.acceptedAnswer.text}</p>
                    </details>
                  ))}
                </FaqList>
              </Article>

              <Sidebar>
                <SidebarHeading>Konfigurer utekjøkkenet</SidebarHeading>
                <UtekjokkenCalculator config={config} onChange={setConfig} snapshotRef={snapshotRef} />
              </Sidebar>
            </Layout>
          </Content>

          <TechBand>
            <div className="inner">
              <h2>Mer enn en tegning</h2>
              <p className="lead">
                Utekjøkkenplanleggeren tar med både innredningen og det som faktisk gjør kjøkkenet solid og
                værbestandig ute.
              </p>
              <TechGrid>
                {TECH.map((t) => (
                  <TechCard key={t.navn}>
                    <div className="ico">
                      <Icon name={t.icon} />
                    </div>
                    <div className="tag">{t.tag}</div>
                    <h3>{t.navn}</h3>
                    <p>{t.tekst}</p>
                  </TechCard>
                ))}
              </TechGrid>
            </div>
          </TechBand>
        </main>
      </PageTransition>
      <PlannerDisclaimer />
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
