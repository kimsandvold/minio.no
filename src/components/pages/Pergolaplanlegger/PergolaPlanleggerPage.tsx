import styled from 'styled-components'
import { useRef } from 'react'
import PergolaVisualizer from './PergolaVisualizer'
import PergolaCalculator from './PergolaCalculator'
import { usePergolaProsjekter } from './usePergolaProsjekter'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import { useSEO } from '../../../hooks/useSEO'

const PERGOLA_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hva kan jeg planlegge med pergolaplanleggeren?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Du kan tegne en frittstående eller veggmontert pergola i 3D, velge bredde, dybde og høyde, og bestemme tak (åpne spær, lekter, skråstilte spjeld eller tett tak) og eventuelle sideskjermer eller spalér. Planleggeren regner ut stolper, dragere, spær, lekter, beslag og skruer, og gir et veiledende prisestimat.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hva er forskjellen på frittstående og veggmontert pergola?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En frittstående pergola står på egne stolper på alle fire hjørner og kan plasseres hvor som helst i hagen. En veggmontert pergola festes til husveggen med en veggdrager (ledger) på baksiden, så du sparer én stolperad – fin som solskjerm over terrassen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hvilket tak bør jeg velge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Åpne spær gir et lett uttrykk uten skygge. Lekter gir delvis skygge og luft, mens skråstilte spjeld (lameller) styrer hvor mye sol som slipper inn. Tett tak med plater eller takduk gir en tørr uteplass du kan bruke i regnvær.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg lagre pergolaprosjektet mitt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, du kan lagre flere pergolaprosjekter direkte i nettleseren og åpne dem igjen senere. Ingen innlogging er nødvendig.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bygger Minio pergolaen for meg?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Bruk planleggeren til å komme fram til ønsket løsning, og be om et konkret tilbud. Vi bygger skreddersydde pergolaer og uteløsninger i tre, håndlaget i Lillehammer.',
      },
    },
  ],
}

const PERGOLA_APP = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://minio.no/planleggere/pergola#app',
  name: 'Pergolaplanlegger',
  alternateName: ['Pergoladesigner', 'Pergolakalkulator', 'Solskjermplanlegger', 'Hagestueplanlegger'],
  url: 'https://minio.no/planleggere/pergola',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: 'nb-NO',
  description:
    'Gratis pergolaplanlegger som lar deg tegne pergolaen i 3D, velge frittstående eller veggmontert, sette mål og tak (lekter, spjeld eller tett), legge til sideskjerm og få komplett materialliste med prisestimat og PDF.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
  featureList: [
    '3D-visualisering i sanntid',
    'Frittstående eller veggmontert',
    'Åpne spær, lekter, spjeld eller tett tak',
    'Sideskjerm og spalér',
    'Materialliste med løpemeter per trevirke',
    'Veiledende prisestimat',
    'Last ned materialliste som PDF',
    'Lagre prosjekter lokalt',
  ],
  publisher: { '@id': 'https://minio.no/#business' },
}

const PERGOLA_HOWTO = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Slik planlegger du pergolaen i 3D',
  description: 'Tegn pergolaen, sett målene og få en komplett materialliste med Minios gratis pergolaplanlegger.',
  inLanguage: 'nb-NO',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Velg montering', text: 'Velg frittstående eller veggmontert pergola.' },
    { '@type': 'HowToStep', position: 2, name: 'Sett målene', text: 'Juster bredde, dybde og høyde med skyvekontrollene og se pergolaen i 3D.' },
    { '@type': 'HowToStep', position: 3, name: 'Velg tak og skjerm', text: 'Velg tak (lekter, spjeld eller tett) og legg til sideskjerm der du vil ha le.' },
    { '@type': 'HowToStep', position: 4, name: 'Få materialliste', text: 'Se materialliste og prisestimat, og last ned alt som PDF til byggevarehandelen.' },
  ],
}

const PERGOLA_BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
    { '@type': 'ListItem', position: 2, name: 'Planleggere', item: 'https://minio.no/planleggere' },
    { '@type': 'ListItem', position: 3, name: 'Pergolaplanlegger', item: 'https://minio.no/planleggere/pergola' },
  ],
}

const Hero = styled.section`
  min-height: 28vh;
  background-color: #e8e8e0;
  background-image: url('/images/planleggere/pergola-hero.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 4rem 2rem 2rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.32);
    z-index: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 0;
    padding: 5rem 1rem 1rem;
  }
`

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    font-weight: 700;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
      margin: 0;
    }
  }

  p {
    font-size: 1.2rem;
    opacity: 0.95;
    color: white;
    margin: 0;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      display: none;
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
    font-size: 2rem;
    margin: 0 0 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
    }
  }

  h3 {
    font-size: 1.5rem;
    margin: 2rem 0 1rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.3rem;
    }
  }

  p {
    line-height: 1.8;
    margin-bottom: 1.5rem;
    color: #333;
  }

  ul {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.75rem;
    line-height: 1.6;
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
    transition: transform 0.2s ease;
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

export default function PergolaPlanleggerPage() {
  const { config, setConfig, prosjekt } = usePergolaProsjekter()
  const snapshotRef = useRef<(() => string | null) | null>(null)

  useSEO({
    title: 'Pergolaplanlegger – tegn pergola i 3D og få materialliste | Minio',
    description:
      'Gratis pergolaplanlegger fra Minio. Velg frittstående eller veggmontert, sett målene og se pergolaen i 3D med tak av lekter, spjeld eller tett tak og eventuell sideskjerm. Få komplett materialliste med stolper, dragere, spær, beslag og skruer, veiledende prisestimat og PDF du kan ta med i byggevarehandelen.',
    keywords:
      'pergolaplanlegger, pergola planlegger, pergoladesigner, pergolakalkulator, solskjerm pergola, planlegge pergola, tegne pergola, bygge pergola, pergola 3D, materialliste pergola, frittstående pergola, veggmontert pergola, pergola tak',
    ogImage: '/images/planleggere/pergola.webp',
    jsonLd: [PERGOLA_APP, PERGOLA_HOWTO, PERGOLA_FAQ, PERGOLA_BREADCRUMB],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroContent>
              <h1>Pergolaplanlegger</h1>
              <p>Tegn pergolaen i 3D – velg tak og skjerm, og få komplett materialliste med prisestimat</p>
            </HeroContent>
          </Hero>

          <Content>
            <Layout>
              <VisualizerWrap>
                <PergolaVisualizer config={config} onConfigChange={setConfig} prosjekt={prosjekt} snapshotRef={snapshotRef} />
              </VisualizerWrap>

              <Article>
                <h2>Planlegg pergolaen – ned til hver stolpe og spær</h2>
                <p>
                  Med pergolaplanleggeren tegner du pergolaen akkurat slik du vil ha den, og ser den
                  umiddelbart i 3D. Velg om den skal stå <strong>frittstående</strong> i hagen eller{' '}
                  <strong>veggmonteres</strong> som solskjerm over terrassen, sett målene med
                  skyvekontrollene, og bestem hvordan taket skal se ut. Veksle mellom{' '}
                  <strong>ferdig</strong>, <strong>konstruksjon</strong> (stolper, dragere og spær) og{' '}
                  <strong>begge samtidig</strong>, der tak og skjerm blir gjennomsiktige så du ser
                  bæringen under. Trykk på fullskjerm for å se modellen i full størrelse.
                </p>

                <h3>Velg tak etter hvor mye sol du vil ha</h3>
                <ul>
                  <li>
                    <strong>Åpen</strong> – kun spær, et lett og luftig uttrykk.
                  </li>
                  <li>
                    <strong>Lekter</strong> – jevn solskjerm med luft mellom bordene.
                  </li>
                  <li>
                    <strong>Spjeld</strong> – skråstilte lameller som styrer sollyset.
                  </li>
                  <li>
                    <strong>Tett tak</strong> – plater eller takduk for en tørr uteplass hele året.
                  </li>
                </ul>

                <h3>Sideskjerm og spalér for le og planter</h3>
                <p>
                  Legg til <strong>spalér</strong> for klatreplanter, <strong>vannrette bord</strong> eller{' '}
                  <strong>tett panel</strong> på de sidene du vil skjerme for innsyn og vind. Velg fritt hvilke
                  sider skjermen skal stå på.
                </p>

                <h3>Komplett materialliste og prisestimat</h3>
                <p>
                  For hver endring regner planleggeren ut antall stolper, dragere og spær, løpemeter trevirke,
                  takslekter eller takflate, stolpesko og skruer – og gir deg et veiledende materialestimat i
                  kroner. Under <strong>Materialer og priser</strong> kan du justere dimensjoner, avstander og
                  dagens priser slik at estimatet passer ditt prosjekt.
                </p>

                <h3>Lagre prosjektene dine</h3>
                <p>
                  Lag flere varianter, gi dem navn og lagre dem rett i nettleseren. Da kan du sammenligne
                  løsninger og hente dem fram igjen senere – helt uten innlogging.
                </p>

                <h3>Klar til å bygge?</h3>
                <p>
                  Når du har funnet løsningen du liker, bygger vi den gjerne for deg. Minio lager
                  skreddersydde pergolaer og uteløsninger i tre, håndlaget i Lillehammer. Be om et tilbud,
                  så hjelper vi deg videre.
                </p>

                <h3>Vanlige spørsmål</h3>
                <FaqList>
                  {PERGOLA_FAQ.mainEntity.map((item) => (
                    <details key={item.name}>
                      <summary>{item.name}</summary>
                      <p>{item.acceptedAnswer.text}</p>
                    </details>
                  ))}
                </FaqList>
              </Article>

              <Sidebar>
                <SidebarTitle>Konfigurer pergolaen</SidebarTitle>
                <PergolaCalculator config={config} onChange={setConfig} snapshotRef={snapshotRef} />
              </Sidebar>
            </Layout>
          </Content>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
