import { useRef } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { allProducts } from '../../data/products'
import { Eyebrow, Hode, PilLenke, Reveal, Seksjon, Tittel, Wrap } from './shared'

/** «Varmepumpehus – tilpasset ditt hjem» → «Varmepumpehus». */
function kortNavn(tittel: string) {
  return tittel.split(' – ')[0]
}

/** «Pris fra 3490,-» → «fra 3 490 kr». Faller tilbake på originalteksten. */
function kortPris(pris: string) {
  const tall = pris.match(/\d[\d\s]*/)?.[0].replace(/\s/g, '')
  return tall ? `fra ${Number(tall).toLocaleString('nb-NO')} kr` : pris
}

const PRODUKTER = allProducts
  .filter((p) => p.showOnFrontPage && !p.unlisted)
  .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured))

export default function ProdukterSection() {
  const skinne = useRef<HTMLDivElement>(null)

  const rull = (retning: 1 | -1) => {
    const el = skinne.current
    if (!el) return
    el.scrollBy({ left: retning * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <Seksjon $flate="surface" id="produkter">
      <Wrap>
        <Reveal>
          <Hode>
            <div>
              <Eyebrow>Håndlaget på bestilling</Eyebrow>
              <Tittel>Ferdig bygget. Etter dine mål.</Tittel>
            </div>
            <Kontroller>
              <PilLenke til="/produkter">Alle produkter</PilLenke>
              <PilKnapp type="button" aria-label="Forrige" onClick={() => rull(-1)}>
                <Icon name="faArrowLeft" />
              </PilKnapp>
              <PilKnapp type="button" aria-label="Neste" onClick={() => rull(1)}>
                <Icon name="faArrowRight" />
              </PilKnapp>
            </Kontroller>
          </Hode>
        </Reveal>
      </Wrap>

      <Reveal forsinkelse={100}>
        <Skinne ref={skinne}>
          {PRODUKTER.map((p) => (
            <Produkt key={p.slug} to={`/produkter/${p.slug}`}>
              <Bilde>
                <img src={p.images[0]?.src} alt={p.images[0]?.alt ?? ''} loading="lazy" />
                {p.regularPrice && <Merke>Tilbud</Merke>}
              </Bilde>
              <Navn>{kortNavn(p.title)}</Navn>
              <Pris>
                {kortPris(p.price)}
                {p.regularPrice && <s>{kortPris(p.regularPrice).replace('fra ', '')}</s>}
              </Pris>
            </Produkt>
          ))}
        </Skinne>
      </Reveal>
    </Seksjon>
  )
}

const Kontroller = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  > a {
    margin-right: 1rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    button {
      display: none;
    }
  }
`

const PilKnapp = styled.button`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.ink};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

// Skinnen starter på gitterets venstrekant og løper ut til høyre skjermkant.
const Skinne = styled.div`
  --kant: max(2rem, calc((100vw - 1240px) / 2 + 2rem));
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: clamp(250px, 24vw, 310px);
  gap: 1.25rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--kant);
  padding: 0 var(--kant) 0.5rem;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    --kant: 1rem;
    grid-auto-columns: 72%;
    gap: 0.9rem;
  }
`

const Produkt = styled(Link)`
  scroll-snap-align: start;
  color: inherit;
  text-decoration: none;

  img {
    transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover img {
    transform: scale(1.05);
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
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Merke = styled.span`
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
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
