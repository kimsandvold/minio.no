import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { guidePhases, guideTopics } from '../../data/byggeguider'
import { Eyebrow, Hode, Ingress, PilLenke, Reveal, Seksjon, Tittel, Wrap } from '../editorial'

const TILGJENGELIGE = guideTopics.filter((t) => t.available)
const PER_FASE = 4

export default function GuiderSection() {
  return (
    <Seksjon $flate="surface" id="byggeguider">
      <Wrap>
        <Reveal>
          <Hode>
            <div>
              <Eyebrow>Byggeguider</Eyebrow>
              <Tittel>{TILGJENGELIGE.length} guider for deg som bygger selv.</Tittel>
            </div>
            <div>
              <Ingress>
                Spennvidder, søknadsplikt, frostfri dybde, riktig skrue. Forklart på norsk, med
                tallene du trenger – gratis og uten innlogging.
              </Ingress>
            </div>
          </Hode>
        </Reveal>

        <Faser>
          {guidePhases.map((fase, i) => {
            const emner = TILGJENGELIGE.filter((t) => t.phaseKey === fase.key)
            return (
              <Reveal key={fase.key} forsinkelse={i * 80}>
                <Fase>
                  <FaseHode>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <h3>{fase.label}</h3>
                    <small>{emner.length} guider</small>
                  </FaseHode>
                  <ul>
                    {emner.slice(0, PER_FASE).map((t) => (
                      <li key={t.slug}>
                        <Link to={`/byggeguider/${t.slug}`}>{t.title}</Link>
                      </li>
                    ))}
                  </ul>
                </Fase>
              </Reveal>
            )
          })}
        </Faser>

        <Reveal>
          <Til>
            <PilLenke til="/byggeguider">Alle byggeguider</PilLenke>
          </Til>
        </Reveal>
      </Wrap>
    </Seksjon>
  )
}

const Faser = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const Fase = styled.div`
  height: 100%;
  padding: 1.5rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.paper};

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  a {
    display: block;
    padding: 0.7rem 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.ink};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const FaseHode = styled.div`
  margin-bottom: 1rem;

  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  h3 {
    margin: 0.35rem 0 0.15rem;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  small {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Til = styled.div`
  margin-top: 2.5rem;
`
