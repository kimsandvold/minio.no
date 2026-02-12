import { useState, useEffect } from 'react'
import styled from 'styled-components'

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ theme }) => theme.zIndex.overlay};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.6s ease-out;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
`

const OverlayContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 2rem;
  padding: 2rem;
`

const Logo = styled.img`
  max-width: 200px;
  width: 75%;
  height: auto;

  @media (max-width: 600px) {
    max-width: 120px;
    width: 60%;
  }
`

const CookieBox = styled.div`
  max-width: 500px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: center;

  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 1rem;
  }

  p {
    font-size: 0.95rem;
    color: #555;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
`

const AcceptButton = styled.button`
  background-color: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  &:hover {
    background-color: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

interface LoadingOverlayProps {
  hasConsented: boolean
  onAccept: () => void
}

export default function LoadingOverlay({ hasConsented, onAccept }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(!hasConsented)
  const [removed, setRemoved] = useState(hasConsented)

  useEffect(() => {
    if (hasConsented && visible) {
      setVisible(false)
      const timer = setTimeout(() => setRemoved(true), 600)
      return () => clearTimeout(timer)
    }
  }, [hasConsented, visible])

  if (removed) return null

  return (
    <Overlay $visible={visible}>
      <OverlayContent>
        <Logo src="/images/branding/logo_dark.svg" alt="Minio" />
        {!hasConsented && (
          <CookieBox>
            <h3>Cookies og personvern</h3>
            <p>Vi bruker cookies for å gi deg best mulig opplevelse på vår nettside. Ved å akseptere godtar du vår bruk av cookies.</p>
            <AcceptButton onClick={onAccept}>Aksepter</AcceptButton>
          </CookieBox>
        )}
      </OverlayContent>
    </Overlay>
  )
}
