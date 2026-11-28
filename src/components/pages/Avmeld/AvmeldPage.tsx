import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'

/**
 * Avmelding fra nyhetsbrevet – uten innlogging.
 *
 * Nyhetsbrevet sendes fra Mail med blindkopi, så alle får samme e-post og
 * lenken kan ikke bære den enkeltes adresse. Derfor skriver man inn adressen
 * her. `?epost=` fyller feltet hvis lenken en gang blir personlig.
 *
 * Svaret er det samme uansett om adressen sto på lista eller ikke. Ellers
 * kunne siden brukes til å finne ut hvem som står der.
 */
export default function AvmeldPage() {
  const [params] = useSearchParams()
  const { firebaseUser } = useAuthContext()
  const [epost, settEpost] = useState(params.get('epost') ?? firebaseUser?.email ?? '')
  const [tilstand, settTilstand] = useState<'klar' | 'sender' | 'ferdig' | 'feil'>('klar')

  useSEO({ title: 'Meld deg av nyhetsbrevet – Minio', description: 'Meld deg av nyhetsbrevet fra Minio.', noindex: true })

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (tilstand === 'sender') return
    settTilstand('sender')
    const m = await import('../../../services/kontaktService')
    const ok = await m.meldAvMedEpost(epost)
    // Innlogget med samme adresse: skru av på kontoen også, så profilsiden
    // og spørsmålet i hjørnet er enige.
    if (ok && firebaseUser?.email && firebaseUser.email.toLowerCase() === epost.trim().toLowerCase()) {
      await m.meldAvNyhetsbrev(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName ?? '')
    }
    settTilstand(ok ? 'ferdig' : 'feil')
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Flate>
            <Kort>
              {tilstand === 'ferdig' ? (
                <>
                  <Ikon $ok>
                    <Icon name="faCheck" />
                  </Ikon>
                  <h1>Du er meldt av</h1>
                  <p>
                    <strong>{epost.trim().toLowerCase()}</strong> får ikke flere nyhetsbrev fra Minio. Ombestemmer du
                    deg, kan du melde deg på igjen nederst på siden.
                  </p>
                  <Lenke to="/">Til forsiden</Lenke>
                </>
              ) : (
                <>
                  <Ikon>
                    <Icon name="faEnvelopeOpenText" />
                  </Ikon>
                  <h1>Meld deg av nyhetsbrevet</h1>
                  <p>Skriv inn adressen du får nyhetsbrevet på, så sender vi ikke flere.</p>
                  <Skjema onSubmit={send}>
                    <label htmlFor="avmeld-epost">E-postadresse</label>
                    <input
                      id="avmeld-epost"
                      type="email"
                      required
                      autoComplete="email"
                      value={epost}
                      onChange={(e) => settEpost(e.target.value)}
                      placeholder="navn@eksempel.no"
                    />
                    <button type="submit" disabled={tilstand === 'sender'}>
                      {tilstand === 'sender' ? 'Melder av …' : 'Meld meg av'}
                    </button>
                    {tilstand === 'feil' && <Feil role="alert">Noe gikk galt. Prøv igjen om litt.</Feil>}
                  </Skjema>
                  <Liten>
                    Har du konto? Du kan også styre dette på <Link to="/min-profil">Min profil</Link>.
                  </Liten>
                </>
              )}
            </Kort>
          </Flate>
        </main>
      </PageTransition>
      <Footer />
    </>
  )
}

const Flate = styled.section`
  display: grid;
  place-items: center;
  min-height: 70vh;
  padding: 7rem 1.25rem 4rem;
  background: ${({ theme }) => theme.colors.paper};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 5.5rem 1rem 3rem;
  }
`

const Kort = styled.div`
  width: 100%;
  max-width: 460px;
  padding: 2.2rem 2rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.surface};
  text-align: center;

  h1 {
    margin: 0.9rem 0 0.5rem;
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.ink};
  }
  p {
    margin: 0 0 1.4rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
    overflow-wrap: anywhere;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.8rem 1.25rem;
  }
`

const Ikon = styled.div<{ $ok?: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${({ $ok, theme }) => ($ok ? theme.colors.successSoft : theme.colors.accentSoft)};
  color: ${({ $ok, theme }) => ($ok ? theme.colors.success : theme.colors.accentInk)};
  font-size: 1.2rem;
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: left;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }
  input {
    height: 48px;
    padding: 0 0.9rem;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: 12px;
    font-family: inherit;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.surface};
  }
  input:focus {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }
  button {
    height: 48px;
    margin-top: 0.3rem;
    border: none;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.ink};
    color: #fff;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`

const Feil = styled.p`
  margin: 0.2rem 0 0 !important;
  font-size: 0.88rem;
  color: #9c3621 !important;
`

const Liten = styled.p`
  margin: 1.3rem 0 0 !important;
  font-size: 0.88rem;

  a {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Lenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 1.3rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
  text-decoration: none;
`
