import { useState, useCallback } from 'react'
import styled from 'styled-components'
import Icon from './Icon'
import CopyNotification from './CopyNotification'
import { getShareUrl, shareFacebook, copyToClipboard } from '../../utils/share'
import { trackShare } from '../../utils/analytics'

const HeroGroup = styled.div`
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  flex-wrap: wrap;
`

const HeroBtn = styled.button`
  padding: 0.4rem 0.9rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: -0.005em;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default};
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.72);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  @media (max-width: 768px) {
    padding: 0.35rem 0.8rem;
    font-size: 0.8rem;
  }
`

const SectionGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`

const SectionBtn = styled.button<{ $platform: 'facebook' | 'instagram' }>`
  padding: 0.75rem 1.75rem;
  background: #fff;
  border: 1px solid;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: -0.005em;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  ${({ $platform }) =>
    $platform === 'facebook'
      ? `
    color: #3b5998;
    border-color: #3b5998;
    &:hover { background: #3b5998; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 89, 152, 0.3); }
  `
      : `
    color: #c9344f;
    border-color: #c9344f;
    &:hover { background: #c9344f; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(228, 64, 95, 0.3); }
  `}
  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    padding: 0.65rem 1.5rem;
    font-size: 0.9rem;
  }
`

const SmallBtn = styled.button<{ $platform: 'facebook' | 'instagram' }>`
  background: #fff;
  border: 1.5px solid #ddd4c7;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;

  ${({ $platform }) =>
    $platform === 'facebook'
      ? `
    color: #3b5998; border-color: #3b5998;
    &:hover { background: #3b5998; color: #fff; transform: scale(1.1); box-shadow: 0 3px 8px rgba(59, 89, 152, 0.3); }
  `
      : `
    color: #c9344f; border-color: #c9344f;
    &:hover { background: #c9344f; color: #fff; transform: scale(1.1); box-shadow: 0 3px 8px rgba(228, 64, 95, 0.3); }
  `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

/*
 * Artikkelfot. Egne stiler i stedet for `section`-varianten: plattformfargene
 * der (Facebook-blå, Instagram-rosa) ville brutt én-aksent-regelen midt i en
 * lang guide. Her er raden nøytral, og terrakotta kommer først på hover.
 */
const ArticleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const ArticleLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkMuted};
  margin-right: 0.25rem;
`

const ArticleBtn = styled.button`
  padding: 0.45rem 1rem;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.colors.inkMuted};
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

interface ShareButtonsProps {
  variant: 'hero' | 'section' | 'small' | 'artikkel'
  context?: string
}

export default function ShareButtons({ variant, context = '' }: ShareButtonsProps) {
  const [notification, setNotification] = useState<string | null>(null)

  const handleShare = useCallback(async (platform: 'facebook' | 'instagram') => {
    const kanal = platform === 'facebook' ? 'facebook' : 'kopier-lenke'
    const url = getShareUrl(context, kanal)
    const sti = new URL(url).pathname
    if (platform === 'facebook') {
      shareFacebook(url)
      trackShare(kanal, sti)
    } else {
      const success = await copyToClipboard(url)
      // Teller bare delinger som faktisk ble til en lenke på utklippstavla.
      if (success) trackShare(kanal, sti)
      // Artikkelraden har en nøytral «kopier lenke»-knapp, ikke en Instagram-knapp.
      const kopiert = variant === 'artikkel' ? 'Lenke kopiert!' : 'Lenke kopiert! Lim inn i Instagram.'
      setNotification(success ? kopiert : 'Kunne ikke kopiere lenke automatisk.')
    }
  }, [context, variant])

  if (variant === 'hero') {
    return (
      <>
        <HeroGroup>
          <HeroBtn onClick={() => handleShare('facebook')} aria-label="Del på Facebook">
            <Icon name="faFacebookF" /> Del
          </HeroBtn>
          <HeroBtn onClick={() => handleShare('instagram')} aria-label="Kopier lenke for Instagram">
            <Icon name="faInstagram" /> Kopier lenke
          </HeroBtn>
        </HeroGroup>
        {notification && <CopyNotification message={notification} onDone={() => setNotification(null)} />}
      </>
    )
  }

  if (variant === 'artikkel') {
    return (
      <>
        <ArticleRow>
          <ArticleLabel>Fant du guiden nyttig? Del den videre:</ArticleLabel>
          <ArticleBtn onClick={() => handleShare('facebook')} aria-label="Del på Facebook">
            <Icon name="faFacebookF" /> Facebook
          </ArticleBtn>
          <ArticleBtn onClick={() => handleShare('instagram')} aria-label="Kopier lenke til guiden">
            <Icon name="faLink" /> Kopier lenke
          </ArticleBtn>
        </ArticleRow>
        {notification && <CopyNotification message={notification} onDone={() => setNotification(null)} />}
      </>
    )
  }

  if (variant === 'small') {
    return (
      <>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e8e1d7' }}>
          <SmallBtn $platform="facebook" onClick={() => handleShare('facebook')} aria-label="Del på Facebook" title="Del på Facebook">
            <Icon name="faFacebookF" />
          </SmallBtn>
          <SmallBtn $platform="instagram" onClick={() => handleShare('instagram')} aria-label="Kopier lenke for Instagram" title="Kopier lenke for Instagram">
            <Icon name="faInstagram" />
          </SmallBtn>
        </div>
        {notification && <CopyNotification message={notification} onDone={() => setNotification(null)} />}
      </>
    )
  }

  return (
    <>
      <SectionGroup>
        <SectionBtn $platform="facebook" onClick={() => handleShare('facebook')}>
          <Icon name="faFacebookF" /> Facebook
        </SectionBtn>
        <SectionBtn $platform="instagram" onClick={() => handleShare('instagram')}>
          <Icon name="faInstagram" /> Instagram
        </SectionBtn>
      </SectionGroup>
      {notification && <CopyNotification message={notification} onDone={() => setNotification(null)} />}
    </>
  )
}
