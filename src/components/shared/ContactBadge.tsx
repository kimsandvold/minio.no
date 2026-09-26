import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useLocation } from 'react-router-dom'
import Icon from './Icon'

// Phone digits stored as (charCode - 8) to keep "48252843" out of the bundled source.
// Decoded only at runtime when the user reveals the badge.
const PHONE_OFFSETS = [44, 48, 42, 45, 42, 48, 44, 43]
const SHIFT = 8

function decodePhone(): string {
  return PHONE_OFFSETS.map((n) => String.fromCharCode(n + SHIFT)).join('')
}

function formatPhone(raw: string): string {
  return `${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 8)}`
}

const Wrapper = styled.div`
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    right: 0.75rem;
    bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-direction: row-reverse;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 0.4rem;
  }
`

const Availability = styled.span`
  font-size: 0.72rem;
  font-weight: 500;
  color: #fff;
  background: rgba(28, 26, 24, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  letter-spacing: 0.01em;
  animation: contactBadgeIn 0.25s ease;

  @keyframes contactBadgeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const BADGE_ACCENT = '#a8512c'
const BADGE_ACCENT_HOVER = '#8e4223'

const PILL_PADDING = '0.85rem 1.25rem'
const PILL_PADDING_MOBILE = '0.75rem 1.1rem'

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  height: 48px;
  padding: ${PILL_PADDING};
  background: ${BADGE_ACCENT};
  color: #fff;
  border: 0;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(168, 81, 44, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;



  &:hover {
    background: ${BADGE_ACCENT_HOVER};
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(168, 81, 44, 0.55);
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 3px;
  }

  svg {
    font-size: 1.05rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 44px;
    font-size: 0.95rem;
    padding: ${PILL_PADDING_MOBILE};
  }
`

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  height: 48px;
  padding: ${PILL_PADDING};
  background: #fff;
  color: ${BADGE_ACCENT};
  border-radius: 999px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(168, 81, 44, 0.3), inset 0 0 0 2px ${BADGE_ACCENT};
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
  animation: contactBadgeIn 0.25s ease;

  &:hover {
    background: ${BADGE_ACCENT};
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(168, 81, 44, 0.4), inset 0 0 0 2px ${BADGE_ACCENT};
  }

  &:focus-visible {
    outline: 2px solid ${BADGE_ACCENT};
    outline-offset: 3px;
  }

  svg {
    font-size: 1rem;
  }

  @keyframes contactBadgeIn {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 44px;
    font-size: 0.95rem;
    padding: ${PILL_PADDING_MOBILE};
  }
`

export default function ContactBadge() {
  const [expanded, setExpanded] = useState(false)
  const [phone, setPhone] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  const handleReveal = () => {
    if (!phone) setPhone(decodePhone())
    setExpanded(true)
  }

  useEffect(() => {
    if (!expanded) return
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  // Overflødig på kontaktsiden – der dekker den bare skjemaet på mobil.
  if (pathname === '/kontakt') return null

  return (
    <Wrapper ref={wrapperRef} data-nosnippet>
      {expanded && <Availability>Tilgjengelig hverdager etter kl. 16:00 og hele helgen</Availability>}
      <Row>
        <Pill
          type="button"
          onClick={handleReveal}
          aria-label={expanded ? 'Skjul telefonnummer' : 'Vis telefonnummer'}
        >
          Ta kontakt
        </Pill>
        {expanded && phone && (
          <>
            <ActionLink href={`tel:+47${phone}`} aria-label="Ring Minio">
              <Icon name="faPhone" />
              Ring {formatPhone(phone)}
            </ActionLink>
            <ActionLink href={`sms:+47${phone}`} aria-label="Send SMS til Minio">
              <Icon name="faComments" />
              Send SMS
            </ActionLink>
          </>
        )}
      </Row>
    </Wrapper>
  )
}
