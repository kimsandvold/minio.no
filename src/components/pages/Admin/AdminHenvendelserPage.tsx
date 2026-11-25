import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleHenvendelser, oppdaterHenvendelseStatus } from '../../../services/henvendelseService'
import type { Henvendelse, HenvendelseStatus } from '../../../types/henvendelse'
import { henvendelseStatusLabel, henvendelseKildeLabel } from '../../../types/henvendelse'
import { AdminPageHead, Empty, LasterListe, Tab, Tabs } from './adminUi'
import { Liste, Radhandlinger, Rad } from './AdminListe'
import { Sekundaer, Sitat, StatusVelg } from './AdminKort'

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
        <LasterListe antall={4} />
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
                <Rad
                  key={h.id}
                  tittel={h.emne}
                  undertittel={`${h.navn} · ${henvendelseKildeLabel[h.kilde]}`}
                  status={
                    <StatusVelg
                      value={h.status}
                      onChange={(e) => h.id && setStatus(h.id, e.target.value as HenvendelseStatus)}
                      aria-label="Status"
                    >
                      {statuser.map((st) => (
                        <option key={st} value={st}>
                          {henvendelseStatusLabel[st]}
                        </option>
                      ))}
                    </StatusVelg>
                  }
                  dato={datoTekst(h.createdAt)}
                >
                  <Kontaktlinje>
                    <a href={`mailto:${h.epost}`}>
                      <Icon name="faEnvelope" /> {h.epost}
                    </a>
                    {h.mobil && (
                      <a href={`tel:${h.mobil.replace(/\s/g, '')}`}>
                        <Icon name="faPhone" /> {h.mobil}
                      </a>
                    )}
                  </Kontaktlinje>

                  <Sitat>{h.melding}</Sitat>

                  {h.detaljer && Object.keys(h.detaljer).length > 0 && (
                    <Detaljliste>
                      {Object.entries(h.detaljer).map(([k, v]) => (
                        <div key={k}>
                          <em>{k}</em>
                          <span>{v}</span>
                        </div>
                      ))}
                    </Detaljliste>
                  )}

                  <Radhandlinger>
                    <Sekundaer href={svarLenke(h)}>
                      <Icon name="faPaperPlane" /> Svar på e-post
                    </Sekundaer>
                    <Sekundaer as="button" type="button" onClick={() => navigator.clipboard?.writeText(h.epost)}>
                      <Icon name="faCopy" /> Kopier e-post
                    </Sekundaer>
                    {h.mobil && (
                      <Sekundaer as="button" type="button" onClick={() => navigator.clipboard?.writeText(h.mobil)}>
                        <Icon name="faCopy" /> Kopier mobil
                      </Sekundaer>
                    )}
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
    flex-direction: column;
    gap: 0.1rem;
    /* Egen linje med høyde nok til å treffes med tommelen. */
    a { min-height: 38px; }
  }
`

const Detaljliste = styled.div`
  display: grid;
  gap: 0.25rem;
  font-size: 0.83rem;

  div { display: flex; gap: 0.5rem; }
  em {
    flex-shrink: 0;
    font-style: normal;
    font-weight: 600;
    color: #6b7280;
    min-width: 7rem;
  }
  span { color: #111827; overflow-wrap: anywhere; }
`
