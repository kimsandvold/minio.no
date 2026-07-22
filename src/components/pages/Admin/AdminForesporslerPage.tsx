import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleForesporsler, oppdaterForesporselStatus } from '../../../services/foresporselService'
import type { DesignForesporsel, ForesporselStatus } from '../../../types/foresporsel'
import { foresporselStatusLabel, foresporselTypeLabel } from '../../../types/foresporsel'
import { AdminPageHead, Tabs, Tab, Loading, Empty } from './adminUi'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

type FilterKey = 'alle' | ForesporselStatus
const filterOptions: FilterKey[] = ['alle', 'ny', 'besvart', 'lukket']
const statuser: ForesporselStatus[] = ['ny', 'besvart', 'lukket']

export default function AdminForesporslerPage() {
  const [liste, setListe] = useState<DesignForesporsel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('alle')

  useEffect(() => {
    getAlleForesporsler().then(setListe).finally(() => setLoading(false))
  }, [])

  const setStatus = async (id: string, status: ForesporselStatus) => {
    setListe((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
    try { await oppdaterForesporselStatus(id, status) } catch { /* optimistisk */ }
  }

  const synlige = filter === 'alle' ? liste : liste.filter((f) => f.status === filter)
  const antall = (k: FilterKey) => (k === 'alle' ? liste.length : liste.filter((f) => f.status === k).length)

  return (
    <>
      <AdminPageHead title="Forespørsler" subtitle="Bygging og materialpakker fra designverktøyet." />

      {loading ? (
        <Loading><Icon name="faSpinner" spin /> Laster forespørsler …</Loading>
      ) : (
        <>
          <Tabs>
            {filterOptions.map((k) => (
              <Tab key={k} $active={filter === k} onClick={() => setFilter(k)}>
                {k === 'alle' ? 'Alle' : foresporselStatusLabel[k]} <em>({antall(k)})</em>
              </Tab>
            ))}
          </Tabs>

          {synlige.length === 0 ? (
            <Empty><h2>Ingen forespørsler</h2><p>Ingen forespørsler med denne statusen.</p></Empty>
          ) : (
            <Liste>
              {synlige.map((f) => (
                <Kort key={f.id}>
                  <KortTop>
                    <div>
                      <TypeTag $type={f.type}>{foresporselTypeLabel[f.type]}</TypeTag>
                      <h3>{f.designNavn} <span>· {f.produktNavn}</span></h3>
                    </div>
                    <StatusVelg value={f.status} onChange={(e) => f.id && setStatus(f.id, e.target.value as ForesporselStatus)}>
                      {statuser.map((s) => <option key={s} value={s}>{foresporselStatusLabel[s]}</option>)}
                    </StatusVelg>
                  </KortTop>
                  <Fakta>
                    <span><b>Mål</b> {f.maal}</span>
                    <span><b>Areal</b> {f.arealM2 != null ? `${f.arealM2.toFixed(1)} m²` : '–'}</span>
                    <span><b>Materialer</b> {formatKr(f.estimatKr)}</span>
                    <span><b>Prisestimat</b> fra {formatKr(f.prisEstimatKr)}</span>
                  </Fakta>
                  <Spec>{f.sammendrag}</Spec>
                  {f.melding && <Melding>«{f.melding}»</Melding>}
                  <KortBunn>
                    <a href={`mailto:${f.userEmail}?subject=${encodeURIComponent(`Svar på din forespørsel – ${f.designNavn}`)}`}>
                      <Icon name="faEnvelope" /> {f.userEmail}
                    </a>
                  </KortBunn>
                </Kort>
              ))}
            </Liste>
          )}
        </>
      )}
    </>
  )
}

const Liste = styled.div`display: flex; flex-direction: column; gap: 1rem;`
const Kort = styled.div`
  background: #fff; border: 1px solid #e7e5df; border-radius: 14px; padding: 1.15rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`
const KortTop = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.8rem;
  h3 { margin: 0.35rem 0 0; font-size: 1.05rem; color: #16181d; span { color: #999; font-weight: 500; } }
`
const TypeTag = styled.span<{ $type: string }>`
  display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem; border-radius: 999px;
  color: ${({ $type }) => ($type === 'ferdig' ? '#3a5f3a' : '#5a4a2f')};
  background: ${({ $type }) => ($type === 'ferdig' ? 'rgba(123,156,123,0.18)' : 'rgba(189,149,99,0.18)')};
`
const StatusVelg = styled.select`
  flex-shrink: 0; padding: 0.45rem 0.7rem; border: 1px solid #ddd; border-radius: 8px; background: #fff; font-family: inherit; font-weight: 600; font-size: 0.85rem; cursor: pointer;
`
const Fakta = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.5rem 1.4rem; margin-bottom: 0.7rem;
  span { font-size: 0.88rem; color: #333; b { color: #999; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 0.3rem; } }
`
const Spec = styled.div`font-size: 0.8rem; color: #777; line-height: 1.5; padding-top: 0.6rem; border-top: 1px solid #f0f0f0;`
const Melding = styled.p`margin: 0.7rem 0 0; padding: 0.7rem 0.85rem; background: #f7f5ef; border-left: 3px solid #7b9c7b; border-radius: 0 8px 8px 0; font-size: 0.9rem; color: #2a2a2a; font-style: italic;`
const KortBunn = styled.div`
  margin-top: 0.9rem; padding-top: 0.7rem; border-top: 1px solid #f0f0f0;
  a { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; font-weight: 600; color: #3a5f3a; text-decoration: none; &:hover { text-decoration: underline; } }
`
