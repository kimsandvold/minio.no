import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useRandomProducts } from '../../hooks/useProducts'

const Section = styled.section`
  max-width: 1200px;
  margin: 3.5rem auto 0;
`

const Header = styled.div`
  margin-bottom: 1.5rem;

  h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.25rem;
  }

  p {
    font-size: 0.9rem;
    color: #888;
    margin: 0;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const Card = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`

const CardImage = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`

const CardTitle = styled.div`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CardPrice = styled.div`
  font-size: 0.78rem;
  color: #888;
`

interface RelatedProductsProps {
  currentSlug: string
}

export default function RelatedProducts({ currentSlug }: RelatedProductsProps) {
  const { data: products } = useRandomProducts(3, currentSlug)

  if (products.length === 0) return null

  return (
    <Section>
      <Header>
        <h3>Se også</h3>
        <p>Andre produkter som kan passe</p>
      </Header>
      <Grid>
        {products.map(product => (
          <Card key={product.id} to={`/produkter/${product.slug}`}>
            <CardImage>
              <img src={product.images[0].src} alt={product.images[0].alt} loading="lazy" />
            </CardImage>
            <CardContent>
              <CardTitle>{product.title}</CardTitle>
              <CardPrice>{product.price}</CardPrice>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Section>
  )
}
