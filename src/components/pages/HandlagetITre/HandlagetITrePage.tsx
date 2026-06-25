import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { ProductGridCardSkeleton } from '../../shared/ProductSkeleton'
import { useSEO } from '../../../hooks/useSEO'
import { useAllProducts } from '../../../hooks/useProducts'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'

const SITE_URL = 'https://minio.no'

const HANDLAGET_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/handlaget-i-tre#page`,
    name: 'Håndlaget i tre – uteprodukter etter mål',
    url: `${SITE_URL}/handlaget-i-tre`,
    inLanguage: 'nb-NO',
    description:
      'Håndlagde uteprodukter i tre, skreddersydd etter dine mål: plantekasser, varmepumpehus, søppelboder, vedskjul, levegger og mer. Bygget for hånd i Lillehammer.',
    isPartOf: { '@id': `${SITE_URL}/#website` },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Håndlaget i tre', item: `${SITE_URL}/handlaget-i-tre` },
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
      font-size: 1.8rem;
    }
  }

  p {
    position: relative;
    z-index: 1;
    font-size: 1.15rem;
    max-width: 680px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Intro = styled.section`
  background: #fff;
  padding: 4rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem 2rem;
  }
`

const IntroInner = styled.div`
  max-width: 820px;
  margin: 0 auto;

  h2 {
    font-size: 1.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 1.25rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1.08rem;
    line-height: 1.75;
    color: #3f3f3f;
    margin: 0 0 1.1rem;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.3);
    text-underline-offset: 0.18em;
  }

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const Pillars = styled.ul`
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 1rem;
    color: #3f3f3f;
    line-height: 1.5;

    svg {
      margin-top: 0.2rem;
      color: ${({ theme }) => theme.colors.textDark};
      opacity: 0.65;
      flex-shrink: 0;
    }
  }
`

const Products = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem 3rem;
  }
`

const SectionHead = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto 1.75rem;

  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.35rem;
  }

  p {
    font-size: 0.98rem;
    color: #666;
    margin: 0;
  }
`

const Grid = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  }

  .img {
    aspect-ratio: 4 / 3;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .body {
    padding: 1.1rem 1.25rem 1.35rem;
    display: flex;
    flex-direction: column;
    flex: 1;

    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.textDark};
      margin: 0 0 0.35rem;
    }

    p {
      font-size: 0.88rem;
      line-height: 1.55;
      color: #555;
      margin: 0 0 0.85rem;
      flex: 1;
    }

    .price {
      font-size: 1rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.textDark};
    }
  }
`

const CrossLinks = styled.section`
  background: #fff;
  padding: 3rem 2rem 4rem;
  border-top: 1px solid #ececec;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem 3rem;
  }
`

const CrossGrid = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const CrossCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.75rem;
  background: ${({ theme }) => theme.colors.lightBg};
  border: 1px solid #ececec;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: #d4d4d4;
    transform: translateY(-2px);
  }

  svg {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    opacity: 0.7;
    flex-shrink: 0;
  }

  .text {
    strong {
      display: block;
      font-size: 1.05rem;
      color: ${({ theme }) => theme.colors.textDark};
      margin-bottom: 0.2rem;
    }

    span {
      font-size: 0.9rem;
      color: #666;
      line-height: 1.5;
    }
  }
`

export default function HandlagetITrePage() {
  const { data: products, loading } = useAllProducts()

  useSEO({
    title: 'Håndlaget i tre – uteprodukter etter mål | Minio',
    description:
      'Håndlagde uteprodukter i tre, skreddersydd etter dine mål – plantekasser, varmepumpehus, vedskjul, levegger og mer. Bygget for hånd i Lillehammer.',
    keywords:
      'håndlaget i tre, uteprodukter i tre, tre etter mål, skreddersydd i tre, håndlagde treprodukter, spesialbygd i tre, hageprodukter i tre',
    ogImage: '/images/products/plantekasser_4.webp',
    ogImageAlt: 'Håndlaget plantekasse i tre på terrasse',
    jsonLd: HANDLAGET_JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Håndlaget i tre – etter dine mål</h1>
            <p>
              Alt vi lager bygges for hånd i Lillehammer, skreddersydd millimeter for millimeter
              etter plassen din. Ingen standardmål – bare uteprodukter i tre som passer akkurat ditt hjem.
            </p>
          </Hero>

          <Intro>
            <IntroInner>
              <h2>Ekte håndverk, tilpasset deg</h2>
              <p>
                Mye av det du finner i butikkhyllene er masseprodusert i standardmål som sjelden
                passer der du faktisk vil ha det. Vi jobber motsatt: du forteller oss hva du
                trenger, så <strong>bygger vi det for hånd</strong> i solid treverk – tilpasset
                dine mål, din stil og norsk klima.
              </p>
              <p>
                Fra <Link to="/produkter/plantekasser">plantekasser</Link> og{' '}
                <Link to="/produkter/varmepumpehus">varmepumpehus</Link> til{' '}
                <Link to="/produkter/vedskjul">vedskjul</Link> og{' '}
                <Link to="/produkter/levegger">levegger</Link> – alt lages på bestilling og leveres
                ferdig behandlet. Se hvordan vi jobber under{' '}
                <Link to="/slik-jobber-vi">slik jobber vi</Link>.
              </p>
              <Pillars>
                <li><Icon name="faRulerCombined" /> Skreddersydd etter dine mål – ingen standardstørrelser</li>
                <li><Icon name="faTree" /> Solid treverk dimensjonert for norsk vær</li>
                <li><Icon name="faHammer" /> Bygget for hånd i Lillehammer</li>
                <li><Icon name="faPalette" /> Ferdig behandlet i fargen du ønsker</li>
              </Pillars>
            </IntroInner>
          </Intro>

          <Products>
            <SectionHead>
              <h2>Våre produkter i tre</h2>
              <p>Alt lages på bestilling etter dine mål og ønsker.</p>
            </SectionHead>
            <Grid>
              {loading
                ? Array.from({ length: 6 }, (_, i) => <ProductGridCardSkeleton key={i} />)
                : products.map((product) => (
                    <Card key={product.id} to={`/produkter/${product.slug}`}>
                      <div className="img">
                        <img src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
                      </div>
                      <div className="body">
                        <h3>{product.title}</h3>
                        <p>{product.shortDescription}</p>
                        <div className="price">{product.price}</div>
                      </div>
                    </Card>
                  ))}
            </Grid>
          </Products>

          <CrossLinks>
            <SectionHead>
              <h2>Vil du bygge selv?</h2>
              <p>Vi deler kunnskapen vår gratis – guider og 3D-planleggere for uteprosjekter i tre.</p>
            </SectionHead>
            <CrossGrid>
              <CrossCard to="/byggeguider">
                <Icon name="faTools" />
                <div className="text">
                  <strong>Byggeguider</strong>
                  <span>Over 60 guider om trevirke, verktøy, fundament, festemidler og hele byggeprosjekter.</span>
                </div>
              </CrossCard>
              <CrossCard to="/planleggere">
                <Icon name="faRulerCombined" />
                <div className="text">
                  <strong>Planleggere</strong>
                  <span>Tegn terrasse, pergola eller carport i 3D og få komplett materialliste – helt gratis.</span>
                </div>
              </CrossCard>
              <CrossCard to="/byggehjelp">
                <Icon name="faHammer" />
                <div className="text">
                  <strong>Byggehjelp på timen</strong>
                  <span>Står du fast? Leie meg som rådgiver eller ekstra hånd – på stedet eller gjennomgang av tegning.</span>
                </div>
              </CrossCard>
            </CrossGrid>
          </CrossLinks>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
