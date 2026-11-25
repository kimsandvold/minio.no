import { useEffect, useState } from 'react'
import styled from 'styled-components'
import GraveringKort from './GraveringKort'
import {
  getAlleGraveringer,
  graveringStatusLabel,
  oppdaterGraveringOppfolging,
  oppdaterGraveringStatus,
  type GraveringBestilling,
  type GraveringStatus,
} from '../../../services/graveringService'
import type { Oppfolging } from '../../../types/oppfolging'
import { AdminPageHead, Empty, LasterListe, Tab, Tabs } from './adminUi'

/**
 * Graveringsbestillinger fra /gravering.
 *
 * Hvert kort bærer produksjonsfila: SVG-en ble bygget da kunden sendte inn, med
 * teksten konvertert til kurver. «Last ned SVG» gir derfor en fil som kan
 * sendes rett til graveringsmaskinen, uten at skriften må finnes på maskinen.
 */


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


// «usendt» og «ufakturert» er arbeidslistene: alt som ikke er sendt eller
// fakturert ennå, uavhengig av hvor langt dialogen med kunden har kommet.
// «aapne» er standardvisningen: alt som ikke er lukket og ikke er gravert,
// sendt og fakturert – altså bestillinger det fortsatt er noe å gjøre med.
type FilterKey = 'aapne' | 'alle' | GraveringStatus | 'usendt' | 'ufakturert'
const filtre: FilterKey[] = ['aapne', 'alle', 'ny', 'besvart', 'lukket', 'usendt', 'ufakturert']
const statuser: GraveringStatus[] = ['ny', 'besvart', 'lukket']

const filterNavn = (k: FilterKey) =>
  k === 'aapne' ? 'Å behandle'
    : k === 'alle' ? 'Alle'
    : k === 'usendt' ? 'Ikke sendt'
    : k === 'ufakturert' ? 'Ikke fakturert'
    : graveringStatusLabel[k]

const treffer = (b: GraveringBestilling, k: FilterKey) =>
  k === 'aapne' ? b.status !== 'lukket' && !(b.gjort && b.sendt && b.fakturert)
    : k === 'alle' ? true
    : k === 'usendt' ? !b.sendt
    : k === 'ufakturert' ? !b.fakturert
    : b.status === k

export default function AdminGraveringerPage() {
  const [liste, setListe] = useState<GraveringBestilling[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('aapne')

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
        <LasterListe antall={3} />
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
              <p>{filter === 'aapne' ? 'Ingenting å gjøre – alt er behandlet.' : filter === 'usendt' ? 'Alt er sendt.' : filter === 'ufakturert' ? 'Alt er fakturert.' : 'Ingen bestillinger med denne statusen.'}</p>
            </Empty>
          ) : (
            <Liste>
              {synlige.map((b) => (
                <GraveringKort
                  key={b.id}
                  b={b}
                  iOrdren={ordrer[b.ordreId] ?? 1}
                  statuser={statuser}
                  statusNavn={graveringStatusLabel}
                  onStatus={(st) => b.id && setStatus(b.id, st)}
                  onOppfolging={(endring) => setOppfolging(b.id as string, endring)}
                  onLastNed={() => lastNed(b)}
                  svarLenke={svarLenke(b)}
                />
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













