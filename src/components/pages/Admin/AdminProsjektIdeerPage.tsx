import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleProsjektIdeer, oppdaterProsjektIdeStatus } from '../../../services/prosjektIdeService'
import type { ProsjektIde, ProsjektIdeStatus } from '../../../types/prosjektIde'
import { prosjektIdeStatusLabel } from '../../../types/prosjektIde'
import { AdminPageHead, Empty, LasterListe, Tab, Tabs } from './adminUi'
import { Liste, Rad, Radhandlinger } from './AdminListe'
import { Sekundaer, Sitat, StatusVelg } from './AdminKort'

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
        <LasterListe antall={4} />
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
                <Rad
                  key={ide.id}
                  tittel={ide.navn}
                  undertittel={ide.prosjektType || 'Prosjektidé'}
                  status={
                    <StatusVelg
                      value={ide.status}
                      onChange={(e) => ide.id && setStatus(ide.id, e.target.value as ProsjektIdeStatus)}
                      aria-label="Status"
                    >
                      {statuser.map((st) => (
                        <option key={st} value={st}>
                          {prosjektIdeStatusLabel[st]}
                        </option>
                      ))}
                    </StatusVelg>
                  }
                  kolonner={ide.sted ? [{ merkelapp: 'Sted', verdi: ide.sted }] : undefined}
                  dato={datoTekst(ide.createdAt)}
                >
                  <Kontaktlinje>
                    <a href={`mailto:${ide.epost}`}>
                      <Icon name="faEnvelope" /> {ide.epost}
                    </a>
                  </Kontaktlinje>

                  <Sitat>{ide.melding}</Sitat>

                  <Radhandlinger>
                    <Sekundaer href={svarLenke(ide)}>
                      <Icon name="faPaperPlane" /> Svar på e-post
                    </Sekundaer>
                    <Sekundaer as="button" type="button" onClick={() => navigator.clipboard?.writeText(ide.epost)}>
                      <Icon name="faCopy" /> Kopier e-post
                    </Sekundaer>
                  </Radhandlinger>
                </Rad>
              ))}
            </Liste>
          )}
        </>
      )}
    </>
  )
}

const Kontaktlinje = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1.2rem;
  font-size: 0.86rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: #111827;
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  a:hover { text-decoration: underline; }
  svg { font-size: 0.78rem; color: #9ca3af; }

  @media (max-width: 640px) {
    a { min-height: 38px; }
  }
`
