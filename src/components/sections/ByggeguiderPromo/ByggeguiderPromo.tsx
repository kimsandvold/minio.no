import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import Icon from '../../shared/Icon'
import AnimatedBlock from '../../shared/AnimatedBlock'
import { guidePhases, guideTopics, guideHref } from '../../../data/byggeguider'

/**
 * Kunnskapsbanken er sidens største aktivum og ble ikke nevnt med ett ord på
 * forsiden. Seksjonen viser de fire fasene med ekte antall fra
 * `guideTopics`, så tallene aldri kan bli utdaterte, pluss noen innganger
 * folk faktisk søker etter.
 */

const FREMHEVEDE_SLUGS = [
  'soknadsplikt-terrasse',
  'spennvidder-bjelker',
  'trykkimpregnert-vs-royalimpregnert',
  'hva-koster-terrasse',
]

const FASE_IKON: Record<string, string> = {
  planlegg: 'faPencilRuler',
  velg: 'faTree',
  bygg: 'faHammer',
  finish: 'faPalette',
}

const Inner = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 3.5rem;
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 2.25rem;
  }
`

const Tekst = styled.div`
  h2 {
    margin: 0 0 1rem;
  }

  > p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 46ch;
    margin: 0 0 1.75rem;
  }
`

const Merkelapp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.4rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  margin-bottom: 1.1rem;
`

const Cta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.inkInverted};
  font-size: 1rem;
  font-weight: 600;
  padding: 0.95rem 1.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-decoration: none;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.neutral[800]};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`

const FaseGrid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }
`

const FaseKort = styled.li`
  a {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem 1.1rem;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    text-decoration: none;
    color: inherit;
    transition:
      border-color ${({ theme }) => theme.transitions.default},
      box-shadow ${({ theme }) => theme.transitions.default};

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderStrong};
      box-shadow: ${({ theme }) => theme.shadows.sm};
    }
  }

  svg {
    color: ${({ theme }) => theme.colors.accent};
    flex-shrink: 0;
  }

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Populaere = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 1.25rem;

  h3 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
    margin: 0 0 0.85rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  a {
    display: inline-block;
    padding: 0.4rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
    text-decoration: none;
    transition:
      border-color ${({ theme }) => theme.transitions.default},
      color ${({ theme }) => theme.transitions.default};

    &:hover {
      border-color: ${({ theme }) => theme.colors.accent};
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

export default function ByggeguiderPromo() {
  const tilgjengelige = guideTopics.filter((t) => t.available)
  const fremhevede = FREMHEVEDE_SLUGS.map((s) => tilgjengelige.find((t) => t.slug === s)).filter(
    (t): t is (typeof tilgjengelige)[number] => Boolean(t),
  )

  return (
    <Section id="byggeguider-promo" variant="sunken">
      <Container>
        <AnimatedBlock>
          <Inner>
            <Tekst>
              <Merkelapp>Gratis kunnskapsbank</Merkelapp>
              <h2>{tilgjengelige.length} byggeguider — skrevet for deg som skal bygge selv</h2>
              <p>
                Spennvidder, søknadsplikt, frostfri dybde, riktig skrue. Alt vi får spørsmål
                om står forklart her, på norsk, med tallene du trenger. Ingen innlogging,
                ingen betalingsmur.
              </p>
              <Cta to="/byggeguider">
                Åpne byggeguidene <Icon name="faArrowRight" />
              </Cta>
            </Tekst>

            <div>
              <FaseGrid>
                {guidePhases.map((fase) => {
                  const antall = tilgjengelige.filter((t) => t.phaseKey === fase.key).length
                  return (
                    <FaseKort key={fase.key}>
                      <Link to="/byggeguider">
                        <Icon name={FASE_IKON[fase.key] ?? 'faTools'} />
                        <span>
                          <strong>{fase.label}</strong>
                          <span>
                            {antall} {antall === 1 ? 'guide' : 'guider'}
                          </span>
                        </span>
                      </Link>
                    </FaseKort>
                  )
                })}
              </FaseGrid>

              <Populaere>
                <h3>Mest lest</h3>
                <ul>
                  {fremhevede.map((t) => (
                    <li key={t.slug}>
                      <Link to={guideHref(t)}>{t.title}</Link>
                    </li>
                  ))}
                </ul>
              </Populaere>
            </div>
          </Inner>
        </AnimatedBlock>
      </Container>
    </Section>
  )
}
