import { useState, useCallback } from 'react'
import styled from 'styled-components'
import VedskjulPriceCalculator from './VedskjulPriceCalculator'
import VedskjulThreeVisualizer from './VedskjulThreeVisualizer'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import { useSEO } from '../../../hooks/useSEO'
import { useProductBySlug } from '../../../hooks/useProducts'
import RelatedProducts from '../../shared/RelatedProducts'

const Hero = styled.section`
  min-height: 50vh;
  background-image: url('/images/products/fire_wood_shed_1.webp');
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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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
  gap: 4rem;
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
  padding-right: 4rem;

  h2 {
    font-size: 2rem;
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.6rem;
    }
  }

  h3 {
    font-size: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
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

const Sidebar = styled.aside`
  padding: 0;
  height: fit-content;
  position: sticky;
  top: 100px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    position: static;
    padding: 0;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e0e0e0;
    order: 1;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
`

const SidebarTitle = styled.h3`
  font-size: 1.3rem;
  margin-top: 0;
  margin-bottom: 0.75rem;
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

const ReviewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const ReviewCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
`

const ReviewStars = styled.div`
  color: #f5a623;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  letter-spacing: 2px;
`

const ReviewText = styled.p`
  font-size: 0.95rem;
  line-height: 1.7;
  color: #444;
  margin: 0 0 1rem;
  font-style: italic;
`

const ReviewAuthor = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
`

const ReviewLocation = styled.span`
  font-weight: 400;
  color: #999;
`

const ReviewNote = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-top: 1.5rem;
`

const REVIEWS = [
  {
    stars: 5,
    text: 'Endelig et vedskjul som faktisk holder veden tørr! Vi har prøvd presenning og diverse løsninger i årevis, men ingenting slår et ordentlig skjul. Luftingen er gjennomtenkt – veden tørker raskt og er alltid klar til bruk. Veldig fornøyd.',
    author: 'Jorun',
    location: 'Vingrom',
  },
]

interface VisualizerConfig {
  width: number
  height: number
  depth: number
  sectionCount: number
  finish: string
  roof: string
  roofShape: string
  roofDegree: number
  roofSlopeDirection: string
  hasDoor: boolean
}

const DEFAULT_BASE_PRICE = 13900

export default function VedskjulPage() {
  const { data: product } = useProductBySlug('vedskjul')
  const [config, setConfig] = useState<VisualizerConfig>({
    width: 300,
    height: 200,
    depth: 150,
    sectionCount: 1,
    finish: '0',
    roof: '0',
    roofShape: 'flat',
    roofDegree: 15,
    roofSlopeDirection: 'back',
    hasDoor: false,
  })

  const handleConfigChange = useCallback((newConfig: VisualizerConfig) => {
    setConfig(newConfig)
  }, [])

  useSEO({
    title: 'Skreddersydd vedskjul – Minio',
    description: 'Konfigurer og bestill skreddersydd vedskjul i tre. Velg antall seksjoner, finish og tak. Hold veden tørr og tilgjengelig. Levering fra Lillehammer.',
    ogImage: '/images/products/fire_wood_shed_1.webp',
  })

  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero>
          <HeroContent>
            <h1>Vedskjul</h1>
            <p>Skreddersydd etter dine behov</p>
          </HeroContent>
        </Hero>

        <Content>
          <Container>
            <Article>
              <h2>Tørr ved, ryddig eiendom – hele året</h2>
              <p>
                I Norge fyrer vi mye. Kalde vintre, lange kvelder og en vedovn som går for
                fullt fra september til mai. Men for at veden skal gi god varme, må den
                lagres riktig. Fuktig ved brenner dårlig, gir mer røyk, mindre varme og økt
                sotdannelse i pipen. Et gjennomtenkt vedskjul sørger for at veden holder seg
                tørr, får god luftsirkulasjon og er lett tilgjengelig – uansett årstid.
              </p>
              <VedskjulThreeVisualizer
                width={config.width}
                height={config.height}
                depth={config.depth}
                sectionCount={config.sectionCount}
                finish={config.finish}
                roof={config.roof}
                roofShape={config.roofShape}
                roofDegree={config.roofDegree}
                roofSlopeDirection={config.roofSlopeDirection}
                hasDoor={config.hasDoor}
              />

              <p>
                Prinsippet er enkelt: veden trenger luft for å tørke og tak for å holde seg
                tørr. Våre vedskjul er konstruert med åpen front og ventilerte sidevegger
                som gir kontinuerlig luftgjennomstrømning, mens tak og solid bakvegg
                holder nedbøren ute. Når du henter ved en kald januarmorgen, er den tørr,
                lett å tenne og gir maksimal varme – uten røykproblemer eller halvbrent
                ved som ulmer i ovnen.
              </p>

              <h3>Mer enn bare vedlagring</h3>
              <p>
                Trenger du plass til mer enn ved? Velg <strong>to seksjoner</strong> og kombiner
                vedskjulet med en lukket redskapsbod. Den ekstra boden gir skjermet oppbevaring
                for <strong>snøfreser, gressklipper, hageredskaper eller annet utstyr</strong> som
                ellers tar plass i garasjen eller står ubeskyttet ute. Med valgfri dør får du
                enkel tilgang og trygg lagring – alt samlet i én solid konstruksjon.
              </p>

              <h3>Konstruert for god tørking</h3>
              <p>
                Hvert vedskjul er konstruert med <strong>åpen front</strong> for enkel tilgang
                og maksimal luftgjennomstrømning. Baksiden er helt lukket for å beskytte mot
                slagregn og vind, mens sidene har vertikale spiler som slipper luft gjennom
                uten å slippe inn nedbør. Denne kombinasjonen gir optimal tørking – veden
                krymper naturlig, barken løsner, og fuktigheten trekkes ut. Du slipper å
                dra av presenninger, snu vedkubber eller flytte på ting.
              </p>

              <h3>Tilpasset dine behov</h3>
              <p>Hver eneste detalj kan konfigureres:</p>
              <ul>
                <li><strong>Redskapsbod som tilvalg</strong> – Lukket seksjon for snøfreser, gressklipper eller hageredskaper, med valgfri dør</li>
                <li><strong>Presise mål</strong> – Bredde, høyde og dybde skreddersydd etter plassen du har til rådighet</li>
                <li><strong>Takform</strong> – Valmtak eller flatt tak med justerbar takvinkel og fallretning</li>
                <li><strong>Konstruksjon</strong> – Hvittre eller impregnert tre. Impregnert gir bedre holdbarhet mot råte og fukt, og legger til 20 % på totalprisen</li>
                <li><strong>Overflatebehandling</strong> – Ubehandlet, grunnet eller ferdig malt i ønsket farge</li>
                <li><strong>Taktype</strong> – Panel, takpapp eller impregnert – tilpasset boligens stil</li>
                <li><strong>Kvalitet</strong> – Standard eller forsterket utførelse med tykkere materialer for ekstra holdbarhet</li>
                <li><strong>Levering og montering</strong> – Vi leverer og monterer på stedet om du ønsker</li>
              </ul>

              <h3>Bygget for norsk klima</h3>
              <p>
                Fra Lillehammer vet vi hva norsk vær gjør med trekonstruksjoner. Derfor
                bygges hvert vedskjul med <strong>solide materialer, gjennomtenkt
                konstruksjon og en holdbarhet som tåler norske vintre</strong> – år etter år.
                Regn, snø, is, temperatursvingninger og sterk vind er en del av hverdagen.
                Våre vedskjul er konstruert for nettopp det. Dette er ikke et produkt du
                bytter ut – det er et produkt som varer.
              </p>

              <h3>Viktig om fundament</h3>
              <p>
                Prisen inkluderer ikke fundamentet vedskjulet skal stå på. Vi anbefaler
                et plant underlag med god drenering – for eksempel singel, belegningsstein
                eller betongplater. Du kan bygge dette selv, eller så kan vi hjelpe deg med
                en vurdering basert på underlag og plassering. Ta kontakt så finner vi den
                beste løsningen sammen.
              </p>
            </Article>

            <Sidebar>
              <SidebarTitle>Pris kalkulator</SidebarTitle>
              <VedskjulPriceCalculator basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE} onConfigChange={handleConfigChange} />
            </Sidebar>
          </Container>

          <ReviewsSection>
            <ReviewsHeader>
              <h2>Hva kundene sier</h2>
              <p>Tilbakemeldinger fra fornøyde kunder</p>
            </ReviewsHeader>
            <ReviewsGrid>
              {REVIEWS.map((review) => (
                <ReviewCard key={review.author}>
                  <ReviewStars>{'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}</ReviewStars>
                  <ReviewText>«{review.text}»</ReviewText>
                  <ReviewAuthor>
                    {review.author} <ReviewLocation>– {review.location}</ReviewLocation>
                  </ReviewAuthor>
                </ReviewCard>
              ))}
            </ReviewsGrid>
            <ReviewNote>Din tilbakemelding legges ut etter avtale per e-post i etterkant av installasjon.</ReviewNote>
          </ReviewsSection>

          <RelatedProducts currentSlug="vedskjul" />
        </Content>
      </main>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
