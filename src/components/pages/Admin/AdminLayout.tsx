import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { useSEO } from '../../../hooks/useSEO'
import Icon from '../../shared/Icon'
import { bp, t } from './adminTokens'

interface Punkt {
  to: string
  label: string
  icon: string
  end?: boolean
}

const NAV: Punkt[] = [
  { to: '/admin', label: 'Dashbord', icon: 'faGaugeHigh', end: true },
  { to: '/admin/bestillinger', label: 'Bestillinger', icon: 'faBoxOpen' },
  { to: '/admin/foresporsler', label: 'Forespørsler', icon: 'faHammer' },
  { to: '/admin/graveringer', label: 'Graveringer', icon: 'faPenNib' },
  { to: '/admin/henvendelser', label: 'Henvendelser', icon: 'faEnvelope' },
  { to: '/admin/prosjektideer', label: 'Prosjektidéer', icon: 'faLightbulb' },
  { to: '/admin/kontakter', label: 'Kontakter', icon: 'faAddressBook' },
  { to: '/admin/avstemninger', label: 'Avstemninger', icon: 'faChartColumn' },
]

/**
 * Admin-skallet.
 *
 * Lyst og luftig, ikke et mørkt kontrollrom: hvit topplinje med utlogging, lys
 * sidemeny på skjerm, og en vannrett stripe man sveiper på mobil. Den mørke
 * sidemenyen ga admin et annet formspråk enn resten av verktøykassa uten at
 * forskjellen betydde noe.
 *
 * På mobil ligger navigasjonen øverst som en stripe i stedet for i en skuff.
 * Skuffen krevde to trykk for hvert sidebytte, og måtte nås i hjørnet som er
 * vanskeligst å treffe med én hånd.
 */
export default function AdminLayout() {
  const { isAdmin, isAuthenticated, loading, user, logout } = useAuthContext()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useSEO({ title: 'Admin – Minio', description: 'Administrasjon.', noindex: true })

  if (loading) {
    return (
      <Midt>
        <Icon name="faSpinner" spin />
      </Midt>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Midt>
        <Nektet>
          <Icon name="faLock" />
          <h1>Ingen tilgang</h1>
          <p>Du må være logget inn som administrator.</p>
          <button onClick={() => navigate('/')}>Til forsiden</button>
        </Nektet>
      </Midt>
    )
  }

  const initialer = (user?.name || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase())
    .join('')

  return (
    <Skall>
      <Topplinje>
        <Merke onClick={() => navigate('/admin')}>
          <img src="/images/branding/logo_icon_white.webp" alt="" />
          <strong>MINIO</strong>
          <span>Admin</span>
        </Merke>
        <Hoyretopp>
          <Epost>{user?.email}</Epost>
          <Loggut type="button" onClick={() => logout()}>
            Logg ut
          </Loggut>
        </Hoyretopp>
      </Topplinje>

      {/* Sveipestripa erstatter sidemenyen på mobil. */}
      <Stripe aria-label="Seksjoner">
        {NAV.map((n) => (
          <StripeLenke key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </StripeLenke>
        ))}
      </Stripe>

      <Kropp>
        <Sidemeny>
          <Brukerkort>
            <Avatar aria-hidden="true">{initialer}</Avatar>
            <div>
              <strong>{user?.name || 'Admin'}</strong>
              <small>{user?.email}</small>
            </div>
          </Brukerkort>

          <Meny>
            {NAV.map((n) => (
              <MenyLenke key={n.to} to={n.to} end={n.end}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
              </MenyLenke>
            ))}
          </Meny>

          <Bolketittel>Snarveier</Bolketittel>
          <Snarvei href="/">
            <Icon name="faArrowLeft" />
            <span>Til nettsiden</span>
          </Snarvei>
        </Sidemeny>

        <Innhold key={pathname}>
          <Outlet />
        </Innhold>
      </Kropp>
    </Skall>
  )
}

const Skall = styled.div`
  min-height: 100dvh;
  background: ${t.bunn};
`

const Topplinje = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 60px;
  padding: 0 1.4rem;
  background: ${t.flate};
  border-bottom: 1px solid ${t.kant};

  @media (max-width: ${bp.mobil}) {
    height: 54px;
    padding: 0 1rem;
  }
`

const Merke = styled.button`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;

  img {
    height: 26px;
    width: 26px;
    border-radius: 7px;
    background: ${t.blekk};
    padding: 4px;
  }
  strong {
    font-size: 0.98rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: ${t.blekk};
  }
  span {
    padding-left: 0.55rem;
    border-left: 1px solid ${t.kant};
    font-size: 0.92rem;
    color: ${t.dempet};
  }
`

const Hoyretopp = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const Epost = styled.span`
  font-size: 0.85rem;
  color: ${t.dempet};

  @media (max-width: ${bp.mobil}) {
    display: none;
  }
`

const Loggut = styled.button`
  border: none;
  background: none;
  padding: 0.3rem 0;
  color: ${t.blekk};
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`

const Stripe = styled.nav`
  display: none;

  @media (max-width: ${bp.mobil}) {
    position: sticky;
    top: 54px;
    z-index: 35;
    display: flex;
    gap: 0.45rem;
    padding: 0.6rem 1rem;
    background: ${t.flate};
    border-bottom: 1px solid ${t.kant};
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`

const StripeLenke = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.5rem 0.85rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radiusRund};
  color: ${t.dempet};
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;

  svg {
    font-size: 0.8rem;
  }
  &.active {
    background: ${t.aksentSvak};
    border-color: ${t.aksent};
    color: ${t.aksent};
  }
`

const Kropp = styled.div`
  display: flex;
  gap: 1.6rem;
  max-width: 1480px;
  margin: 0 auto;
  padding: 1.6rem 1.4rem 4rem;

  @media (max-width: ${bp.mobil}) {
    padding: 1rem 1rem 3rem;
  }
`

const Sidemeny = styled.aside`
  flex-shrink: 0;
  width: ${t.sidemeny};
  position: sticky;
  top: 80px;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  @media (max-width: ${bp.mobil}) {
    display: none;
  }
`

const Brukerkort = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem;
  margin-bottom: 0.7rem;
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  min-width: 0;

  strong {
    display: block;
    font-size: 0.88rem;
    font-weight: 700;
    color: ${t.blekk};
  }
  small {
    display: block;
    font-size: 0.74rem;
    color: ${t.dempet};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 148px;
  }
`

const Avatar = styled.span`
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: ${t.aksent};
  color: #fff;
  font-size: 0.76rem;
  font-weight: 700;
`

const Meny = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`

const MenyLenke = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid transparent;
  border-radius: ${t.radiusLiten};
  color: ${t.dempet};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;

  svg {
    width: 17px;
    flex-shrink: 0;
    font-size: 0.88rem;
  }
  &:hover {
    background: ${t.flate};
    color: ${t.blekk};
  }
  /* Den aktive siden er et hvitt kort med kant – samme språk som alt annet
     innhold, i stedet for en farget flate som bare finnes her. */
  &.active {
    background: ${t.flate};
    border-color: ${t.kant};
    color: ${t.blekk};
    box-shadow: ${t.skygge};
  }
`

const Bolketittel = styled.p`
  margin: 1.1rem 0 0.35rem;
  padding: 0 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${t.svak};
`

const Snarvei = styled.a`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.75rem;
  border-radius: ${t.radiusLiten};
  color: ${t.dempet};
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;

  svg {
    width: 17px;
    font-size: 0.82rem;
  }
  &:hover {
    color: ${t.blekk};
  }
`

const Innhold = styled.main`
  flex: 1;
  min-width: 0;
  max-width: ${t.innholdMaks};
`

const Midt = styled.div`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: ${t.bunn};
  color: ${t.dempet};
  font-size: 1.3rem;
`

const Nektet = styled.div`
  text-align: center;
  color: ${t.dempet};

  svg {
    font-size: 1.6rem;
    color: ${t.fare};
  }
  h1 {
    margin: 0.6rem 0 0.3rem;
    font-size: 1.35rem;
    color: ${t.blekk};
  }
  p {
    margin: 0 0 1.1rem;
    font-size: 0.95rem;
  }
  button {
    padding: 0.7rem 1.4rem;
    border: none;
    border-radius: ${t.radiusLiten};
    background: ${t.blekk};
    color: #fff;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }
`
