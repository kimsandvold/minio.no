import { useState, useCallback } from 'react'
import styled from 'styled-components'
import PidestallKrakkPriceCalculator from './PidestallKrakkPriceCalculator'
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

const PIDESTALL_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvilke mål kan jeg velge på pidestallen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pidestallen kan bestilles fra 30×30×30 cm opp til 60×60 cm i bredde/dybde med høyde opp til 80 cm. Bruk konfiguratoren for å se 3D-modellen med dine mål.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan pidestallen stå ute hele året?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Pidestallen er bygget i solid treverk og tåler norske forhold. Velg malt eller beiset finish for ekstra beskyttelse mot fukt.',
      },
    },
    {
      '@type': 'Question',
      name: 'Får jeg rabatt om jeg kjøper flere?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja – 5 % rabatt på 2 stk, 8 % på 3 stk og 10 % på 4 eller flere. Rabatten beregnes automatisk i priskalkulatoren.',
      },
    },
    {
      '@type': 'Question',
      name: 'Tåler pidestallen ujevnt underlag?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hver pidestall leveres med justerbar fot på ett av bena, slik at den står stødig selv på ujevn terrasse eller gulv.',
      },
    },
  ],
}

const Hero = styled.section`
  min-height: 28vh;
  background-image: url('/images/products/pidestall_krakk_1.webp');
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

interface PidestallConfig {
  width: number
  depth: number
  height: number
}

const DEFAULT_BASE_PRICE = 1500

const INITIAL_CONFIG: PidestallConfig = {
  width: 30,
  depth: 30,
  height: 30,
}

export default function PidestallKrakkPage() {
  const { data: product } = useProductBySlug('pidestall-krakk')
  const [config, setConfig] = useState<PidestallConfig>(INITIAL_CONFIG)

  const handleConfigChange = useCallback((newConfig: PidestallConfig) => {
    setConfig(newConfig)
  }, [])

  const baseJsonLd = product
    ? productJsonLd(product, '/produkter/pidestall-krakk')
    : []
  const productSchema = baseJsonLd[0] as Record<string, unknown> | undefined
  if (productSchema && productSchema.offers) {
    productSchema.offers = {
      ...(productSchema.offers as Record<string, unknown>),
      highPrice: 3700,
      priceValidUntil: '2026-12-31',
    }
  }
  if (productSchema) {
    productSchema.material = 'Trykkimpregnert furu'
    productSchema.category = 'Hage & utemøbler > Plantestativ'
    productSchema.audience = { '@type': 'PeopleAudience', suggestedGender: 'unisex' }
    productSchema.additionalProperty = [
      { '@type': 'PropertyValue', name: 'Min mål (cm)', value: '30×30×30' },
      { '@type': 'PropertyValue', name: 'Maks mål (cm)', value: '60×60×80' },
      { '@type': 'PropertyValue', name: 'Toppplate', value: '23×46 mm planker' },
      { '@type': 'PropertyValue', name: 'Bena', value: '48×48 mm' },
      { '@type': 'PropertyValue', name: 'Justerbar fot', value: 'Ja' },
    ]
  }

  useSEO({
    title: 'Pidestall krakk i tre – skreddersydd plantestativ fra 1 500,- | Minio',
    description:
      'Håndlaget pidestall i trykkimpregnert tre. Skreddersydd fra 30×30×30 cm opp til 60×60×80 cm. Mengderabatt opptil 10 %. Bygget i Lillehammer – pris fra 1 500,-.',
    ogImage: product?.images[0]?.src ?? '/images/products/pidestall_krakk_1.webp',
    jsonLd: [...baseJsonLd, PIDESTALL_FAQ],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroContent>
              <h1>Pidestall krakk i tre</h1>
              <p>Skreddersydd plantestativ – pris fra 1 500,-</p>
            </HeroContent>
          </Hero>

          <Content>
            <Container>
              <VisualizerTitle>Stilren pidestall i tre – løft fram det du er glad i</VisualizerTitle>
              <VisualizerWrap>
                <ThreeVisualizer
                  width={config.width}
                  depth={config.depth}
                  height={config.height}
                />
              </VisualizerWrap>

              <Article>
                <p>
                  En pidestall gjør at favorittplanten, krukken eller lykten får den oppmerksomheten den
                  fortjener. Vi bygger hver pidestall for hånd i Lillehammer i <strong>trykkimpregnert
                  treverk</strong> – ferdig til å stå ute hele året.
                </p>

                <h3>Velg dine mål</h3>
                <p>
                  Bredde og dybde fra 30 cm til 60 cm, høyde fra 30 cm til 80 cm. Bruk konfiguratoren
                  over for å se modellen i 3D mens du justerer målene – priskalkulatoren oppdaterer seg
                  automatisk.
                </p>

                <h3>Bygget for ujevn terrasse</h3>
                <p>
                  Hver pidestall leveres med <strong>justerbar fot på ett av bena</strong>. Det betyr at
                  du kan kompensere for små nivåforskjeller på terrassen, balkongen eller i hagen, slik at
                  pidestallen står stødig uten å vagge.
                </p>

                <h3>Mengderabatt</h3>
                <ul>
                  <li><strong>2 stk</strong> – 5 % rabatt</li>
                  <li><strong>3 stk</strong> – 8 % rabatt</li>
                  <li><strong>4 stk eller flere</strong> – 10 % rabatt</li>
                </ul>
                <p>
                  Perfekt om du vil ha en serie i ulike høyder og skape et levende uttrykk med trapper av
                  planter.
                </p>

                <h3>Trykkimpregnert tre – ferdig til bruk</h3>
                <p>
                  Pidestallene leveres ferdig i trykkimpregnert tre som tåler jord, fukt og frost. Vi
                  tilbyr ikke ekstra overflatebehandling – impregneringen gjør at krakken kan stå ute hele
                  året uten ytterligere vedlikehold.
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
                  Pidestallen er bygget med solide ben og kraftige rammer for et stødig produkt som tåler
                  norske forhold. Velg malt eller beiset finish om du vil at den skal stå ute hele året.
                </p>
              </Article>

              <Sidebar>
                <SidebarTitle>Pris kalkulator</SidebarTitle>
                <PidestallKrakkPriceCalculator
                  basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE}
                  onConfigChange={handleConfigChange}
                />
              </Sidebar>
            </Container>

            <RelatedProducts currentSlug="pidestall-krakk" />
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
