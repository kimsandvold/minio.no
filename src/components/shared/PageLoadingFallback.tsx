import styled from 'styled-components'
import { pulse } from '../../styles/animations'
import Navbar from '../layout/Navbar'
import Footer from '../layout/Footer'

const Wrapper = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.lightBg};
`

const Logo = styled.img`
  width: 80px;
  height: auto;
  animation: ${pulse} 1.8s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export default function PageLoadingFallback() {
  return (
    <>
      <Navbar />
      <Wrapper>
        <Logo src="/images/branding/logo_dark.svg" alt="Laster..." />
      </Wrapper>
      <Footer />
    </>
  )
}
