import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { Eyebrow, Hode, Ingress, Reveal, Seksjon, Tittel, Wrap } from './shared'

/**
 * Hele forretningen på én skjerm: hvor mye vil kunden gjøre selv? Tre kort,
 * tre dører – dette er forsidens egentlige navigasjon.
 */
const VEIER = [
  {
    nr: '01',
    navn: 'Design selv',
    tekst: 'Tegn i 3D med dine egne mål. Få materialliste, kappliste og byggeplan – gratis å designe.',
    cta: 'Åpne designverktøyet',
    til: '/designverktoy',
    bilde: '/images/planleggere/carport.webp',
    lys: true,
  },
  {
    nr: '02',
    navn: 'Bestill ferdig',
    tekst: 'Plantekasser, varmepumpehus, søppelboder og mer – laget på bestilling etter dine mål.',
    cta: 'Se produktene',
    til: '/produkter',
    bilde: '/images/hero/forside_8.webp',
  },
  {
    nr: '03',
    navn: 'Få hjelp',
    tekst: 'Prisanslag på tre trykk og et personlig svar – og hjelp til å finne en snekker hvis du ikke vil bygge selv.',
    cta: 'Få prisanslag',
    til: '/prosjekthjelp',
    bilde: '/images/hero/forside_1.webp',
  },
]

export default function VeierSection() {
  return (
    <Seksjon id="tre-veier">
      <Wrap>
        <Reveal>
          <Hode>
            <div>
              <Eyebrow>Tre veier til mål</Eyebrow>
              <Tittel>Du velger hvor mye du gjør selv.</Tittel>
            </div>
            <Ingress>
              Samme mål og samme beregninger – enten du bygger selv, bestiller et ferdig produkt
              eller vil ha en snekker til å sette det opp.
            </Ingress>
          </Hode>
        </Reveal>

        <Grid>
          {VEIER.map((v, i) => (
            <Reveal key={v.nr} forsinkelse={i * 90}>
              <Kort to={v.til}>
                <Bilde $lys={v.lys}>
                  <img src={v.bilde} alt="" loading="lazy" />
                </Bilde>
                <Tekst>
                  <Nr>{v.nr}</Nr>
                  <h3>{v.navn}</h3>
                  <p>{v.tekst}</p>
                  <Cta>
                    {v.cta} <Icon name="faArrowRight" />
                  </Cta>
                </Tekst>
              </Kort>
            </Reveal>
          ))}
        </Grid>
      </Wrap>
    </Seksjon>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const Kort = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  color: inherit;
  text-decoration: none;
  box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border};
  transition: box-shadow ${({ theme }) => theme.transitions.soft}, transform ${({ theme }) => theme.transitions.soft};

  img {
    transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.borderStrong}, 0 24px 48px rgba(28, 26, 24, 0.1);

    img {
      transform: scale(1.04);
    }
  }

  @media (max-width: 900px) {
    flex-direction: row;

    @media (max-width: 560px) {
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover,
    &:hover img {
      transform: none;
    }
  }
`

const Bilde = styled.div<{ $lys?: boolean }>`
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: ${({ theme, $lys }) => ($lys ? '#fff' : theme.colors.sunken)};

  img {
    width: 100%;
    height: 100%;
    object-fit: ${({ $lys }) => ($lys ? 'contain' : 'cover')};
    padding: ${({ $lys }) => ($lys ? '8% 6% 2%' : '0')};
  }

  @media (max-width: 900px) and (min-width: 561px) {
    flex: 0 0 42%;
    aspect-ratio: auto;
  }
`

const Tekst = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.6rem 1.6rem 1.5rem;

  h3 {
    margin: 0.35rem 0 0.6rem;
    font-size: 1.6rem;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0 0 1.5rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.55;
  }
`

const Nr = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Cta = styled.span`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};

  svg {
    font-size: 0.8em;
  }
`
