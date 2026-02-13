import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import { useSEO } from '../../../hooks/useSEO'

const Wrapper = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;
`

const Content = styled.div`
  max-width: 520px;

  h1 {
    font-size: 6rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
    line-height: 1;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 4rem;
    }
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.2rem;
    }
  }

  p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
    margin: 0 0 2rem;
  }
`

const HomeLink = styled(Link)`
  display: inline-block;
  padding: 0.85rem 2rem;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(29, 161, 242, 0.35);
  }
`

export default function NotFoundPage() {
  useSEO({
    title: 'Siden ble ikke funnet – Minio',
    description: 'Beklager, denne siden finnes ikke. Gå tilbake til forsiden.',
  })

  return (
    <>
      <Navbar />
      <Wrapper>
        <Content>
          <h1>404</h1>
          <h2>Siden ble ikke funnet</h2>
          <p>Beklager, siden du leter etter finnes ikke eller har blitt flyttet.</p>
          <HomeLink to="/">Tilbake til forsiden</HomeLink>
        </Content>
      </Wrapper>
      <Footer />
    </>
  )
}
