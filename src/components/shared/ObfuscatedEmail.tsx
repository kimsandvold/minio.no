import { useCallback } from 'react'
import styled from 'styled-components'

/**
 * Viser en e-postadresse på en måte som er vanskelig for bot-scrapere å høste:
 *  - Adressen settes sammen fra deler, så den fullstendige strengen aldri
 *    finnes i kildekoden.
 *  - I DOM-en/prerendret HTML ligger adressen reversert; CSS snur den slik at
 *    mennesker ser den riktig vei, mens en tekst-scraper får en ugyldig streng.
 *  - Det finnes ingen `mailto:`-href i HTML-en. Lenken bygges først ved klikk.
 */
const Address = styled.span`
  unicode-bidi: bidi-override;
  direction: rtl;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
    border-radius: 2px;
  }
`

interface ObfuscatedEmailProps {
  user: string
  domain: string
}

export default function ObfuscatedEmail({ user, domain }: ObfuscatedEmailProps) {
  const open = useCallback(() => {
    window.location.href = `mailto:${user}@${domain}`
  }, [user, domain])

  const reversed = `${user}@${domain}`.split('').reverse().join('')

  return (
    <Address
      role="link"
      tabIndex={0}
      aria-label="Send e-post til Minio"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
    >
      {reversed}
    </Address>
  )
}
