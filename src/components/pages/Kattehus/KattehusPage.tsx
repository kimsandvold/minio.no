import { useState } from 'react'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PlannerDisclaimer from '../../shared/planlegger/PlannerDisclaimer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimalHouseVisualizer from '../../shared/AnimalHouseVisualizer'
import type { AnimalHouseConfig } from '../../shared/AnimalHouseVisualizer'
import AnimalHousePriceCalculator from '../../shared/AnimalHousePriceCalculator'
import RelatedProducts from '../../shared/RelatedProducts'
import { useSEO } from '../../../hooks/useSEO'
import { useProductBySlug } from '../../../hooks/useProducts'
import { productJsonLd } from '../../../utils/productJsonLd'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

const KATTEHUS_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'nb-NO',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvorfor kattehus på stolpe?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En stolpe løfter huset opp fra bakken slik at det holder seg tørt, gir katten oversikt og trygghet, og holder uønsket besøk unna. Du velger selv stolpehøyden i konfiguratoren.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan kattehuset isoleres for vinterbruk?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Vi kan bygge kattehuset isolert på forespørsel, med isolerte vegger, gulv og tak for et varmere uteliggested. Ta kontakt, så finner vi riktig løsning.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hvor leveres kattehuset fra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alle kattehus bygges for hånd i Lillehammer. Vi leverer i Innlandet og store deler av Østlandet – be om pris ved bestilling.',
      },
    },
  ],
}

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
    font-size: 2.5rem;
    margin: 0 0 1rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.7rem;
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
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
`

const Article = styled.article`
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
  }

  p {
    font-size: 1.08rem;
    line-height: 1.75;
    margin-bottom: 1.1rem;
    color: #3f3f3f;
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
    order: 2;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
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
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const DEFAULT_BASE_PRICE = 1690

export default function KattehusPage() {
  const { data: product } = useProductBySlug('kattehus')
  const [config, setConfig] = useState<AnimalHouseConfig>({
    width: 40,
    depth: 40,
    height: 40,
    roof: 'panel',
    finish: 'natural',
    entrance: 'hole',
    poleHeight: 90,
  })

  const baseJsonLd = product ? productJsonLd(product, '/produkter/kattehus') : []

  useSEO({
    title: 'Kattehus på stolpe i tre – tegn i 3D | Minio',
    description:
      'Skreddersydd kattehus i tre på stolpe – trygt og tørt over bakken. Tegn det i 3D, velg stolpehøyde, tak og finish, og se prisen med en gang.',
    keywords:
      'kattehus i tre, kattehus på stolpe, håndlaget kattehus, utekattehus, kattehus etter mål',
    ogImage: '/images/products/kattehus.webp',
    ogImageAlt: 'Håndlaget kattehus i tre på stolpe med vindusåpning, ubehandlet furu',
    jsonLd: [...baseJsonLd, KATTEHUS_FAQ],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Kattehus på stolpe i tre</h1>
            <p>Tegn kattehuset i 3D – velg mål, stolpehøyde, tak og finish, og se prisen med en gang.</p>
          </Hero>

          <Content>
            <Container>
              <Article>
                <h2>Et trygt utested for katten – hevet over bakken</h2>
                <p>
                  Vi bygger hvert kattehus for hånd i Lillehammer og monterer det på stolpe, slik
                  at katten får et <strong>tørt og trygt sted med god oversikt</strong>. Du velger
                  selv både husets mål og hvor høyt det skal stå.
                </p>

                <h3>Tilpass etter katten din</h3>
                <ul>
                  <li><strong>Innvendige mål</strong> – bredde, dybde og høyde</li>
                  <li><strong>Stolpehøyde</strong> – hvor høyt over bakken huset skal stå</li>
                  <li><strong>Tak</strong> – panel eller takpapp</li>
                  <li><strong>Overflate</strong> – ubehandlet, grunnet eller ferdig malt</li>
                </ul>

                <h3>Stødig og værbestandig</h3>
                <p>
                  Huset står på en solid stolpe med base, og en rund inngang slipper katten inn og
                  ut. Huset bygges i solid tre med liggende kledning, og saltak gir god avrenning
                  året rundt.
                </p>

                <p>
                  Bruk konfiguratoren til høyre for å se kattehuset i 3D mens du justerer – prisen
                  oppdaterer seg automatisk.
                </p>
              </Article>

              <Sidebar>
                <AnimalHouseVisualizer {...config} />
                <SidebarTitle>Pris kalkulator</SidebarTitle>
                <AnimalHousePriceCalculator
                  type="Kattehus"
                  basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE}
                  width={{ min: 30, max: 60 }}
                  depth={{ min: 30, max: 55 }}
                  height={{ min: 30, max: 55 }}
                  volumeCostFactor={0.006}
                  finishPrices={{ primed: 350, painted: 700 }}
                  roofPrices={{ felt: 250 }}
                  showPole
                  pole={{ min: 60, max: 160 }}
                  polePricePerCm={14}
                  onConfigChange={setConfig}
                />
              </Sidebar>
            </Container>

            <RelatedProducts currentSlug="kattehus" />
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
