import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleProsjektIdeer, oppdaterProsjektIdeStatus } from '../../../services/prosjektIdeService'
import type { ProsjektIde, ProsjektIdeStatus } from '../../../types/prosjektIde'
import { prosjektIdeStatusLabel } from '../../../types/prosjektIde'
import { AdminPageHead, Tabs, Tab, Loading, Empty } from './adminUi'

/**
 * Prosjektidéer fra /prosjekthjelp. Dialogen med innsenderen går på e-post:
 * «Svar på e-post» åpner e-postklienten med emne og en høflig start ferdig
 * utfylt, så terskelen for å svare raskt er lav.
 */

function svarLenke(ide: ProsjektIde): string {
  const emne = `Prosjektidéen din${ide.prosjektType ? ` – ${ide.prosjektType.toLowerCase()}` : ''} – Minio`
  const fornavn = ide.navn.trim().split(' ')[0] || ''
  const kropp = [
    `Hei${fornavn ? ` ${fornavn}` : ''}!`,
    ``,
    `Takk for at du delte idéen din på minio.no – her kommer mine tanker:`,
    ``,
    ``,
    `Vennlig hilsen`,
    `Kim / Minio`,
  ].join('\n')
  return `mailto:${ide.epost}?subject=${encodeURIComponent(emne)}&body=${encodeURIComponent(kropp)}`
}

function datoTekst(createdAt: unknown): string {
  const ts = createdAt as { toDate?: () => Date } | undefined
  const d = ts?.toDate?.()
  return d ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

type FilterKey = 'alle' | ProsjektIdeStatus
const filterOptions: FilterKey[] = ['alle', 'ny', 'besvart', 'lukket']
const statuser: ProsjektIdeStatus[] = ['ny', 'besvart', 'lukket']

export default function AdminProsjektIdeerPage() {
  const [liste, setListe] = useState<ProsjektIde[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('alle')

  useEffect(() => {
    getAlleProsjektIdeer().then(setListe).finally(() => setLoading(false))
  }, [])

  const setStatus = async (id: string, status: ProsjektIdeStatus) => {
    setListe((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
    try { await oppdaterProsjektIdeStatus(id, status) } catch { /* optimistisk */ }
  }

  const synlige = filter === 'alle' ? liste : liste.filter((i) => i.status === filter)
  const antall = (k: FilterKey) => (k === 'alle' ? liste.length : liste.filter((i) => i.status === k).length)

  return (
    <>
      <AdminPageHead title="Prosjektidéer" subtitle="Innsendte idéer fra /prosjekthjelp. Svar går på e-post." />

      {loading ? (
        <Loading><Icon name="faSpinner" spin /> Laster prosjektidéer …</Loading>
      ) : (
        <>
          <Tabs>
            {filterOptions.map((k) => (
              <Tab key={k} $active={filter === k} onClick={() => setFilter(k)}>
                {k === 'alle' ? 'Alle' : prosjektIdeStatusLabel[k]} <em>({antall(k)})</em>
              </Tab>
            ))}
          </Tabs>

          {synlige.length === 0 ? (
            <Empty><h2>Ingen prosjektidéer</h2><p>Ingen idéer med denne statusen.</p></Empty>
          ) : (
            <Liste>
              {synlige.map((ide) => (
                <Kort key={ide.id}>
                  <KortTop>
                    <div>
                      <h3>
                        {ide.navn}
                        {ide.prosjektType && <TypeTag>{ide.prosjektType}</TypeTag>}
                      </h3>
                      <Meta>
                        <span><Icon name="faEnvelope" /> {ide.epost}</span>
                        {ide.sted && <span><Icon name="faMap" /> {ide.sted}</span>}
                        {datoTekst(ide.createdAt) && <span><Icon name="faClock" /> {datoTekst(ide.createdAt)}</span>}
                      </Meta>
                    </div>
                    <StatusVelg value={ide.status} onChange={(e) => ide.id && setStatus(ide.id, e.target.value as ProsjektIdeStatus)}>
                      {statuser.map((s) => <option key={s} value={s}>{prosjektIdeStatusLabel[s]}</option>)}
                    </StatusVelg>
                  </KortTop>

                  <Melding>{ide.melding}</Melding>

                  <Handlinger>
                    <SvarKnapp href={svarLenke(ide)}>
                      <Icon name="faPaperPlane" /> Svar på e-post
                    </SvarKnapp>
                    <KopierKnapp
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(ide.epost)}
                      title="Kopier e-postadressen"
                    >
                      <Icon name="faCopy" /> Kopier e-post
                    </KopierKnapp>
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
  margin-bottom: 0.9rem;

  h3 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    font-size: 1.08rem;
    margin: 0 0 0.35rem;
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const TypeTag = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  padding: 0.2rem 0.6rem;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.1rem;
  font-size: 0.85rem;
  color: #6b6157;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  svg {
    opacity: 0.6;
  }
`

const StatusVelg = styled.select`
  font: inherit;
  font-size: 0.88rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd6cf;
  border-radius: 8px;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  flex-shrink: 0;
`

const Melding = styled.p`
  font-size: 0.95rem;
  line-height: 1.65;
  color: #3f3f3f;
  white-space: pre-wrap;
  background: ${({ theme }) => theme.colors.lightBg};
  border-radius: 10px;
  padding: 0.9rem 1.1rem;
  margin: 0 0 1rem;
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`

const SvarKnapp = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  padding: 0.6rem 1.2rem;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

const KopierKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border: 1px solid #ddd6cf;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`
