import { useState, useCallback } from 'react'
import styled from 'styled-components'
import PostkassePriceCalculator from './PostkassePriceCalculator'
import PostkasseThreeVisualizer from './PostkasseThreeVisualizer'
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
  background-image: url('/images/products/mail_box_3.webp');
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

const ReviewNote = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-top: 1rem;
`

interface VisualizerConfig {
  width: number
  height: number
  depth: number
  mailboxCount: number
  finish: string
  roof: string
  hasNumberPanel: boolean
}

const DEFAULT_BASE_PRICE = 7490

export default function PostkasseStativPage() {
  const { data: product } = useProductBySlug('postkassestativer')
  const [config, setConfig] = useState<VisualizerConfig>({
    width: 170,
    height: 140,
    depth: 60,
    mailboxCount: 4,
    finish: '0',
    roof: '0',
    hasNumberPanel: false,
  })

  const handleConfigChange = useCallback((newConfig: VisualizerConfig) => {
    setConfig(newConfig)
  }, [])

  useSEO({
    title: 'Skreddersydd postkassestativ i tre – Minio',
    description: 'Skreddersydd postkassestativ i tre for borettslag, sameie og felles innkjørsler. Plass til 1–8 postkasser med pakkehylle, belysning og husnummer. Håndlaget i Lillehammer.',
    ogImage: '/images/products/mail_box_3.webp',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
      <main id="main-content">
        <Hero>
          <HeroContent>
            <h1>Postkassestativ</h1>
            <p>Skreddersydd etter dine behov</p>
          </HeroContent>
        </Hero>

        <Content>
          <Container>
            <Article>
              <h2>Gi innkjørselen et gjennomført uttrykk</h2>
              <p>
                I borettslag, sameier og rekkehusområder samles ofte postkassene på ett felles punkt.
                Et skreddersydd postkassestativ i tre gir et ryddig, helhetlig inntrykk ved innkjørselen
                og sørger for at post og pakker håndteres på en ordentlig måte. Hvert stativ bygges
                for hånd etter dine mål og tilpasses antall enheter, tilgjengelig plass og ønsket design.
              </p>

              <h3>Ideelt for felles innkjørsler</h3>
              <p>
                Mange borettslag og sameier sliter med rotete postkasseløsninger – løse stativer
                som velter, misfarget plast eller slitte metallkonstruksjoner som trekker ned
                helhetsinntrykket. Et skreddersydd postkassestativ i tre løser dette problemet.
                Stativet tilpasses eksakt antall postkasser for borettslaget eller sameiet,
                fra 2 til 8 enheter, og gir et gjennomført, representativt uttrykk som
                alle beboere kan være stolte av.
              </p>

              <h3>Praktisk pakkehylle for beboere</h3>
              <p>
                Under postkassene er det et romslig, åpent hyllerom som gir plass til pakker
                som skal sendes, leveranser som ikke får plass i postkassen, eller andre ting
                beboerne ønsker å oppbevare lett tilgjengelig. Rommet er tilpasset bredden på stativet
                og delt opp med skillevegger for ryddig organisering – en funksjon som er spesielt
                nyttig i borettslag og sameier med mange leveranser.
              </p>

              <h3>Skreddersydd for ditt borettslag</h3>
              <p>
                Bruk priskalkulatoren til høyre for å sette sammen et stativ som passer ditt
                borettslag, sameie eller felles innkjørsel. Du velger selv:
              </p>
              <ul>
                <li><strong>Antall postkasser</strong> – Plass til 1 til 8 postkasser. Bredden justeres automatisk, eller du kan stille den inn manuelt.</li>
                <li><strong>Mål</strong> – Bredde, høyde og dybde tilpasses dine postkasser og tilgjengelig plass.</li>
                <li><strong>Konstruksjon</strong> – Velg mellom hvitt treverk eller trykkimpregnert for ekstra holdbarhet mot råte og fukt.</li>
                <li><strong>Overflatebehandling</strong> – Ubehandlet, grunnet eller ferdig grunnet og malt.</li>
                <li><strong>Taktype</strong> – Paneltak, takpapp eller impregnert tak.</li>
                <li><strong>Skilt</strong> – Legg til husnummer, adresseskilt eller annen gravering. Design selv i skiltdesigneren.</li>
                <li><strong>Belysning</strong> – Lysinstallasjon per postkasse for god synlighet hele året.</li>
                <li><strong>Levering</strong> – Vi leverer inntil 200 km fra Lillehammer. Avstandsbasert pris beregnes automatisk.</li>
                <li><strong>Montering</strong> – Vi setter opp stativet ferdig på stedet.</li>
              </ul>

              <h3>Populært valg for styret</h3>
              <p>
                For styret i borettslag og sameier er et felles postkassestativ en enkel
                oppgradering som hever standarden på fellesarealet. Det er en investering
                som alle beboere drar nytte av, og som gjør inngangspartiet mer innbydende
                for både beboere og besøkende. Vi leverer gjerne til hele borettslaget
                med montering inkludert.
              </p>

              <h3>Overflatebehandling</h3>
              <ul>
                <li><strong>Ubehandlet</strong> – Naturlig tre som du behandler selv med olje, beis eller maling.</li>
                <li><strong>Grunnet</strong> – Klargjort for maling i din ønskede farge.</li>
                <li><strong>Grunnet og malt</strong> – Ferdig behandlet og klar til montering.</li>
              </ul>

              <h3>Materialvalg</h3>
              <p>
                Du kan velge mellom hvitt treverk og trykkimpregnert tre. Impregnert tre gir
                vesentlig bedre motstand mot råte og fukt, og er et godt valg for borettslag
                og sameier der stativet skal stå eksponert for vær og vind uten ekstra
                overflatebehandling.
              </p>

              <h3>Bygget for norsk klima</h3>
              <p>
                Alle postkassestativer fra Minio bygges med solide materialer og gjennomtenkt
                konstruksjon for å tåle norsk klima. Saltede vinterveier, regn og sterk sol
                setter krav til både materialvalg og utførelse. Vi bruker kraftige hjørnestolper,
                valmtak med takutstikk og grundig overflatebehandling for å sikre lang levetid
                – uansett om stativet står i et borettslag i Oslo, et sameie i Bergen eller
                et rekkehusområde på Lillehammer.
              </p>
            </Article>

            <Sidebar>
              <PostkasseThreeVisualizer
                width={config.width}
                height={config.height}
                depth={config.depth}
                mailboxCount={config.mailboxCount}
                finish={config.finish}
                roof={config.roof}
                hasNumberPanel={config.hasNumberPanel}
                onConfigChange={setConfig}
              />
              <SidebarTitle>Pris kalkulator</SidebarTitle>
              <PostkassePriceCalculator basePrice={product?.basePrice ?? DEFAULT_BASE_PRICE} onConfigChange={handleConfigChange} />
            </Sidebar>
          </Container>

          <RelatedProducts currentSlug="postkassestativer" />

          <ReviewsSection>
            <ReviewsHeader>
              <h2>Hva kundene sier</h2>
              <p>Ingen tilbakemeldinger ennå</p>
            </ReviewsHeader>
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
