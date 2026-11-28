import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import Innlogging from '../../shared/Innlogging'

/**
 * Min profil – kontoen, og valget om nyhetsbrev.
 *
 * Nyhetsbrevet er et samtykke, og et samtykke skal være like lett å trekke
 * som å gi. Derfor ligger det her som én bryter, ikke bak en lenke nederst i
 * en e-post. Bryteren skriver samme felt som spørsmålet i hjørnet og
 * påmeldingsskjemaet, så alle tre er enige om svaret.
 */

type Tilstand = 'laster' | 'klar' | 'lagrer' | 'feil'

function metode(providerId: string | undefined): string {
  if (providerId === 'google.com') return 'Google'
  if (providerId === 'password') return 'E-post og passord'
  return 'Ukjent'
}

export default function MinProfilPage() {
  const { isAuthenticated, firebaseUser, user, loading, logout } = useAuthContext()
  const [nyhetsbrev, settNyhetsbrev] = useState(false)
  const [tilstand, settTilstand] = useState<Tilstand>('laster')

  useSEO({ title: 'Min profil – Minio', description: 'Kontoen din hos Minio.', noindex: true })

  const uid = firebaseUser?.uid
  useEffect(() => {
    if (!uid) return
    let avbrutt = false
    import('../../../services/kontaktService')
      .then((m) => m.hentNyhetsbrevStatus(uid))
      .then((status) => {
        if (avbrutt) return
        settNyhetsbrev(status?.nyhetsbrev ?? false)
        settTilstand(status ? 'klar' : 'feil')
      })
    return () => {
      avbrutt = true
    }
  }, [uid])

  const bytt = async () => {
    if (!firebaseUser || tilstand === 'lagrer') return
    const ny = !nyhetsbrev
    settNyhetsbrev(ny)
    settTilstand('lagrer')
    const m = await import('../../../services/kontaktService')
    const navn = firebaseUser.displayName ?? ''
    const ok = ny
      ? await m.meldPaaNyhetsbrev(firebaseUser.email ?? '', navn, 'innlogging', firebaseUser.uid)
      : await m.meldAvNyhetsbrev(firebaseUser.uid, firebaseUser.email ?? '', navn)
    if (ok) {
      try {
        // Samme nøkkel som spørsmålet i hjørnet, så det ikke dukker opp igjen.
        localStorage.setItem(`minio:nyhetsbrev-spurt:${firebaseUser.uid}`, ny ? 'ja' : 'nei')
      } catch {
        /* Kontoen husker uansett. */
      }
    } else {
      settNyhetsbrev(!ny)
    }
    settTilstand(ok ? 'klar' : 'feil')
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <h1>Min profil</h1>
            <p>Kontoen din, og hva vi får sende deg.</p>
          </Hero>
          <Innhold>
            <Beholder>
              {loading ? (
                <Kort $midt>
                  <Icon name="faSpinner" spin />
                </Kort>
              ) : !isAuthenticated || !firebaseUser ? (
                <Kort $midt>
                  <Icon name="faLock" />
                  <p>Logg inn for å se profilen din.</p>
                  <Innlogging />
                </Kort>
              ) : (
                <>
                  <Kort>
                    <Konto>
                      {user?.picture ? (
                        <img src={user.picture} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span aria-hidden="true">{(user?.name || user?.email || '?')[0]?.toUpperCase()}</span>
                      )}
                      <div>
                        <strong>{user?.name || 'Uten navn'}</strong>
                        <small>{firebaseUser.email}</small>
                      </div>
                    </Konto>
                    <Fakta>
                      <div>
                        <dt>Innlogging</dt>
                        <dd>{metode(firebaseUser.providerData[0]?.providerId)}</dd>
                      </div>
                      <div>
                        <dt>Medlem siden</dt>
                        <dd>
                          {firebaseUser.metadata.creationTime
                            ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('nb-NO', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '–'}
                        </dd>
                      </div>
                    </Fakta>
                  </Kort>

                  <Kort>
                    <Bryterrad>
                      <div>
                        <h2 id="nyhetsbrev-tittel">Nyhetsbrev</h2>
                        <p>
                          Nye byggeguider, verktøy og tilbud fra Minio – sjelden, og til {firebaseUser.email}. Du
                          kan skru det av og på når du vil.
                        </p>
                      </div>
                      <Bryter
                        type="button"
                        role="switch"
                        aria-checked={nyhetsbrev}
                        aria-labelledby="nyhetsbrev-tittel"
                        $paa={nyhetsbrev}
                        onClick={bytt}
                        disabled={tilstand === 'laster' || tilstand === 'lagrer'}
                      >
                        <span />
                      </Bryter>
                    </Bryterrad>
                    <Status $feil={tilstand === 'feil'} role="status">
                      {tilstand === 'laster'
                        ? 'Henter …'
                        : tilstand === 'lagrer'
                          ? 'Lagrer …'
                          : tilstand === 'feil'
                            ? 'Kunne ikke lagre. Prøv igjen.'
                            : nyhetsbrev
                              ? 'Du får nyhetsbrevet.'
                              : 'Du får ikke nyhetsbrevet.'}
                    </Status>
                  </Kort>

                  <Lenker>
                    <Link to="/mine-design">
                      <Icon name="faPalette" /> Mine design
                    </Link>
                    <Link to="/mine-bestillinger">
                      <Icon name="faClipboardList" /> Mine bestillinger
                    </Link>
                    <Link to="/personvern">
                      <Icon name="faLock" /> Personvern
                    </Link>
                    <button type="button" onClick={() => logout()}>
                      <Icon name="faSignOutAlt" /> Logg ut
                    </button>
                  </Lenker>
                </>
              )}
            </Beholder>
          </Innhold>
        </main>
      </PageTransition>
      <Footer />
    </>
  )
}

const Hero = styled.section`
  padding: 7rem 1.5rem 2.5rem;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  text-align: center;

  h1 {
    margin: 0 0 0.4rem;
    font-size: 2.4rem;
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 5.5rem 1rem 2rem;
    h1 {
      font-size: 1.8rem;
    }
  }
`

const Innhold = styled.section`
  background: ${({ theme }) => theme.colors.paper};
  padding: 2.5rem 1.5rem 5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.25rem 1rem 3rem;
  }
`

const Beholder = styled.div`
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Kort = styled.div<{ $midt?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  ${({ $midt, theme }) =>
    $midt
      ? `align-items: center; text-align: center; color: ${theme.colors.inkMuted}; padding: 3rem 1.5rem; font-size: 1.05rem;`
      : ''}

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.2rem;
  }
`

const Konto = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;

  img,
  > span {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 50%;
  }
  > span {
    display: grid;
    place-items: center;
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accentInk};
    font-weight: 700;
    font-size: 1.2rem;
  }
  div {
    min-width: 0;
  }
  strong {
    display: block;
    font-size: 1.15rem;
    color: ${({ theme }) => theme.colors.ink};
  }
  small {
    display: block;
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    overflow-wrap: anywhere;
  }
`

const Fakta = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  dt {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
  dd {
    margin: 0.15rem 0 0;
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Bryterrad = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.2rem;

  h2 {
    margin: 0 0 0.3rem;
    font-size: 1.15rem;
    color: ${({ theme }) => theme.colors.ink};
  }
  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
    overflow-wrap: anywhere;
  }
`

const Bryter = styled.button<{ $paa: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 30px;
  margin-top: 0.1rem;
  border: none;
  border-radius: 999px;
  background: ${({ $paa, theme }) => ($paa ? theme.colors.success : theme.colors.borderStrong)};
  cursor: pointer;
  transition: background 0.2s;

  span {
    position: absolute;
    top: 3px;
    left: ${({ $paa }) => ($paa ? '25px' : '3px')};
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: left 0.2s;
  }
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }
`

const Status = styled.p<{ $feil: boolean }>`
  margin: -0.3rem 0 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $feil, theme }) => ($feil ? '#9c3621' : theme.colors.inkSubtle)};
`

const Lenker = styled.nav`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;

  a,
  button {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 48px;
    padding: 0 1rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.ink};
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover,
  button:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
  svg {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`
