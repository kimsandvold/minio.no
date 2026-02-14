import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import { useSEO } from '../../../hooks/useSEO'
import PageTransition from '../../shared/PageTransition'
import SplideCarousel from '../../shared/SplideCarousel'
import PromoRibbon from '../../shared/PromoRibbon'
import { ProductGridCardSkeleton } from '../../shared/ProductSkeleton'
import { useAllProducts } from '../../../hooks/useProducts'

const Hero = styled.section`
  min-height: 30vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 25vh;
    padding: 5rem 1.5rem 2rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Content = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`

const CardImageWrap = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;

  .splide {
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const CardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  h3 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #222;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.88rem;
    line-height: 1.6;
    color: #555;
    margin: 0 0 1rem;
    flex: 1;
  }
`

const CardPrice = styled.div`
  font-weight: 500;
  font-size: 1.2rem;
  color: #2c2c2c;
  letter-spacing: -0.02em;
`

const CardRegularPrice = styled.div`
  font-size: 0.8rem;
  color: #999;
  text-decoration: line-through;
  margin-top: 0.15rem;
`

const DetailsButton = styled(Link)`
  display: block;
  text-align: center;
  padding: 0.75rem 1.5rem;
  margin: 0 1.25rem 1.25rem;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }
`

export default function ProdukterPage() {
  const { data: allProducts, loading } = useAllProducts()

  useSEO({
    title: 'Alle produkter – Minio',
    description: 'Utforsk Minios sortiment av skreddersydde treløsninger – varmepumpehus, søppelboder, postkassestativer, levegger og mer. Håndlaget i Lillehammer.',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
      <main>
        <Hero>
          <HeroContent>
            <h1>Alle produkter</h1>
            <p>Utforsk hele vårt sortiment av skreddersydde produkter i tre. Alt lages på bestilling etter dine mål og ønsker.</p>
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            <Grid>
              {loading
                ? Array.from({ length: 6 }, (_, i) => <ProductGridCardSkeleton key={i} />)
                : allProducts.map(product => (
                    <Card key={product.id}>
                      {product.hasPromoRibbon && <PromoRibbon />}
                      <CardImageWrap>
                        {product.images.length > 1 ? (
                          <SplideCarousel>
                            {product.images.map((img, i) => (
                              <img key={i} src={img.src} alt={img.alt} loading="lazy" />
                            ))}
                          </SplideCarousel>
                        ) : (
                          <img src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
                        )}
                      </CardImageWrap>
                      <CardBody>
                        <h3>{product.title}</h3>
                        <p>{product.shortDescription}</p>
                        <CardPrice>{product.price}</CardPrice>
                        {product.regularPrice && <CardRegularPrice>{product.regularPrice}</CardRegularPrice>}
                      </CardBody>
                      <DetailsButton to={`/produkter/${product.slug}`}>Se detaljer</DetailsButton>
                    </Card>
                  ))}
            </Grid>
          </Container>
        </Content>
      </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
