import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import Icon from './Icon'

// Klikkbart bilde som åpner en lightbox i full størrelse. Brukes for artikkel-
// bilder på tvers av sidene (planleggere m.m.) så de oppfører seg likt.

const ZoomButton = styled.button`
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  line-height: 0;

  & + & {
    margin-top: 1rem;
  }

  img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.4s ease, filter 0.4s ease;
  }

  &:hover img,
  &:focus-visible img {
    transform: scale(1.04);
    filter: brightness(0.92);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`

const ZoomBadge = styled.span`
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(20, 20, 20, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 1rem;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;

  ${ZoomButton}:hover &,
  ${ZoomButton}:focus-visible & {
    opacity: 1;
    transform: scale(1);
  }
`

const Lightbox = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.88);
  cursor: zoom-out;
  animation: lightboxFade 0.2s ease;

  @keyframes lightboxFade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`

const LightboxClose = styled.button`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`

interface ZoomableImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export default function ZoomableImage({ src, alt, width, height, className }: ZoomableImageProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <ZoomButton
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label={`Forstørr bilde: ${alt}`}
      >
        <img src={src} alt={alt} loading="lazy" width={width} height={height} />
        <ZoomBadge aria-hidden="true">
          <Icon name="faSearch" />
        </ZoomBadge>
      </ZoomButton>
      {open &&
        createPortal(
          <Lightbox role="dialog" aria-modal="true" aria-label="Forstørret bilde" onClick={() => setOpen(false)}>
            <LightboxClose type="button" aria-label="Lukk" onClick={() => setOpen(false)}>
              <Icon name="faTimes" />
            </LightboxClose>
            <img src={src} alt={alt} />
          </Lightbox>,
          document.body,
        )}
    </>
  )
}
