import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { getUserOrders } from '../../../services/orderService'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import GoogleLoginButton from '../../shared/GoogleLoginButton'
import OrderCard from './OrderCard'
import type { Order } from '../../../types/order'

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
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const LoginGate = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  text-align: center;
`

const LockIcon = styled.div`
  font-size: 2.5rem;
  color: #999;
`

const LoginMessage = styled.p`
  font-size: 1.1rem;
  color: #555;
  max-width: 400px;
  line-height: 1.6;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

export default function MineBestillingerPage() {
  const { isAuthenticated, firebaseUser, loading: authLoading } = useAuthContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useSEO({
    title: 'Mine bestillinger – Minio',
    description: 'Se dine forespørsler og bestillinger hos Minio.',
    noindex: true,
  })

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false)
      return
    }
    setLoading(true)
    getUserOrders(firebaseUser.uid)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [firebaseUser])

  return (
    <>
      <Navbar />
      <PageTransition>
      <main>
        <Hero>
          <HeroContent>
            <h1>Mine bestillinger</h1>
            <p>Oversikt over dine forespørsler.</p>
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            {authLoading || loading ? (
              <LoadingState>
                <Icon name="faSpinner" spin /> Laster...
              </LoadingState>
            ) : !isAuthenticated ? (
              <LoginGate>
                <LockIcon><Icon name="faLock" /></LockIcon>
                <LoginMessage>Du må logge inn for å se dine bestillinger.</LoginMessage>
                <GoogleLoginButton />
              </LoginGate>
            ) : orders.length === 0 ? (
              <EmptyState>Du har ingen bestillinger ennå.</EmptyState>
            ) : (
              orders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </Container>
        </Content>
      </main>
      </PageTransition>
      <Footer />
    </>
  )
}
