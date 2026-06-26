import styled from 'styled-components'
import Icon from '../Icon'
import { useBasketContext } from '../../../context/BasketContext'
import { formatPrice, parsePrice, formatSum } from '../../../utils/formatPrice'

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #f1f1f1; }
  &::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
`

const Empty = styled.p`
  text-align: center;
  color: #666;
  padding: 2rem;
`

const Item = styled.div`
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
`

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.75rem;
  gap: 1rem;
`

const ItemTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  flex: 1;
`

const Quantity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 0.25rem;
`

const QtyBtn = styled.button`
  background: white;
  border: 1px solid #ddd;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  padding: 0;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.textDark};
    color: white;
    border-color: ${({ theme }) => theme.colors.textDark};
  }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`

const QtyValue = styled.span`
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  color: #202020;
`

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
`

const Details = styled.div`
  font-size: 0.85rem;
  color: #666;
  line-height: 1.6;
`

const PriceSection = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
`

const PriceLabel = styled.div`
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`

const PriceValue = styled.div`
  font-weight: 700;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const Notes = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #e0e0e0;
  flex-shrink: 0;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  textarea {
    width: 100%;
    min-height: 80px;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
    transition: border-color 0.3s ease;

    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.textDark}; }
  }
`

const TotalSection = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #e0e0e0;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TotalLabel = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const TotalValue = styled.span`
  font-weight: 700;
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const Footer = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #e0e0e0;
  flex-shrink: 0;
`

const CheckoutBtn = styled.button`
  display: block;
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: white;
  text-align: center;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover { background: #333; }
`

interface BasketViewProps {
  onCheckout: () => void
}

export default function BasketView({ onCheckout }: BasketViewProps) {
  const { items, notes, setNotes, removeItem, updateQuantity } = useBasketContext()
  const totalSum = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0)

  return (
    <>
      <Body>
        {items.length === 0 ? (
          <Empty>Handlekurven er tom</Empty>
        ) : (
          items.map(item => (
            <Item key={item.id}>
              <ItemHeader>
                <ItemTitle>{item.type}</ItemTitle>
                {!item.lockQuantity && (
                  <Quantity>
                    <QtyBtn onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Reduser antall">
                      <Icon name="faMinus" />
                    </QtyBtn>
                    <QtyValue>{item.quantity}</QtyValue>
                    <QtyBtn onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Øk antall">
                      <Icon name="faPlus" />
                    </QtyBtn>
                  </Quantity>
                )}
                <RemoveBtn onClick={() => removeItem(item.id)} aria-label="Fjern">
                  <Icon name="faTrash" />
                </RemoveBtn>
              </ItemHeader>
              <Details>
                {item.slotDimensions && item.slotDimensions.length > 0 ? (
                  <>
                    <strong>{item.setLabel ?? 'Pidestaller i settet'}:</strong>
                    <ul style={{ margin: '0.25rem 0 0.5rem', paddingLeft: '1.25rem' }}>
                      {item.slotDimensions.map((s, idx) => (
                        <li key={idx}>
                          #{idx + 1}: {s.type && <>{s.type} – </>}
                          {s.widthB ? `${s.width}+${s.widthB}×${s.height}` : `${s.width}×${s.height}×${s.depth}`} cm
                          {s.orientation && <> · {s.orientation}</>}
                          {s.unitPrice && <> ({s.unitPrice})</>}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (item.dimensions.width || item.dimensions.height || item.dimensions.depth) ? (
                  <><strong>Mål:</strong> {item.dimensions.width}×{item.dimensions.height}×{item.dimensions.depth} cm<br /></>
                ) : null}
                {item.shape && <><strong>Form:</strong> {item.shape}<br /></>}
                {item.mounting && <><strong>Konstruksjon:</strong> {item.mounting}<br /></>}
                {item.angle && <><strong>Vinkel:</strong> {item.angle}°<br /></>}
                {item.size && <><strong>Størrelse:</strong> {item.size}<br /></>}
                {item.complexity && <><strong>Tilvalg:</strong> {item.complexity}<br /></>}
                {item.orientation && <><strong>Spilretning:</strong> {item.orientation}<br /></>}
                <strong>Overflatebehandling:</strong> {item.finish}<br />
                {item.quality && <><strong>Kvalitet:</strong> {item.quality}<br /></>}
                {item.roof && <><strong>Tak:</strong> {item.roof}<br /></>}
                {item.lighting && <><strong>Belysning:</strong> {item.lighting}<br /></>}
                {item.signRequested && <><strong>Skilt:</strong> Ja ({item.signWidthCm}×{item.signHeightCm} cm) — pris kommer separat<br /></>}
                <strong>Levering:</strong> {item.delivery}{item.installation && <><br /><strong>Montering:</strong> {item.installation}</>}
                {item.discount && <><br /><strong>Rabatt:</strong> {item.discount}</>}
              </Details>
              <PriceSection>
                <PriceLabel>Estimert pris inkl. mva {item.quantity > 1 ? `(${item.quantity} stk)` : ''}</PriceLabel>
                <PriceValue>
                  {item.price}
                  {item.quantity > 1 && ` × ${item.quantity} = ${formatPrice(item.price, item.quantity)}`}
                </PriceValue>
              </PriceSection>
            </Item>
          ))
        )}
      </Body>
      <Notes>
        <label htmlFor="basket-notes">Tilleggsinformasjon (valgfritt)</label>
        <textarea
          id="basket-notes"
          placeholder="Legg til notater, spesielle ønsker eller spørsmål..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </Notes>
      {items.length > 0 && (
        <TotalSection>
          <TotalLabel>Estimert totalsum</TotalLabel>
          <TotalValue>{formatSum(totalSum)}</TotalValue>
        </TotalSection>
      )}
      <Footer>
        <CheckoutBtn onClick={onCheckout}>Gå til forespørsel</CheckoutBtn>
      </Footer>
    </>
  )
}
