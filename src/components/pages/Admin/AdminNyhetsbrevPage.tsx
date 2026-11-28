import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { MALER, type Mal } from '../../../data/nyhetsbrevMaler'
import { getAlleNyhetsbrev, opprettNyhetsbrev } from '../../../services/nyhetsbrevService'
import type { Nyhetsbrev } from '../../../types/nyhetsbrev'
import { AdminPageHead, Empty, LasterListe } from './adminUi'
import { bp, t } from './adminTokens'

/**
 * Nyhetsbrev – utkastene, og malene man starter nye fra.
 *
 * Utsendelsen skjer ikke herfra. Brevet kopieres og limes inn i Mail, med
 * mottakerne fra kontaktlista i Blindkopi. Det holder for noen titalls
 * mottakere, og betyr at svar på brevet havner i den vanlige innboksen.
 */

function datoTekst(verdi: unknown): string {
  const d = (verdi as { toDate?: () => Date } | undefined)?.toDate?.()
  return d ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Nå'
}

export default function AdminNyhetsbrevPage() {
  const [brev, settBrev] = useState<Nyhetsbrev[]>([])
  const [laster, settLaster] = useState(true)
  const [lager, settLager] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getAlleNyhetsbrev()
      .then(settBrev)
      .catch(() => settBrev([]))
      .finally(() => settLaster(false))
  }, [])

  const start = async (mal: Mal) => {
    if (lager) return
    settLager(mal.id)
    try {
      const id = await opprettNyhetsbrev(mal.lag())
      navigate(`/admin/kontakter/nyhetsbrev/${id}`)
    } catch {
      settLager(null)
    }
  }

  return (
    <>
      <AdminPageHead
        title="Nyhetsbrev"
        subtitle="Sett sammen brevet av blokker, kopier det og lim det inn i Mail. Mottakerne kopieres fra kontaktlista."
      />

      <Seksjon>
        <h2>Start fra en mal</h2>
        <Malgrid>
          {MALER.map((m) => (
            <Malkort key={m.id} type="button" onClick={() => start(m)} disabled={Boolean(lager)}>
              <Malbilde $bilde={m.bilde}>
                {!m.bilde && <Icon name="faPlus" />}
                {lager === m.id && (
                  <Lagerlag>
                    <Icon name="faSpinner" spin />
                  </Lagerlag>
                )}
              </Malbilde>
              <strong>{m.navn}</strong>
              <small>{m.beskrivelse}</small>
            </Malkort>
          ))}
        </Malgrid>
      </Seksjon>

      <Seksjon>
        <h2>Utkast</h2>
        {laster ? (
          <LasterListe antall={3} />
        ) : brev.length === 0 ? (
          <Empty>
            <h2>Ingen utkast ennå</h2>
            <p>Velg en mal over for å lage det første brevet.</p>
          </Empty>
        ) : (
          <Utkastliste>
            {brev.map((b) => (
              <Utkast key={b.id} to={`/admin/kontakter/nyhetsbrev/${b.id}`}>
                <Icon name="faEnvelopeOpenText" />
                <div>
                  <strong>{b.tittel || 'Uten navn'}</strong>
                  <small>{b.emne || 'Mangler emne'}</small>
                </div>
                <span>
                  {b.blokker?.length ?? 0} blokker · {datoTekst(b.oppdatert)}
                </span>
                <Icon name="faChevronRight" />
              </Utkast>
            ))}
          </Utkastliste>
        )}
      </Seksjon>
    </>
  )
}

const Seksjon = styled.section`
  margin-bottom: 2rem;

  > h2 {
    margin: 0 0 0.9rem;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${t.svak};
  }
`

const Malgrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.9rem;

  @media (max-width: ${bp.smal}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
`

const Malkort = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.55rem 0.55rem 0.85rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  background: ${t.flate};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

  strong {
    margin-top: 0.45rem;
    padding: 0 0.25rem;
    font-size: 0.9rem;
    color: ${t.blekk};
  }
  small {
    padding: 0 0.25rem;
    font-size: 0.78rem;
    line-height: 1.4;
    color: ${t.dempet};
  }
  &:hover:not(:disabled) {
    border-color: ${t.svak};
    box-shadow: ${t.skyggeHev};
    transform: translateY(-1px);
  }
  &:disabled {
    cursor: wait;
  }
`

const Malbilde = styled.div<{ $bilde: string }>`
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  background: ${({ $bilde }) => ($bilde ? `url(${$bilde}) center / cover` : t.senket)};
  color: ${t.svak};
  font-size: 1.1rem;
  overflow: hidden;
`

const Lagerlag = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.7);
  color: ${t.blekk};
`

const Utkastliste = styled.div`
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  overflow: hidden;
`

const Utkast = styled(Link)`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto 12px;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid ${t.kantSvak};
  color: ${t.blekk};
  text-decoration: none;

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${t.senket};
  }
  > svg {
    color: ${t.svak};
    font-size: 0.85rem;
  }
  strong {
    display: block;
    font-size: 0.93rem;
  }
  small {
    display: block;
    margin-top: 0.1rem;
    font-size: 0.8rem;
    color: ${t.dempet};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  span {
    font-size: 0.8rem;
    color: ${t.dempet};
    white-space: nowrap;
  }

  @media (max-width: ${bp.smal}) {
    grid-template-columns: 20px minmax(0, 1fr) 12px;
    span {
      display: none;
    }
  }
`
