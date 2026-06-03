import { Link } from 'react-router-dom'
import styled from 'styled-components'
import SplideCarousel from '../../shared/SplideCarousel'
import Icon from '../../shared/Icon'
import { FeaturedProductSkeleton } from '../../shared/ProductSkeleton'
import { useFeaturedProducts } from '../../../hooks/useProducts'

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Wrapper = styled.div`
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: 8px;
  }
`

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const CAMPAIGN_RED = '#c0392b'

const ImageWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;

  .splide {
    height: 100%;
  }

  .splide__track, .splide__list, .splide__slide {
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 1024px) {
    aspect-ratio: 16 / 10;
  }
`

const CornerRibbon = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 2;
  background: ${CAMPAIGN_RED};
  color: #fff;
  padding: 0.5rem 0.9rem;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(192, 57, 43, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;

  strong {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  small {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.95;
    margin-top: 0.2rem;
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.75rem 1.75rem 1.75rem 2rem;
  gap: 0.5rem;

  h3 {
    font-size: 1.4rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0;
    line-height: 1.2;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.9rem 0.6rem 1rem;
    h3 { font-size: 1.2rem; }
  }
`

const Description = styled.p`
  font-size: 0.9rem;
  line-height: 1.55;
  color: #555;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.4rem;
  padding: 0.6rem 0.8rem;
  background: #fdf6f4;
  border-left: 3px solid ${CAMPAIGN_RED};
  border-radius: 4px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.55rem 0.65rem;
  }
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const Price = styled.span`
  font-size: 1.55rem;
  font-weight: 700;
  color: ${CAMPAIGN_RED};
  letter-spacing: -0.02em;
  line-height: 1.1;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.3rem;
  }
`

const RegularPrice = styled.span`
  font-size: 0.9rem;
  color: #888;
  text-decoration: line-through;
`

const ReadMoreLink = styled(Link)`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1.6rem;
  font-size: 0.85rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: all 0.3s ease;
  margin-top: 0.5rem;

  &:hover {
    background: #333;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-self: stretch;
    width: 100%;
    padding: 0.9rem 1.6rem;
  }
`

export default function FeaturedProduct() {
  const { data: products, loading } = useFeaturedProducts()

  if (loading) return <FeaturedProductSkeleton />
  if (products.length === 0) return null

  return (
    <Stack>
      {products.map(p => (
        <Wrapper key={p.slug}>
          <Content>
            <ImageWrap>
              <CornerRibbon>
                <strong>-30%</strong>
                <small>Kampanje</small>
              </CornerRibbon>
              <SplideCarousel>
                {p.images.map((img, i) => (
                  <img key={i} src={img.src} alt={img.alt} loading="lazy" />
                ))}
              </SplideCarousel>
            </ImageWrap>
            <Info>
              <h3>{p.title}</h3>
              <Description>{p.shortDescription}</Description>
              <PriceBlock>
                <PriceRow>
                  <Price>{p.price}</Price>
                  {p.regularPrice && <RegularPrice>{p.regularPrice}</RegularPrice>}
                </PriceRow>
              </PriceBlock>
              <ReadMoreLink to={`/produkter/${p.slug}`}>
                Konfigurer og bestill <Icon name="faArrowRight" />
              </ReadMoreLink>
            </Info>
          </Content>
        </Wrapper>
      ))}
    </Stack>
  )
}
