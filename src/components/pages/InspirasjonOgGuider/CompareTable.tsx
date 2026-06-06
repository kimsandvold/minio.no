import styled from 'styled-components'
import type { Product } from '../../../types/product'
import Icon from '../../shared/Icon'

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-top: 1.5rem;
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    white-space: nowrap;
  }

  th {
    background: ${({ theme }) => theme.colors.darkBg};
    color: ${({ theme }) => theme.colors.textLight};
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:nth-child(even) td {
    background: rgba(0, 0, 0, 0.02);
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;

    th, td {
      padding: 0.6rem 0.75rem;
    }
  }
`

const ProductLink = styled.a`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  svg {
    margin-left: 0.3rem;
    font-size: 0.7rem;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.hover};
  }
`

const Chip = styled.span<{ $variant?: string }>`
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${({ $variant }) =>
    $variant === 'yes' ? '#e8f5e9' : $variant === 'premium' ? '#fff3e0' : '#f5f5f5'};
  color: ${({ $variant }) =>
    $variant === 'yes' ? '#2e7d32' : $variant === 'premium' ? '#e65100' : '#666'};
`

interface Props {
  products: Product[]
}

export default function CompareTable({ products }: Props) {
  return (
    <TableWrapper>
      <StyledTable>
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Pris fra</th>
            <th>Mål (BxHxD cm)</th>
            <th>Konfigurator</th>
            <th>Skreddersydd</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <ProductLink href={`/produkter/${p.slug}`}>
                  {p.title.replace(/–.*$/, '').trim()}
                  <Icon name="faArrowRight" />
                </ProductLink>
              </td>
              <td>{p.basePrice ? `kr ${p.basePrice.toLocaleString('nb-NO')},-` : p.price}</td>
              <td>
                {p.slug === 'plantekasser' && '40-200 x 40-200 x 40 cm'}
                {p.slug === 'varmepumpehus' && 'Tilpasses din varmepumpe'}
                {p.slug === 'soppelboder' && '120 x 80-180 cm'}
                {p.slug === 'vedskjul' && '200 x 200-300 cm'}
                {p.slug === 'postkassestativer' && 'Tilpasses antall kasser'}
                {p.slug === 'levegger' && '90-180 x 150-180 cm'}
                {p.slug === 'pidestall-krakk' && '30-60 x 30-80 x 30-60 cm'}
                {p.slug === 'robotklippergarasje' && 'Tilpasses din klipper'}
              </td>
              <td>
                {p.hasConfigurator ? (
                  <Chip $variant="yes">Ja</Chip>
                ) : (
                  <Chip>Nei</Chip>
                )}
              </td>
              <td><Chip $variant="yes">Ja</Chip></td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </TableWrapper>
  )
}
