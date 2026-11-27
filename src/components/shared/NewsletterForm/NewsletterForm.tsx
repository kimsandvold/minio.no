import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { useAuthContext } from '../../../context/AuthContext'

/**
 * Påmelding til nyhetsbrevet.
 *
 * Erstatter Brevo-iframen som stod i footeren og i nyhetsbrevmodalen. Den
 * iframen var et skjema på et annet domene: adressene havnet rett i Brevo og
 * aldri hos oss, den kunne ikke styles, den lastet et fremmed skript på hver
 * eneste sidevisning, og den hadde fast høyde på 305 px – så den brøt
 * layouten på smale skjermer. Nå går påmeldingen i Firestore, og Brevo får
 * lista som CSV-eksport fra /admin/kontakter når det skal sendes ut.
 *
 * Er man innlogget, fylles adressen inn fra kontoen, men feltet er fortsatt
 * redigerbart: mange vil ha nyhetsbrevet på en annen adresse enn den de
 * logger inn med.
 */
export default function NewsletterForm({ mork = false }: { mork?: boolean }) {
  const { user, firebaseUser } = useAuthContext()
  const [epost, settEpost] = useState(user?.email ?? '')
  const [navn, settNavn] = useState(user?.name ?? '')
  const [tilstand, settTilstand] = useState<'klar' | 'sender' | 'ferdig' | 'feil'>('klar')

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (tilstand === 'sender') return
    settTilstand('sender')

    const { meldPaaNyhetsbrev } = await import('../../../services/kontaktService')
    const ok = await meldPaaNyhetsbrev(epost, navn, 'nyhetsbrev', firebaseUser?.uid)
    settTilstand(ok ? 'ferdig' : 'feil')
  }

  if (tilstand === 'ferdig') {
    return (
      <Kvittering $mork={mork} role="status">
        <Icon name="faCheck" />
        <div>
          <strong>Du er påmeldt</strong>
          <span>Vi sender sjelden, og aldri noe du ikke kan melde deg av.</span>
        </div>
      </Kvittering>
    )
  }

  return (
    <Skjema $mork={mork} onSubmit={send}>
      <Felt>
        <label htmlFor="nb-navn">Navn</label>
        <input
          type="text"
          id="nb-navn"
          placeholder="Ditt navn"
          autoComplete="name"
          value={navn}
          onChange={(e) => settNavn(e.target.value)}
        />
      </Felt>
      <Felt>
        <label htmlFor="nb-epost">E-post *</label>
        <input
          type="email"
          id="nb-epost"
          required
          maxLength={200}
          placeholder="din@epost.no"
          autoComplete="email"
          value={epost}
          onChange={(e) => settEpost(e.target.value)}
        />
      </Felt>

      <Knapp type="submit" disabled={tilstand === 'sender'}>
        {tilstand === 'sender' ? <Icon name="faSpinner" spin /> : <Icon name="faEnvelope" />}
        {tilstand === 'sender' ? 'Melder på …' : 'Meld meg på'}
      </Knapp>

      {tilstand === 'feil' && (
        <Feil role="alert">Fikk ikke meldt deg på nå. Prøv igjen om litt.</Feil>
      )}

      <Finstilt>
        Du kan melde deg av når som helst. Se <Link to="/personvern">personvernerklæringen</Link>.
      </Finstilt>
    </Skjema>
  )
}

/**
 * Skjemaet står både på lys bakgrunn (modalen er mørk, footeren er mørk) og
 * kan senere stå lyst. `$mork` bytter bare tekst- og kantfarger – formen er
 * den samme, så det ikke blir to skjemaer å vedlikeholde.
 */
const Skjema = styled.form<{ $mork: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  max-width: 420px;

  --nb-tekst: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.92)' : '#2e2a26')};
  --nb-dempet: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.6)' : '#6b6560')};
  --nb-kant: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)')};
  --nb-flate: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.06)' : '#fff')};
`

const Felt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--nb-dempet);
  }

  input {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--nb-kant);
    border-radius: 8px;
    background: var(--nb-flate);
    color: var(--nb-tekst);
    font-family: inherit;
    font-size: 0.95rem;

    &::placeholder {
      color: var(--nb-dempet);
      opacity: 0.7;
    }
    &:focus-visible {
      outline: 2px solid #a8512c;
      outline-offset: 1px;
    }
  }
`

const Knapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: #a8512c;
  color: #fff;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #964827;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Feil = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: #e08a6f;
`

const Finstilt = styled.p`
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--nb-dempet);

  a {
    color: inherit;
    text-decoration: underline;
  }
`

const Kvittering = styled.div<{ $mork: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 420px;
  padding: 1rem 1.1rem;
  border: 1px solid ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)')};
  border-radius: 12px;
  background: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.06)' : '#f6f4ef')};

  > svg {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    padding: 9px;
    border-radius: 50%;
    background: #3f7a3f;
    color: #fff;
    font-size: 0.85rem;
  }

  div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  strong {
    font-size: 0.95rem;
    color: ${({ $mork }) => ($mork ? '#fff' : '#2e2a26')};
  }
  span {
    font-size: 0.8rem;
    line-height: 1.45;
    color: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.65)' : '#6b6560')};
  }
`
