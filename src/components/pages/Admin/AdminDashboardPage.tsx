import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAllOrders } from '../../../services/orderService'
import { getAlleForesporsler } from '../../../services/foresporselService'
import type { Order } from '../../../types/order'
import type { DesignForesporsel } from '../../../types/foresporsel'
import { foresporselTypeLabel } from '../../../types/foresporsel'
import { AdminPageHead, Card, Stat, Loading } from './adminUi'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [foresp, setForesp] = useState<DesignForesporsel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllOrders().catch(() => []), getAlleForesporsler().catch(() => [])])
      .then(([o, f]) => { setOrders(o); setForesp(f) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading><Icon name="faSpinner" spin /> Laster …</Loading>

  const nyeOrdre = orders.filter((o) => o.status === 'ny').length
  const nyeForesp = foresp.filter((f) => f.status === 'ny').length

  return (
    <>
      <AdminPageHead title="Dashbord" subtitle="Oversikt over aktivitet i Minio." />

      <Stats>
        <Stat icon="faBoxOpen" tone="amber" label="Nye bestillinger" value={nyeOrdre} onClick={() => navigate('/admin/bestillinger')} />
        <Stat icon="faLayerGroup" label="Bestillinger totalt" value={orders.length} onClick={() => navigate('/admin/bestillinger')} />
        <Stat icon="faHammer" tone="green" label="Nye forespørsler" value={nyeForesp} onClick={() => navigate('/admin/foresporsler')} />
        <Stat icon="faEnvelopeOpenText" label="Forespørsler totalt" value={foresp.length} onClick={() => navigate('/admin/foresporsler')} />
      </Stats>

      <Grid>
        <Card>
          <PanelHead>
            <h2>Siste forespørsler</h2>
            <Link onClick={() => navigate('/admin/foresporsler')}>Se alle <Icon name="faChevronRight" /></Link>
          </PanelHead>
          {foresp.length === 0 ? (
            <Tom>Ingen forespørsler ennå.</Tom>
          ) : (
            <List>
              {foresp.slice(0, 6).map((f) => (
                <Rad key={f.id} onClick={() => navigate('/admin/foresporsler')}>
                  <Dot $ny={f.status === 'ny'} />
                  <div className="m">
                    <strong>{f.designNavn}</strong>
                    <span>{foresporselTypeLabel[f.type]} · {f.produktNavn}</span>
                  </div>
                  <b>{formatKr(f.prisEstimatKr)}</b>
                </Rad>
              ))}
            </List>
          )}
        </Card>

        <Card>
          <PanelHead>
            <h2>Siste bestillinger</h2>
            <Link onClick={() => navigate('/admin/bestillinger')}>Se alle <Icon name="faChevronRight" /></Link>
          </PanelHead>
          {orders.length === 0 ? (
            <Tom>Ingen bestillinger ennå.</Tom>
          ) : (
            <List>
              {orders.slice(0, 6).map((o) => (
                <Rad key={o.id} onClick={() => navigate('/admin/bestillinger')}>
                  <Dot $ny={o.status === 'ny'} />
                  <div className="m">
                    <strong>{o.customerName || o.userName || 'Kunde'}</strong>
                    <span>{o.items?.length ?? 0} varer</span>
                  </div>
                  <b>{formatKr(o.totalSum ?? 0)}</b>
                </Rad>
              ))}
            </List>
          )}
        </Card>
      </Grid>
    </>
  )
}

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
`

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid #f0eee8;
  h2 { margin: 0; font-size: 1rem; font-weight: 700; color: #16181d; }
`

const Link = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: none;
  color: #3f7a3f;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  svg { font-size: 0.7rem; }
`

const List = styled.div`display: flex; flex-direction: column;`

const Rad = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.2rem;
  border: none;
  border-bottom: 1px solid #f4f2ec;
  background: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  &:last-child { border-bottom: none; }
  &:hover { background: #faf9f5; }
  .m { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .m strong { font-size: 0.9rem; color: #16181d; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .m span { font-size: 0.76rem; color: #918d84; }
  b { font-size: 0.9rem; color: #16181d; font-variant-numeric: tabular-nums; white-space: nowrap; }
`

const Dot = styled.span<{ $ny: boolean }>`
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $ny }) => ($ny ? '#5a8f5a' : '#d4d0c6')};
`

const Tom = styled.p`
  margin: 0;
  padding: 2rem 1.2rem;
  text-align: center;
  color: #918d84;
  font-size: 0.9rem;
`
