import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { useAuthContext } from '../../context/AuthContext'

/**
 * Spør en innlogget bruker om nyhetsbrev – én gang.
 *
 * Innlogging er ikke samtykke til markedsføring, så kontaktlista har mange
 * kontoer med `nyhetsbrev: false`. Dette er veien til et ekte ja: et lite
 * spørsmål i hjørnet, et stykke ut i økta, som forsvinner for godt på
 * «Nei takk». Svaret lagres som samtykke med dato og kilde, akkurat som fra
 * skjemaet i footeren.
 *
 * «Nei takk» huskes i nettleseren, ikke i Firestore. Prisen er at en som
 * bytter enhet kan bli spurt én gang til – det er bedre enn å utvide
 * kontaktraden med et felt reglene må passe på.
 */

const FORSINKELSE_MS = 8000
const nokkel = (uid: string) => `minio:nyhetsbrev-spurt:${uid}`

function alleredeSpurt(uid: string): boolean {
  try {
    return localStorage.getItem(nokkel(uid)) !== null
  } catch {
    // Uten lagring kan vi ikke huske svaret, og da spør vi heller ikke.
    return true
  }
}

function huskSvar(uid: string, svar: 'ja' | 'nei'): void {
  try {
    localStorage.setItem(nokkel(uid), svar)
  } catch {
    /* Se alleredeSpurt. */
  }
}

export default function NyhetsbrevSporsmal() {
  const { firebaseUser, isAdmin } = useAuthContext()
  const { pathname } = useLocation()
  const [synlig, settSynlig] = useState(false)
  const [tilstand, settTilstand] = useState<'sporsmal' | 'sender' | 'takk'>('sporsmal')

  const uid = firebaseUser?.uid
  const epost = firebaseUser?.email ?? ''
  // Ikke midt i admin, handlekurven eller et verktøy der hjørnet er i bruk.
  const stille = /^\/(admin|handlekurv|designverktoy|3d-design|planleggere|gravering)/.test(pathname)

  useEffect(() => {
    if (!uid || !epost || isAdmin || alleredeSpurt(uid)) return
    let avbrutt = false
    const tid = setTimeout(async () => {
      const { harNyhetsbrev } = await import('../../services/kontaktService')
      const har = await harNyhetsbrev(uid)
      if (avbrutt) return
      // Står allerede på lista: aldri spør igjen på denne enheten.
      if (har === true) huskSvar(uid, 'ja')
      else if (har === false) settSynlig(true)
    }, FORSINKELSE_MS)
    return () => {
      avbrutt = true
      clearTimeout(tid)
    }
  }, [uid, epost, isAdmin])

  if (!synlig || !uid || stille) return null

  const nei = () => {
    huskSvar(uid, 'nei')
    settSynlig(false)
  }

  const ja = async () => {
    settTilstand('sender')
    const { meldPaaNyhetsbrev } = await import('../../services/kontaktService')
    const ok = await meldPaaNyhetsbrev(epost, firebaseUser?.displayName ?? '', 'innlogging', uid)
    if (!ok) {
      // Ikke husk noe – da kan vi spørre igjen neste økt.
      settSynlig(false)
      return
    }
    huskSvar(uid, 'ja')
    settTilstand('takk')
    setTimeout(() => settSynlig(false), 4000)
  }

  return (
    <Kort role="dialog" aria-label="Nyhetsbrev">
      {tilstand === 'takk' ? (
        <Takk role="status">
          <Icon name="faCheck" /> Takk! Du står på lista.
        </Takk>
      ) : (
        <>
          <Lukk type="button" onClick={nei} aria-label="Lukk">
            <Icon name="faXmark" />
          </Lukk>
          <strong>Vil du ha nyhetsbrev fra Minio?</strong>
          <p>
            Nye byggeguider, verktøy og tilbud – sjelden, og til {epost}. Du kan melde deg av når som helst.{' '}
            <Link to="/personvern">Personvern</Link>
          </p>
          <Knapper>
            <Ja type="button" onClick={ja} disabled={tilstand === 'sender'}>
              Ja takk
            </Ja>
            <Nei type="button" onClick={nei}>
              Nei takk
            </Nei>
          </Knapper>
        </>
      )}
    </Kort>
  )
}

const Kort = styled.div`
  position: fixed;
  left: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 900;
  width: min(340px, calc(100vw - 2rem));
  padding: 1rem 1.1rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  box-shadow: 0 10px 30px -12px rgba(28, 26, 24, 0.35);

  strong {
    display: block;
    padding-right: 1.6rem;
    font-size: 0.98rem;
  }
  p {
    margin: 0.35rem 0 0.85rem;
    font-size: 0.85rem;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.inkMuted};
    overflow-wrap: anywhere;
  }
  a {
    color: inherit;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
    bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  }
`

const Lukk = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.inkSubtle};
  cursor: pointer;
`

const Knapper = styled.div`
  display: flex;
  gap: 0.5rem;

  button {
    flex: 1;
    min-height: 40px;
    border-radius: 999px;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
  }
`

const Ja = styled.button`
  border: none;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`

const Nei = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: none;
  color: ${({ theme }) => theme.colors.ink};
`

const Takk = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.success};
`
