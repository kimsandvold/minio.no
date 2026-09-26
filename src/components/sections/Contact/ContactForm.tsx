import { useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import { useContactForm } from '../../../hooks/useContactForm'
import { trackEvent } from '../../../utils/analytics'
import Icon from '../../shared/Icon'

interface ContactFormProps {
  /** Forhåndsutfylt emne, f.eks. fra `?subject=` i URL-en. */
  emne?: string
}

export default function ContactForm({ emne }: ContactFormProps) {
  const { formState, setField, prefillSubject, submit, status, reset } = useContactForm()

  // Emnet må inn i skjemastaten (feltet er kontrollert) – ellers sendes det ikke med.
  useEffect(() => {
    if (emne) prefillSubject(emne)
  }, [emne, prefillSubject])

  useEffect(() => {
    if (status === 'success') trackEvent('kontakt_sendt', 'kontakt')
  }, [status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit()
  }

  if (status === 'success') {
    return (
      <Kvittering role="status">
        <KvitteringIkon><Icon name="faCheckCircle" /></KvitteringIkon>
        <h2>Takk, meldingen er sendt.</h2>
        <p>Du får et personlig svar på e-posten du oppga.</p>
        <SekundaerKnapp type="button" onClick={reset}>Send en ny melding</SekundaerKnapp>
      </Kvittering>
    )
  }

  return (
    <Skjema id="contactForm" onSubmit={handleSubmit}>
      <Topp>
        <h2>Send en melding</h2>
        <p>Felt merket med * må fylles ut.</p>
      </Topp>
      <ToKolonner>
        <Felt>
          <label htmlFor="contactName">Navn *</label>
          <input
            id="contactName"
            type="text"
            name="name"
            required
            autoComplete="name"
            value={formState.name}
            onChange={e => setField('name', e.target.value)}
          />
        </Felt>
        <Felt>
          <label htmlFor="contactEmail">E-post *</label>
          <input
            id="contactEmail"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={formState.email}
            onChange={e => setField('email', e.target.value)}
          />
        </Felt>
      </ToKolonner>

      <ToKolonner>
        <Felt>
          <label htmlFor="contactPhone">Telefon <span>(valgfritt)</span></label>
          <input
            id="contactPhone"
            type="tel"
            name="phone"
            autoComplete="tel"
            value={formState.phone}
            onChange={e => setField('phone', e.target.value)}
          />
        </Felt>
        <Felt>
          <label htmlFor="contactSubject">Emne <span>(valgfritt)</span></label>
          <input
            id="contactSubject"
            type="text"
            name="subject"
            value={formState.subject}
            onChange={e => setField('subject', e.target.value)}
          />
        </Felt>
      </ToKolonner>

      <Felt>
        <label htmlFor="contactMessage">Melding *</label>
        <textarea
          id="contactMessage"
          name="message"
          required
          rows={6}
          value={formState.message}
          onChange={e => setField('message', e.target.value)}
          aria-describedby="contactMessageHjelp"
        />
        <Hjelp id="contactMessageHjelp">
          Jo mer konkret, jo bedre svar: mål, treslag, finish og når du trenger det.
        </Hjelp>
      </Felt>

      {status === 'error' && (
        <Feil role="alert">
          <Icon name="faExclamationTriangle" />
          <span>
            Noe gikk galt. Prøv igjen, eller send oss en melding på Facebook eller Instagram.
          </span>
        </Feil>
      )}

      <SendKnapp type="submit" disabled={status === 'submitting'}>
        {status === 'submitting'
          ? <><Icon name="faSpinner" spin /> Sender …</>
          : <><Icon name="faPaperPlane" /> Send melding</>}
      </SendKnapp>
      <Note>
        Uforpliktende. E-posten brukes bare til å svare deg. Se{' '}
        <Link to="/personvern">personvernerklæringen</Link>.
      </Note>
    </Skjema>
  )
}

const innFade = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  width: 100%;
`

const Topp = styled.div`
  margin-bottom: 0.65rem;

  h2 {
    margin: 0 0 0.35rem;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: 600;
    letter-spacing: -0.035em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const ToKolonner = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem 0.9rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const Felt = styled.div`
  min-width: 0;

  label {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    margin-bottom: 0.45rem;
    color: ${({ theme }) => theme.colors.ink};

    span {
      font-weight: 400;
      color: ${({ theme }) => theme.colors.inkMuted};
    }
  }

  input,
  textarea {
    width: 100%;
    font: inherit;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: 12px;
    padding: 0.8rem 0.95rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      border-color: ${({ theme }) => theme.colors.neutral[400]};
    }

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accent};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
    }
  }

  textarea {
    resize: vertical;
    min-height: 150px;
    line-height: 1.55;
  }
`

const Hjelp = styled.p`
  margin: 0.5rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Feil = styled.p`
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorSoft};

  svg {
    margin-top: 0.2rem;
    flex: none;
  }
`

const SendKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  min-height: 52px;
  margin-top: 0.3rem;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 0 1.5rem;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default}, transform ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`

const Note = styled.p`
  margin: -0.2rem 0 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkMuted};

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
`

const Kvittering = styled.div`
  text-align: center;
  padding: 3rem 0.5rem;
  animation: ${innFade} 0.5s ${({ theme }) => theme.easing.soft} both;

  h2 {
    margin: 0 0 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    letter-spacing: -0.03em;
  }

  p {
    margin: 0 auto 1.75rem;
    max-width: 40ch;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.6;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const KvitteringIkon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 1.7rem;
  color: ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.successSoft};
`

const SekundaerKnapp = styled.button`
  font: inherit;
  font-weight: 500;
  min-height: 44px;
  padding: 0 1.4rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.ink};
  }
`
