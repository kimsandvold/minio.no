import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import styled from 'styled-components'
import { navLinks } from '../../data/navigation'
import { socialLinks } from '../../data/socialLinks'
import { useBasketContext } from '../../context/BasketContext'
import { useAuthContext } from '../../context/AuthContext'
import Icon from '../shared/Icon'
import GoogleLoginButton from '../shared/GoogleLoginButton'

const Nav = styled.nav`
  position: fixed;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2rem);
  max-width: ${({ theme }) => theme.spacing.containerMax};
  padding: 0.6rem 1.5rem;
  background: rgba(20, 20, 20, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: ${({ theme }) => theme.zIndex.nav};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: 0.5rem;
    width: calc(100% - 1rem);
    padding: 0.5rem 1rem;
    border-radius: 14px;
  }
`

const NavContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-left: -0.5rem;

  a {
    display: flex;
    align-items: center;

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  img {
    height: 36px;
    width: auto;
    display: block;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`

const MenuLinks = styled.div<{ $open: boolean }>`
  justify-self: center;
  display: flex;
  gap: 2rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    position: fixed;
    top: 0;
    right: ${({ $open }) => ($open ? '0' : '-100%')};
    width: 75%;
    max-width: 320px;
    height: 100vh;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.darkBg} 0%, #2a2a2a 100%);
    flex-direction: column;
    align-items: flex-start;
    padding: 80px 2rem 2rem;
    gap: 2rem;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
    z-index: ${({ theme }) => theme.zIndex.nav + 1};
  }
`

const textLinkStyles = `
  color: var(--text-light, #f9f9f9);
  text-decoration: none;
  font-weight: 400;
  font-size: 0.88rem;
  letter-spacing: 0.01em;
  opacity: 0.85;
  transition: opacity 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const TextLink = styled.a`
  ${textLinkStyles}
  color: ${({ theme }) => theme.colors.textLight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const TextRouterLink = styled(Link)`
  ${textLinkStyles}
  color: ${({ theme }) => theme.colors.textLight};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const iconLinkStyles = `
  display: none;
  font-size: 1rem;
  transition: color 0.3s ease;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const IconLink = styled.a`
  ${iconLinkStyles}
  color: ${({ theme }) => theme.colors.textLight};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    font-size: 1.2rem;
    gap: 1rem;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &::after {
      content: attr(aria-label);
      font-size: 1rem;
      font-family: ${({ theme }) => theme.fonts.body};
    }
  }
`

const IconRouterLink = styled(Link)`
  ${iconLinkStyles}
  color: ${({ theme }) => theme.colors.textLight};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    font-size: 1.2rem;
    gap: 1rem;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &::after {
      content: attr(aria-label);
      font-size: 1rem;
      font-family: ${({ theme }) => theme.fonts.body};
    }
  }
`

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-self: end;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    order: 2;
  }
`

const SocialIcons = styled.div`
  display: flex;
  gap: 0.8rem;
  align-items: center;

  a {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.1rem;
    opacity: 0.65;
    transition: opacity 0.3s ease;
    text-decoration: none;
    &:hover { opacity: 1; }
    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const BasketLink = styled(Link)`
  position: relative;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
  text-decoration: none;

  &:hover { color: #fff; }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const BasketCount = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background: ${({ theme }) => theme.colors.error};
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
`

const UserMenuWrapper = styled.div`
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const UserPill = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  padding: 0.3rem 0.75rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.body};
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
`

const UserAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`

const ChevronIcon = styled.span<{ $open: boolean }>`
  font-size: 0.65rem;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0')});
  opacity: 0.6;
`

const UserDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  overflow: hidden;
  z-index: ${({ theme }) => theme.zIndex.nav + 5};
`

const DropdownLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
`

const DropdownBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  background: none;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 120, 120, 0.9);
  font-size: 0.9rem;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ff8888;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
`

const LoginLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  font-weight: 400;
  cursor: pointer;
  text-decoration: none;
  opacity: 0.85;
  transition: opacity 0.3s ease;
  font-family: ${({ theme }) => theme.fonts.body};

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const LoginPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  z-index: ${({ theme }) => theme.zIndex.nav + 5};
  min-width: 260px;
  text-align: center;

  p {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
`

const LoginPopoverWrapper = styled.div`
  position: relative;
`

const MobileAuth = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    margin-top: auto;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`

const MobileUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1rem;
`

const MobileLogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1rem;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  padding: 0.5rem 0;
  opacity: 0.6;

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const Hamburger = styled.button<{ $open: boolean }>`
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 28px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: ${({ theme }) => theme.zIndex.nav + 2};

  span {
    width: 28px;
    height: 3px;
    background: ${({ theme }) => theme.colors.textLight};
    border-radius: 2px;
    transition: all 0.3s ease;
    transform-origin: center;
  }

  ${({ $open }) => $open && `
    span:nth-child(1) { transform: translateY(10.5px) rotate(45deg); }
    span:nth-child(2) { opacity: 0; }
    span:nth-child(3) { transform: translateY(-10.5px) rotate(-45deg); }
  `}

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
  }
`

const Backdrop = styled.div<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: ${({ theme }) => theme.zIndex.nav};
  backdrop-filter: blur(2px);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: opacity 0.3s ease;
`

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const loginPopoverRef = useRef<HTMLDivElement>(null)
  const { totalItems } = useBasketContext()
  const { user, logout, isAuthenticated, isAdmin } = useAuthContext()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const firstName = user?.name?.split(' ')[0] ?? ''

  useEffect(() => {
    if (isAuthenticated) setLoginOpen(false)
  }, [isAuthenticated])

  useEffect(() => {
    setUserMenuOpen(false)
  }, [location])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (loginPopoverRef.current && !loginPopoverRef.current.contains(e.target as Node)) {
        setLoginOpen(false)
      }
    }
    if (userMenuOpen || loginOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, loginOpen])

  const navHref = (hash: string) => isHome ? hash : `/${hash}`

  return (
    <>
      <Backdrop $open={menuOpen} onClick={closeMenu} />
      <Nav aria-label="Hovedmeny">
        <NavContainer>
          <Logo>
            <Link to="/"><img src="/images/branding/logo_navbar.svg" alt="Minio" /></Link>
          </Logo>

          <MenuLinks $open={menuOpen}>
            {navLinks.map(link => {
              const isRoute = link.href.startsWith('/')
              return isRoute ? (
                <TextRouterLink key={link.href} to={link.href} onClick={closeMenu}>
                  {link.label}
                </TextRouterLink>
              ) : (
                <TextLink key={link.href} href={navHref(link.href)} onClick={closeMenu}>
                  {link.label}
                </TextLink>
              )
            })}
            {navLinks.map(link => {
              const isRoute = link.href.startsWith('/')
              return isRoute ? (
                <IconRouterLink key={`icon-${link.href}`} to={link.href} aria-label={link.ariaLabel} onClick={closeMenu}>
                  <Icon name={link.icon} />
                </IconRouterLink>
              ) : (
                <IconLink key={`icon-${link.href}`} href={navHref(link.href)} aria-label={link.ariaLabel} onClick={closeMenu}>
                  <Icon name={link.icon} />
                </IconLink>
              )
            })}
            {isAuthenticated && (
              <IconRouterLink to="/mine-design" aria-label="Mine design" onClick={closeMenu}>
                <Icon name="faPalette" />
              </IconRouterLink>
            )}
            {isAuthenticated && (
              <IconRouterLink to="/mine-bestillinger" aria-label="Mine bestillinger" onClick={closeMenu}>
                <Icon name="faClipboardList" />
              </IconRouterLink>
            )}
            {isAdmin && (
              <IconRouterLink to="/admin/bestillinger" aria-label="Admin" onClick={closeMenu}>
                <Icon name="faUserShield" />
              </IconRouterLink>
            )}
            <MobileAuth>
              {isAuthenticated ? (
                <>
                  <MobileUserInfo>
                    {user?.picture && <UserAvatar src={user.picture} alt="" />}
                    <span>Hei, {firstName}</span>
                  </MobileUserInfo>
                  <MobileLogoutBtn onClick={() => { logout(); closeMenu() }}>
                    <Icon name="faSignOutAlt" />
                    Logg ut
                  </MobileLogoutBtn>
                </>
              ) : (
                <GoogleLoginButton />
              )}
            </MobileAuth>
          </MenuLinks>

          <RightControls>
            <SocialIcons>
              {socialLinks.map(link => (
                <a key={link.platform} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.ariaLabel}>
                  <Icon name={link.icon} />
                </a>
              ))}
            </SocialIcons>
            <BasketLink to="/handlekurv" aria-label="Handlekurv">
              <Icon name="faShoppingCart" />
              {totalItems > 0 && <BasketCount>{totalItems}</BasketCount>}
            </BasketLink>
            {isAuthenticated ? (
              <UserMenuWrapper ref={userMenuRef}>
                <UserPill onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  {user?.picture && <UserAvatar src={user.picture} alt="" />}
                  <span>Hei, {firstName}</span>
                  <ChevronIcon $open={userMenuOpen}>
                    <Icon name="faChevronDown" />
                  </ChevronIcon>
                </UserPill>
                {userMenuOpen && (
                  <UserDropdown>
                    <DropdownLink to="/mine-design" onClick={() => setUserMenuOpen(false)}>
                      <Icon name="faPalette" /> Mine design
                    </DropdownLink>
                    <DropdownLink to="/mine-bestillinger" onClick={() => setUserMenuOpen(false)}>
                      <Icon name="faClipboardList" /> Mine bestillinger
                    </DropdownLink>
                    {isAdmin && (
                      <DropdownLink to="/admin/bestillinger" onClick={() => setUserMenuOpen(false)}>
                        <Icon name="faUserShield" /> Admin
                      </DropdownLink>
                    )}
                    <DropdownBtn onClick={() => { logout(); setUserMenuOpen(false) }}>
                      <Icon name="faSignOutAlt" /> Logg ut
                    </DropdownBtn>
                  </UserDropdown>
                )}
              </UserMenuWrapper>
            ) : (
              <LoginPopoverWrapper ref={loginPopoverRef}>
                <LoginLink onClick={() => setLoginOpen(!loginOpen)}>
                  Logg inn
                </LoginLink>
                {loginOpen && (
                  <LoginPopover>
                    <p>Logg inn for å lagre design og bestillinger</p>
                    <GoogleLoginButton />
                  </LoginPopover>
                )}
              </LoginPopoverWrapper>
            )}
            <Hamburger $open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menyknapp" aria-expanded={menuOpen}>
              <span /><span /><span />
            </Hamburger>
          </RightControls>
        </NavContainer>
      </Nav>
    </>
  )
}
