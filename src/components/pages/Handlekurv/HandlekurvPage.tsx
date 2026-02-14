import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useBasketContext } from '../../../context/BasketContext'
import { useAuthContext } from '../../../context/AuthContext'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import { useSEO } from '../../../hooks/useSEO'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import GoogleLoginButton from '../../shared/GoogleLoginButton'
import BasketView from '../../shared/BasketModal/BasketView'
import CheckoutView from '../../shared/BasketModal/CheckoutView'
import SuccessView from '../../shared/BasketModal/SuccessView'

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

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
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
`

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    flex: 1;
  }
`

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover { background: #f0f0f0; }
`

const LoginGate = styled.div`
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

type ViewType = 'basket' | 'checkout' | 'success'

export default function HandlekurvPage() {
  const { isAuthenticated } = useAuthContext()
  const { items, clearBasket } = useBasketContext()
  const [view, setView] = useState<ViewType>('basket')
  const navigate = useNavigate()

  useSEO({
    title: 'Handlekurv – Minio',
    description: 'Se over dine valgte produkter og send en forespørsel.',
    noindex: true,
  })

  const handleCheckout = useCallback(() => {
    if (items.length === 0) {
      alert('Handlekurven er tom')
      return
    }
    setView('checkout')
    window.scrollTo(0, 0)
  }, [items])

  const handleSuccess = useCallback(() => {
    setView('success')
    window.scrollTo(0, 0)
  }, [])

  const handleClose = useCallback(() => {
    clearBasket()
    navigate('/')
  }, [clearBasket, navigate])

  const titles: Record<ViewType, string> = {
    basket: 'Handlekurv',
    checkout: 'Fullfør forespørsel',
    success: 'Takk for din forespørsel!',
  }

  return (
    <>
      <Navbar />
      <PageTransition>
      <main>
        <Hero>
          <HeroContent>
            <h1>{titles[view]}</h1>
            {view === 'basket' && (
              <p>Se over varene dine og send en forespørsel.</p>
            )}
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            <Card>
              {!isAuthenticated ? (
                <>
                  <Header>
                    <h2>Logg inn</h2>
                  </Header>
                  <LoginGate>
                    <LockIcon>
                      <Icon name="faLock" />
                    </LockIcon>
                    <LoginMessage>
                      Du må logge inn for å bruke handlekurven. Logg inn med Google-kontoen din for å fortsette.
                    </LoginMessage>
                    <GoogleLoginButton />
                  </LoginGate>
                </>
              ) : (
                <>
                  <Header>
                    {view === 'checkout' && (
                      <BackBtn onClick={() => { setView('basket'); window.scrollTo(0, 0) }} aria-label="Tilbake">
                        <Icon name="faArrowLeft" />
                      </BackBtn>
                    )}
                    <h2>{titles[view]}</h2>
                  </Header>
                  {view === 'basket' && <BasketView onCheckout={handleCheckout} />}
                  {view === 'checkout' && <CheckoutView onSuccess={handleSuccess} />}
                  {view === 'success' && <SuccessView onClose={handleClose} />}
                </>
              )}
            </Card>
          </Container>
        </Content>
      </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
