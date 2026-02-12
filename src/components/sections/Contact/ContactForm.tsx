import styled from 'styled-components'
import { useContactForm } from '../../../hooks/useContactForm'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
  margin-bottom: 2rem;
  gap: 1rem;
  max-width: 600px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
  }
`

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
  }
`

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  min-height: 120px;
  resize: vertical;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
  }
`

const HelperText = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-top: -0.5rem;
  font-style: italic;
`

const SubmitButton = styled.button`
  padding: 0.9rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`

const Status = styled.div<{ $type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;

  ${({ $type }) =>
    $type === 'success'
      ? `background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;`
      : `background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;`}
`

export default function ContactForm() {
  const { formState, setField, submit, status } = useContactForm()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  return (
    <Form id="contactForm" onSubmit={handleSubmit}>
      <Input
        type="text"
        name="name"
        placeholder="Navn *"
        required
        value={formState.name}
        onChange={e => setField('name', e.target.value)}
      />
      <Input
        type="email"
        name="email"
        placeholder="E-post *"
        required
        value={formState.email}
        onChange={e => setField('email', e.target.value)}
      />
      <Input
        type="tel"
        name="phone"
        placeholder="Telefon"
        value={formState.phone}
        onChange={e => setField('phone', e.target.value)}
      />
      <Input
        type="text"
        name="subject"
        id="contactSubject"
        placeholder="Emne"
        value={formState.subject}
        onChange={e => setField('subject', e.target.value)}
      />
      <TextArea
        name="message"
        id="contactMessage"
        placeholder="Melding *"
        required
        value={formState.message}
        onChange={e => setField('message', e.target.value)}
      />
      <HelperText>Vær så spesifikk som mulig med størrelse, utførelse, forventet levering etc.</HelperText>
      <SubmitButton type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sender...' : 'Send melding'}
      </SubmitButton>
      {status === 'success' && (
        <Status $type="success">Takk for din melding! Vi tar kontakt så snart som mulig.</Status>
      )}
      {status === 'error' && (
        <Status $type="error">Noe gikk galt. Vennligst prøv igjen eller kontakt oss via sosiale medier.</Status>
      )}
    </Form>
  )
}
