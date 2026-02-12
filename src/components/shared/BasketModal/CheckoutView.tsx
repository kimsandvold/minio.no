import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../Icon'
import { useBasketContext } from '../../../context/BasketContext'
import { useAuthContext } from '../../../context/AuthContext'
import { formatPrice, parsePrice, formatSum } from '../../../utils/formatPrice'
import { createOrder } from '../../../services/orderService'
import { subscribeToNewsletter } from '../../../services/newsletterService'

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;

  label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textDark};
  }

  input {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.95rem;
    font-family: inherit;
    transition: border-color 0.3s ease;

    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.textDark}; }
  }
`

const Summary = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.lightBg};
  border-radius: 8px;
  font-size: 0.85rem;

  p { margin-bottom: 0.5rem; }
`

const SummaryItem = styled.div`
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  &:last-child { border-bottom: none; }
`

const SummaryTotal = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #ccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const VatNote = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
  font-size: 0.85rem;
  color: #666;
`

const Footer = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #e0e0e0;
  flex-shrink: 0;
`

const SubmitBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover { background: #45a049; }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
`

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'
const VAT_PERCENTAGE = 0

interface CheckoutViewProps {
  onSuccess: () => void
}

export default function CheckoutView({ onSuccess }: CheckoutViewProps) {
  const { items, notes, clearBasket } = useBasketContext()
  const { user, firebaseUser } = useAuthContext()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const totalSum = items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0)

  const formatBasketForEmail = () => {
    let message = '=== HANDLEKURV ===\n\n'
    items.forEach((item, index) => {
      message += `Produkt ${index + 1}: ${item.type}\n`
      message += `Antall: ${item.quantity} stk\n`
      message += `Mål: ${item.dimensions.width}×${item.dimensions.height}×${item.dimensions.depth} cm\n`
      if (item.mounting) message += `Konstruksjon: ${item.mounting}\n`
      if (item.angle) message += `Vinkel: ${item.angle}°\n`
      if (item.size) message += `Størrelse: ${item.size}\n`
      if (item.complexity) message += `Tilvalg: ${item.complexity}\n`
      message += `Overflatebehandling: ${item.finish}\n`
      if (item.quality) message += `Kvalitet: ${item.quality}\n`
      message += `Tak: ${item.roof}\n`
      if (item.lighting) message += `Belysning: ${item.lighting}\n`
      message += `Levering: ${item.delivery}\n`
      message += `Montering: ${item.installation}\n`
      message += `Estimert pris per stk: ${item.price}\n`
      if (item.quantity > 1) message += `Total: ${formatPrice(item.price, item.quantity)}\n`
      message += '\n'
    })
    message += `--- ESTIMERT TOTALSUM: ${formatSum(totalSum)} ---\n\n`
    if (notes) message += `Tilleggsinformasjon:\n${notes}\n\n`
    message += '==================\n\n'
    return message
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // 1. Save order to Firestore (don't block checkout if it fails)
      if (firebaseUser) {
        createOrder({
          userId: firebaseUser.uid,
          userEmail: firebaseUser.email ?? '',
          userName: firebaseUser.displayName ?? '',
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          items,
          notes,
          totalSum,
        }).catch(() => {
          // Firestore save failed (e.g. rules not configured) — checkout still proceeds
        })
      }

      // 2. Send email via Formspree (keep existing flow)
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('subject', 'Ny forespørsel fra handlekurv')
      formData.append('message', formatBasketForEmail())

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        // 3. Auto-subscribe to newsletter (best-effort)
        subscribeToNewsletter(email)

        clearBasket()
        onSuccess()
      } else {
        alert('Noe gikk galt. Vennligst prøv igjen.')
      }
    } catch {
      alert('Noe gikk galt. Vennligst prøv igjen.')
    }

    setSubmitting(false)
  }

  return (
    <>
      <Body>
        <form id="checkoutForm" onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="checkout-name">Navn *</label>
            <input type="text" id="checkout-name" required placeholder="Ditt navn" value={name} onChange={e => setName(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <label htmlFor="checkout-email">E-post *</label>
            <input type="email" id="checkout-email" required placeholder="din@epost.no" value={email} onChange={e => setEmail(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <label htmlFor="checkout-phone">Telefon *</label>
            <input type="tel" id="checkout-phone" required placeholder="123 45 678" value={phone} onChange={e => setPhone(e.target.value)} />
          </FormGroup>
          <Summary>
            <p><strong>Du er i ferd med å sende forespørsel om:</strong></p>
            {items.map((item, i) => (
              <SummaryItem key={item.id}>
                <strong>{i + 1}. {item.type}</strong>{item.quantity > 1 ? ` (${item.quantity} stk)` : ''}<br />
                Mål: {item.dimensions.width}×{item.dimensions.height}×{item.dimensions.depth} cm<br />
                {item.mounting && <>Konstruksjon: {item.mounting}<br /></>}
                {item.angle && <>Vinkel: {item.angle}°<br /></>}
                {item.size && <>Størrelse: {item.size}<br /></>}
                {item.complexity && <>Tilvalg: {item.complexity}<br /></>}
                Overflatebehandling: {item.finish}<br />
                {item.quality && <>Kvalitet: {item.quality}<br /></>}
                Tak: {item.roof}<br />
                {item.lighting && <>Belysning: {item.lighting}<br /></>}
                Levering: {item.delivery}<br />
                Montering: {item.installation}<br />
                Estimert pris: {item.price}{item.quantity > 1 ? ` × ${item.quantity} = ${formatPrice(item.price, item.quantity)}` : ''}
              </SummaryItem>
            ))}
            {notes && <SummaryItem><strong>Tilleggsinformasjon:</strong><br />{notes}</SummaryItem>}
            <SummaryTotal>
              <span>Estimert totalsum</span>
              <span>{formatSum(totalSum)}</span>
            </SummaryTotal>
            <VatNote><em>Alle priser inkluderer {VAT_PERCENTAGE}% MVA</em></VatNote>
          </Summary>
        </form>
      </Body>
      <Footer>
        <SubmitBtn type="submit" form="checkoutForm" disabled={submitting}>
          {submitting ? <><Icon name="faSpinner" spin /> Sender...</> : <><Icon name="faPaperPlane" /> Send forespørsel</>}
        </SubmitBtn>
      </Footer>
    </>
  )
}
