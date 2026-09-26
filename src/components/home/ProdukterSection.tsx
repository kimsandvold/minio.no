import { useRef } from 'react'
import styled from 'styled-components'
import Icon from '../shared/Icon'
import { allProducts } from '../../data/products'
import { Eyebrow, Hode, PilLenke, Reveal, Seksjon, Tittel, Wrap } from '../editorial'
import ProduktKort from '../editorial/ProduktKort'

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
            <Plass key={p.slug}>
              <ProduktKort produkt={p} />
            </Plass>
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

const Plass = styled.div`
  scroll-snap-align: start;
`
