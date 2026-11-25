import { useId, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { useAuthContext } from '../../context/AuthContext'
import { authFeilmelding } from '../../hooks/authFeil'
import GoogleLoginButton from './GoogleLoginButton'
import Icon from './Icon'

type Modus = 'logg-inn' | 'ny-konto' | 'glemt'

/**
 * Innlogging med e-post og passord, med Google som alternativ.
 *
 * Erstatter den tidligere rene Google-knappen alle steder som krever
 * innlogging. Google var en terskel for alle som ikke har – eller ikke vil
 * bruke – en Google-konto, og veien videre var da kontaktskjemaet og manuell
 * behandling.
 *
 * E-post står først fordi det er det alminnelige valget. Google ligger under
 * en skillelinje som en snarvei for dem som vil ha den.
 */
export default function Innlogging({ kompakt = false }: { kompakt?: boolean }) {
  const { loggInnMedEpost, registrerMedEpost, sendPassordlenke } = useAuthContext()
  /*
   * Komponenten står flere ganger i samme dokument – Navbar har én i
   * mobilmenyen og én i popoveren, og begge ligger i DOM-en samtidig selv om
   * bare én vises. Med faste id-er ble de duplikater, og da peker <label for>
   * på feil felt: trykker du på «E-post» i den synlige, får den skjulte
   * fokus. useId gir hver instans sine egne.
   */
  const id = useId()
  const [modus, settModus] = useState<Modus>('logg-inn')
  const [navn, settNavn] = useState('')
  const [epost, settEpost] = useState('')
  const [passord, settPassord] = useState('')
  const [visPassord, settVisPassord] = useState(false)
  const [feil, settFeil] = useState('')
  const [kvittering, settKvittering] = useState('')
  const [sender, settSender] = useState(false)

  const bytt = (m: Modus) => {
    settModus(m)
    settFeil('')
    settKvittering('')
  }

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (sender) return
    settSender(true)
    settFeil('')
    settKvittering('')
    try {
      if (modus === 'logg-inn') {
        await loggInnMedEpost(epost, passord)
      } else if (modus === 'ny-konto') {
        await registrerMedEpost(epost, passord, navn)
      } else {
        await sendPassordlenke(epost)
        settKvittering(`Vi har sendt en lenke til ${epost.trim()}. Sjekk også søppelposten.`)
      }
    } catch (f) {
      settFeil(authFeilmelding(f))
    } finally {
      settSender(false)
    }
  }

  const knappetekst =
    modus === 'logg-inn' ? 'Logg inn' : modus === 'ny-konto' ? 'Opprett konto' : 'Send lenke'

  return (
    <Boks $kompakt={kompakt}>
      <Skjema onSubmit={send} noValidate>
        {modus === 'ny-konto' && (
          <Felt>
            <label htmlFor={`${id}-navn`}>Navn</label>
            <input
              id={`${id}-navn`}
              type="text"
              autoComplete="name"
              value={navn}
              onChange={(e) => settNavn(e.target.value)}
              placeholder="Kari Nordmann"
            />
          </Felt>
        )}

        <Felt>
          <label htmlFor={`${id}-epost`}>E-post</label>
          <input
            id={`${id}-epost`}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={epost}
            onChange={(e) => settEpost(e.target.value)}
            placeholder="deg@example.com"
          />
        </Felt>

        {modus !== 'glemt' && (
          <Felt>
            <label htmlFor={`${id}-passord`}>Passord</label>
            <Passordrad>
              <input
                id={`${id}-passord`}
                type={visPassord ? 'text' : 'password'}
                required
                /* Nettleseren skal tilby å lagre et NYTT passord ved
                   registrering, ikke fylle inn det gamle. */
                autoComplete={modus === 'ny-konto' ? 'new-password' : 'current-password'}
                minLength={6}
                value={passord}
                onChange={(e) => settPassord(e.target.value)}
                placeholder={modus === 'ny-konto' ? 'Minst 6 tegn' : ''}
              />
              <Vis
                type="button"
                onClick={() => settVisPassord((v) => !v)}
                aria-label={visPassord ? 'Skjul passordet' : 'Vis passordet'}
              >
                <Icon name={visPassord ? 'faEyeSlash' : 'faEye'} />
              </Vis>
            </Passordrad>
          </Felt>
        )}

        {feil && (
          <Melding role="alert" $feil>
            <Icon name="faExclamationTriangle" /> {feil}
          </Melding>
        )}
        {kvittering && (
          <Melding role="status">
            <Icon name="faCheckCircle" /> {kvittering}
          </Melding>
        )}

        <Hovedknapp type="submit" disabled={sender}>
          {sender ? <><Icon name="faSpinner" spin /> Sender …</> : knappetekst}
        </Hovedknapp>
      </Skjema>

      <Lenker>
        {modus === 'logg-inn' && (
          <>
            <Lenke type="button" onClick={() => bytt('ny-konto')}>Opprett konto</Lenke>
            <Lenke type="button" onClick={() => bytt('glemt')}>Glemt passord?</Lenke>
          </>
        )}
        {modus === 'ny-konto' && (
          <Lenke type="button" onClick={() => bytt('logg-inn')}>Har du konto? Logg inn</Lenke>
        )}
        {modus === 'glemt' && (
          <Lenke type="button" onClick={() => bytt('logg-inn')}>Tilbake til innlogging</Lenke>
        )}
      </Lenker>

      <Skille><span>eller</span></Skille>
      <GoogleLoginButton />
    </Boks>
  )
}

const Boks = styled.div<{ $kompakt: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
  max-width: ${({ $kompakt }) => ($kompakt ? '100%' : '340px')};
  margin: 0 auto;
  text-align: left;
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`

const Felt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  input {
    width: 100%;
    /* 16 px er ikke en smakssak: under det zoomer iOS inn på feltet når det
       får fokus, og hele siden hopper. */
    font-size: 16px;
    font-family: inherit;
    padding: 0.7rem 0.85rem;
    min-height: 46px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 10px;
    background: #fff;
    color: ${({ theme }) => theme.colors.ink};

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.accent};
      outline-offset: 1px;
      border-color: transparent;
    }
  }
`

const Passordrad = styled.div`
  position: relative;
  input { padding-right: 3rem; }
`

const Vis = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 2.9rem;
  display: grid;
  place-items: center;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;
`

const Hovedknapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0.75rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: default; }
`

const Lenker = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 1rem;
`

const Lenke = styled.button`
  border: none;
  background: none;
  padding: 0.2rem 0;
  color: ${({ theme }) => theme.colors.accent};
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`

const Melding = styled.p<{ $feil?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.4;
  color: ${({ $feil }) => ($feil ? '#8c2f1d' : '#2f5d3a')};
  background: ${({ $feil }) => ($feil ? 'rgba(177, 68, 47, 0.1)' : 'rgba(90, 143, 90, 0.14)')};
  svg { margin-top: 0.15rem; flex-shrink: 0; }
`

const Skille = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.8rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`
