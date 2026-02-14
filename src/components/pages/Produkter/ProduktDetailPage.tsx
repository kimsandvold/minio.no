import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import { useSEO } from '../../../hooks/useSEO'
import SplideCarousel from '../../shared/SplideCarousel'
import { ProductDetailSkeleton } from '../../shared/ProductSkeleton'
import { useProductBySlug } from '../../../hooks/useProducts'
import RelatedProducts from '../../shared/RelatedProducts'

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

const ProductLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

const ImageWrap = styled.div`
  width: 100%;

  .splide {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
    border-radius: 8px;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Price = styled.div`
  font-size: 1.8rem;
  font-weight: 500;
  color: #2c2c2c;
  letter-spacing: -0.02em;
`

const RegularPrice = styled.div`
  font-size: 0.9rem;
  color: #999;
  text-decoration: line-through;
  margin-top: 0.15rem;
`

const Details = styled.div`
  line-height: 1.7;
  color: #333;

  h3 { display: none; }
  h4 { margin: 1.5rem 0 0.5rem; font-size: 1.1rem; }
  ul { padding-left: 1.5rem; margin: 0.5rem 0; }
  li { margin-bottom: 0.3rem; }
  p { margin: 0.75rem 0; }
`

const ContactButton = styled.a`
  display: inline-block;
  align-self: flex-start;
  margin-top: 1rem;
  padding: 0.9rem 2rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: #333;
    transform: translateY(-2px);
  }
`

export default function ProduktDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: product, loading } = useProductBySlug(slug)

  useSEO({
    title: product ? `${product.title} – Minio` : 'Produkt – Minio',
    description: product ? product.shortDescription : 'Utforsk skreddersydde treløsninger fra Minio – håndlaget i Lillehammer.',
    ogImage: product?.images[0]?.src,
  })

  useEffect(() => {
    if (!loading && !product) {
      navigate('/produkter', { replace: true })
    }
  }, [product, loading, navigate])

  if (loading) {
    return (
      <>
        <Navbar />
        <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <h1>&nbsp;</h1>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              <ProductDetailSkeleton />
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

  if (!product) return null

  const contactHref = `/kontakt?subject=${encodeURIComponent(product.title)}`

  return (
    <>
      <Navbar />
      <PageTransition>
      <main>
        <Hero>
          <HeroContent>
            <h1>{product.title}</h1>
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            <ProductLayout>
              <ImageWrap>
                {product.images.length > 1 ? (
                  <SplideCarousel>
                    {product.images.map((img, i) => (
                      <img key={i} src={img.src} alt={img.alt} loading="lazy" />
                    ))}
                  </SplideCarousel>
                ) : (
                  <img src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
                )}
              </ImageWrap>
              <Info>
                <Price>{product.price}</Price>
                {product.regularPrice && <RegularPrice>{product.regularPrice}</RegularPrice>}
                {/* Content sourced from our own static products.json at build time */}
                <Details dangerouslySetInnerHTML={{ __html: product.detailsHtml }} />
                <ContactButton href={contactHref}>Ta kontakt for tilbud</ContactButton>
              </Info>
            </ProductLayout>

            <RelatedProducts currentSlug={slug ?? ''} />
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
