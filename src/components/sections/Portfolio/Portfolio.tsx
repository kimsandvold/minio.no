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
    margin-bottom: 0.9rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: 2rem;
  }
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.inkMuted};
  max-width: 44rem;
  margin: 0 auto;
`

const Divider = styled.div`
  width: 48px;
  height: 2px;
  background: ${({ theme }) => theme.colors.accent};
  margin: 1.5rem auto 0;
  border-radius: 999px;
`

/* Sans her, ikke display — dette er en rutenett-etikett, ikke en overskrift. */
const GridHeading = styled.h3`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
  text-align: center;
  margin: 4rem 0 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 2.5rem 0 1.5rem;
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
  padding: 0.9rem 2rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.ink};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.base};
  letter-spacing: -0.005em;
  text-decoration: none;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.ink};
    border-color: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};
    transform: translateY(-1px);
  }
`

export default function Portfolio() {
  const { activePollId, loading: pollLoading } = useActivePoll()
  const productCount = activePollId ? 3 : 4
  const { data: randomProducts, loading } = useRandomProducts(productCount)

  return (
    <Section id="portefolje" variant="surface">
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
