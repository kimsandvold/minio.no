import styled from 'styled-components'
import TerrasseVisualizer from './TerrasseVisualizer'
import TerrasseCalculator from './TerrasseCalculator'
import { useTerrasseProsjekter } from './useTerrasseProsjekter'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PlannerDisclaimer from '../../shared/planlegger/PlannerDisclaimer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import { useSEO } from '../../../hooks/useSEO'
import { MINIO_PUBLISHER } from '../../../utils/seo'
import Icon from '../../shared/Icon'
import { useRef, useState, useEffect } from 'react'

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
    {
      '@type': 'Question',
      name: 'Heter det terrasse, veranda, platting eller altan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Folk kaller det mange ting – terrasse, veranda, platting, altan, treplatting eller uteplass i tre. Planleggeren fungerer likt uansett hva du kaller den: tegn underlaget i 3D, sett målene og få materialliste og prisestimat. Verktøyet fungerer altså like godt som verandaplanlegger, plattingplanlegger eller terrassedesigner.',
      },
    },
  ],
}

const TERRASSE_APP = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': 'https://minio.no/planleggere/terrasse#app',
  name: 'Terrasseplanlegger',
  alternateName: [
    'Verandaplanlegger',
    'Verandadesigner',
    'Plattingplanlegger',
    'Terrassedesigner',
    'Altanplanlegger',
    'Uteplassplanlegger',
    'Terrassekalkulator',
    'Plattingkalkulator',
  ],
  url: 'https://minio.no/planleggere/terrasse',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: 'nb-NO',
  description:
    'Gratis terrasseplanlegger og verandadesigner som lar deg tegne terrassen, verandaen eller plattingen i 3D, velge form (rektangel, L-form, U-form), legge til gjerde og trapp, og få komplett materialliste med prisestimat og PDF.',
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
  publisher: MINIO_PUBLISHER,
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
    { '@type': 'ListItem', position: 2, name: 'Planleggere', item: 'https://minio.no/planleggere' },
    { '@type': 'ListItem', position: 3, name: 'Terrasseplanlegger', item: 'https://minio.no/planleggere/terrasse' },
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
    /* Hold 3D-modellen festet øverst mens parametrene under scroller. */
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

const ZoomButton = styled.button`
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 1.5rem;
  padding: 0;
  border: none;
  background: none;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  line-height: 0;

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.4s ease, filter 0.4s ease;
  }

  &:hover img,
  &:focus-visible img {
    transform: scale(1.04);
    filter: brightness(0.92);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`

const ZoomBadge = styled.span`
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(20, 20, 20, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 1rem;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;

  ${ZoomButton}:hover &,
  ${ZoomButton}:focus-visible & {
    opacity: 1;
    transform: scale(1);
  }
`

const Lightbox = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.88);
  cursor: zoom-out;
  animation: lightboxFade 0.2s ease;

  @keyframes lightboxFade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`

const LightboxClose = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`

export default function TerrassePlanleggerPage() {
  const { config, setConfig, prosjekt } = useTerrasseProsjekter()
  // Visualiseringen fyller denne med en funksjon som fanger modellen fra standard-
  // perspektivet, slik at PDF-en alltid bruker det beste utgangsbildet.
  const snapshotRef = useRef<(() => string | null) | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  useSEO({
    title: 'Terrasseplanlegger & verandadesigner – tegn i 3D og få materialliste | Minio',
    description:
      'Gratis terrasseplanlegger, verandadesigner og plattingplanlegger fra Minio. Velg form (rektangel, L-form, U-form), sett målene og se terrassen, verandaen eller plattingen i 3D med ferdig overflate og konstruksjon. Få komplett materialliste med antall bord, bjelker, skruer, gjerde og trapp, veiledende prisestimat og PDF du kan ta med i byggevarehandelen.',
    keywords:
      'terrasseplanlegger, verandaplanlegger, verandadesigner, plattingplanlegger, terrassedesigner, altanplanlegger, uteplassplanlegger, terrassekalkulator, plattingkalkulator, planlegge terrasse, tegne terrasse, bygge terrasse, terrasse 3D, materialliste terrasse, treplatting, uteplass i tre',
    ogImage: '/images/terrasse/terrasseplanlegger-promo.png',
    ogImageAlt: 'Terrasse i tre tegnet i Minios 3D-terrasseplanlegger',
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
              <p>Planlegg terrasse, veranda eller platting i 3D – og få komplett materialliste med prisestimat</p>
            </HeroContent>
          </Hero>

          <Content>
            <Layout>
              <VisualizerWrap>
                <TerrasseVisualizer config={config} onConfigChange={setConfig} prosjekt={prosjekt} snapshotRef={snapshotRef} />
              </VisualizerWrap>

              <Article>
                <h2>Planlegg terrasse, veranda eller platting – ned til hvert bord</h2>
                <p>
                  Med terrasseplanleggeren tegner du terrassen akkurat slik du vil ha den, og ser den
                  umiddelbart i 3D. Verktøyet fungerer like godt som <strong>verandadesigner</strong>,{' '}
                  <strong>plattingplanlegger</strong> eller <strong>altanplanlegger</strong> – kall det
                  gjerne terrasse, veranda, platting, altan eller uteplass i tre, planleggingen er den
                  samme. Velg form, sett målene med skyvekontrollene, og legg til gjerde og
                  trapp der du trenger det. Veksle mellom <strong>ferdig overflate</strong>,{' '}
                  <strong>konstruksjon</strong> (bjelkelag, sidebjelker og stolper) og <strong>begge samtidig</strong>,
                  der terrassebordene blir gjennomsiktige så du ser konstruksjonen under. Trykk på fullskjerm
                  for å se modellen i full størrelse.
                </p>

                <ZoomButton
                  type="button"
                  onClick={() =>
                    setLightbox({
                      src: '/images/planleggere/terrasse-inspirasjon.webp',
                      alt: 'Terrasse i tre med rekkverk, spisegruppe og loungesofa langs husveggen i kveldssol',
                    })
                  }
                  aria-label="Forstørr inspirasjonsbilde av ferdig terrasse"
                >
                  <img
                    src="/images/planleggere/terrasse-inspirasjon.webp"
                    alt="Terrasse i tre med rekkverk, spisegruppe og loungesofa langs husveggen i kveldssol"
                    loading="lazy"
                    width={1536}
                    height={1024}
                  />
                  <ZoomBadge aria-hidden="true">
                    <Icon name="faSearch" />
                  </ZoomBadge>
                </ZoomButton>

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

                <h3>Vanlige spørsmål</h3>
                <FaqList>
                  {TERRASSE_FAQ.mainEntity.map((item) => (
                    <details key={item.name}>
                      <summary>{item.name}</summary>
                      <p>{item.acceptedAnswer.text}</p>
                    </details>
                  ))}
                </FaqList>
              </Article>

              <Sidebar>
                <SidebarTitle>Konfigurer terrassen</SidebarTitle>
                <TerrasseCalculator config={config} onChange={setConfig} snapshotRef={snapshotRef} />
              </Sidebar>
            </Layout>
          </Content>
        </main>
      </PageTransition>
      {lightbox && (
        <Lightbox role="dialog" aria-modal="true" aria-label="Forstørret bilde" onClick={() => setLightbox(null)}>
          <LightboxClose type="button" aria-label="Lukk" onClick={() => setLightbox(null)}>
            <Icon name="faTimes" />
          </LightboxClose>
          <img src={lightbox.src} alt={lightbox.alt} />
        </Lightbox>
      )}
      <PlannerDisclaimer />
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
