import { useState, useCallback } from 'react'
import styled from 'styled-components'
import SoppelboderPriceCalculator from './SoppelboderPriceCalculator'
import SoppelboderThreeVisualizer from './SoppelboderThreeVisualizer'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import { useSEO } from '../../../hooks/useSEO'
import { useProductBySlug } from '../../../hooks/useProducts'
import RelatedProducts from '../../shared/RelatedProducts'

const Hero = styled.section`
  min-height: 50vh;
  background-image: url('/images/products/garbage_house_4.webp');
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
  padding: 0 0 0 2rem;
  height: fit-content;
  position: sticky;
  top: 100px;
  border-left: 1px solid #e0e0e0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    position: static;
    padding: 0;
    padding-bottom: 2rem;
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
    stars: 4,
    text: 'Veldig solid og flott søppelbod! Eneste minus er at jeg bestilte den litt for trangt tilpasset de gamle dunkene, og da kommunen byttet til litt større dunker ble det stramt. Min egen feil – skulle hatt litt mer margin. Skulle ønske det var enkelt å utvide bredden i etterkant. Det kunne vært billigere, men angrer ikke med tanke på leveringstid og kvalitet.',
    author: 'Thomas R.',
    location: 'Gjøvik',
  },
  {
    stars: 5,
    text: 'Vi sendte fargekoden til huset vårt til Minio, og søppelboden passet umiddelbart sømløst inn med resten av fasaden. Det ser ut som den alltid har stått der! Naboene sluttet også å bruke dunkene våre til hundebæsjposer med en gang boden var på plass. Verdt hver krone.',
    author: 'Marte S.',
    location: 'Hamar',
  },
  {
    stars: 5,
    text: 'Vi bestilte med impregnert tre og belysning. Resultatet ble langt over forventning – ser eksklusivt ut og føles som et solid håndverksprodukt. Hyggelige samtaler og høy tillitsverdi. Anbefales på det sterkeste.',
    author: 'Erik og Line',
    location: 'Ringebu',
  },
]

interface VisualizerConfig {
  width: number
  height: number
  depth: number
  binCount: number
  doorType: string
  finish: string
  roof: string
}

const DEFAULT_BASE_PRICE = 7900

export default function SoppelboderPage() {
  const { data: product } = useProductBySlug('soppelboder')
  const [config, setConfig] = useState<VisualizerConfig>({
    width: 305,
    height: 160,
    depth: 60,
    binCount: 4,
    doorType: 'front',
    finish: '0',
    roof: '0',
  })

  const handleConfigChange = useCallback((newConfig: VisualizerConfig) => {
    setConfig(newConfig)
  }, [])

  useSEO({
    title: 'Skreddersydd søppelbod – Minio',
    description: 'Konfigurer og bestill skreddersydd søppelbod i tre. Velg antall dunker, dørtype, finish og tak. Levering fra Lillehammer.',
    ogImage: '/images/products/garbage_house_4.webp',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
      <main id="main-content">
        <Hero>
          <HeroContent>
            <h1>Søppelbod</h1>
            <p>Skreddersydd etter dine behov</p>
          </HeroContent>
        </Hero>

        <Content>
          <Container>
            <Article>
              <h2>Uteområdet ditt fortjener bedre</h2>
              <p>
                Du har investert i boligen, hagen og terrassen – men søppeldunkene står
                fortsatt synlige ved veggen. Når været er dårlig blåser de over ende. Folk
                som går forbi synes det er lettvint å kaste hundebæsjposer og annet søppel
                hos deg, og at de synes så godt gjør ikke eiendommen din særlig penere.
                Kjenner du deg igjen? Da kan dette produktet være noe for deg.
              </p>
              <p>
                <strong>En Minio søppelbod forandrer det.</strong> Håndlaget i Norge med
                norske materialer og ekte håndverkskvalitet, skreddersydd millimeter for
                millimeter etter dine mål, og designet for å gjøre det mest oversette
                hjørnet av eiendommen til noe du faktisk er stolt av.
              </p>

              <h3>Gjennomtenkt ned til siste detalj</h3>
              <p>
                Hver søppelbod er konstruert med <strong>tilgang fra baksiden</strong>. Det
                betyr at dunkene dine er fullstendig skjermet fra gaten – lokkene blåser
                ikke av i storm, dyr kommer seg ikke til, og forbipasserende tenker seg om
                to ganger før de kaster hundebæsjposer i noen andres lukkede bod. Det er
                en enkel løsning som fjerner et hverdagsproblem de fleste bare har lært seg
                å leve med.
              </p>

              <h3>Helt og holdent din</h3>
              <p>Hver eneste detalj kan tilpasses:</p>
              <ul>
                <li><strong>Antall dunker</strong> – Fra én enkelt dunk til fem på rad, nøyaktig som du trenger</li>
                <li><strong>Presise mål</strong> – Bredde, høyde og dybde skreddersydd etter dine dunker og plassen du har til rådighet</li>
                <li><strong>Konstruksjon</strong> – Velg mellom hvittre eller impregnert tre. Impregnert gir bedre holdbarhet mot råte og fukt, og legger til 20 % på totalprisen</li>
                <li><strong>Overflatebehandling</strong> – Ubehandlet, grunnet eller grunnet og malt i ønsket farge</li>
                <li><strong>Tak</strong> – Panel, takpapp eller impregnert – tilpasset boligens stil</li>
                <li><strong>Kvalitet</strong> – Standard eller forsterket utførelse med tykkere vegger for ekstra holdbarhet</li>
                <li><strong>Levering og montering</strong> – Vi leverer og monterer på stedet om du ønsker</li>
              </ul>

              <h3>Belysning som tilvalg</h3>
              <p>
                Velger du belysning, anbefaler vi <strong>én downlight innvendig per dunk</strong> –
                slik at du alltid har god sikt når du åpner boden. Vi kan også montere
                <strong> utvendig belysning</strong> om ønskelig. Alt leveres med
                <strong> skumringsrelé</strong>, slik at lyset slår seg på automatisk når
                det blir mørkt. Hele oppsettet er ferdig koblet og klart for tilkobling til strøm.
              </p>

              <h3>Bygget for å tåle alt</h3>
              <p>
                Norsk vær er brutalt – det vet vi bedre enn de fleste. Derfor bygges hver
                søppelbod med <strong>solide materialer, gjennomtenkt ventilasjon og en
                konstruksjon som står fjellstøtt</strong> gjennom regn, snø, is og vind.
                År etter år. Dette er ikke et produkt du bytter ut – det er et produkt som
                varer.
              </p>

              <h3>Viktig om fundament</h3>
              <p>
                Prisen inkluderer ikke fundamentet søppelboden skal stå på. Dette kan du
                bygge selv, eller så kan vi hjelpe deg – men det krever en egen
                vurdering basert på underlag og plassering. Ta kontakt så finner vi den
                beste løsningen sammen.
              </p>
            </Article>

            <Sidebar>
              <SoppelboderThreeVisualizer
                width={config.width}
                height={config.height}
                depth={config.depth}
                binCount={config.binCount}
                doorType={config.doorType}
                finish={config.finish}
                roof={config.roof}
                onConfigChange={setConfig}
              />
              <SidebarTitle>Pris kalkulator</SidebarTitle>
              <SoppelboderPriceCalculator basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE} onConfigChange={handleConfigChange} />
            </Sidebar>
          </Container>

          <RelatedProducts currentSlug="soppelboder" />

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
        </Content>
      </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
