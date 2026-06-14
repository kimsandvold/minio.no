import { useState } from 'react'
import styled from 'styled-components'
import TerrasseVisualizer from './TerrasseVisualizer'
import TerrasseCalculator from './TerrasseCalculator'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import { useSEO } from '../../../hooks/useSEO'
import { DEFAULT_CONFIG, type TerrasseConfig } from './terrasseModel'

const TERRASSE_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvilke terrasseformer kan jeg planlegge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Du kan planlegge tre former etter hvordan terrassen skal ligge rundt huset: rektangel (langs én vegg), L-form (rundt to sider) og U-form / hestesko (rundt tre sider). Velg form, sett målene og se terrassen i 3D med ferdig overflate, konstruksjon eller begge samtidig.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hva regner planleggeren ut?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Planleggeren beregner areal, antall terrassebord og løpemeter, antall bjelker, skruer, gjerde og trapp – samt et veiledende materialestimat i kroner basert på dimensjoner og priser du kan justere selv.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg lagre terrasseprosjektet mitt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, du kan lagre flere terrasseprosjekter direkte i nettleseren og åpne dem igjen senere. Ingen innlogging er nødvendig.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bygger Minio terrassen for meg?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Bruk planleggeren til å komme fram til ønsket løsning, og be om et konkret tilbud. Vi bygger skreddersydde terrasser og uteløsninger i tre, håndlaget i Lillehammer.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg laste ned en materialliste?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Planleggeren lager en materialliste med antall og løpemeter per trevirke (terrassebord, bjelker, kantbjelker, lekt, stolper) og festemateriell, med bilde av modellen og Minio-logo. Lasten ned som PDF og ta den med i byggevarehandelen.',
      },
    },
  ],
}

const TERRASSE_APP = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://minio.no/terrasseplanlegger#app',
  name: 'Terrasseplanlegger',
  url: 'https://minio.no/terrasseplanlegger',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: 'nb-NO',
  description:
    'Gratis terrasseplanlegger som lar deg tegne terrassen i 3D, velge form (rektangel, L-form, U-form), legge til gjerde og trapp, og få komplett materialliste med prisestimat og PDF.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
  featureList: [
    '3D-visualisering i sanntid',
    'Rektangel, L-form og U-form rundt huset',
    'Gjerde og trapp',
    'Materialliste med løpemeter per trevirke',
    'Veiledende prisestimat',
    'Last ned materialliste som PDF',
    'Lagre prosjekter lokalt',
  ],
  publisher: { '@id': 'https://minio.no/#business' },
}

const TERRASSE_HOWTO = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Slik planlegger du terrassen i 3D',
  description:
    'Tegn terrassen, sett målene og få en komplett materialliste med Minios gratis terrasseplanlegger.',
  inLanguage: 'nb-NO',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Velg form', text: 'Velg rektangel, L-form eller U-form etter hvordan terrassen skal ligge rundt huset.' },
    { '@type': 'HowToStep', position: 2, name: 'Sett målene', text: 'Juster lengde, bredde og dybde med skyvekontrollene og se terrassen i 3D.' },
    { '@type': 'HowToStep', position: 3, name: 'Legg til gjerde og trapp', text: 'Velg gjerdetype og plasser trapper på ønsket side.' },
    { '@type': 'HowToStep', position: 4, name: 'Få materialliste', text: 'Se materialliste og prisestimat, og last ned alt som PDF til byggevarehandelen.' },
  ],
}

const TERRASSE_BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
    { '@type': 'ListItem', position: 2, name: 'Terrasseplanlegger', item: 'https://minio.no/terrasseplanlegger' },
  ],
}

const Hero = styled.section`
  min-height: 28vh;
  background-color: #ffffff;
  background-image: url('/images/terrasse/terrasseplanlegger-promo.png');
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
    margin-bottom: 0;
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

export default function TerrassePlanleggerPage() {
  const [config, setConfig] = useState<TerrasseConfig>(DEFAULT_CONFIG)

  useSEO({
    title: 'Terrasseplanlegger – tegn terrassen i 3D og få materialliste | Minio',
    description:
      'Gratis terrasseplanlegger fra Minio. Velg form (rektangel, L-form, U-form), sett målene og se terrassen i 3D med ferdig overflate og konstruksjon. Få komplett materialliste med antall bord, bjelker, skruer, gjerde og trapp, veiledende prisestimat og PDF du kan ta med i byggevarehandelen.',
    ogImage: '/images/terrasse/terrasseplanlegger-promo.png',
    jsonLd: [TERRASSE_APP, TERRASSE_HOWTO, TERRASSE_FAQ, TERRASSE_BREADCRUMB],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroContent>
              <h1>Terrasseplanlegger</h1>
              <p>Tegn terrassen i 3D og få komplett materialliste med prisestimat</p>
            </HeroContent>
          </Hero>

          <Content>
            <Layout>
              <VisualizerWrap>
                <TerrasseVisualizer config={config} onConfigChange={setConfig} />
              </VisualizerWrap>

              <Article>
                <h2>Planlegg terrassen din – ned til hvert bord</h2>
                <p>
                  Med terrasseplanleggeren tegner du terrassen akkurat slik du vil ha den, og ser den
                  umiddelbart i 3D. Velg form, sett målene med skyvekontrollene, og legg til gjerde og
                  trapp der du trenger det. Veksle mellom <strong>ferdig overflate</strong>,{' '}
                  <strong>konstruksjon</strong> (bjelkelag, sidebjelker og stolper) og <strong>begge samtidig</strong>,
                  der terrassebordene blir gjennomsiktige så du ser konstruksjonen under. Trykk på fullskjerm
                  for å se modellen i full størrelse.
                </p>

                <h3>Tre former – rundt én, to eller tre sider av huset</h3>
                <ul>
                  <li>
                    <strong>Rektangel</strong> – den klassiske terrassen langs én husvegg.
                  </li>
                  <li>
                    <strong>L-form</strong> – hjørneterrasse som følger to sider av huset.
                  </li>
                  <li>
                    <strong>U-form (hestesko)</strong> – terrassen omslutter huset på tre sider.
                  </li>
                </ul>

                <h3>Komplett materialliste og prisestimat</h3>
                <p>
                  For hver endring regner planleggeren ut areal, antall terrassebord og løpemeter, antall
                  bjelker, skruer, gjerdebord og trinn – og gir deg et veiledende materialestimat i kroner.
                  Under <strong>Materialer og priser</strong> kan du justere bordbredde, bjelkeavstand,
                  dimensjoner og dagens priser slik at estimatet passer ditt prosjekt.
                </p>

                <h3>Lagre prosjektene dine</h3>
                <p>
                  Lag flere varianter, gi dem navn og lagre dem rett i nettleseren. Da kan du sammenligne
                  løsninger og hente dem fram igjen senere – helt uten innlogging.
                </p>

                <h3>Klar til å bygge?</h3>
                <p>
                  Når du har funnet løsningen du liker, bygger vi den gjerne for deg. Minio lager
                  skreddersydde terrasser og uteløsninger i tre, håndlaget i Lillehammer. Be om et tilbud,
                  så hjelper vi deg videre.
                </p>
              </Article>

              <Sidebar>
                <SidebarTitle>Konfigurer terrassen</SidebarTitle>
                <TerrasseCalculator config={config} onChange={setConfig} />
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
