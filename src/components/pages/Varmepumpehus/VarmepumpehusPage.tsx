import { useState } from 'react'
import styled from 'styled-components'
import PriceCalculator from './PriceCalculator'
import ThreeVisualizer from './ThreeVisualizer'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import { useSEO } from '../../../hooks/useSEO'
import { useProductBySlug } from '../../../hooks/useProducts'
import EngravingBanner from '../../shared/EngravingBanner'

const Hero = styled.section`
  min-height: 50vh;
  background-image: url('/images/products/heating-housing-top.webp');
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
    text: 'Rask levering, ferdig grunnet og montert. Veldig hyggelig og fin utførelse.',
    author: 'Anonym',
    location: 'Vingrom',
  },
  {
    stars: 5,
    text: 'Veldig fin dialog i forkant. Vi utvekslet ideer og jeg fikk tilsendt skisser. Prisen synes jeg var høy, men vi inngikk et kompromiss på utførelsen og fikk et knakende godt tilbud. Ferdigstillelse innen leveringsdato. Anbefaler!',
    author: 'Fred',
    location: 'Ski',
  },
  {
    stars: 5,
    text: 'Hadde kjøpt meg varmepumpe, men fikk ikke kjøpt varmepumpehus som passet noe sted. Etter fin dialog bestilte jeg et ferdig grunnet varmepumpehus. Det var akkurat som bestilt og veldig enkelt å montere på veggen.',
    author: 'Inge',
    location: 'Hamar',
  },
]

interface VisualizerDims {
  width: number
  height: number
  depth: number
  angle: number
  mounting: 'wall' | 'freestanding'
  finish: string
  roof: string
}

const DEFAULT_BASE_PRICE = 6990

export default function VarmepumpehusPage() {
  const { data: product } = useProductBySlug('varmepumpehus')
  const [dims, setDims] = useState<VisualizerDims>({
    width: 70,
    height: 50,
    depth: 40,
    angle: 22,
    mounting: 'wall',
    finish: '0',
    roof: '0',
  })

  useSEO({
    title: 'Skreddersydd varmepumpehus – Minio',
    description: 'Konfigurer og bestill skreddersydd varmepumpehus i tre. Velg mål, finish og tak – se 3D-modell i sanntid. Levering fra Lillehammer.',
    ogImage: '/images/products/heating-housing-top.webp',
  })

  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero>
          <HeroContent>
            <h1>Varmepumpehus</h1>
            <p>Med dine egne mål</p>
          </HeroContent>
        </Hero>

        <Content>
          <Container>
            <Article>
              <h2>Beskyttelse for varmepumpen din</h2>
              <p>
                Et skreddersydd varmepumpehus beskytter varmepumpen din mot vær, vind og mekaniske skader.
                Det forlenger levetiden, reduserer støy og gjør uteområdet penere.
              </p>
              <ThreeVisualizer
                width={dims.width}
                height={dims.height}
                depth={dims.depth}
                angle={dims.angle}
                mounting={dims.mounting}
                finish={dims.finish}
                roof={dims.roof}
              />

              <h3>Tilpass etter dine behov</h3>
              <p>Du velger selv:</p>
              <ul>
                <li><strong>Monteringstype</strong> – Vegghengt eller frittstående med spiler på alle sider</li>
                <li><strong>Mål</strong> – Fra 70×50×40 cm til 200×200×150 cm</li>
                <li><strong>Kvalitet</strong> – Standard eller forsterket utførelse med tykkere vegger</li>
                <li><strong>Tak</strong> – Panel, takpapp eller impregnert</li>
                <li><strong>Overflatebehandling</strong> – Ubehandlet, grunnet eller grunnet og malt</li>
                <li><strong>Levering og montering</strong> – Vi leverer inntil 200 km fra Lillehammer og kan montere for deg</li>
              </ul>

              <h3>Monteringstype</h3>
              <ul>
                <li><strong>Vegghengt</strong> – Har spiler på begge sider og i front. Festes mot husveggen</li>
                <li><strong>Frittstående</strong> – Har spiler på alle 4 sider. Perfekt for varmepumper som står fritt på en flate i hagen eller uteområdet</li>
              </ul>

              <h3>Kvalitetsvalg</h3>
              <ul>
                <li><strong>Standard utførelse</strong> – Solid konstruksjon for normal bruk</li>
                <li><strong>Forsterket utførelse</strong> – Benytter tykkere materiale for ekstra styrke. Anbefales ved store belastninger som tung snø på taket eller ved behov for ekstra holdbarhet</li>
              </ul>

              <h3>Overflatebehandling</h3>
              <ul>
                <li><strong>Ubehandlet</strong> – Du behandler selv med olje, beis eller maling</li>
                <li><strong>Grunnet</strong> – Klar for maling i din ønskede farge</li>
                <li><strong>Grunnet og malt</strong> – Ferdig behandlet og klar til montering</li>
              </ul>

              <h3>Kvalitet som varer</h3>
              <p>
                Bygget med solide materialer som tåler norsk klima. Alle varmepumpehus lages med
                optimale luftspalter for god ventilasjon.
              </p>
            </Article>

            <Sidebar>
              <SidebarTitle>Pris kalkulator</SidebarTitle>
              <PriceCalculator basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE} onDimensionsChange={setDims} />
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

          <EngravingBanner
            heading="Merk varmepumpehuset med husnummer"
            description="Vi graverer husnummer, adresse eller logo direkte på varmepumpehuset ditt – for et personlig og gjennomført uttrykk."
          />
        </Content>
      </main>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
