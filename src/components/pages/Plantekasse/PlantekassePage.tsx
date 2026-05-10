import { useState, useCallback } from 'react'
import styled from 'styled-components'
import PlantekassePriceCalculator from './PlantekassePriceCalculator'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import SplideCarousel from '../../shared/SplideCarousel'
import { useSEO } from '../../../hooks/useSEO'
import { useProductBySlug } from '../../../hooks/useProducts'
import RelatedProducts from '../../shared/RelatedProducts'

const Hero = styled.section`
  min-height: 50vh;
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
  padding: 6rem 2rem 4rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 40vh;
    padding: 5rem 1.5rem 3rem;
  }
`

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.2rem;
    opacity: 0.95;
    color: white;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
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
  gap: 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 2rem;
    display: flex;
    flex-direction: column;
  }
`

const Article = styled.article`
  padding: 0;

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
    padding: 0;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
    order: 2;
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
    order: 1;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
`

const SidebarTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 0.75rem;
  color: ${({ theme }) => theme.colors.textDark};
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

interface PlantekasseConfig {
  width: number
  height: number
  depth: number
  construction: string
  finish: string
}

const DEFAULT_BASE_PRICE = 1260

export default function PlantekassePage() {
  const { data: product } = useProductBySlug('plantekasser')
  const [config, setConfig] = useState<PlantekasseConfig>({
    width: 60,
    depth: 40,
    height: 40,
    construction: 'whitewood',
    finish: '0',
  })

  const handleConfigChange = useCallback((newConfig: PlantekasseConfig) => {
    setConfig(newConfig)
  }, [])

  useSEO({
    title: 'Plantekasse i tre – skreddersydd og kampanjepris | Minio',
    description:
      'Skreddersydd plantekasse i tre med justerbare innvendige mål fra 30×30×30 cm til 200×200×80 cm. Velg mellom impregnert tre eller trehvitt. Kampanjepris fra 1 260,-.',
    ogImage: product?.images[0]?.src ?? '/images/products/plantekasser_2.webp',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <HeroContent>
              <h1>Plantekasse i tre</h1>
              <p>Skreddersydd etter dine mål – kampanjepris akkurat nå</p>
            </HeroContent>
          </Hero>

          <Content>
            <Container>
              <Article>
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

                <h2>Solid plantekasse i tre, akkurat som du vil ha den</h2>
                <p>
                  Fra urter og blomster til grønnsaker – en skreddersydd plantekasse i tre gir terrassen,
                  balkongen eller hagen et grønt løft. Vi bygger hver kasse for hånd i Lillehammer, og du
                  velger målene som passer plassen din.
                </p>

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

                <h3>Kampanjepris akkurat nå</h3>
                <p>
                  Plantekassen er for tiden på <strong>kampanje med 30 % rabatt</strong>. Ordinær pris fra
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
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
