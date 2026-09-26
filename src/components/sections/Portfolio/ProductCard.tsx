import { Link } from 'react-router-dom'
import styled from 'styled-components'
import SplideCarousel from '../../shared/SplideCarousel'
import PromoRibbon from '../../shared/PromoRibbon'
import type { Product } from '../../../types/product'

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  color: inherit;
  transition:
    transform ${({ theme }) => theme.transitions.soft},
    box-shadow ${({ theme }) => theme.transitions.soft},
    border-color ${({ theme }) => theme.transitions.soft};
  position: relative;

  /* Roligere løft enn før (6px leste som hopp) — skyggen gjør jobben. */
  &:hover {
    transform: translateY(-3px);
    border-color: ${({ theme }) => theme.colors.borderStrong};
    box-shadow: ${({ theme }) => theme.shadows.lg};
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
    transform: scale(1.04);
  }
`

const CardBody = styled.div`
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  h3 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1.05rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
    margin: 0 0 0.4rem;
    line-height: 1.35;
    letter-spacing: -0.01em;
  }
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: 0 0 auto;
  padding-bottom: 1rem;
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 0.85rem;
`

const Price = styled.span`
  font-weight: 600;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.ink};
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
`

const RegularPrice = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkSubtle};
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
`

const DetailsButton = styled(Link)`
  display: block;
  text-align: center;
  padding: 0.75rem 1.5rem;
  margin: 0 1.25rem 1.25rem;
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.inkInverted};
  border: 1px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default};

  ${Card}:hover &,
  &:hover {
    background: ${({ theme }) => theme.colors.neutral[800]};
    border-color: ${({ theme }) => theme.colors.neutral[800]};
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
          <SplideCarousel label={`Bilder av ${product.title}`}>
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
