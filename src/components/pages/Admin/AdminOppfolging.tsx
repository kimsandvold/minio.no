import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { formatOppfolgingDato, idag, type Oppfolging } from '../../../types/oppfolging'

/**
 * «Gjort», «Sendt» og «Fakturert» med dato – samme kontroll på alle
 * admin-listene (bestillinger, graveringer, forespørsler), slik at det ser
 * likt ut og oppfører seg likt uansett hvor bestillingen kom inn.
 *
 * Lagrer med én gang du huker av eller endrer datoen; ingen Lagre-knapp.
 * Hakes en markør på, settes dagens dato automatisk – men datofeltet står
 * åpent, så en faktura du sendte i forrige uke kan bokføres på riktig dag.
 * Hakes den av igjen, nullstilles datoen.
 */

type Tone = 'gjort' | 'sendt' | 'faktura'

interface Markor {
  felt: 'gjort' | 'sendt' | 'fakturert'
  dato: 'gjortDato' | 'sendtDato' | 'fakturaDato'
  etikett: string
  datoEtikett: string
  ikon: string
  tone: Tone
}

/** I den rekkefølgen jobben vanligvis går: gjort → sendt → fakturert. */
const MARKORER: Markor[] = [
  { felt: 'gjort', dato: 'gjortDato', etikett: 'Gjort', datoEtikett: 'Dato utført', ikon: 'faCircleCheck', tone: 'gjort' },
  { felt: 'sendt', dato: 'sendtDato', etikett: 'Sendt', datoEtikett: 'Dato sendt', ikon: 'faTruck', tone: 'sendt' },
  { felt: 'fakturert', dato: 'fakturaDato', etikett: 'Fakturert', datoEtikett: 'Fakturadato', ikon: 'faFileInvoice', tone: 'faktura' },
]

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
      {MARKORER.map((m) => {
        const pa = Boolean(verdi[m.felt])
        return (
          <Felt key={m.felt} $av={pa}>
            <label>
              <input
                type="checkbox"
                checked={pa}
                onChange={(e) =>
                  lagre({
                    [m.felt]: e.target.checked,
                    [m.dato]: e.target.checked ? (verdi[m.dato] ?? idag()) : null,
                  })
                }
              />
              <Icon name={pa ? 'faCircleCheck' : 'faCircle'} /> {m.etikett}
            </label>
            {pa && (
              <Dato
                type="date"
                value={verdi[m.dato] ?? ''}
                onChange={(e) => lagre({ [m.dato]: e.target.value || null })}
                aria-label={m.datoEtikett}
              />
            )}
          </Felt>
        )
      })}

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
 * Kompakt visning av de samme markørene, til korttopper og sammenslåtte
 * lister der kontrollen ikke er synlig. Viser ingenting når ingen er satt.
 */
export function OppfolgingMerker({ verdi }: { verdi: Oppfolging }) {
  const satt = MARKORER.filter((m) => verdi[m.felt])
  if (satt.length === 0) return null
  return (
    <Merker>
      {satt.map((m) => (
        <Merke key={m.felt} $tone={m.tone}>
          <Icon name={m.ikon} /> {m.etikett}
          {verdi[m.dato] ? ` ${formatOppfolgingDato(verdi[m.dato])}` : ''}
        </Merke>
      ))}
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

const MERKEFARGER: Record<Tone, { farge: string; bakgrunn: string }> = {
  gjort: { farge: '#2f5d3a', bakgrunn: 'rgba(90, 143, 90, 0.16)' },
  sendt: { farge: '#2f4f6b', bakgrunn: 'rgba(70, 120, 170, 0.16)' },
  faktura: { farge: '#6b4a2f', bakgrunn: 'rgba(197, 149, 62, 0.18)' },
}

const Merke = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $tone }) => MERKEFARGER[$tone].farge};
  background: ${({ $tone }) => MERKEFARGER[$tone].bakgrunn};
`
