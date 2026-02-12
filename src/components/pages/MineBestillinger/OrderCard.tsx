import styled from 'styled-components'
import type { Order } from '../../../types/order'
import { orderStatusLabels, orderStatusColors } from '../../../types/order'
import { formatSum } from '../../../utils/formatPrice'

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const OrderId = styled.span`
  font-size: 0.8rem;
  color: #999;
  font-family: monospace;
`

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background: ${({ $color }) => $color};
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #444;
`

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child { border-bottom: none; }
`

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 2px solid #f0f0f0;
`

const TotalSum = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const DateText = styled.span`
  font-size: 0.8rem;
  color: #999;
`

function formatDate(timestamp: { seconds: number } | null): string {
  if (!timestamp) return ''
  return new Date(timestamp.seconds * 1000).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <OrderId>#{order.id.slice(0, 8)}</OrderId>
        </div>
        <StatusBadge $color={orderStatusColors[order.status]}>
          {orderStatusLabels[order.status]}
        </StatusBadge>
      </CardHeader>

      <ItemList>
        {order.items.map((item, i) => (
          <ItemRow key={i}>
            <span>{item.type}{item.quantity > 1 ? ` (${item.quantity} stk)` : ''}</span>
            <span>{item.price}</span>
          </ItemRow>
        ))}
      </ItemList>

      <CardFooter>
        <DateText>{formatDate(order.createdAt)}</DateText>
        <TotalSum>{formatSum(order.totalSum)}</TotalSum>
      </CardFooter>
    </Card>
  )
}
