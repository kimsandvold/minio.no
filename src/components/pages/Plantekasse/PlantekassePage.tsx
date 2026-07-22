import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import PlantekassePriceCalculator from './PlantekassePriceCalculator'
import ThreeVisualizer from './ThreeVisualizer'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PlannerDisclaimer from '../../shared/planlegger/PlannerDisclaimer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import SplideCarousel from '../../shared/SplideCarousel'
import { useSEO } from '../../../hooks/useSEO'
import { useProductBySlug } from '../../../hooks/useProducts'
import { productJsonLd } from '../../../utils/productJsonLd'
import RelatedProducts from '../../shared/RelatedProducts'

const PLANTEKASSE_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvilke former kommer plantekassen i?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Plantekassen kommer i fire former: kvadratisk, rektangulær, utvendig hjørne (L) og innvendig hjørne (L). Bruk konfiguratoren for å se 3D-modellen med dine mål.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hva er forskjellen på trehvitt og impregnert tre?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trehvitt er ubehandlet furu med et lyst, naturlig uttrykk. Trykkimpregnert tre har en grønnlig tone og tåler jord, fukt og frost vesentlig bedre over tid – anbefalt for plantekasser som står ute hele året.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg legge til espalier?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, du kan legge til espalier (vertikalt klatregitter) på baksiden av kassen. På L-formene monteres espalier på begge armene. Tillegg fra 800,-.',
      },
    },
    {
      '@type': 'Question',
      name: 'Leverer dere plantekassen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, vi leverer ferdig montert plantekasse inntil 200 km fra Lillehammer. Avstanden bestemmer leveringsprisen, og du kan også velge å hente selv.',
      },
    },
  ],
}

const Hero = styled.section`
  min-height: 28vh;
  background-image: url('/images/products/plantekasser_2.webp');
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
    background: rgba(0, 0, 0, 0.5);
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

const Container = styled.div`
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

const Article = styled.article`
  grid-area: article;
  padding: 0;

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
    padding: 0;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
  }
`

const VisualizerWrap = styled.div`
  grid-area: viz;
  margin-bottom: 2rem;
  animation: fadeInVisualizer 0.4s ease-out;

  @keyframes fadeInVisualizer {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: 0;
  }
`

const ImageWrap = styled.div`
  margin-bottom: 2rem;

  .splide,
  .splide__track,
  .splide__list,
  .splide__slide {
    border-radius: 8px;
  }

  .splide {
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .splide__slide {
    aspect-ratio: 1 / 1;
    overflow: hidden;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    aspect-ratio: 1 / 1;
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
  margin: 0 0 0.5rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const AdvancedCta = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: #16181d;
  color: #e9e7e1;
  text-decoration: none;
  transition: transform 0.15s ease, background 0.15s ease;

  &:hover {
    background: #202329;
    transform: translateY(-2px);
  }

  .ac-ico {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: rgba(123, 195, 156, 0.16);
    color: #7bc39c;
    font-size: 0.9rem;
  }

  .ac-txt {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    strong { font-size: 0.9rem; font-weight: 700; color: #fff; }
    em { font-style: normal; font-size: 0.76rem; line-height: 1.4; color: #a8a49b; }
  }

  > svg:last-child { color: #8b877e; font-size: 0.85rem; flex-shrink: 0; }
`

const ReviewsSection = styled.section`
  max-width: 1200px;
  margin: 4rem auto 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 2.5rem;
  }
`

const ReviewsHeader = styled.div`
  margin-bottom: 2rem;

  h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.95rem;
    color: #888;
    margin: 0;
  }
`

const ReviewNote = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-top: 1rem;
`

type PlantekasseShape = 'square' | 'rect' | 'outside-corner' | 'inside-corner'

interface PlantekasseConfig {
  shape: PlantekasseShape
  width: number
  height: number
  depth: number
  thickness: number
  construction: string
  finish: string
  espalier: boolean
}

const DEFAULT_BASE_PRICE = 1260

const INITIAL_CONFIG: PlantekasseConfig = {
  shape: 'rect',
  width: 80,
  depth: 40,
  height: 40,
  thickness: 40,
  construction: 'impregnated',
  finish: '0',
  espalier: true,
}

export default function PlantekassePage() {
  const { data: product } = useProductBySlug('plantekasser')
  const [config, setConfig] = useState<PlantekasseConfig>(INITIAL_CONFIG)

  const handleConfigChange = useCallback((newConfig: PlantekasseConfig) => {
    setConfig(newConfig)
  }, [])

  useSEO({
    title: 'Plantekasse i tre – kvadratisk, rektangulær og hjørnemodell | Minio',
    description:
      'Skreddersydd plantekasse i tre i fire former: kvadratisk, rektangulær og som hjørneløsning (utvendig/innvendig L). Velg mål, trehvitt eller impregnert, espalier og levering. Pris fra 1 260,- – håndlaget i Lillehammer.',
    ogImage: product?.images[0]?.src ?? '/images/products/plantekasser_2.webp',
    jsonLd: product
      ? [...productJsonLd(product, '/produkter/plantekasser'), PLANTEKASSE_FAQ]
      : [PLANTEKASSE_FAQ],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroContent>
              <h1>Plantekasse i tre</h1>
              <p>Skreddersydd etter dine mål – pris fra 1 260,-</p>
            </HeroContent>
          </Hero>

          <Content>
            <Container>
              <VisualizerWrap>
                <ThreeVisualizer
                  shape={config.shape}
                  width={config.width}
                  height={config.height}
                  depth={config.depth}
                  thickness={config.thickness}
                  construction={config.construction}
                  finish={config.finish}
                  espalier={config.espalier}
                />
              </VisualizerWrap>

              <Article>
                <h2>Solid plantekasse i tre, akkurat som du vil ha den</h2>
                <p>
                  Fra urter og blomster til grønnsaker – en skreddersydd plantekasse i tre gir terrassen,
                  balkongen eller hagen et grønt løft. Vi bygger hver kasse for hånd i Lillehammer, og du
                  velger både form, mål og treverk som passer plassen din.
                </p>

                <h3>Fire former – velg den som passer plassen</h3>
                <p>
                  Plantekassen kommer i fire former. Bruk konfiguratoren over for å se modellen i 3D
                  med dine valgte mål, treverk og espalier.
                </p>
                <ul>
                  <li>
                    <strong>Kvadratisk plantekasse</strong> – Symmetrisk og kompakt. Fungerer som et
                    blikkfang midt på terrassen eller som hjørnedetalj på balkongen. Standardmål 40×40×40 cm,
                    med innvendige mål fra 30×30×30 cm til 200×200×80 cm.
                  </li>
                  <li>
                    <strong>Rektangulær plantekasse</strong> – Den klassiske formen. Brukes langs vegger,
                    rekkverk eller mellom uteområder. Standardmål 40×80×40 cm – ideelt for urtehage,
                    krydderplanter eller grønnsaker i rekke.
                  </li>
                  <li>
                    <strong>Utvendig hjørne (L-form)</strong> – Plantekassen omslutter et utvendig hjørne
                    på huset, skuret eller pergolaen. Espalier monteres på innsiden av L-en slik at
                    klatreplanter dekker hjørneveggene. Standardmål A 80 × B 80 cm med 40 cm dybde.
                  </li>
                  <li>
                    <strong>Innvendig hjørne (L-form)</strong> – Glir tett inn i et hjørne på terrasse,
                    balkong eller veranda. Utnytter plass som ellers blir liggende ubrukt, med espalier
                    på de to baksidene mot vegg.
                  </li>
                </ul>

                <h3>Slik tilpasser du kassen</h3>
                <ul>
                  <li>
                    <strong>Innvendige mål</strong> – Bredde og dybde fra 30 cm til 200 cm, høyde fra 30 cm til 80 cm.
                    Målene gjelder selve plassen for jord og planter, så du vet at røttene får akkurat den plassen
                    de trenger.
                  </li>
                  <li>
                    <strong>Treverk</strong> – Velg mellom <strong>trehvitt</strong> for et lyst, naturlig uttrykk
                    eller <strong>trykkimpregnert tre</strong> som tåler jord, fukt og frost vesentlig bedre over tid.
                  </li>
                  <li>
                    <strong>Overflatebehandling</strong> – Lever ubehandlet, grunnet eller ferdig grunnet og malt i
                    ønsket farge.
                  </li>
                  <li>
                    <strong>Levering og montering</strong> – Vi kjører ut inntil 200 km fra Lillehammer og kan sette
                    kassen ferdig på plass om du ønsker.
                  </li>
                </ul>

                {product && product.images.length > 0 && (
                  <ImageWrap>
                    {product.images.length > 1 ? (
                      <SplideCarousel>
                        {product.images.map((img, i) => (
                          <img key={i} src={img.src} alt={img.alt} loading="lazy" />
                        ))}
                      </SplideCarousel>
                    ) : (
                      <img src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
                    )}
                  </ImageWrap>
                )}

                <h3>Tilbud akkurat nå</h3>
                <p>
                  Plantekassen er for tiden på <strong>tilbud med 30 % rabatt</strong>. Ordinær pris fra
                  1 800,- starter nå på <strong>1 260,-</strong> for minste størrelse. Bruk priskalkulatoren til
                  høyre for å se hva akkurat din kasse koster med valgte mål, treverk og tilvalg.
                </p>

                <h3>Bygget for å vare</h3>
                <p>
                  Plantekassene er bygget med solide hjørnestolper og kraftige planker for et stødig, varig produkt.
                  Med trykkimpregnert tre kan du la kassen stå ute hele året uten ekstra behandling – perfekt for
                  norsk klima og varierende temperaturer.
                </p>
              </Article>

              <Sidebar>
                <SidebarTitle>Pris kalkulator</SidebarTitle>
                <PlantekassePriceCalculator
                  basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE}
                  config={config}
                  onConfigChange={handleConfigChange}
                />

                <AdvancedCta to="/designverktoy/plantekasse">
                  <span className="ac-ico"><Icon name="faCube" /></span>
                  <span className="ac-txt">
                    <strong>Vil du ha flere valg?</strong>
                    <em>Åpne 3D-designverktøyet for avansert design – dra i målene, mal hver del, se byggeplan.</em>
                  </span>
                  <Icon name="faArrowRight" />
                </AdvancedCta>
              </Sidebar>
            </Container>

            <RelatedProducts currentSlug="plantekasser" />

            <ReviewsSection>
              <ReviewsHeader>
                <h2>Hva kundene sier</h2>
                <p>Ingen tilbakemeldinger ennå</p>
              </ReviewsHeader>
              <ReviewNote>
                Din tilbakemelding legges ut etter avtale per e-post i etterkant av levering.
              </ReviewNote>
            </ReviewsSection>
          </Content>
        </main>
      </PageTransition>
      <PlannerDisclaimer />
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
