import styled from 'styled-components'
import { useContactForm } from '../../../hooks/useContactForm'
import { scaleIn, shake } from '../../../styles/animations'
import Icon from '../../shared/Icon'

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

const SuccessPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 1.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  width: 100%;
  animation: ${scaleIn} 0.4s ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const SuccessIcon = styled.div`
  font-size: 2.5rem;
  color: #28a745;
  margin-bottom: 1rem;
`

const SuccessHeading = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 0 0 0.5rem;
`

const SuccessBody = styled.p`
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 1.5rem;
`

const ResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: none;
  border: 2px solid ${({ theme }) => theme.colors.textDark};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textDark};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.textDark};
    color: #fff;
  }
`

const ErrorPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  margin-top: 1rem;
  animation: ${shake} 0.4s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const ErrorIcon = styled.div`
  font-size: 1.5rem;
  color: #721c24;
  margin-bottom: 0.5rem;
`

const ErrorText = styled.p`
  font-size: 0.9rem;
  color: #721c24;
  margin: 0 0 1rem;
  line-height: 1.5;
`

const RetryButton = styled.button`
  padding: 0.6rem 1.25rem;
  background: #721c24;
  color: #fff;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`

export default function ContactForm() {
  const { formState, setField, submit, status, reset } = useContactForm()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  if (status === 'success') {
    return (
      <SuccessPanel>
        <SuccessIcon>
          <Icon name="faCheckCircle" />
        </SuccessIcon>
        <SuccessHeading>Meldingen er sendt!</SuccessHeading>
        <SuccessBody>
          Takk for din henvendelse. Vi svarer vanligvis innen 24 timer.
        </SuccessBody>
        <ResetButton onClick={reset}>Send ny melding</ResetButton>
      </SuccessPanel>
    )
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
        {status === 'submitting' ? (
          <>
            <Icon name="faSpinner" spin /> Sender...
          </>
        ) : (
          <>
            <Icon name="faPaperPlane" /> Send melding
          </>
        )}
      </SubmitButton>
      {status === 'error' && (
        <ErrorPanel>
          <ErrorIcon>
            <Icon name="faExclamationTriangle" />
          </ErrorIcon>
          <ErrorText>Noe gikk galt. Vennligst prøv igjen eller kontakt oss via sosiale medier.</ErrorText>
          <RetryButton onClick={reset}>Prøv igjen</RetryButton>
        </ErrorPanel>
      )}
    </Form>
  )
}
