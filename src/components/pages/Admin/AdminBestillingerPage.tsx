import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { getAllOrders } from '../../../services/orderService'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import Icon from '../../shared/Icon'
import AdminOrderCard from './AdminOrderCard'
import type { Order, OrderStatus } from '../../../types/order'
import { orderStatusLabels } from '../../../types/order'

const Hero = styled.section`
  min-height: 20vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 15vh;
    padding: 5rem 1.5rem 2rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
`

const Content = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3rem 2rem 5rem;
  min-height: 50vh;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: 2px solid ${({ $active }) => ($active ? '#1a1a1a' : '#e0e0e0')};
  background: ${({ $active }) => ($active ? '#1a1a1a' : 'white')};
  color: ${({ $active }) => ($active ? 'white' : '#666')};
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1a1a1a;
  }
`

const TabCount = styled.span`
  margin-left: 0.35rem;
  opacity: 0.6;
`

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const AccessDenied = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;

  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.5rem;
  }
`

type FilterKey = 'alle' | OrderStatus

const filterOptions: FilterKey[] = ['alle', 'ny', 'bekreftet', 'under_arbeid', 'ferdig', 'kansellert']

export default function AdminBestillingerPage() {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuthContext()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('alle')

  useSEO({
    title: 'Admin – Bestillinger – Minio',
    description: 'Administrer alle bestillinger.',
    noindex: true,
  })

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !isAdmin) {
      setLoading(false)
      return
    }
    setLoading(true)
    getAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [isAdmin, isAuthenticated, authLoading])

  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }, [])

  const filteredOrders = activeFilter === 'alle'
    ? orders
    : orders.filter(o => o.status === activeFilter)

  const getCount = (filter: FilterKey) =>
    filter === 'alle' ? orders.length : orders.filter(o => o.status === filter).length

  if (!authLoading && (!isAuthenticated || !isAdmin)) {
    return (
      <>
        <Navbar />
        <main>
          <Hero>
            <HeroContent>
              <h1>Admin</h1>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              <AccessDenied>
                <h2>Ingen tilgang</h2>
                <p>Du har ikke tilgang til denne siden.</p>
                <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Gå til forsiden
                </button>
              </AccessDenied>
            </Container>
          </Content>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero>
          <HeroContent>
            <h1>Bestillinger</h1>
            <p>Oversikt over alle forespørsler.</p>
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            {loading ? (
              <LoadingState>
                <Icon name="faSpinner" spin /> Laster bestillinger...
              </LoadingState>
            ) : (
              <>
                <FilterTabs>
                  {filterOptions.map(filter => (
                    <FilterTab
                      key={filter}
                      $active={activeFilter === filter}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter === 'alle' ? 'Alle' : orderStatusLabels[filter]}
                      <TabCount>({getCount(filter)})</TabCount>
                    </FilterTab>
                  ))}
                </FilterTabs>

                {filteredOrders.length === 0 ? (
                  <EmptyState>Ingen bestillinger med denne statusen.</EmptyState>
                ) : (
                  filteredOrders.map(order => (
                    <AdminOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </>
            )}
          </Container>
        </Content>
      </main>
      <Footer />
    </>
  )
}
