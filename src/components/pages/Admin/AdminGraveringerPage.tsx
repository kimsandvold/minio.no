import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import GraveringPreview from '../Gravering/GraveringPreview'
import {
  getAlleGraveringer,
  graveringStatusLabel,
  oppdaterGraveringOppfolging,
  oppdaterGraveringStatus,
  type GraveringBestilling,
  type GraveringStatus,
} from '../../../services/graveringService'
import type { Oppfolging } from '../../../types/oppfolging'
import AdminOppfolging from './AdminOppfolging'
import { AdminPageHead, Empty, Loading, Tab, Tabs } from './adminUi'

/**
 * Graveringsbestillinger fra /gravering.
 *
 * Hvert kort bærer produksjonsfila: SVG-en ble bygget da kunden sendte inn, med
 * teksten konvertert til kurver. «Last ned SVG» gir derfor en fil som kan
 * sendes rett til graveringsmaskinen, uten at skriften må finnes på maskinen.
 */

function datoTekst(createdAt: unknown): string {
  const d = (createdAt as { toDate?: () => Date } | undefined)?.toDate?.()
  return d ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

function svarLenke(b: GraveringBestilling): string {
  const fornavn = b.navn.trim().split(' ')[0] || ''
  const kropp = [
    `Hei${fornavn ? ` ${fornavn}` : ''}!`,
    '',
    `Takk for graveringsforespørselen på ${b.produktNavn.toLowerCase()}. Her kommer korrektur og tilbud:`,
    '',
    b.sammendrag,
    '',
    'Si fra om noe skal endres, så graverer vi når du har godkjent.',
    '',
    'Vennlig hilsen',
    'Kim / Minio',
  ].join('\n')
  return `mailto:${b.epost}?subject=${encodeURIComponent(`Gravering – ${b.produktNavn} – Minio`)}&body=${encodeURIComponent(kropp)}`
}

function lastNed(b: GraveringBestilling): void {
  const url = URL.createObjectURL(new Blob([b.svg], { type: 'image/svg+xml' }))
  const a = document.createElement('a')
  a.href = url
  a.download = b.filnavn || 'gravering.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

// «usendt» og «ufakturert» er arbeidslistene: alt som ikke er sendt eller
// fakturert ennå, uavhengig av hvor langt dialogen med kunden har kommet.
type FilterKey = 'alle' | GraveringStatus | 'usendt' | 'ufakturert'
const filtre: FilterKey[] = ['alle', 'ny', 'besvart', 'lukket', 'usendt', 'ufakturert']
const statuser: GraveringStatus[] = ['ny', 'besvart', 'lukket']

const filterNavn = (k: FilterKey) =>
  k === 'alle' ? 'Alle'
    : k === 'usendt' ? 'Ikke sendt'
    : k === 'ufakturert' ? 'Ikke fakturert'
    : graveringStatusLabel[k]

const treffer = (b: GraveringBestilling, k: FilterKey) =>
  k === 'alle' ? true
    : k === 'usendt' ? !b.sendt
    : k === 'ufakturert' ? !b.fakturert
    : b.status === k

export default function AdminGraveringerPage() {
  const [liste, setListe] = useState<GraveringBestilling[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('alle')

  useEffect(() => {
    getAlleGraveringer()
      .then(setListe)
      .finally(() => setLoading(false))
  }, [])

  const setOppfolging = async (id: string, endring: Oppfolging) => {
    await oppdaterGraveringOppfolging(id, endring)
    setListe((prev) => prev.map((b) => (b.id === id ? { ...b, ...endring } : b)))
  }

  const setStatus = async (id: string, status: GraveringStatus) => {
    setListe((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    try {
      await oppdaterGraveringStatus(id, status)
    } catch {
      /* optimistisk – listen hentes på nytt ved neste besøk */
    }
  }

  // Hvor mange varer hører til hver bestilling – til «1 av 3 i ordren».
  const ordrer = liste.reduce<Record<string, number>>((n, b) => {
    if (b.ordreId) n[b.ordreId] = (n[b.ordreId] ?? 0) + 1
    return n
  }, {})

  const synlige = liste.filter((b) => treffer(b, filter))
  const antall = (k: FilterKey) => liste.filter((b) => treffer(b, k)).length

  return (
    <>
      <AdminPageHead
        title="Graveringer"
        subtitle="Bestillinger fra /gravering. SVG-en er ferdig vektorisert og klar for maskinen."
      />

      {loading ? (
        <Loading>
          <Icon name="faSpinner" spin /> Laster graveringer …
        </Loading>
      ) : (
        <>
          <Tabs>
            {filtre.map((k) => (
              <Tab key={k} $active={filter === k} onClick={() => setFilter(k)}>
                {filterNavn(k)} <em>({antall(k)})</em>
              </Tab>
            ))}
          </Tabs>

          {synlige.length === 0 ? (
            <Empty>
              <h2>Ingen graveringer</h2>
              <p>{filter === 'usendt' ? 'Alt er sendt.' : filter === 'ufakturert' ? 'Alt er fakturert.' : 'Ingen bestillinger med denne statusen.'}</p>
            </Empty>
          ) : (
            <Liste>
              {synlige.map((b) => (
                <Kort key={b.id}>
                  <Visning>
                    <GraveringPreview dekorativ valg={b.valg} />
                  </Visning>

                  <Innhold>
                    <KortTopp>
                      <div>
                        <h3>
                          {b.navn}
                          <Tag>
                            {b.produktNavn}
                            {b.antall > 1 ? ` × ${b.antall}` : ''}
                          </Tag>
                          {/* Flere varer i samme bestilling deler ordreId og
                              skal pakkes og faktureres sammen. */}
                          {ordrer[b.ordreId] > 1 && <Ordretag>1 av {ordrer[b.ordreId]} i ordren</Ordretag>}
                        </h3>
                        <Meta>
                          <span>
                            <Icon name="faEnvelope" /> {b.epost}
                          </span>
                          {b.telefon && (
                            <span>
                              <Icon name="faPhone" /> {b.telefon}
                            </span>
                          )}
                          {b.adresse && (
                            <span>
                              <Icon name="faTruck" /> {b.adresse}, {b.postnr} {b.sted}
                            </span>
                          )}
                          {datoTekst(b.createdAt) && (
                            <span>
                              <Icon name="faClock" /> {datoTekst(b.createdAt)}
                            </span>
                          )}
                          <span>
                            <Icon name="faTag" /> {kr(b.prisSum)}
                          </span>
                        </Meta>
                      </div>
                      <StatusVelg
                        value={b.status}
                        onChange={(e) => b.id && setStatus(b.id, e.target.value as GraveringStatus)}
                      >
                        {statuser.map((s) => (
                          <option key={s} value={s}>
                            {graveringStatusLabel[s]}
                          </option>
                        ))}
                      </StatusVelg>
                    </KortTopp>

                    <Spek>{b.sammendrag}</Spek>
                    {b.melding && <Melding>«{b.melding}»</Melding>}

                    {b.id && (
                      <AdminOppfolging verdi={b} onLagre={(endring) => setOppfolging(b.id as string, endring)} />
                    )}

                    <Handlinger>
                      <Primaer type="button" onClick={() => lastNed(b)} disabled={!b.svg}>
                        <Icon name="faDownload" /> Last ned SVG
                      </Primaer>
                      <Sekundaer href={svarLenke(b)}>
                        <Icon name="faPaperPlane" /> Svar på e-post
                      </Sekundaer>
                      <Sekundaer as="button" type="button" onClick={() => navigator.clipboard?.writeText(b.epost)}>
                        <Icon name="faCopy" /> Kopier e-post
                      </Sekundaer>
                    </Handlinger>
                  </Innhold>
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

const Kort = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.paper};

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const Visning = styled.div`
  align-self: start;
  padding: 0.75rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};

  svg {
    display: block;
    width: 100%;
    height: auto;
  }
`

const Innhold = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const KortTopp = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;

  h3 {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 0.35rem;
    font-size: 1.1rem;
  }
`

const Tag = styled.span`
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
`

const Ordretag = styled.span`
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkMuted};

  svg {
    margin-right: 0.3rem;
  }
`

const StatusVelg = styled.select`
  padding: 0.45rem 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const Spek = styled.pre`
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.7;
  white-space: pre-wrap;
`

const Melding = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: auto;
`

const Primaer = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Sekundaer = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
`
