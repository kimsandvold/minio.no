import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import FeaturedProduct from './FeaturedProduct'
import ProductCard from './ProductCard'
import { ProductCardSkeleton } from '../../shared/ProductSkeleton'
import AnimatedBlock from '../../shared/AnimatedBlock'
import PollCard from './PollCard'
import { useRandomProducts } from '../../../hooks/useProducts'
import { useActivePoll } from '../../../hooks/useActivePoll'

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;

  h2 {
    font-size: 2.2rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: 2rem;
    h2 { font-size: 1.6rem; }
  }
`

const Subtitle = styled.p`
  font-size: 1.05rem;
  line-height: 1.7;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
`

const Divider = styled.div`
  width: 60px;
  height: 3px;
  background: ${({ theme }) => theme.colors.accent};
  margin: 1.25rem auto 0;
  border-radius: 2px;
`

const GridHeading = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  text-align: center;
  margin: 4rem 0 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 2.5rem 0 1.5rem;
    font-size: 1.15rem;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`

const ViewAllWrapper = styled.div`
  text-align: center;
  margin-top: 3rem;
`

const ViewAllLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 2.5rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.textDark};
  border: 2px solid ${({ theme }) => theme.colors.textDark};
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.textDark};
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

export default function Portfolio() {
  const { activePollId, loading: pollLoading } = useActivePoll()
  const productCount = activePollId ? 3 : 4
  const { data: randomProducts, loading } = useRandomProducts(productCount)

  return (
    <Section id="portefolje" variant="light">
      <Container>
        <SectionHeader>
          <h2>Utendørs treprodukter etter dine mål</h2>
          <Subtitle>
            Fra varmepumpehus og søppelboder til levegger og plantekasser – alt bygges på bestilling, tilpasset dine mål og ditt uterom.
          </Subtitle>
          <Divider />
        </SectionHeader>
        <FeaturedProduct />
        <GridHeading>Utforsk flere produkter</GridHeading>
        <Grid>
          {loading || pollLoading
            ? Array.from({ length: productCount }, (_, i) => <ProductCardSkeleton key={i} />)
            : randomProducts.map((product, index) => (
                <AnimatedBlock key={product.id} delay={index * 100}>
                  <ProductCard product={product} />
                </AnimatedBlock>
              ))}
          {activePollId && (
            <AnimatedBlock delay={400}>
              <PollCard pollId={activePollId} />
            </AnimatedBlock>
          )}
        </Grid>
        <ViewAllWrapper>
          <ViewAllLink to="/produkter">Se alle produkter &rarr;</ViewAllLink>
        </ViewAllWrapper>
      </Container>
    </Section>
  )
}
