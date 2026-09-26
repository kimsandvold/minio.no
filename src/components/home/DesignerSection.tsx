import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { Eyebrow, Ingress, Knapp, Reveal, Seksjon, Tittel, Wrap } from './shared'

/**
 * Designverktøyet er produktet – vis det som et produkt. Speilet av
 * src/designer/registry.ts (lastes ikke her, den drar med seg three.js).
 */
const MODELLER = [
  { id: 'carport', navn: 'Carport' },
  { id: 'terrasse', navn: 'Terrasse' },
  { id: 'pergola', navn: 'Pergola' },
  { id: 'utekjokken', navn: 'Utekjøkken' },
  { id: 'garasje', navn: 'Garasje' },
  { id: 'vedskjul', navn: 'Vedskjul' },
  { id: 'soppelboder', navn: 'Søppelbod' },
  { id: 'plantekasse', navn: 'Plantekasse' },
  { id: 'varmepumpehus', navn: 'Varmepumpehus' },
  { id: 'postkassestativer', navn: 'Postkassestativ' },
  { id: 'utedo', navn: 'Utedo' },
]

// Samsvarer med carport-templatets standardoppsett, som er det bildet viser.
const SPESIFIKASJONER = [
  { tekst: 'Bredde 600 cm', plass: 'ov' },
  { tekst: 'Saltak · shingel', plass: 'oh' },
  { tekst: 'Stolper 148 × 148', plass: 'nv' },
  { tekst: 'Materialliste klar', plass: 'nh', ok: true },
]

const FAKTA = [
  { tall: String(MODELLER.length), tekst: 'modeller å designe' },
  { tall: '0 kr', tekst: 'å tegne og regne' },
  { tall: 'EC5', tekst: 'takbjelker kontrollert mot snølast' },
]

export default function DesignerSection() {
  return (
    <Seksjon $flate="deep" id="designverktoy" data-surface="dark">
      <Wrap>
        <Grid>
          <Reveal>
            <Eyebrow $lys>Designverktøy</Eyebrow>
            <Tittel>Fra idé til kappliste på minutter.</Tittel>
            <Ingress $lys>
              Sett målene, velg treslag og tak, og se prosjektet fra alle kanter. Verktøyet
              regner ut materialliste og pris mens du tegner – og dimensjonerer takbjelkene etter
              snølasten.
            </Ingress>
            <Knapper>
              <Knapp to="/designverktoy" $variant="hvit">
                <Icon name="faCube" /> Åpne designverktøyet
              </Knapp>
            </Knapper>
          </Reveal>

          <Reveal forsinkelse={120}>
            <Vindu>
              <Tittellinje>
                <span /><span /><span />
                <em>minio.no/designverktoy/carport</em>
              </Tittellinje>
              <Lerret>
                <img src="/images/planleggere/carport.webp" alt="3D-modell av en carport i designverktøyet" loading="lazy" />
                {SPESIFIKASJONER.map((s, i) => (
                  <Brikke key={s.tekst} $plass={s.plass} style={{ animationDelay: `${i * 0.6}s` }}>
                    {s.ok && <Icon name="faCheck" />} {s.tekst}
                  </Brikke>
                ))}
              </Lerret>
            </Vindu>
          </Reveal>
        </Grid>

        <Reveal>
          <Fakta>
            {FAKTA.map((f) => (
              <li key={f.tekst}>
                <strong>{f.tall}</strong>
                <span>{f.tekst}</span>
              </li>
            ))}
          </Fakta>
          <Modeller>
            {MODELLER.map((m) => (
              <Link key={m.id} to={`/designverktoy/${m.id}`}>{m.navn}</Link>
            ))}
          </Modeller>
        </Reveal>
      </Wrap>
    </Seksjon>
  )
}

const svev = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(2.5rem, 5vw, 5rem);
  align-items: center;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Knapper = styled.div`
  margin-top: 2.25rem;
`

const Vindu = styled.div`
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 40px 100px rgba(0, 0, 0, 0.55);
`

const Tittellinje = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.7rem 1rem;
  background: #f1efeb;

  span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #cfcac2;
  }

  em {
    margin-left: 0.75rem;
    font-style: normal;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.72rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Lerret = styled.div`
  position: relative;
  aspect-ratio: 16 / 11;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8% 8% 4%;
  }
`

const plassering: Record<string, string> = {
  ov: 'top: 9%; left: 6%;',
  oh: 'top: 14%; right: 6%;',
  nv: 'bottom: 12%; left: 8%;',
  nh: 'bottom: 7%; right: 6%;',
}

const Brikke = styled.span<{ $plass: string }>`
  position: absolute;
  ${({ $plass }) => plassering[$plass]}
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border-radius: 10px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.74rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.ink};
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(28, 26, 24, 0.12), 0 0 0 1px rgba(28, 26, 24, 0.06);
  animation: ${svev} 5s ease-in-out infinite;

  svg {
    color: ${({ theme }) => theme.colors.success};
  }

  @media (max-width: 560px) {
    font-size: 0.64rem;
    padding: 0.35rem 0.6rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Fakta = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin: clamp(3.5rem, 7vw, 6rem) 0 0;
  padding: 2rem 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};

  li {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  strong {
    font-size: clamp(2.2rem, 4vw, 3.2rem);
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  span {
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  @media (max-width: 640px) {
    gap: 1rem;

    strong {
      font-size: 1.8rem;
    }

    span {
      font-size: ${({ theme }) => theme.fontSizes.sm};
      line-height: 1.35;
    }
  }
`

const Modeller = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 2.5rem;

  a {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkInverted};
    text-decoration: none;
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.borderInverted};
    transition: background ${({ theme }) => theme.transitions.default};

    &:hover {
      background: rgba(250, 247, 242, 0.1);
    }
  }
`
