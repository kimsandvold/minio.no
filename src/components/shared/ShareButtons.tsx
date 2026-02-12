import { useState, useCallback } from 'react'
import styled from 'styled-components'
import Icon from './Icon'
import CopyNotification from './CopyNotification'
import { getShareUrl, shareFacebook, copyToClipboard } from '../../utils/share'

const HeroGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`

const HeroBtn = styled.button`
  padding: 0.65rem 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.55rem 1.25rem;
    font-size: 0.85rem;
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
  border: 2px solid;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  ${({ $platform }) =>
    $platform === 'facebook'
      ? `
    color: #3b5998;
    border-color: #3b5998;
    &:hover { background: #3b5998; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 89, 152, 0.3); }
  `
      : `
    color: #e4405f;
    border-color: #e4405f;
    &:hover { background: #e4405f; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(228, 64, 95, 0.3); }
  `}
  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.65rem 1.5rem;
    font-size: 0.9rem;
  }
`

const SmallBtn = styled.button<{ $platform: 'facebook' | 'instagram' }>`
  background: #fff;
  border: 1.5px solid #ddd;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;

  ${({ $platform }) =>
    $platform === 'facebook'
      ? `
    color: #3b5998; border-color: #3b5998;
    &:hover { background: #3b5998; color: #fff; transform: scale(1.1); box-shadow: 0 3px 8px rgba(59, 89, 152, 0.3); }
  `
      : `
    color: #e4405f; border-color: #e4405f;
    &:hover { background: #e4405f; color: #fff; transform: scale(1.1); box-shadow: 0 3px 8px rgba(228, 64, 95, 0.3); }
  `}
`

interface ShareButtonsProps {
  variant: 'hero' | 'section' | 'small'
  context?: string
}

export default function ShareButtons({ variant, context = '' }: ShareButtonsProps) {
  const [notification, setNotification] = useState<string | null>(null)

  const handleShare = useCallback(async (platform: 'facebook' | 'instagram') => {
    const url = getShareUrl(context)
    if (platform === 'facebook') {
      shareFacebook(url)
    } else {
      const success = await copyToClipboard(url)
      setNotification(success ? 'Lenke kopiert! Lim inn i Instagram.' : 'Kunne ikke kopiere lenke automatisk.')
    }
  }, [context])

  if (variant === 'hero') {
    return (
      <>
        <HeroGroup>
          <HeroBtn onClick={() => handleShare('facebook')}>
            <Icon name="faFacebookF" /> Del på Facebook
          </HeroBtn>
          <HeroBtn onClick={() => handleShare('instagram')}>
            <Icon name="faInstagram" /> Del på Instagram
          </HeroBtn>
        </HeroGroup>
        {notification && <CopyNotification message={notification} onDone={() => setNotification(null)} />}
      </>
    )
  }

  if (variant === 'small') {
    return (
      <>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
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
