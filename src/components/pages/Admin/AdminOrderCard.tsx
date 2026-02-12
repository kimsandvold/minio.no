import { useState } from 'react'
import styled from 'styled-components'
import type { Order, OrderStatus } from '../../../types/order'
import { orderStatusLabels, orderStatusColors } from '../../../types/order'
import { updateOrderStatus } from '../../../services/orderService'
import { formatSum } from '../../../utils/formatPrice'
import Icon from '../../shared/Icon'

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`

const CardHeader = styled.div<{ $clickable: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  flex-wrap: wrap;
  gap: 0.5rem;

  &:hover {
    background: ${({ $clickable }) => ($clickable ? '#fafafa' : 'transparent')};
  }
`

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const CustomerName = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const OrderMeta = styled.span`
  font-size: 0.8rem;
  color: #999;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const TotalSum = styled.span`
  font-weight: 700;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textDark};
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

const ExpandIcon = styled.span<{ $expanded: boolean }>`
  font-size: 0.8rem;
  color: #999;
  transition: transform 0.2s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0')});
`

const Details = styled.div`
  border-top: 1px solid #f0f0f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const DetailSection = styled.div`
  h4 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #999;
    margin-bottom: 0.5rem;
  }
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  font-size: 0.9rem;

  dt { color: #666; font-weight: 500; }
  dd { color: ${({ theme }) => theme.colors.textDark}; margin: 0; }
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;

  &:last-child { border-bottom: none; }
`

const ItemDetails = styled.span`
  color: #666;
  font-size: 0.8rem;
`

const StatusControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const StatusSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.textDark};
  }
`

const SaveBtn = styled.button`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover { background: #333; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const NotesBox = styled.div`
  background: #fafafa;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #444;
  white-space: pre-wrap;
`

const allStatuses: OrderStatus[] = ['ny', 'bekreftet', 'under_arbeid', 'ferdig', 'kansellert']

function formatDate(timestamp: { seconds: number } | null): string {
  if (!timestamp) return ''
  return new Date(timestamp.seconds * 1000).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface AdminOrderCardProps {
  order: Order
  onStatusChange: (orderId: string, status: OrderStatus) => void
}

export default function AdminOrderCard({ order, onStatusChange }: AdminOrderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status)
  const [saving, setSaving] = useState(false)

  const handleSaveStatus = async () => {
    if (newStatus === order.status) return
    setSaving(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      onStatusChange(order.id, newStatus)
    } catch {
      alert('Kunne ikke oppdatere status.')
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader $clickable onClick={() => setExpanded(!expanded)}>
        <HeaderLeft>
          <CustomerName>{order.customerName}</CustomerName>
          <OrderMeta>#{order.id.slice(0, 8)} &middot; {formatDate(order.createdAt)} &middot; {order.items.length} vare{order.items.length !== 1 ? 'r' : ''}</OrderMeta>
        </HeaderLeft>
        <HeaderRight>
          <TotalSum>{formatSum(order.totalSum)}</TotalSum>
          <StatusBadge $color={orderStatusColors[order.status]}>
            {orderStatusLabels[order.status]}
          </StatusBadge>
          <ExpandIcon $expanded={expanded}>
            <Icon name="faArrowRight" />
          </ExpandIcon>
        </HeaderRight>
      </CardHeader>

      {expanded && (
        <Details>
          <DetailSection>
            <h4>Kundeinformasjon</h4>
            <InfoGrid>
              <dt>Navn</dt><dd>{order.customerName}</dd>
              <dt>E-post</dt><dd>{order.customerEmail}</dd>
              <dt>Telefon</dt><dd>{order.customerPhone}</dd>
              <dt>Konto</dt><dd>{order.userEmail}</dd>
            </InfoGrid>
          </DetailSection>

          <DetailSection>
            <h4>Varer</h4>
            <ItemList>
              {order.items.map((item, i) => (
                <ItemRow key={i}>
                  <div>
                    <div>{item.type}{item.quantity > 1 ? ` (${item.quantity} stk)` : ''}</div>
                    <ItemDetails>
                      {item.dimensions.width}×{item.dimensions.height}×{item.dimensions.depth} cm
                      {item.finish && ` · ${item.finish}`}
                      {item.roof && ` · Tak: ${item.roof}`}
                    </ItemDetails>
                  </div>
                  <span>{item.price}</span>
                </ItemRow>
              ))}
            </ItemList>
          </DetailSection>

          {order.notes && (
            <DetailSection>
              <h4>Tilleggsinformasjon</h4>
              <NotesBox>{order.notes}</NotesBox>
            </DetailSection>
          )}

          <DetailSection>
            <h4>Oppdater status</h4>
            <StatusControl>
              <StatusSelect value={newStatus} onChange={e => setNewStatus(e.target.value as OrderStatus)}>
                {allStatuses.map(s => (
                  <option key={s} value={s}>{orderStatusLabels[s]}</option>
                ))}
              </StatusSelect>
              <SaveBtn onClick={handleSaveStatus} disabled={saving || newStatus === order.status}>
                {saving ? 'Lagrer...' : 'Lagre'}
              </SaveBtn>
            </StatusControl>
          </DetailSection>
        </Details>
      )}
    </Card>
  )
}
