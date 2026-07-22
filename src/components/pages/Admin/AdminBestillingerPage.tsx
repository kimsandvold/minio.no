import { useState, useEffect, useCallback } from 'react'
import Icon from '../../shared/Icon'
import { getAllOrders } from '../../../services/orderService'
import AdminOrderCard from './AdminOrderCard'
import type { Order, OrderStatus } from '../../../types/order'
import { orderStatusLabels } from '../../../types/order'
import { AdminPageHead, Tabs, Tab, Loading, Empty } from './adminUi'

type FilterKey = 'alle' | OrderStatus
const filterOptions: FilterKey[] = ['alle', 'ny', 'bekreftet', 'under_arbeid', 'ferdig', 'kansellert']

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

  const filtered = activeFilter === 'alle' ? orders : orders.filter((o) => o.status === activeFilter)
  const count = (f: FilterKey) => (f === 'alle' ? orders.length : orders.filter((o) => o.status === f).length)

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
                {f === 'alle' ? 'Alle' : orderStatusLabels[f]} <em>({count(f)})</em>
              </Tab>
            ))}
          </Tabs>

          {filtered.length === 0 ? (
            <Empty><h2>Ingen bestillinger</h2><p>Ingen bestillinger med denne statusen.</p></Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((order) => (
                <AdminOrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
