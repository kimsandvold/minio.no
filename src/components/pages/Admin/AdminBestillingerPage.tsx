import { useState, useEffect, useCallback } from 'react'
import Icon from '../../shared/Icon'
import { getAllOrders } from '../../../services/orderService'
import AdminOrderCard from './AdminOrderCard'
import type { Order, OrderStatus } from '../../../types/order'
import { orderStatusLabels } from '../../../types/order'
import type { Oppfolging } from '../../../types/oppfolging'
import { AdminPageHead, Tabs, Tab, Loading, Empty } from './adminUi'

/**
 * «usendt» og «ufakturert» er ikke statuser, men arbeidslistene dine: alt som
 * ikke er sendt til kunden, og alt som ikke er fakturert ennå. Kansellerte
 * ordre holdes utenfor begge – de skal aldri sendes eller faktureres.
 */
type FilterKey = 'alle' | OrderStatus | 'usendt' | 'ufakturert'
const filterOptions: FilterKey[] = ['alle', 'ny', 'bekreftet', 'under_arbeid', 'ferdig', 'kansellert', 'usendt', 'ufakturert']

const filterLabel = (f: FilterKey) =>
  f === 'alle' ? 'Alle'
    : f === 'usendt' ? 'Ikke sendt'
    : f === 'ufakturert' ? 'Ikke fakturert'
    : orderStatusLabels[f]

const matcher = (o: Order, f: FilterKey) =>
  f === 'alle' ? true
    : f === 'usendt' ? !o.sendt && o.status !== 'kansellert'
    : f === 'ufakturert' ? !o.fakturert && o.status !== 'kansellert'
    : o.status === f

export default function AdminBestillingerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('alle')

  useEffect(() => {
    getAllOrders().then(setOrders).finally(() => setLoading(false))
  }, [])

  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }, [])

  const handleOppfolgingChange = useCallback((orderId: string, endring: Oppfolging) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...endring } : o)))
  }, [])

  const filtered = orders.filter((o) => matcher(o, activeFilter))
  const count = (f: FilterKey) => orders.filter((o) => matcher(o, f)).length

  return (
    <>
      <AdminPageHead title="Bestillinger" subtitle="Alle innkomne bestillinger fra nettbutikken." />

      {loading ? (
        <Loading><Icon name="faSpinner" spin /> Laster bestillinger …</Loading>
      ) : (
        <>
          <Tabs>
            {filterOptions.map((f) => (
              <Tab key={f} $active={activeFilter === f} onClick={() => setActiveFilter(f)}>
                {filterLabel(f)} <em>({count(f)})</em>
              </Tab>
            ))}
          </Tabs>

          {filtered.length === 0 ? (
            <Empty>
              <h2>Ingen bestillinger</h2>
              <p>{activeFilter === 'usendt' ? 'Alt er sendt.' : activeFilter === 'ufakturert' ? 'Alt er fakturert.' : 'Ingen bestillinger med denne statusen.'}</p>
            </Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((order) => (
                <AdminOrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onOppfolgingChange={handleOppfolgingChange}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
