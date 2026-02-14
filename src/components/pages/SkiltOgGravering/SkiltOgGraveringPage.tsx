import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import SignDesignerModal from '../SignDesigner/SignDesignerModal'
import Icon from '../../shared/Icon'
import PageTransition from '../../shared/PageTransition'
import { useSEO } from '../../../hooks/useSEO'

const Hero = styled.section`
  min-height: 50vh;
  background-image: url('/images/products/mail_box_5_address.webp');
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
    margin-bottom: 0.75rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Content = styled.section`
  background: linear-gradient(135deg, #fff 0, ${({ theme }) => theme.colors.lightBg} 100%);
  padding: 3rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const Intro = styled.div`
  max-width: 760px;
  margin: 0 auto 3rem;
  text-align: center;

  p {
    font-size: 1.05rem;
    line-height: 1.8;
    color: #444;
  }
`

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const ProductCard = styled.div`
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
`

const CardIcon = styled.div`
  font-size: 2rem;
  color: #4a4a4a;
  margin-bottom: 1rem;
`

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.75rem;
`

const CardText = styled.p`
  font-size: 0.95rem;
  line-height: 1.7;
  color: #555;
  margin: 0;
`

const DetailSection = styled.div`
  margin-top: 3rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1rem;
    line-height: 1.8;
    color: #444;
    margin-bottom: 1rem;
    max-width: 760px;
  }
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const FeatureItem = styled.li`
  padding: 1rem 1.25rem;
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 0.95rem;
  line-height: 1.6;
  color: #444;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  strong {
    color: ${({ theme }) => theme.colors.textDark};
    display: block;
    margin-bottom: 0.25rem;
  }
`

const CrossSell = styled.div`
  margin-top: 3rem;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.darkBg};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  color: ${({ theme }) => theme.colors.textLight};
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    text-align: center;
  }

  h3 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.75);
    margin: 0;
    line-height: 1.6;
  }
`

const CrossSellLink = styled(Link)`
  display: inline-block;
  padding: 0.9rem 1.5rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

const CrossSellButton = styled.button`
  display: inline-block;
  padding: 0.9rem 1.5rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

const Cta = styled.div`
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    color: #555;
  }
`

const ContactButton = styled(Link)`
  display: inline-block;
  padding: 0.9rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }
`

const PRODUCTS = [
  {
    icon: 'faHome',
    title: 'Nummerskilt',
    text: 'Skreddersydde husnummerskilt laserskåret i tre. Velg mellom moderne, minimalistisk eller rustikk stil – vi tilpasser design, størrelse og skrifttype etter dine ønsker. Værbehandlet for å tåle norske forhold.',
  },
  {
    icon: 'faTruck',
    title: 'Adresseskilt til postkassestativ',
    text: 'Det perfekte tilbehøret til våre postkassestativer. Vi lager adresseskilt som passer sømløst til stativet ditt – med navn, adresse eller husnummer. Bestill sammen for et helhetlig uttrykk ved innkjørselen.',
  },
  {
    icon: 'faTree',
    title: 'Hytteskilt',
    text: 'Gi hytta et personlig preg med et håndlaget navneskilt i tre. Laserskåret med hyttenavnet, familienavn eller et valgfritt motiv. Et tidløst tillegg til enhver fjellhytte eller sjøbu.',
  },
  {
    icon: 'faHandPointer',
    title: 'Velkomstskilt og dekor',
    text: 'Velkomstskilt til inngangspartiet, hageskilt, eller dekorative elementer til uteområdet. Vi skjærer og graverer i ulike størrelser og stiler – fra enkle tekstskilt til detaljerte motiver.',
  },
  {
    icon: 'faCube',
    title: 'Gravering på Minio-produkter',
    text: 'Legg til en personlig detalj på produktene du bestiller fra oss. Vi kan gravere husnummer, navn eller logo direkte på varmepumpehus, søppelboder og andre Minio-produkter.',
  },
  {
    icon: 'faGears',
    title: 'Spesialtilpassede skilt',
    text: 'Har du en helt egen idé? Vi laserskjærer og graverer etter dine tegninger eller skisser. Firmaprofilering, orienteringsskilt til eiendommen, eller noe helt annet – ta kontakt for en prat.',
  },
]

export default function SkiltOgGraveringPage() {
  const [showDesigner, setShowDesigner] = useState(false)

  useSEO({
    title: 'Skilt og gravering – Minio',
    description: 'Laserskårne nummerskilt, adresseskilt, hytteskilt og dekorative utendørsskilt i tre. Håndlaget i Lillehammer, tilpasset dine ønsker.',
    ogImage: '/images/products/mail_box_5_address.webp',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
      <main>
        <Hero>
          <HeroContent>
            <h1>Skilt og gravering</h1>
            <p>
              Laserskåret i tre, tilpasset ditt hjem. Nummerskilt, adresseskilt, hytteskilt og dekorativ utendørsdekor – alt laget på bestilling fra verkstedet i Lillehammer.
            </p>
          </HeroContent>
        </Hero>

        <Content>
          <Container>
            <Intro>
              <p>
                Vi bruker moderne laserteknikk til å skjære og gravere skilt og dekor i tre. Hvert produkt lages etter dine mål og ønsker, og kan kombineres med våre utendørsprodukter for et gjennomført uttrykk. Bestill et nummerskilt sammen med et postkassestativ, eller få gravert husnummer direkte på varmepumpehuset – mulighetene er mange.
              </p>
            </Intro>

            <ProductGrid>
              {PRODUCTS.map(product => (
                <ProductCard key={product.title}>
                  <CardIcon><Icon name={product.icon} /></CardIcon>
                  <CardTitle>{product.title}</CardTitle>
                  <CardText>{product.text}</CardText>
                </ProductCard>
              ))}
            </ProductGrid>

            <CrossSell>
              <div>
                <h3>Design ditt eget skilt</h3>
                <p>
                  Bruk vår interaktive skiltdesigner til å lage ditt eget skilt. Legg til tekst, former og symboler, og eksporter designet som SVG – klart for laserskjæring.
                </p>
              </div>
              <CrossSellButton onClick={() => setShowDesigner(true)}>
                <Icon name="faPencilRuler" /> Åpne skiltdesigner
              </CrossSellButton>
            </CrossSell>

            <DetailSection>
              <h2>Materialer og teknikk</h2>
              <p>
                Alle skilt og dekorative elementer lages i utvalgte tresorter som tåler utendørs bruk. Vi kombinerer laserskjæring for presise konturer med lasergravering for detaljerte tekster og motiver.
              </p>
              <FeatureList>
                <FeatureItem>
                  <strong>Furu og gran</strong>
                  Lett og rimelig, trykkimpregnert for lang holdbarhet utendørs. Perfekt for rustikke hytteskilt.
                </FeatureItem>
                <FeatureItem>
                  <strong>Eik</strong>
                  Hardt og slitesterkt med vakker åretegning. Ideelt for nummerskilt og adresseskilt med lang levetid.
                </FeatureItem>
                <FeatureItem>
                  <strong>MDF / Finér</strong>
                  Jevn overflate som gir skarpe snitt og tydelig gravering. Egner seg godt for malte skilt i moderne stil.
                </FeatureItem>
                <FeatureItem>
                  <strong>Overflatebehandling</strong>
                  Ubehandlet, oljet, beiset eller malt – du velger utseendet. Vi anbefaler utendørsolje eller beis for skilt som står eksponert for vær og vind.
                </FeatureItem>
              </FeatureList>
            </DetailSection>

            <CrossSell>
              <div>
                <h3>Kombiner med postkassestativ</h3>
                <p>
                  Bestill et adresseskilt sammen med et av våre skreddersydde postkassestativer og få et helhetlig, gjennomført uttrykk ved innkjørselen. Vi tilpasser skiltets størrelse og stil til stativet.
                </p>
              </div>
              <CrossSellLink to="/produkter/postkassestativer">
                Se postkassestativer
              </CrossSellLink>
            </CrossSell>

            <Cta>
              <h3>Har du en idé?</h3>
              <p>Send oss en melding med dine ønsker – vi gir deg et uforpliktende prisforslag og skisse.</p>
              <ContactButton to="/kontakt">
                <Icon name="faEnvelope" /> Ta kontakt
              </ContactButton>
            </Cta>
          </Container>
        </Content>
      </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
      <SignDesignerModal isOpen={showDesigner} onClose={() => setShowDesigner(false)} />
    </>
  )
}
