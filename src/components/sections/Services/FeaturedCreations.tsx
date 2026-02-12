import styled from 'styled-components'
import SplideCarousel from '../../shared/SplideCarousel'
import { featuredCreations } from '../../../data/featuredCreations'

const Wrapper = styled.div`
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  width: 100%;
  overflow: hidden;

  h3 {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: 2rem;
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: 767px) {
    margin-top: 2rem;
    padding-top: 1.5rem;
    h3 {
      font-size: 1.4rem;
      margin-bottom: 1.5rem;
    }
  }
`

const FeaturedCard = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  padding: 2rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  width: 100%;

  @media (max-width: 767px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
`

const FeaturedImage = styled.div`
  flex: 0 0 33.33%;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  @media (max-width: 767px) {
    flex: none;
    width: 100%;
  }
`

const FeaturedContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  overflow-wrap: break-word;

  h4 {
    font-size: 1.3rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0;
    font-weight: 600;

    @media (max-width: 767px) {
      font-size: 1.1rem;
    }
  }
`

const MetaList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;

  li {
    margin-bottom: 0.75rem;
    padding-left: 1.5rem;
    position: relative;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #444;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: ${({ theme }) => theme.colors.accent};
      font-weight: 700;
      font-size: 1.2rem;
    }

    strong {
      color: ${({ theme }) => theme.colors.accent};
      font-weight: 600;
      margin-right: 0.25rem;
    }
  }
`

const Description = styled.p`
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;
  margin: 0.5rem 0 0;

  @media (max-width: 767px) {
    font-size: 0.875rem;
    line-height: 1.5;
  }
`

export default function FeaturedCreations() {
  return (
    <Wrapper>
      <h3>Smakebiter fra verkstedet</h3>
      <SplideCarousel options={{ arrows: false, interval: 5000, gap: '1rem' }}>
        {featuredCreations.map((item, i) => (
          <FeaturedCard key={i}>
            <FeaturedImage>
              <img src={item.image.src} alt={item.image.alt} loading="lazy" />
            </FeaturedImage>
            <FeaturedContent>
              <h4>{item.title}</h4>
              {item.metaList && (
                <MetaList>
                  {item.metaList.map((meta, j) => (
                    <li key={j}><strong>{meta.label}:</strong> {meta.value}</li>
                  ))}
                </MetaList>
              )}
              <Description>{item.description}</Description>
            </FeaturedContent>
          </FeaturedCard>
        ))}
      </SplideCarousel>
    </Wrapper>
  )
}
