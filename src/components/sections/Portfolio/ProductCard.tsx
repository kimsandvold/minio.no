import { Link } from 'react-router-dom'
import styled from 'styled-components'
import SplideCarousel from '../../shared/SplideCarousel'
import PromoRibbon from '../../shared/PromoRibbon'
import type { Product } from '../../../types/product'

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
`

const ImageWrap = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;

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
    transition: transform 0.5s ease;
  }

  ${Card}:hover & img {
    transform: scale(1.05);
  }
`

const CardBody = styled.div`
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  h3 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #222;
    margin: 0 0 0.4rem;
    line-height: 1.3;
  }
`

const Description = styled.p`
  font-size: 0.85rem;
  line-height: 1.6;
  color: #666;
  margin: 0 0 auto;
  padding-bottom: 1rem;
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.85rem;
`

const Price = styled.span`
  font-weight: 600;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.textDark};
  letter-spacing: -0.02em;
`

const RegularPrice = styled.span`
  font-size: 0.8rem;
  color: #aaa;
  text-decoration: line-through;
`

const DetailsButton = styled(Link)`
  display: block;
  text-align: center;
  padding: 0.75rem 1.5rem;
  margin: 0 1.5rem 1.5rem;
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

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasMultipleImages = product.images.length > 1

  return (
    <Card>
      {product.hasPromoRibbon && <PromoRibbon />}
      <ImageWrap>
        {hasMultipleImages ? (
          <SplideCarousel>
            {product.images.map((img, i) => (
              <img key={i} src={img.src} alt={img.alt} loading="lazy" />
            ))}
          </SplideCarousel>
        ) : (
          <img src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
        )}
      </ImageWrap>
      <CardBody>
        <h3>{product.title}</h3>
        <Description>{product.shortDescription}</Description>
        <PriceRow>
          <Price>{product.price}</Price>
          {product.regularPrice && <RegularPrice>{product.regularPrice}</RegularPrice>}
        </PriceRow>
      </CardBody>
      <DetailsButton to={`/produkter/${product.slug}`}>Se detaljer</DetailsButton>
    </Card>
  )
}
