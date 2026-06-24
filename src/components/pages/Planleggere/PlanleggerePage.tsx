import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

interface Planlegger {
  slug: string
  navn: string
  ingress: string
  tagline: string
  bilde: string
  alt: string
  /** Bruk 'contain' for modellrenders på hvit bakgrunn så hele konstruksjonen vises. */
  bildeFit?: 'cover' | 'contain'
  punkter: { icon: string; tekst: string }[]
}

const PLANLEGGERE: Planlegger[] = [
  {
    slug: 'terrasse',
    navn: 'Terrasseplanlegger',
    tagline: 'Terrasse · veranda · platting',
    bilde: '/images/planleggere/terrasse.webp',
    alt: 'L-formet terrasse i tre med rekkverk og trapp, tegnet i Minios terrasseplanlegger',
    ingress:
      'Tegn terrassen i 3D – velg form (rektangel, L-form eller U-form), legg til rekkverk og trapp, og få komplett materialliste med antall bord, bjelker og skruer.',
    punkter: [
      { icon: 'faRulerCombined', tekst: 'Rundt 1, 2 eller 3 sider av huset' },
      { icon: 'faSquare', tekst: 'Rekkverk og trapp' },
      { icon: 'faDownload', tekst: 'Materialliste som PDF' },
    ],
  },
  {
    slug: 'pergola',
    navn: 'Pergolaplanlegger',
    tagline: 'Frittstående · veggmontert',
    bilde: '/images/planleggere/pergola.webp',
    alt: 'Frittstående pergola i tre med stolper, dragere og spær, tegnet i Minios pergolaplanlegger',
    ingress:
      'Tegn pergolaen i 3D – velg montering, tak (lekter, spjeld eller tett) og sideskjerm, og få komplett materialliste med stolper, dragere, spær og beslag.',
    punkter: [
      { icon: 'faTree', tekst: 'Frittstående eller veggmontert' },
      { icon: 'faSquare', tekst: 'Tak, spjeld og sideskjerm' },
      { icon: 'faDownload', tekst: 'Materialliste som PDF' },
    ],
  },
  {
    slug: 'carport',
    navn: 'Carportplanlegger',
    tagline: 'Tak · snølast · byggeregler',
    bilde: '/images/planleggere/carport.webp',
    alt: 'Frittstående carport i tre med saltak og bærekonstruksjon, tegnet i Minios carportplanlegger',
    bildeFit: 'contain',
    ingress:
      'Tegn carporten i 3D – velg takform og takvinkel, taktekke og vegger med akrylvinduer. Solid konstruksjon med tverrbjelker og knebånd, snølast-dimensjonering og status mot norske byggeregler.',
    punkter: [
      { icon: 'faSquare', tekst: 'Flatt, pulttak eller saltak' },
      { icon: 'faClipboardList', tekst: 'Snølast og byggeregler' },
      { icon: 'faDownload', tekst: 'Materialliste som PDF' },
    ],
  },
]

const PLANLEGGERE_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://minio.no/planleggere#page',
    name: 'Planleggere – tegn uteprosjektet i 3D',
    url: 'https://minio.no/planleggere',
    inLanguage: 'nb-NO',
    description:
      'Minios gratis 3D-planleggere for uteprosjekter i tre: terrasse, veranda, platting, pergola og carport. Tegn i 3D, få materialliste og prisestimat.',
    isPartOf: { '@id': 'https://minio.no/#website' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Planleggere fra Minio',
    itemListElement: PLANLEGGERE.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.navn,
      url: `https://minio.no/planleggere/${p.slug}`,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
      { '@type': 'ListItem', position: 2, name: 'Planleggere', item: 'https://minio.no/planleggere' },
    ],
  },
]

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
    font-size: 2.6rem;
    margin: 0 0 1rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.9rem;
    }
  }

  p {
    position: relative;
    z-index: 1;
    font-size: 1.15rem;
    max-width: 640px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Content = styled.section`
  padding: 4rem 2rem 5rem;
  background: ${({ theme }) => theme.colors.lightBg};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem 3.5rem;
  }
`

const Grid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`

const Card = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.12);
  }

  &:hover .thumb img {
    transform: scale(1.04);
  }

  .tagline {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 0.4rem;
  }

  h2 {
    font-size: 1.4rem;
    margin: 0 0 0.75rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  .ingress {
    font-size: 0.92rem;
    line-height: 1.6;
    color: #555;
    margin: 0 0 1.25rem;
  }
`

const Thumb = styled.div<{ $contain?: boolean }>`
  border-radius: 12px;
  overflow: hidden;
  background: ${({ $contain }) =>
    $contain ? '#ffffff' : 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)'};
  aspect-ratio: 4 / 3;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: ${({ $contain }) => ($contain ? 'contain' : 'cover')};
    object-position: center;
    padding: ${({ $contain }) => ($contain ? '0.5rem' : '0')};
    display: block;
    transition: transform 0.3s ease;
  }
`

const Punkter = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.88rem;
    color: #444;

    svg {
      color: ${({ theme }) => theme.colors.textDark};
      opacity: 0.65;
      flex-shrink: 0;
    }
  }
`

const OpenLink = styled(Link)`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.8rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

export default function PlanleggerePage() {
  useSEO({
    title: 'Planleggere – tegn terrasse, pergola og carport i 3D | Minio',
    description:
      'Minios gratis 3D-planleggere for uteprosjekter i tre. Tegn terrasse, veranda, platting, pergola eller carport i 3D, og få komplett materialliste med prisestimat og PDF.',
    keywords:
      'planleggere, terrasseplanlegger, pergolaplanlegger, carportplanlegger, verandaplanlegger, plattingplanlegger, 3D planlegger, materialliste, planlegge uteplass',
    ogImage: '/images/planleggere/terrasse.webp',
    ogImageAlt: 'L-formet terrasse i tre tegnet i Minios 3D-planlegger',
    jsonLd: PLANLEGGERE_JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Planleggere</h1>
            <p>
              Tegn uteprosjektet ditt i 3D, se det ferdig før du bygger, og få en komplett materialliste med
              veiledende prisestimat – helt gratis.
            </p>
          </Hero>

          <Content>
            <Grid>
              {PLANLEGGERE.map((p) => (
                <Card key={p.slug}>
                  <Thumb className="thumb" $contain={p.bildeFit === 'contain'}>
                    <img src={p.bilde} alt={p.alt} loading="lazy" />
                  </Thumb>
                  <div className="tagline">{p.tagline}</div>
                  <h2>{p.navn}</h2>
                  <p className="ingress">{p.ingress}</p>
                  <Punkter>
                    {p.punkter.map((punkt) => (
                      <li key={punkt.tekst}>
                        <Icon name={punkt.icon} /> {punkt.tekst}
                      </li>
                    ))}
                  </Punkter>
                  <OpenLink to={`/planleggere/${p.slug}`}>
                    Åpne {p.navn.toLowerCase()} <Icon name="faArrowRight" />
                  </OpenLink>
                </Card>
              ))}
            </Grid>
          </Content>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
