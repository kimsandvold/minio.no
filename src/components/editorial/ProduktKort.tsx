import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'
import { kortNavn, kortPris } from '../../utils/produktTekst'

interface Props {
  produkt: Product
  /** Vis kortbeskrivelsen under prisen (produktsiden, ikke karusellen). */
  medBeskrivelse?: boolean
}

/**
 * Produktkort: stort bilde, navn og pris – ingenting mer. Har produktet flere
 * bilder, tones bilde nr. 2 inn ved hover i stedet for en karusell med piler.
 */
export default function ProduktKort({ produkt, medBeskrivelse }: Props) {
  const [forste, andre] = produkt.images
  return (
    <Kort to={`/produkter/${produkt.slug}`}>
      <Bilde>
        <img src={forste?.src} alt={forste?.alt ?? ''} loading="lazy" />
        {andre && <img className="andre" src={andre.src} alt="" loading="lazy" aria-hidden="true" />}
        {produkt.regularPrice && <Merke>Tilbud</Merke>}
      </Bilde>
      <Navn>{kortNavn(produkt.title)}</Navn>
      <Pris>
        {kortPris(produkt.price)}
        {produkt.regularPrice && <s>{kortPris(produkt.regularPrice).replace('fra ', '')}</s>}
      </Pris>
      {medBeskrivelse && <Beskrivelse className="beskrivelse">{produkt.shortDescription}</Beskrivelse>}
    </Kort>
  )
}

export function ProduktKortSkjelett() {
  return (
    <div aria-hidden="true">
      <Bilde as="div" className="skjelett" />
      <SkjelettLinje style={{ width: '60%', marginTop: '1rem' }} />
      <SkjelettLinje style={{ width: '35%' }} />
    </div>
  )
}

const pulser = keyframes`
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
`

const Kort = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;

  img {
    transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease;
  }

  .andre {
    opacity: 0;
  }

  &:hover img {
    transform: scale(1.04);
  }

  &:hover .andre {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover img {
      transform: none;
    }
  }
`

const Bilde = styled.div`
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.sunken};

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.skjelett {
    animation: ${pulser} 1.4s ease-in-out infinite;
  }
`

const Merke = styled.span`
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
  z-index: 1;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.accent};
`

const Navn = styled.h3`
  margin: 1rem 0 0.2rem;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  letter-spacing: -0.015em;
`

const Pris = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkMuted};

  s {
    margin-left: 0.5rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Beskrivelse = styled.p`
  margin: 0.6rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkMuted};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const SkjelettLinje = styled.div`
  height: 0.9rem;
  margin-top: 0.5rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.sunken};
  animation: ${pulser} 1.4s ease-in-out infinite;
`
