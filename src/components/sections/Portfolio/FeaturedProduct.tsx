import { Link } from 'react-router-dom'
import styled from 'styled-components'
import SplideCarousel from '../../shared/SplideCarousel'
import Icon from '../../shared/Icon'
import { FeaturedProductSkeleton } from '../../shared/ProductSkeleton'
import { useFeaturedProduct } from '../../../hooks/useProducts'

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
  aspect-ratio: 1 / 1;

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

const Badge = styled.span`
  display: inline-block;
  align-self: flex-start;
  background: ${CAMPAIGN_RED};
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 0.35rem 0.9rem;
  border-radius: 3px;
  margin-bottom: 0.25rem;
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 2.5rem;
  gap: 0.75rem;

  h3 {
    font-size: 1.65rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0;
    line-height: 1.25;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.75rem;
    h3 { font-size: 1.3rem; }
  }
`

const Description = styled.p`
  font-size: 0.95rem;
  line-height: 1.7;
  color: #555;
  margin: 0;
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #444;

  svg {
    color: ${({ theme }) => theme.colors.accent};
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
`

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.75rem;
  padding: 0.9rem 1rem;
  background: #fdf6f4;
  border-left: 3px solid ${CAMPAIGN_RED};
  border-radius: 4px;
`

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const Price = styled.span`
  font-size: 1.9rem;
  font-weight: 700;
  color: ${CAMPAIGN_RED};
  letter-spacing: -0.02em;
  line-height: 1;
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
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  font-size: 0.9rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: all 0.3s ease;
  margin-top: 0.75rem;

  &:hover {
    background: #333;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

export default function FeaturedProduct() {
  const { data: p, loading } = useFeaturedProduct()

  if (loading) return <FeaturedProductSkeleton />
  if (!p) return null

  return (
    <Wrapper>
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
          <Badge>Kampanjepris</Badge>
          <h3>{p.title}</h3>
          <Description>{p.shortDescription}</Description>
          <FeatureList>
            <FeatureItem>
              <Icon name="faRulerCombined" /> Skreddersydd etter dine mål
            </FeatureItem>
            <FeatureItem>
              <Icon name="faPalette" /> Velg finish: ubehandlet, grunnet eller malt
            </FeatureItem>
            <FeatureItem>
              <Icon name="faTruck" /> Levering inntil 200 km fra Lillehammer
            </FeatureItem>
          </FeatureList>
          <PriceBlock>
            <PriceRow>
              <Price>{p.price}</Price>
              {p.regularPrice && <RegularPrice>{p.regularPrice}</RegularPrice>}
            </PriceRow>
          </PriceBlock>
          <ReadMoreLink to="/produkter/varmepumpehus">
            Konfigurer og bestill <Icon name="faArrowRight" />
          </ReadMoreLink>
        </Info>
      </Content>
    </Wrapper>
  )
}
