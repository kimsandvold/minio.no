import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleHenvendelser, oppdaterHenvendelseStatus } from '../../../services/henvendelseService'
import type { Henvendelse, HenvendelseStatus, HenvendelseKilde } from '../../../types/henvendelse'
import { henvendelseStatusLabel, henvendelseKildeLabel } from '../../../types/henvendelse'
import { AdminPageHead, Tabs, Tab, Loading, Empty } from './adminUi'

/**
 * Henvendelser fra kontaktskjemaet og «eget emne».
 *
 * Disse gikk tidligere bare på e-post via Formspree, og fantes ingen steder
 * hvis e-posten druknet. Nå lagres de også, og listes her. Dialogen videre går
 * fortsatt på e-post – «Svar» åpner e-postklienten med en ferdig start.
 */

function svarLenke(h: Henvendelse): string {
  const emne = `${h.emne} – Minio`
  const fornavn = h.navn.trim().split(' ')[0] || ''
  const kropp = [
    `Hei${fornavn ? ` ${fornavn}` : ''}!`,
    ``,
    `Takk for at du tok kontakt med Minio –`,
    ``,
    ``,
    `Vennlig hilsen`,
    `Kim / Minio`,
  ].join('\n')
  return `mailto:${h.epost}?subject=${encodeURIComponent(emne)}&body=${encodeURIComponent(kropp)}`
}

function datoTekst(createdAt: unknown): string {
  const ts = createdAt as { toDate?: () => Date } | undefined
  const d = ts?.toDate?.()
  return d ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

type FilterKey = 'alle' | HenvendelseStatus
const filterOptions: FilterKey[] = ['alle', 'ny', 'besvart', 'lukket']
const statuser: HenvendelseStatus[] = ['ny', 'besvart', 'lukket']

export default function AdminHenvendelserPage() {
  const [liste, setListe] = useState<Henvendelse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('alle')

  useEffect(() => {
    getAlleHenvendelser().then(setListe).finally(() => setLoading(false))
  }, [])

  const setStatus = async (id: string, status: HenvendelseStatus) => {
    setListe((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)))
    try { await oppdaterHenvendelseStatus(id, status) } catch { /* optimistisk */ }
  }

  const synlige = filter === 'alle' ? liste : liste.filter((h) => h.status === filter)
  const antall = (k: FilterKey) => (k === 'alle' ? liste.length : liste.filter((h) => h.status === k).length)

  return (
    <>
      <AdminPageHead
        title="Henvendelser"
        subtitle="Kontaktskjema og «eget emne». Lagres i tillegg til e-postvarselet."
      />

      {loading ? (
        <Loading><Icon name="faSpinner" spin /> Laster henvendelser …</Loading>
      ) : (
        <>
          <Tabs>
            {filterOptions.map((k) => (
              <Tab key={k} $active={filter === k} onClick={() => setFilter(k)}>
                {k === 'alle' ? 'Alle' : henvendelseStatusLabel[k]} <em>({antall(k)})</em>
              </Tab>
            ))}
          </Tabs>

          {synlige.length === 0 ? (
            <Empty><h2>Ingen henvendelser</h2><p>Ingen henvendelser med denne statusen.</p></Empty>
          ) : (
            <Liste>
              {synlige.map((h) => (
                <Kort key={h.id}>
                  <KortTop>
                    <div>
                      <h3>
                        {h.navn}
                        <KildeTag $kilde={h.kilde}>{henvendelseKildeLabel[h.kilde]}</KildeTag>
                      </h3>
                      <Meta>
                        <span><Icon name="faEnvelope" /> {h.epost}</span>
                        {h.mobil && <span><Icon name="faPhone" /> {h.mobil}</span>}
                        {datoTekst(h.createdAt) && <span><Icon name="faClock" /> {datoTekst(h.createdAt)}</span>}
                      </Meta>
                    </div>
                    <StatusVelg
                      value={h.status}
                      onChange={(e) => h.id && setStatus(h.id, e.target.value as HenvendelseStatus)}
                    >
                      {statuser.map((s) => <option key={s} value={s}>{henvendelseStatusLabel[s]}</option>)}
                    </StatusVelg>
                  </KortTop>

                  <Emne>{h.emne}</Emne>
                  <Melding>{h.melding}</Melding>

                  {h.detaljer && Object.keys(h.detaljer).length > 0 && (
                    <Detaljer>
                      {Object.entries(h.detaljer).map(([k, v]) => (
                        <div key={k}><em>{k}</em><span>{v}</span></div>
                      ))}
                    </Detaljer>
                  )}

                  <Handlinger>
                    <SvarKnapp href={svarLenke(h)}>
                      <Icon name="faPaperPlane" /> Svar på e-post
                    </SvarKnapp>
                    <KopierKnapp type="button" onClick={() => navigator.clipboard?.writeText(h.epost)}>
                      <Icon name="faCopy" /> Kopier e-post
                    </KopierKnapp>
                    {h.mobil && (
                      <KopierKnapp type="button" onClick={() => navigator.clipboard?.writeText(h.mobil)}>
                        <Icon name="faCopy" /> Kopier mobil
                      </KopierKnapp>
                    )}
                  </Handlinger>
                </Kort>
              ))}
            </Liste>
          )}
        </>
      )}
    </>
  )
}

const Liste = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Kort = styled.article`
  background: #fff;
  border: 1px solid #e8e4df;
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
`

const KortTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  h3 {
    margin: 0 0 0.35rem;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
`

const KildeTag = styled.span<{ $kilde: HenvendelseKilde }>`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${({ $kilde }) => ($kilde === 'eget-emne' ? '#f7e8de' : '#eef1f5')};
  color: ${({ $kilde }) => ($kilde === 'eget-emne' ? '#7a3a1e' : '#4a5563')};
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  font-size: 0.82rem;
  color: #6b6157;

  svg { margin-right: 0.3rem; opacity: 0.6; }
`

const StatusVelg = styled.select`
  flex: none;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd6cd;
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
`

const Emne = styled.p`
  margin: 0.9rem 0 0.3rem;
  font-weight: 600;
  font-size: 0.92rem;
`

const Melding = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #4a433c;
`

const Detaljer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;

  div {
    display: flex;
    flex-direction: column;
    padding: 0.4rem 0.7rem;
    background: #faf7f2;
    border: 1px solid #ece6dd;
    border-radius: 8px;
  }
  em {
    font-style: normal;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8a7f72;
  }
  span { font-size: 0.85rem; font-weight: 500; }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.1rem;
`

const SvarKnapp = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: 9px;
  background: #a8512c;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;

  &:hover { background: #8e4223; }
`

const KopierKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border: 1px solid #ddd6cd;
  border-radius: 9px;
  background: #fff;
  color: #4a433c;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover { background: #faf7f2; }
`
