import { useEffect, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { Knapp } from './shared'

/**
 * Fullskjerms helt. Ett budskap, to valg, og bildene gjør resten. Hvert bilde
 * er koblet til sin modell i designverktøyet, så bildet er også en snarvei.
 * Bildene er idébilder – ikke prosjekter Minio har bygget – og merkes slik.
 * Første bilde må være det som forhåndslastes i index.html.
 */
const BILDER = [
  { src: '/images/planleggere/carport-foto.webp', navn: 'Carport', til: '/designverktoy/carport' },
  { src: '/images/planleggere/pergola-inspirasjon.webp', navn: 'Pergola', til: '/designverktoy/pergola' },
  { src: '/images/planleggere/terrasse-inspirasjon.webp', navn: 'Terrasse', til: '/designverktoy/terrasse' },
  { src: '/images/hero/utekjokken-hage-forside.webp', navn: 'Utekjøkken', til: '/designverktoy/utekjokken' },
]

const VARIGHET = 7000

function foretrekkerRoligBevegelse() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function HomeHero() {
  const [aktiv, setAktiv] = useState(0)
  const [pauset, setPauset] = useState(foretrekkerRoligBevegelse)

  useEffect(() => {
    if (pauset) return
    const t = window.setTimeout(() => setAktiv((i) => (i + 1) % BILDER.length), VARIGHET)
    return () => window.clearTimeout(t)
  }, [aktiv, pauset])

  const bilde = BILDER[aktiv]

  return (
    <Helt aria-label="Minio – uteprosjekter i tre" data-surface="dark">
      {BILDER.map((b, i) => (
        <Bilde
          key={b.src}
          src={b.src}
          alt=""
          $aktiv={i === aktiv}
          $animer={!pauset}
          fetchPriority={i === 0 ? 'high' : 'low'}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
      ))}
      <Skygge />

      <Innhold>
        <Topptekst>Uteprosjekter i tre · designet i 3D</Topptekst>
        <h1>
          Tegn det.<br />
          Bygg det.
        </h1>
        <p>
          Design uteprosjektet ditt i 3D på minutter – med materialliste og pris. Bygg selv,
          eller få hjelp til å finne en snekker som setter det opp.
        </p>
        <Knapper>
          <Knapp to="/designverktoy" $variant="hvit">Start designet</Knapp>
          <Knapp to="/prosjekthjelp" $variant="glass">Hva koster det?</Knapp>
        </Knapper>
      </Innhold>

      <Bunn>
        <Idebilde>Idébilder</Idebilde>
        <Faner role="tablist" aria-label="Velg bilde">
          {BILDER.map((b, i) => (
            <Fane
              key={b.navn}
              role="tab"
              aria-selected={i === aktiv}
              onClick={() => { setAktiv(i); setPauset(true) }}
            >
              <Linje>
                <Fyll $aktiv={i === aktiv} $ferdig={i < aktiv} $animer={!pauset} key={`${aktiv}-${pauset}`} />
              </Linje>
              {b.navn}
            </Fane>
          ))}
        </Faner>
        <BildeLenke to={bilde.til}>
          Design din {bilde.navn.toLowerCase()} <Icon name="faArrowRight" />
        </BildeLenke>
      </Bunn>
    </Helt>
  )
}

const zoom = keyframes`
  from { transform: scale(1.06); }
  to { transform: scale(1); }
`

const fyll = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`

const Helt = styled.section`
  position: relative;
  min-height: 100svh;
  min-height: max(640px, 100svh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
`

const Bilde = styled.img<{ $aktiv: boolean; $animer: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $aktiv }) => ($aktiv ? 1 : 0)};
  transition: opacity 1.4s ease;

  ${({ $aktiv, $animer }) =>
    $aktiv && $animer &&
    css`
      animation: ${zoom} ${VARIGHET + 1400}ms ease-out both;
    `}
`

const Skygge = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(12, 11, 10, 0.55) 0%, rgba(12, 11, 10, 0) 22%),
    linear-gradient(0deg, rgba(12, 11, 10, 0.88) 0%, rgba(12, 11, 10, 0.35) 45%, rgba(12, 11, 10, 0) 70%);
  pointer-events: none;
`

const Innhold = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 1rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(3rem, 8.4vw, 7.25rem);
    font-weight: 600;
    line-height: 0.95;
    letter-spacing: -0.055em;
  }

  p {
    margin: 1.5rem 0 0;
    max-width: 40ch;
    font-size: clamp(1.05rem, 0.6vw + 0.95rem, 1.3rem);
    line-height: 1.5;
    color: rgba(250, 247, 242, 0.82);
  }
`

const Topptekst = styled.span`
  display: block;
  margin-bottom: 1.25rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: rgba(250, 247, 242, 0.72);
`

const Knapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2.25rem;
`

const Bunn = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1240px;
  margin: clamp(2.5rem, 6vh, 4.5rem) auto 0;
  padding: 0 2rem 2rem;
  display: flex;
  align-items: flex-end;
  gap: 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 1rem 1.25rem;
  }
`

const Idebilde = styled.span`
  flex: none;
  padding-bottom: 0.5rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: rgba(250, 247, 242, 0.55);

  @media (max-width: 560px) {
    display: none;
  }
`

const Faner = styled.div`
  display: flex;
  gap: 1.25rem;
  flex: 1;
  max-width: 560px;
`

const Fane = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.5rem 0;
  background: none;
  border: none;
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  text-align: left;
  color: rgba(250, 247, 242, 0.62);
  cursor: pointer;

  &[aria-selected='true'] {
    color: ${({ theme }) => theme.colors.inkInverted};
  }

  @media (max-width: 560px) {
    font-size: 0;
    gap: 0;
  }
`

const Linje = styled.span`
  display: block;
  height: 2px;
  border-radius: 2px;
  background: rgba(250, 247, 242, 0.25);
  overflow: hidden;
`

const Fyll = styled.span<{ $aktiv: boolean; $ferdig: boolean; $animer: boolean }>`
  display: block;
  height: 100%;
  background: ${({ theme }) => theme.colors.inkInverted};
  transform-origin: left;
  transform: scaleX(${({ $aktiv, $ferdig }) => ($aktiv || $ferdig ? 1 : 0)});

  ${({ $aktiv, $animer }) =>
    $aktiv && $animer &&
    css`
      animation: ${fyll} ${VARIGHET}ms linear both;
    `}
`

const BildeLenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkInverted};
  text-decoration: none;
  opacity: 0.9;
  padding-bottom: 0.5rem;

  svg {
    font-size: 0.8em;
    transition: transform ${({ theme }) => theme.transitions.default};
  }

  &:hover {
    opacity: 1;

    svg {
      transform: translateX(4px);
    }
  }

  @media (max-width: 560px) {
    display: none;
  }
`
