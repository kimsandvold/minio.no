import styled from 'styled-components'
import { useRef } from 'react'
import CarportVisualizer from './CarportVisualizer'
import CarportCalculator from './CarportCalculator'
import { useCarportProsjekter } from './useCarportProsjekter'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PlannerDisclaimer from '../../shared/planlegger/PlannerDisclaimer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { MINIO_PUBLISHER } from '../../../utils/seo'

const CARPORT_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvilke takløsninger kan jeg velge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Du kan velge flatt tak, pulttak (skrår én vei) eller saltak (møne på midten), og justere takvinkelen trinnløst. Som taktekke kan du velge stålplater, polykarbonat (lysgjennomslippende), takpapp eller shingel – planleggeren regner ut takflate, sutak og avvanning automatisk.',
      },
    },
    {
      '@type': 'Question',
      name: 'Blir carporten solid nok?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Konstruksjonen inkluderer bæredragere, spær, tverrbjelker som binder dragerne sammen, og knebånd/skråstivere for stivhet mot vind og sidekrefter. Planleggeren gir også et veiledende dimensjoneringsråd ut fra valgt snølast og spennvidde, så du ser om spærdimensjonen holder.',
      },
    },
    {
      '@type': 'Question',
      name: 'Må jeg søke kommunen om carport?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En frittstående carport inntil 50 m² kan være unntatt søknad dersom gesimshøyde er under 3,0 m, mønehøyde under 4,0 m og avstand til nabogrense er minst 1,0 m. Et veggmontert tilbygg har en grense på 15 m². Planleggeren viser fortløpende om målene dine ligger innenfor – men du er selv ansvarlig for å sjekke lokale regler.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hvordan tar planleggeren hensyn til snølast?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Du setter den lokale snølasten (kN/m²), og planleggeren vurderer om valgt spærdimensjon og spennvidde er tilstrekkelig. Ved store spenn eller høy snølast anbefales kraftigere dimensjon, tettere spær eller ekstra bæring – og alltid statisk beregning.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg lukke carporten med vegger og vinduer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Du kan legge til vegger på valgte sider, med tett trepanel, klare akrylplater (vindu) eller en kombinasjon med panel nederst og akryl øverst – fint for ly mot vær og innsyn uten å miste lyset.',
      },
    },
  ],
}

const CARPORT_APP = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://minio.no/planleggere/carport#app',
  name: 'Carportplanlegger',
  alternateName: ['Carportdesigner', 'Carportkalkulator', 'Garasjeplanlegger', 'Bilportplanlegger'],
  url: 'https://minio.no/planleggere/carport',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: 'nb-NO',
  description:
    'Gratis carportplanlegger som lar deg tegne carporten i 3D, velge takform (flatt, pulttak, saltak) og takvinkel, taktekke, vegger med akrylvinduer, og få komplett materialliste med solid konstruksjon (tverrbjelker, knebånd), snølast-dimensjonering og status mot norske byggeregler.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
  featureList: [
    '3D-visualisering i sanntid',
    'Flatt tak, pulttak eller saltak med valgfri takvinkel',
    'Stålplater, polykarbonat, takpapp eller shingel',
    'Tverrbjelker og knebånd for solid konstruksjon',
    'Vegger med akrylvinduer',
    'Snølast-dimensjonering',
    'Status mot norske byggeregler (søknadsplikt)',
    'Materialliste med prisestimat og PDF',
  ],
  publisher: MINIO_PUBLISHER,
}

const CARPORT_HOWTO = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Slik planlegger du carporten i 3D',
  description: 'Tegn carporten, velg tak og sett snølasten – få materialliste og byggeregler-status med Minios gratis carportplanlegger.',
  inLanguage: 'nb-NO',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Velg montering og mål', text: 'Velg frittstående eller veggmontert, og sett bredde, lengde og høyde.' },
    { '@type': 'HowToStep', position: 2, name: 'Velg tak', text: 'Velg takform og takvinkel, og hvilken taktekke du vil ha.' },
    { '@type': 'HowToStep', position: 3, name: 'Sett snølast', text: 'Legg inn lokal snølast og se dimensjoneringsråd og byggeregler-status.' },
    { '@type': 'HowToStep', position: 4, name: 'Få materialliste', text: 'Se materialliste med tverrbjelker, knebånd og avvanning, og last ned PDF.' },
  ],
}

const CARPORT_BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
    { '@type': 'ListItem', position: 2, name: 'Planleggere', item: 'https://minio.no/planleggere' },
    { '@type': 'ListItem', position: 3, name: 'Carportplanlegger', item: 'https://minio.no/planleggere/carport' },
  ],
}

// ── Blåkopi-hero (distinkt teknisk uttrykk) ───────────────────────────────────

const Hero = styled.section`
  position: relative;
  background: #1c2530;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 5.5rem 2rem 3rem;
  overflow: hidden;

  /* Blåkopi-rutenett */
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 30%, rgba(28, 37, 48, 0.6) 100%);
    pointer-events: none;
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

const SidebarTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors.textDark};
`

// ── Teknisk feature-band («surprise») ─────────────────────────────────────────

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

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 14px;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.16);
  }

  figcaption {
    margin-top: 0.6rem;
    font-size: 0.8rem;
    color: #888;
    line-height: 1.4;
    text-align: center;
  }
`

const TECH = [
  {
    icon: 'faHammer',
    tag: 'Stivhet',
    navn: 'Tverrbjelker & knebånd',
    tekst: 'Bæredragere bindes sammen med tverrbjelker, og knebånd/skråstivere låser hjørnene. Det gir en stiv ramme som tåler vind og sidekrefter – ikke bare en pen tegning.',
  },
  {
    icon: 'faClipboardList',
    tag: 'Regelverk',
    navn: 'Norske byggeregler',
    tekst: 'Se fortløpende om carporten trolig er søknadsfri: areal under 50 m² (frittstående) eller 15 m² (tilbygg), gesims under 3 m og møne under 4 m – med tydelige merknader.',
  },
  {
    icon: 'faCube',
    tag: 'Last',
    navn: 'Snølast-dimensjonering',
    tekst: 'Sett lokal snølast, så vurderer planleggeren om spærdimensjon og spennvidde holder, og foreslår kraftigere dimensjon eller tettere spær når det trengs.',
  },
]

export default function CarportPlanleggerPage() {
  const { config, setConfig, prosjekt } = useCarportProsjekter()
  const snapshotRef = useRef<(() => string | null) | null>(null)

  useSEO({
    title: 'Carportplanlegger – tegn carport i 3D med tak, snølast og byggeregler | Minio',
    description:
      'Gratis carportplanlegger fra Minio. Velg takform (flatt, pulttak, saltak) og takvinkel, taktekke, vegger med akrylvinduer, og bygg en solid konstruksjon med tverrbjelker og knebånd. Sett snølast og se status mot norske byggeregler, med komplett materialliste, prisestimat og PDF.',
    keywords:
      'carportplanlegger, carport planlegger, carportdesigner, carportkalkulator, garasjeplanlegger, bygge carport, carport tak, pulttak, saltak, carport snølast, carport byggeregler, søknadsfri carport, materialliste carport',
    ogImage: '/images/planleggere/carport.webp',
    ogImageAlt: 'Carport i tre med saltak tegnet i Minios 3D-carportplanlegger',
    jsonLd: [CARPORT_APP, CARPORT_HOWTO, CARPORT_FAQ, CARPORT_BREADCRUMB],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Carportplanlegger</h1>
            <p>Tegn carporten i 3D – velg tak og takvinkel, bygg den solid, og se snølast og byggeregler mens du går.</p>
            <Chips>
              <span><Icon name="faCheckCircle" /> Søknadsfri ≤ 50 m²</span>
              <span><Icon name="faCube" /> Snølast-dimensjonert</span>
              <span><Icon name="faHammer" /> Tverrbjelker & knebånd</span>
            </Chips>
          </Hero>

          <Content>
            <Layout>
              <VisualizerWrap>
                <CarportVisualizer config={config} onConfigChange={setConfig} prosjekt={prosjekt} snapshotRef={snapshotRef} />
              </VisualizerWrap>

              <Article>
                <h2>Planlegg en carport som tåler norsk vinter</h2>
                <p>
                  Med carportplanleggeren tegner du carporten i 3D og ser den umiddelbart fra alle kanter.
                  Velg om den skal stå <strong>frittstående</strong> eller <strong>veggmonteres</strong> mot
                  huset, sett bredde, lengde og fri høyde, og bestem taket. Veksle mellom{' '}
                  <strong>ferdig</strong>, <strong>konstruksjon</strong> (stolper, dragere, spær, tverrbjelker
                  og knebånd) og <strong>begge samtidig</strong> for å se bæringen under taket.
                </p>

                <Figure>
                  <img
                    src="/images/planleggere/carport-foto.webp"
                    alt="Frittstående carport i mørkbeiset tre med saltak og stålplatetak, bil parkert under, foran fjord og fjell i Norge"
                    loading="lazy"
                    width={1536}
                    height={1024}
                  />
                  <figcaption>Saltak-carport i tre med stålplatetak – solid nok for norsk vær.</figcaption>
                </Figure>

                <h3>Takløsninger og takvinkel</h3>
                <ul>
                  <li><strong>Flatt tak</strong> – diskré og moderne.</li>
                  <li><strong>Pulttak</strong> – skrår én vei, leder snø og vann bort.</li>
                  <li><strong>Saltak</strong> – møne på midten, klassisk og romslig.</li>
                </ul>
                <p>
                  Juster <strong>takvinkelen</strong> trinnløst, og velg taktekke: stålplater, lysgjennomslippende
                  polykarbonat, takpapp eller shingel. Planleggeren regner ut takflate, sutak og avvanning
                  (takrenne, nedløp og vindski) automatisk.
                </p>

                <h3>Solid konstruksjon</h3>
                <p>
                  En carport står ute hele året og må tåle vind og snø. Derfor inkluderer modellen{' '}
                  <strong>tverrbjelker</strong> som binder bæredragerne sammen og <strong>knebånd</strong> som
                  stiver av hjørnene, i tillegg til <strong>stolpesko</strong> for sikker forankring.
                </p>

                <h3>Snølast og norske byggeregler</h3>
                <p>
                  Sett den lokale <strong>snølasten</strong>, så gir planleggeren et veiledende
                  dimensjoneringsråd for spærene. Du ser også fortløpende om carporten trolig er{' '}
                  <strong>søknadsfri</strong> ut fra areal og høyder. Vurderingen er veiledende – sjekk alltid
                  lokal snølast og kommunens regler, og få statisk beregning ved store spenn.
                </p>

                <h3>Lukk den med vegger og akrylvinduer</h3>
                <p>
                  Vil du ha mer ly? Legg til vegger på valgte sider med tett trepanel, klare{' '}
                  <strong>akrylplater</strong> eller en kombinasjon med panel nederst og akryl øverst.
                </p>

                <h3>Vanlige spørsmål</h3>
                <FaqList>
                  {CARPORT_FAQ.mainEntity.map((item) => (
                    <details key={item.name}>
                      <summary>{item.name}</summary>
                      <p>{item.acceptedAnswer.text}</p>
                    </details>
                  ))}
                </FaqList>
              </Article>

              <Sidebar>
                <SidebarTitle>Konfigurer carporten</SidebarTitle>
                <CarportCalculator config={config} onChange={setConfig} snapshotRef={snapshotRef} />
              </Sidebar>
            </Layout>
          </Content>

          <TechBand>
            <div className="inner">
              <h2>Bygget for å stå støtt</h2>
              <p className="lead">
                Carportplanleggeren er mer enn en tegning – den tar med det som faktisk gjør en carport solid og
                lovlig i Norge.
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
