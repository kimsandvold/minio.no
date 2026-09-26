import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import Icon from '../../shared/Icon'
import AnimatedBlock from '../../shared/AnimatedBlock'

/**
 * Erstatter de tidligere separate forside-seksjonene for 3D-design og
 * skiltdesigneren. De konkurrerte med designverktøyet om samme plass og samme
 * ord («design»), uten å si hva som skilte dem. Her står de som det de er —
 * tjenester — med én felles inngang til /tjenester.
 */

interface Kort {
  ikon: string
  tittel: string
  tekst: string
  til: string
}

const KORT: Kort[] = [
  {
    ikon: 'faLightbulb',
    tittel: 'Prosjekthjelp – gratis',
    tekst: 'Har du bare en idé? Fortell om den, så får du et personlig svar om pris, materialer og veien videre.',
    til: '/prosjekthjelp',
  },
  {
    ikon: 'faPalette',
    tittel: '3D-design',
    tekst: 'Har du en idé som ikke finnes i verktøyet? Vi tegner og renderer den for deg.',
    til: '/3d-design',
  },
  {
    ikon: 'faComments',
    tittel: 'Byggehjelp',
    tekst: 'Leie en byggekyndig på timen — på stedet eller til gjennomgang av tegningen.',
    til: '/byggehjelp',
  },
  {
    ikon: 'faPencilRuler',
    tittel: 'Skilt og gravering',
    tekst: 'Husskilt, hytteskilt og gravering — designet i nettleseren, laserskåret hos oss.',
    til: '/skilt-og-gravering',
  },
]

const Inner = styled.div`
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
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

  p {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 44ch;
    margin: 0 0 1.75rem;
  }
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

const Liste = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`

const Rad = styled.li`
  a {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.4rem;
    background: ${({ theme }) => theme.colors.paper};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    text-decoration: none;
    color: inherit;
    transition:
      border-color ${({ theme }) => theme.transitions.default},
      background-color ${({ theme }) => theme.transitions.default};

    &:hover {
      border-color: ${({ theme }) => theme.colors.borderStrong};
      background: ${({ theme }) => theme.colors.sunken};
    }
  }

  .ikon {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.borderRadius.small};
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accentInk};
  }

  h3 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.2rem;
    color: ${({ theme }) => theme.colors.ink};
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
    margin: 0;
  }

  .pil {
    margin-left: auto;
    align-self: center;
    color: ${({ theme }) => theme.colors.inkSubtle};
    flex-shrink: 0;
  }
`

export default function TjenesterPromo() {
  return (
    <Section id="tjenester-promo" variant="surface">
      <Container>
        <AnimatedBlock>
          <Inner>
            <Tekst>
              <h2>Eller la oss gjøre jobben</h2>
              <p>
                Ikke alt skal bygges selv. Vi tegner prosjektet ditt, graverer skiltet,
                bygger de små produktene ferdig — eller går gjennom tegningen din med deg
                før du kjøper materialer.
              </p>
              <Cta to="/tjenester">
                Se alle tjenester <Icon name="faArrowRight" />
              </Cta>
            </Tekst>

            <Liste>
              {KORT.map((k) => (
                <Rad key={k.til}>
                  <Link to={k.til}>
                    <span className="ikon" aria-hidden="true">
                      <Icon name={k.ikon} />
                    </span>
                    <span>
                      <h3>{k.tittel}</h3>
                      <p>{k.tekst}</p>
                    </span>
                    <span className="pil" aria-hidden="true">
                      <Icon name="faArrowRight" />
                    </span>
                  </Link>
                </Rad>
              ))}
            </Liste>
          </Inner>
        </AnimatedBlock>
      </Container>
    </Section>
  )
}
