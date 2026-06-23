import { useState, useCallback } from 'react'
import styled from 'styled-components'
import LeveggerPriceCalculator from './LeveggerPriceCalculator'
import ThreeVisualizer from './ThreeVisualizer'
import type { LeveggConfig } from './ThreeVisualizer'
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

const LEVEGG_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'nb-NO',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvilke mål og typer kan jeg velge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Leveggen kan bestilles som rett panel eller som hjørne i 90°. Bredde 30–250 cm (per side ved hjørne), høyde 150–220 cm. Bruk konfiguratoren for å se 3D-modellen.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan leveggen stå ute hele året?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Leveggen leveres i trykkimpregnert tre og tåler norske forhold uten ekstra overflatebehandling.',
      },
    },
    {
      '@type': 'Question',
      name: 'Får jeg rabatt om jeg kjøper flere?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja – 5 % rabatt på 2 stk og 8 % på 3 stk. Rabatten beregnes automatisk i priskalkulatoren.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hva er forskjellen på rett og hjørne?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Rett er ett panel for skjerming langs én side. Hjørne er to paneler i 90° som skjermer to sider av terrassen samtidig – ideelt for hjørneplassering.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan jeg velge mellom stående og liggende spiler?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Velg mellom vertikale (stående) spiler for et klassisk, høyreist uttrykk eller horisontale (liggende) spiler for et mer moderne, lavt uttrykk.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hvor leveres leveggene fra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alle leveggene bygges for hånd i Lillehammer. Vi leverer i hele Innlandet og store deler av Østlandet – be om pris ved bestilling.',
      },
    },
  ],
}

const LEVEGG_TYPE_VARIANTS = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Levegg-varianter',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Product',
        name: 'Levegg – Rett',
        description:
          'Skreddersydd rett levegg i trykkimpregnert tre. Bredde 30–250 cm, høyde 150–220 cm. Velg stående eller liggende spiler.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'NOK',
          price: 3900,
          availability: 'https://schema.org/InStock',
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Product',
        name: 'Levegg – Hjørne (90°)',
        description:
          'Skreddersydd hjørnelevegg med to paneler i 90°. Per side 30–250 cm, høyde 150–220 cm. Ideelt for å skjerme to sider av terrassen samtidig.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'NOK',
          price: 7250,
          availability: 'https://schema.org/InStock',
        },
      },
    },
  ],
}

const Hero = styled.section`
  min-height: 28vh;
  background-image: url('/images/products/minio_levegg_variant.webp');
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
    'viztitle sidebar'
    'viz sidebar'
    'article sidebar';
  gap: 0 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'viztitle'
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

const VisualizerTitle = styled.h2`
  grid-area: viztitle;
  font-size: 1.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 0 0 1rem;
  line-height: 1.2;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.35rem;
    margin: 0.5rem 0 0.75rem;
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
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    aspect-ratio: 4 / 3;
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

const DEFAULT_BASE_PRICE = 3900

const INITIAL_CONFIG: LeveggConfig = {
  type: 'rett',
  orientation: 'vertikal',
  width: 120,
  widthB: 120,
  height: 150,
}

export default function LeveggerPage() {
  const { data: product } = useProductBySlug('levegger')
  const [config, setConfig] = useState<LeveggConfig>(INITIAL_CONFIG)

  const handleConfigChange = useCallback((newConfig: LeveggConfig) => {
    setConfig(newConfig)
  }, [])

  const baseJsonLd = product ? productJsonLd(product, '/produkter/levegger') : []

  useSEO({
    title: 'Levegg i tre – skreddersydd, rett eller hjørne – fra 3 900,- | Minio',
    description:
      'Skreddersydd levegg i trykkimpregnert tre fra Lillehammer. Velg rett panel eller hjørne i 90°, stående eller liggende spiler. 30–250 cm bred, 150–220 cm høy.',
    ogImage: product?.images[0]?.src ?? '/images/products/minio_levegg_variant.webp',
    jsonLd: [...baseJsonLd, LEVEGG_FAQ, LEVEGG_TYPE_VARIANTS],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroContent>
              <h1>Skreddersydd levegg i tre – terrasseskjerming fra Lillehammer</h1>
              <p>Velg rett eller hjørne, stående eller liggende spiler – fra 3 900,-</p>
            </HeroContent>
          </Hero>

          <Content>
            <Container>
              <VisualizerTitle>Bygg leveggen i 3D – velg type, spiler og mål</VisualizerTitle>
              <VisualizerWrap>
                <ThreeVisualizer
                  type={config.type}
                  orientation={config.orientation}
                  width={config.width}
                  widthB={config.widthB}
                  height={config.height}
                />
              </VisualizerWrap>

              <Article>
                <p>
                  En levegg gir <strong>skjerming, ly og roen</strong> som gjør terrassen til
                  et sted du faktisk vil oppholde deg. Vi bygger hver levegg for hånd i
                  Lillehammer i <strong>trykkimpregnert treverk</strong> med vertikale spiler
                  som slipper lys og luft gjennom – men holder innsynet ute.
                </p>

                <h3>Velg type</h3>
                <p>
                  <strong>Rett levegg</strong> er ett panel som passer langs en vegg, ved
                  rekkverket eller mellom to plassering. <strong>Hjørne</strong> er to paneler
                  i 90° som skjermer to sider av terrassen samtidig – perfekt om du vil ha
                  et lukket hjørne uten å bygge en hel skjermvegg.
                </p>

                <h3>Velg spilretning</h3>
                <p>
                  <strong>Stående spiler</strong> (vertikale) gir et klassisk, høyreist uttrykk
                  som passer godt mot moderne terrasser og rekkverk. <strong>Liggende spiler</strong>
                  (horisontale) gir et lavere, mer roen og strekker rommet visuelt –
                  fint mot lavere hekker eller moderne arkitektur.
                </p>

                <h3>Velg dine mål</h3>
                <p>
                  Bredde fra 30 cm til 250 cm – per side om du velger hjørne.
                  Høyde fra 150 cm til 220 cm. Bruk konfiguratoren over for å se modellen i 3D
                  mens du justerer – priskalkulatoren oppdaterer seg automatisk.
                </p>

                <h3>Mengderabatt</h3>
                <ul>
                  <li><strong>2 stk</strong> – 5 % rabatt</li>
                  <li><strong>3 stk</strong> – 8 % rabatt</li>
                </ul>
                <p>
                  Skjerm hele terrassen, eller kombiner en rett og en hjørne for et helt
                  lukket uteareal.
                </p>

                <h3>Trykkimpregnert tre – ferdig til bruk</h3>
                <p>
                  Leveggene leveres ferdig i trykkimpregnert tre som tåler vær, vind og
                  fukt. Du kan beise eller male senere om du vil, men det er ikke
                  nødvendig – impregneringen er nok.
                </p>

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

                <h3>Solid håndverk fra Lillehammer</h3>
                <p>
                  Leveggene bygges med solide stolper, gjennomtenkte rammer og spiler i
                  faste avstander. Konstruksjonen er laget for å stå stødig over tid –
                  også når det blåser.
                </p>
              </Article>

              <Sidebar>
                <SidebarTitle>Pris kalkulator</SidebarTitle>
                <LeveggerPriceCalculator
                  basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE}
                  onConfigChange={handleConfigChange}
                />
              </Sidebar>
            </Container>

            <RelatedProducts currentSlug="levegger" />
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
