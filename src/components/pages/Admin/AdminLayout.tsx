import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { useSEO } from '../../../hooks/useSEO'
import Icon from '../../shared/Icon'

const NAV: Array<{ to: string; label: string; icon: string; end?: boolean }> = [
  { to: '/admin', label: 'Dashbord', icon: 'faGaugeHigh', end: true },
  { to: '/admin/bestillinger', label: 'Bestillinger', icon: 'faBoxOpen' },
  { to: '/admin/foresporsler', label: 'Forespørsler', icon: 'faHammer' },
  { to: '/admin/avstemninger', label: 'Avstemninger', icon: 'faChartColumn' },
]

/**
 * Dedikert admin-skall: fast sidemeny, én tilgangssjekk, og et innholdsområde
 * (Outlet) for underrutene. Erstatter det offentlige nettsted-skallet på
 * /admin-rutene.
 */
export default function AdminLayout() {
  const { isAdmin, isAuthenticated, loading } = useAuthContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useSEO({ title: 'Admin – Minio', description: 'Administrasjon.', noindex: true })

  if (loading) {
    return <Center><Icon name="faSpinner" spin /></Center>
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Center>
        <Denied>
          <Icon name="faLock" />
          <h1>Ingen tilgang</h1>
          <p>Du må være logget inn som administrator.</p>
          <button onClick={() => navigate('/')}>Til forsiden</button>
        </Denied>
      </Center>
    )
  }

  return (
    <Shell>
      <Sidebar $open={open}>
        <Brand onClick={() => navigate('/admin')}>
          <img src="/images/branding/logo_icon_white.webp" alt="Minio" />
          <span>Admin</span>
        </Brand>
        <Nav>
          {NAV.map((n) => (
            <NavItem key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}>
              <Icon name={n.icon} /> <span>{n.label}</span>
            </NavItem>
          ))}
        </Nav>
        <Bottom>
          <BackLink to="/"><Icon name="faArrowLeft" /> <span>Til nettsiden</span></BackLink>
        </Bottom>
      </Sidebar>

      <Right>
        <TopBar>
          <Burger onClick={() => setOpen((o) => !o)} aria-label="Meny"><Icon name={open ? 'faXmark' : 'faBars'} /></Burger>
          <span>Minio Admin</span>
        </TopBar>
        <Scroll>
          <Outlet />
        </Scroll>
      </Right>

      {open && <Backdrop onClick={() => setOpen(false)} />}
    </Shell>
  )
}

const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f4f4f2;
`

const Sidebar = styled.aside<{ $open: boolean }>`
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex-shrink: 0;
  width: 244px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #16181d;
  color: #e9e7e1;
  padding: 1.1rem 0.85rem;

  @media (max-width: 860px) {
    position: fixed;
    z-index: 60;
    left: 0;
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    transition: transform 0.22s ease;
    box-shadow: ${({ $open }) => ($open ? '4px 0 24px rgba(0,0,0,0.35)' : 'none')};
  }
`

const Brand = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem 1rem;
  border: none;
  background: none;
  color: #fff;
  cursor: pointer;
  img { height: 26px; width: auto; }
  span { font-size: 1.05rem; font-weight: 800; letter-spacing: 0.02em; }
`

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
`

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  color: #b6b2a9;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
  svg { width: 18px; text-align: center; }
  &:hover { background: rgba(255, 255, 255, 0.06); color: #fff; }
  &.active { background: rgba(255, 255, 255, 0.1); color: #fff; }
`

const Bottom = styled.div`
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const BackLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  color: #8f8b82;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  &:hover { background: rgba(255, 255, 255, 0.06); color: #fff; }
`

const Right = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const TopBar = styled.header`
  display: none;
  align-items: center;
  gap: 0.75rem;
  height: 54px;
  padding: 0 1rem;
  background: #16181d;
  color: #fff;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 50;

  @media (max-width: 860px) { display: flex; }
`

const Burger = styled.button`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
`

const Scroll = styled.main`
  flex: 1;
  min-width: 0;
  padding: 2rem 2.25rem 4rem;
  @media (max-width: 860px) { padding: 1.25rem 1rem 3rem; }
`

const Backdrop = styled.div`
  @media (max-width: 860px) {
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(0, 0, 0, 0.4);
  }
`

const Center = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f4f4f2;
  color: #6b6860;
  font-size: 1.4rem;
`

const Denied = styled.div`
  text-align: center;
  color: #6b6860;
  svg { font-size: 1.6rem; color: #b1442f; }
  h1 { margin: 0.6rem 0 0.3rem; font-size: 1.4rem; color: #16181d; }
  p { margin: 0 0 1.1rem; font-size: 0.95rem; }
  button { padding: 0.7rem 1.4rem; border: none; border-radius: 10px; background: #16181d; color: #fff; font-weight: 700; font-family: inherit; cursor: pointer; }
`
