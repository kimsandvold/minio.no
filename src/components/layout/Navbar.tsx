import { useState, useCallback, useEffect } from 'react'
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
  top: 0;
  left: 0;
  width: 100%;
  padding: 0.5rem 2rem;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: ${({ theme }) => theme.zIndex.nav};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.5rem 1rem;
  }
`

const NavContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 2rem;
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
`

const Logo = styled.div`
  img {
    height: 40px;
    margin-top: 10px;
    width: auto;
  }
`

const MenuLinks = styled.div<{ $open: boolean }>`
  justify-self: center;
  display: flex;
  gap: 1.2rem;
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
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    transition: width 0.3s ease;
  }

  &:hover {
    &::after { width: 100%; }
  }
`

const TextLink = styled.a`
  ${textLinkStyles}
  color: ${({ theme }) => theme.colors.textLight};
  &::after { background-color: ${({ theme }) => theme.colors.textLight}; }
  &:hover { color: ${({ theme }) => theme.colors.textLight}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const TextRouterLink = styled(Link)`
  ${textLinkStyles}
  color: ${({ theme }) => theme.colors.textLight};
  &::after { background-color: ${({ theme }) => theme.colors.textLight}; }
  &:hover { color: ${({ theme }) => theme.colors.textLight}; }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const iconLinkStyles = `
  display: none;
  font-size: 1rem;
  transition: color 0.3s ease;
  text-decoration: none;
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
    transition: color 0.3s ease;
    text-decoration: none;
    &:hover { color: ${({ theme }) => theme.colors.accent}; }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const BasketLink = styled(Link)`
  position: relative;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
  text-decoration: none;

  &:hover { color: ${({ theme }) => theme.colors.accent}; }
`

const BasketCount = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${({ theme }) => theme.colors.error};
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
`

const UserPill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  padding: 0.3rem 0.75rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  font-weight: 500;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const UserAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`

const LogoutBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  cursor: pointer;
  padding: 0.2rem;
  font-size: 0.85rem;
  transition: color ${({ theme }) => theme.transitions.default};
  display: flex;
  align-items: center;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`

const LoginLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color ${({ theme }) => theme.transitions.default};
  font-family: ${({ theme }) => theme.fonts.body};

  &:hover {
    color: ${({ theme }) => theme.colors.hover};
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
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  z-index: ${({ theme }) => theme.zIndex.nav + 5};
  min-width: 260px;
  text-align: center;

  p {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const LoginPopoverWrapper = styled.div`
  position: relative;
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
  const { totalItems } = useBasketContext()
  const { user, logout, isAuthenticated } = useAuthContext()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const firstName = user?.name?.split(' ')[0] ?? ''

  useEffect(() => {
    if (isAuthenticated) setLoginOpen(false)
  }, [isAuthenticated])

  const navHref = (hash: string) => isHome ? hash : `/${hash}`

  return (
    <>
      <Backdrop $open={menuOpen} onClick={closeMenu} />
      <Nav aria-label="Hovedmeny">
        <NavContainer>
          <Logo>
            <Link to="/"><img src="/images/branding/minio_white_rect_transparent.webp" alt="Minio – skreddersydd i tre, etter dine mål" /></Link>
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
              <UserPill>
                {user?.picture && <UserAvatar src={user.picture} alt="" />}
                <span>Hei, {firstName}</span>
                <LogoutBtn onClick={logout} aria-label="Logg ut">
                  <Icon name="faSignOutAlt" />
                </LogoutBtn>
              </UserPill>
            ) : (
              <LoginPopoverWrapper>
                <LoginLink onClick={() => setLoginOpen(!loginOpen)}>
                  Logg inn
                </LoginLink>
                {loginOpen && (
                  <LoginPopover>
                    <p>Logg inn for å bruke handlekurven</p>
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
