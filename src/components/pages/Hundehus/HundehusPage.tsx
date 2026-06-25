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

const HUNDEHUS_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'nb-NO',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Hvilken størrelse trenger jeg til hunden?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hundehuset bør være litt lengre enn hunden er lang, og høyt nok til at den kan snu seg. Bruk konfiguratoren til å sette innvendige mål – vi gir gjerne råd om du er usikker.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kan hundehuset isoleres for vinterbruk?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja. Vi kan bygge hundehuset isolert på forespørsel, med isolerte vegger, gulv og tak for et varmere liggemiljø om vinteren. Ta kontakt, så finner vi riktig løsning.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hvor leveres hundehuset fra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alle hundehus bygges for hånd i Lillehammer. Vi leverer i Innlandet og store deler av Østlandet – be om pris ved bestilling.',
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

const DEFAULT_BASE_PRICE = 2490

export default function HundehusPage() {
  const { data: product } = useProductBySlug('hundehus')
  const [config, setConfig] = useState<AnimalHouseConfig>({
    width: 60,
    depth: 60,
    height: 55,
    roof: 'panel',
    finish: 'natural',
    entrance: 'door',
  })

  const baseJsonLd = product ? productJsonLd(product, '/produkter/hundehus') : []

  useSEO({
    title: 'Hundehus i tre etter mål – tegn i 3D | Minio',
    description:
      'Skreddersydd hundehus i tre, bygget etter hundens mål. Tegn det i 3D, velg tak og finish, og se prisen med en gang. Håndlaget i Lillehammer.',
    keywords:
      'hundehus i tre, håndlaget hundehus, hundehus etter mål, hundehus med saltak, hundebod',
    ogImage: '/images/products/hundehus.webp',
    ogImageAlt: 'Håndlaget hundehus i tre med saltak, ubehandlet furu',
    jsonLd: [...baseJsonLd, HUNDEHUS_FAQ],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Hundehus i tre etter mål</h1>
            <p>Tegn hundehuset i 3D – velg mål, tak og finish, og se prisen med en gang.</p>
          </Hero>

          <Content>
            <Container>
              <Article>
                <h2>Et tørt og lunt sted for hunden</h2>
                <p>
                  Vi bygger hvert hundehus for hånd i Lillehammer, tilpasset hundens mål. Et hus
                  som er <strong>akkurat passe stort</strong> holder bedre på varmen enn et som er
                  for romslig – derfor lar vi deg sette de innvendige målene selv.
                </p>

                <h3>Derfor bør hunden ha sitt eget hus</h3>
                <p>
                  En hund som er mye ute trenger et sted som er sitt eget – et fast punkt der den
                  kan trekke seg tilbake, hvile og føle seg trygg. Et godt hundehus gir mer enn
                  bare tak over hodet:
                </p>
                <ul>
                  <li><strong>Ly for vær og vind</strong> – beskyttelse mot regn, snø, sol og trekk gjennom hele året</li>
                  <li><strong>Varme på kalde dager</strong> – en hevet gulvkonstruksjon løfter hunden vekk fra kald, fuktig bakke</li>
                  <li><strong>Trygghet og ro</strong> – et eget «hi» gir hunden en fast plass og demper stress og uro</li>
                  <li><strong>Egen sone ute</strong> – hunden kan være mer ute uten å bli liggende rett på terrassen eller bakken</li>
                  <li><strong>Renere uteplass</strong> – et fast liggested samler hår, pels og skitt på ett sted</li>
                </ul>
                <p>
                  For hunder som lever ute, eller som tilbringer lange økter i hagen, er et
                  skikkelig hundehus forskjellen på en kald, våt liggeplass og et tørt, lunt sted
                  som faktisk blir brukt.
                </p>

                <h3>Tilpass etter hunden din</h3>
                <ul>
                  <li><strong>Innvendige mål</strong> – bredde, dybde og høyde etter hundens størrelse</li>
                  <li><strong>Tak</strong> – panel eller takpapp</li>
                  <li><strong>Overflate</strong> – ubehandlet, grunnet eller ferdig malt</li>
                </ul>

                <h3>Bygget for norsk klima</h3>
                <p>
                  Husene bygges i solid tre med liggende kledning som tåler norsk vær. Saltak gir
                  god avrenning, og en hevet, ventilert gulvkonstruksjon holder liggeplassen tørr
                  også når underlaget er fuktig.
                </p>

                <p>
                  Bruk konfiguratoren til høyre for å se hundehuset i 3D mens du justerer – prisen
                  oppdaterer seg automatisk.
                </p>
              </Article>

              <Sidebar>
                <AnimalHouseVisualizer {...config} />
                <SidebarTitle>Pris kalkulator</SidebarTitle>
                <AnimalHousePriceCalculator
                  type="Hundehus"
                  basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE}
                  width={{ min: 40, max: 120 }}
                  depth={{ min: 40, max: 120 }}
                  height={{ min: 35, max: 90 }}
                  volumeCostFactor={0.004}
                  finishPrices={{ primed: 600, painted: 1200 }}
                  roofPrices={{ felt: 300 }}
                  onConfigChange={setConfig}
                />
              </Sidebar>
            </Container>

            <RelatedProducts currentSlug="hundehus" />
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
