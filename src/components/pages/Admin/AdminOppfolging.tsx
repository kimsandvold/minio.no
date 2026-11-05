import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { formatOppfolgingDato, idag, type Oppfolging } from '../../../types/oppfolging'

/**
 * «Gjort» og «Fakturert med dato» – samme kontroll på alle admin-listene
 * (bestillinger, graveringer, forespørsler), slik at det ser likt ut og
 * oppfører seg likt uansett hvor bestillingen kom inn.
 *
 * Lagrer med én gang du huker av eller endrer datoen; ingen Lagre-knapp.
 * Hakes «Gjort» eller «Fakturert» på, settes dagens dato automatisk – men
 * datofeltet står åpent, så en faktura du sendte i forrige uke kan bokføres
 * på riktig dag. Hakes den av igjen, nullstilles datoen.
 */

interface Props {
  verdi: Oppfolging
  /** Skriver endringen til Firestore. Kaster ved feil. */
  onLagre: (endring: Oppfolging) => Promise<void>
}

export default function AdminOppfolging({ verdi, onLagre }: Props) {
  const [lagrer, setLagrer] = useState(false)
  const [feilet, setFeilet] = useState(false)

  const lagre = async (endring: Oppfolging) => {
    setLagrer(true)
    setFeilet(false)
    try {
      await onLagre(endring)
    } catch {
      setFeilet(true)
    }
    setLagrer(false)
  }

  return (
    <Rad>
      <Felt $av={Boolean(verdi.gjort)}>
        <label>
          <input
            type="checkbox"
            checked={Boolean(verdi.gjort)}
            onChange={(e) =>
              lagre({
                gjort: e.target.checked,
                gjortDato: e.target.checked ? (verdi.gjortDato ?? idag()) : null,
              })
            }
          />
          <Icon name={verdi.gjort ? 'faCircleCheck' : 'faCircle'} /> Gjort
        </label>
        {verdi.gjort && (
          <Dato
            type="date"
            value={verdi.gjortDato ?? ''}
            onChange={(e) => lagre({ gjortDato: e.target.value || null })}
            aria-label="Dato utført"
          />
        )}
      </Felt>

      <Felt $av={Boolean(verdi.fakturert)}>
        <label>
          <input
            type="checkbox"
            checked={Boolean(verdi.fakturert)}
            onChange={(e) =>
              lagre({
                fakturert: e.target.checked,
                fakturaDato: e.target.checked ? (verdi.fakturaDato ?? idag()) : null,
              })
            }
          />
          <Icon name={verdi.fakturert ? 'faCircleCheck' : 'faCircle'} /> Fakturert
        </label>
        {verdi.fakturert && (
          <Dato
            type="date"
            value={verdi.fakturaDato ?? ''}
            onChange={(e) => lagre({ fakturaDato: e.target.value || null })}
            aria-label="Fakturadato"
          />
        )}
      </Felt>

      {lagrer && <Status><Icon name="faSpinner" spin /> Lagrer …</Status>}
      {feilet && !lagrer && (
        <Status $feil>
          <Icon name="faExclamationTriangle" /> Ikke lagret – prøv igjen
        </Status>
      )}
    </Rad>
  )
}

/**
 * Kompakt visning av de samme to markørene, til korttopper og sammenslåtte
 * lister der kontrollen ikke er synlig. Viser ingenting når ingen er satt.
 */
export function OppfolgingMerker({ verdi }: { verdi: Oppfolging }) {
  if (!verdi.gjort && !verdi.fakturert) return null
  return (
    <Merker>
      {verdi.gjort && (
        <Merke $tone="gjort">
          <Icon name="faCircleCheck" /> Gjort
          {verdi.gjortDato ? ` ${formatOppfolgingDato(verdi.gjortDato)}` : ''}
        </Merke>
      )}
      {verdi.fakturert && (
        <Merke $tone="faktura">
          <Icon name="faFileInvoice" /> Fakturert
          {verdi.fakturaDato ? ` ${formatOppfolgingDato(verdi.fakturaDato)}` : ''}
        </Merke>
      )}
    </Merker>
  )
}

const Rad = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.9rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e7e5df;
  border-radius: 10px;
  background: #faf9f5;
`

const Felt = styled.div<{ $av: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: ${({ $av }) => ($av ? '#2f5d3a' : '#6b6860')};
    cursor: pointer;
    user-select: none;
  }

  /* Haken selv skjules – ikonet i etiketten er avkryssingsboksen visuelt. */
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  svg {
    font-size: 0.95rem;
    color: ${({ $av }) => ($av ? '#3f7a3f' : '#c3bfb5')};
  }

  input:focus-visible + svg,
  label:focus-within svg {
    outline: 2px solid #3f7a3f;
    outline-offset: 2px;
    border-radius: 50%;
  }
`

const Dato = styled.input`
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd4c7;
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 0.82rem;
  color: #16181d;
  cursor: pointer;
`

const Status = styled.span<{ $feil?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ $feil }) => ($feil ? '#a8512c' : '#8a857b')};
`

const Merker = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`

const Merke = styled.span<{ $tone: 'gjort' | 'faktura' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $tone }) => ($tone === 'gjort' ? '#2f5d3a' : '#6b4a2f')};
  background: ${({ $tone }) => ($tone === 'gjort' ? 'rgba(90, 143, 90, 0.16)' : 'rgba(197, 149, 62, 0.18)')};
`
